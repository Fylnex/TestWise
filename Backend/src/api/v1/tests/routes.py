# -*- coding: utf-8 -*-
"""
Маршруты FastAPI для работы с тестами.
"""

from datetime import datetime, timezone
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger import configure_logger
from src.database.db import get_db
from src.domain.enums import Role
from src.domain.models import Question, Test
from src.repository.base import get_item
from src.repository.test import (
    create_test,
    get_test,
    update_test,
    delete_test,
    archive_test,
    restore_test,
    delete_test_permanently,
    list_tests,  # Предполагаем, что добавим этот метод в repository
)
from src.security.security import admin_or_teacher, authenticated, require_roles
from src.service.progress import check_test_availability
from src.service.tests import start_test, submit_test
from .schemas import (
    TestAttemptRead,
    TestCreateSchema,
    TestReadSchema,
    TestStartResponseSchema,
    TestSubmitSchema,
)

router = APIRouter()
logger = configure_logger()

# ---------------------------------------------------------------------------#
# CRUD (учителя / админы)                                                    #
# ---------------------------------------------------------------------------#

@router.post(
    "",
    response_model=TestReadSchema,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(admin_or_teacher)],
)
async def create_test_endpoint(
        payload: TestCreateSchema,
        session: AsyncSession = Depends(get_db),
):
    """
    Создаёт новый тест (админ / учитель).

    Требуется указать **section_id** *или* **topic_id** (но не оба).
    """
    logger.debug(f"Creating test with payload: {payload.model_dump()}")
    test = await create_test(
        session=session,
        title=payload.title,
        type=payload.type,
        duration=payload.duration,
        section_id=payload.section_id,
        topic_id=payload.topic_id,
        question_ids=payload.question_ids,
    )
    logger.debug(f"Test created with ID: {test.id}")
    return test

@router.get(
    "/{test_id}",
    response_model=TestReadSchema,
    dependencies=[Depends(require_roles(Role.ADMIN, Role.TEACHER, Role.STUDENT))],
)
async def get_test_endpoint(
        test_id: int,
        session: AsyncSession = Depends(get_db),
):
    """Возвращает тест по ID."""
    logger.debug(f"Fetching test with ID: {test_id}")
    return await get_test(session, test_id)

@router.put(
    "/{test_id}",
    response_model=TestReadSchema,
    dependencies=[Depends(admin_or_teacher)],
)
async def update_test_endpoint(
        test_id: int,
        payload: TestCreateSchema,
        session: AsyncSession = Depends(get_db),
):
    """
    Обновляет тест. Передавайте только изменяемые поля.
    """
    logger.debug(f"Updating test {test_id} with payload: {payload.model_dump()}")
    update_data = payload.model_dump(exclude_unset=True)
    logger.debug(f"Update data: {update_data}")
    return await update_test(session, test_id, **update_data)

@router.delete(
    "/{test_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(admin_or_teacher)],
)
async def delete_test_endpoint(
        test_id: int,
        session: AsyncSession = Depends(get_db),
):
    """Архивирует тест."""
    logger.debug(f"Archiving test with ID: {test_id}")
    await delete_test(session, test_id)


# ---------------------------------------------------------------------------#
# Новый эндпоинт для списка тестов                                           #
# ---------------------------------------------------------------------------#

@router.get("", response_model=List[TestReadSchema])
async def list_tests_endpoint(
        topic_id: Optional[int] = None,
        section_id: Optional[int] = None,
        session: AsyncSession = Depends(get_db),
        _claims: dict = Depends(authenticated),
):
    """
    Возвращает список тестов, отфильтрованных по topic_id или section_id (но не оба).
    """
    logger.debug(f"Fetching tests with topic_id: {topic_id}, section_id: {section_id}")
    if (topic_id is None) == (section_id is None):
        raise HTTPException(
            status_code=400,
            detail="Either topic_id or section_id must be provided (but not both)"
        )
    filters = {"is_archived": False}
    if topic_id:
        filters["topic_id"] = topic_id
    elif section_id:
        filters["section_id"] = section_id
    tests = await list_tests(session, Test, **filters)
    logger.debug(f"Retrieved {len(tests)} tests")
    return [TestReadSchema.model_validate(t) for t in tests]

# ---------------------------------------------------------------------------#
# Студенческие действия                                                      #
# ---------------------------------------------------------------------------#

@router.post(
    "/{test_id}/start",
    response_model=TestStartResponseSchema,
    dependencies=[Depends(require_roles(Role.STUDENT))],
)
async def start_test_endpoint(
        test_id: int,
        session: AsyncSession = Depends(get_db),
        claims: dict[str, Any] = Depends(authenticated),
):
    """
    Студент начинает тест — проверяем доступность (прогресс) и создаём попытку.
    """
    logger.debug(f"Starting test {test_id} for user_id: {claims['sub']}")
    user_id = claims["sub"]
    if not await check_test_availability(session, user_id, test_id):
        logger.debug(f"Test {test_id} unavailable for user_id: {user_id}")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Тест недоступен")

    attempt = await start_test(session, user_id, test_id)
    test = await get_test(session, test_id)

    questions_stmt = select(Question).where(Question.id.in_(test.question_ids)) if test.question_ids else \
        select(Question).where(Question.test_id == test_id)
    result = await session.execute(questions_stmt)
    questions = list(result.scalars().all())

    logger.debug(f"Test {test_id} started, {len(questions)} questions retrieved")
    return {
        "attempt_id": attempt.id,
        "test_id": test.id,
        "questions": questions,
        "start_time": datetime.now(tz=timezone.utc),
        "duration": test.duration,
    }

@router.post(
    "/{test_id}/submit",
    response_model=TestAttemptRead,
    dependencies=[Depends(require_roles(Role.STUDENT))],
)
async def submit_test_endpoint(
        test_id: int,
        payload: TestSubmitSchema,
        session: AsyncSession = Depends(get_db),
        claims: dict[str, Any] = Depends(authenticated),
):
    """
    Студент сдаёт тест — оцениваем, сохраняем и возвращаем попытку.
    """
    logger.debug(f"Submitting test {test_id} for user_id: {claims['sub']} with payload: {payload.model_dump()}")
    user_id = claims["sub"]

    # Валидация соответствия теста и вопросов
    test = await get_test(session, test_id)
    for a in payload.answers:
        q = await get_item(session, Question, a["question_id"])
        if q.test_id != test_id:
            logger.debug(f"Invalid test for question {a['question_id']}")
            raise HTTPException(status_code=400, detail="Не тот тест для вопроса")

    # Передаем только attempt_id и answers в сервис, расчет выполняется там
    attempt = await submit_test(
        session=session,
        attempt_id=payload.attempt_id,
        answers={a["question_id"]: a["answer"] for a in payload.answers},
    )
    logger.debug(f"Test {test_id} submitted, score: {attempt.score}")
    return attempt

# ---------------------------------------------------------------------------#
# Archive / Restore / Permanent Delete                                       #
# ---------------------------------------------------------------------------#

@router.post("/{test_id}/archive", status_code=status.HTTP_204_NO_CONTENT)
async def archive_test_endpoint(
    test_id: int,
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(admin_or_teacher),
):
    """Архивирует тест."""
    logger.debug(f"Archiving test with ID: {test_id}")
    await archive_test(session, test_id)

@router.post("/{test_id}/restore", status_code=status.HTTP_204_NO_CONTENT)
async def restore_test_endpoint(
    test_id: int,
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(admin_or_teacher),
):
    """Восстанавливает архивированный тест."""
    logger.debug(f"Restoring test with ID: {test_id}")
    await restore_test(session, test_id)

@router.delete("/{test_id}/permanent", status_code=status.HTTP_204_NO_CONTENT)
async def delete_test_permanently_endpoint(
    test_id: int,
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(admin_or_teacher),
):
    """Окончательно удаляет архивированный тест."""
    logger.debug(f"Permanently deleting test with ID: {test_id}")
    await delete_test_permanently(session, test_id)
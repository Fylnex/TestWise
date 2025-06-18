# TestWise/Backend/src/api/v1/tests/routes.py
# -*- coding: utf-8 -*-
"""
Маршруты FastAPI для работы с тестами.
"""

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.crud import (
    create_test,
    delete_test,
    get_item,
    get_test,
    start_test,
    submit_test,
    update_test,
)
from src.core.logger import configure_logger
from src.core.progress import check_test_availability
from src.core.security import admin_or_teacher, authenticated, require_roles
from src.database.db import get_db
from src.database.models import Question, Role, Test
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
        payload: TestCreateSchema,  # переиспользуем, все поля опциональны?
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
    """Удаляет тест и все связанные сущности."""
    logger.debug(f"Deleting test with ID: {test_id}")
    await delete_test(session, test_id)
    return

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
    test = await get_item(session, Test, test_id)

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

    correct = 0
    for a in payload.answers:
        q: Question = await get_item(session, Question, a["question_id"])
        if q.test_id != test_id:
            logger.debug(f"Invalid test for question {a['question_id']}")
            raise HTTPException(status_code=400, detail="Не тот тест для вопроса")
        if q.correct_answer == a["answer"]:
            correct += 1

    score = (correct / len(payload.answers)) * 100 if payload.answers else 0.0
    attempt = await submit_test(
        session=session,
        attempt_id=payload.attempt_id,
        score=score,
        time_spent=payload.time_spent,
        answers=payload.answers,
    )
    logger.debug(f"Test {test_id} submitted, score: {score}")
    return attempt
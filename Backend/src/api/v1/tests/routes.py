# TestWise/Backend/src/api/v1/tests/routes.py
# -*- coding: utf-8 -*-
"""
Маршруты FastAPI для работы с тестами.
"""
from datetime import datetime
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.v1.questions.schemas import QuestionReadSchema
from src.api.v1.tests.schemas import (
    TestReadSchema,
    TestCreateSchema,
    TestSubmitSchema,
    TestAttemptRead,
    TestStartResponseSchema,
)
from src.config.logger import configure_logger
from src.database.db import get_db
from src.domain.enums import Role
from src.domain.models import Test, Question, TestAttempt
from src.repository.base import get_item, list_items
from src.repository.test import (
    create_test,
    update_test,
    delete_test,
    archive_test,
    restore_test,
    delete_test_permanently,
    list_tests,
    get_test,
    get_test_attempts,
)
from src.security.security import admin_or_teacher, authenticated, require_roles
from src.service.tests import submit_test, start_test
from src.service.progress import check_test_availability

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
    logger.debug(f"Creating test with payload: {payload.model_dump()}")
    test = await create_test(
        session=session,
        title=payload.title,
        type=payload.type,
        duration=payload.duration,
        section_id=payload.section_id,
        topic_id=payload.topic_id,
    )
    logger.debug(f"Test created with ID: {test.id}")
    return TestReadSchema.model_validate(
        {**test.__dict__, "questions": [], "last_score": None}
    )


@router.get(
    "/{test_id}",
    response_model=TestReadSchema,
    dependencies=[Depends(require_roles(Role.ADMIN, Role.TEACHER, Role.STUDENT))],
)
async def get_test_endpoint(
    test_id: int,
    session: AsyncSession = Depends(get_db),
    claims: dict[str, Any] = Depends(authenticated),
):
    logger.debug(f"Fetching test with ID: {test_id}")
    test = await get_test(session, test_id)

    # Загрузка вопросов
    questions = await list_items(
        session,
        Question,
        is_archived=False,
        test_id=test_id,
    )
    q_list = [QuestionReadSchema.model_validate(q) for q in questions]

    # Последний результат текущего пользователя
    user_id = claims["sub"]
    attempts = await get_test_attempts(session, user_id, test_id)
    last = max(attempts, key=lambda a: a.started_at) if attempts else None
    last_score = last.score if last else None

    return TestReadSchema.model_validate({
        **test.__dict__,
        "questions": q_list,
        "last_score": last_score,
    })


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
    logger.debug(f"Updating test {test_id} with payload: {payload.model_dump()}")
    update_data = payload.model_dump(exclude_unset=True)
    logger.debug(f"Update data: {update_data}")
    updated = await update_test(session, test_id, **update_data)
    return TestReadSchema.model_validate(
        {**updated.__dict__, "questions": [], "last_score": None}
    )


@router.delete(
    "/{test_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(admin_or_teacher)],
)
async def delete_test_endpoint(
    test_id: int,
    session: AsyncSession = Depends(get_db),
):
    logger.debug(f"Archiving test with ID: {test_id}")
    await delete_test(session, test_id)


# ---------------------------------------------------------------------------#
# Новый эндпоинт для списка тестов                                           #
# ---------------------------------------------------------------------------#

@router.get(
    "",
    response_model=List[TestReadSchema],
    dependencies=[Depends(authenticated)],
)
async def list_tests_endpoint(
    topic_id: Optional[int] = None,
    section_id: Optional[int] = None,
    session: AsyncSession = Depends(get_db),
    claims: dict[str, Any] = Depends(authenticated),
):
    logger.debug(f"Fetching tests with topic_id: {topic_id}, section_id: {section_id}")
    if (topic_id is None) == (section_id is None):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either topic_id or section_id must be provided (but not both)"
        )

    filters = {"is_archived": False}
    if topic_id:
        filters["topic_id"] = topic_id
    else:
        filters["section_id"] = section_id

    tests = await list_tests(session, Test, **filters)
    logger.debug(f"Retrieved {len(tests)} tests")

    user_id = claims["sub"]
    out: List[TestReadSchema] = []
    for t in tests:
        attempts = await get_test_attempts(session, user_id, t.id)
        last = max(attempts, key=lambda a: a.started_at) if attempts else None
        last_score = last.score if last else None

        out.append(TestReadSchema.model_validate({
            **t.__dict__,
            "questions": [],
            "last_score": last_score,
        }))

    return out


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
    logger.debug(f"Starting test {test_id} for user_id: {claims['sub']}")
    user_id = claims["sub"]

    if not await check_test_availability(session, user_id, test_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Тест недоступен")

    test = await get_test(session, test_id)
    now = datetime.now()

    stmt = (
        select(TestAttempt)
        .where(
            TestAttempt.user_id == user_id,
            TestAttempt.test_id == test_id,
            TestAttempt.completed_at.is_(None),
        )
        .order_by(TestAttempt.started_at.desc())
    )
    existing = (await session.execute(stmt)).scalars().first()

    if existing:
        if not test.duration or test.duration <= 0:
            attempt = existing
        else:
            elapsed = (now - existing.started_at).total_seconds() / 60
            if elapsed <= test.duration:
                attempt = existing
            else:
                existing.completed_at = now
                await session.commit()
                attempt = await start_test(session, user_id, test_id)
    else:
        attempt = await start_test(session, user_id, test_id)

    q_stmt = select(Question).where(Question.test_id == test_id)
    questions = (await session.execute(q_stmt)).scalars().all()

    logger.debug(f"Test {test_id} started, attempt_id={attempt.id}, questions={len(questions)}")

    return {
        "attempt_id": attempt.id,
        "test_id": test.id,
        "questions": questions,
        "start_time": attempt.started_at,
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
    logger.debug(f"Submitting test {test_id} for user_id: {claims['sub']} with payload: {payload.model_dump()}")
    # Валидация
    for a in payload.answers:
        q = await get_item(session, Question, a["question_id"])
        if q.test_id != test_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Не тот тест для вопроса")

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

@router.post(
    "/{test_id}/archive",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(admin_or_teacher)],
)
async def archive_test_endpoint(
    test_id: int,
    session: AsyncSession = Depends(get_db),
):
    logger.debug(f"Archiving test with ID: {test_id}")
    await archive_test(session, test_id)


@router.post(
    "/{test_id}/restore",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(admin_or_teacher)],
)
async def restore_test_endpoint(
    test_id: int,
    session: AsyncSession = Depends(get_db),
):
    logger.debug(f"Restoring test with ID: {test_id}")
    await restore_test(session, test_id)


@router.delete(
    "/{test_id}/permanent",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(admin_or_teacher)],
)
async def delete_test_permanently_endpoint(
    test_id: int,
    session: AsyncSession = Depends(get_db),
):
    logger.debug(f"Permanently deleting test with ID: {test_id}")
    await delete_test_permanently(session, test_id)

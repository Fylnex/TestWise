# TestWise/Backend/src/api/v1/progress/routes.py
# -*- coding: utf-8 -*-
"""
Маршруты FastAPI для получения прогресса пользователей.

Поддерживает четыре агрегирующих эндпоинта:

* GET /api/v1/progress/topics       — прогресс по темам
* GET /api/v1/progress/sections     — прогресс по секциям
* GET /api/v1/progress/subsections  — прогресс по подсекциям
* GET /api/v1/progress/tests        — история попыток тестов

✔ Студент может запрашивать только *свой* прогресс.
✔ Учитель / админ — любой, либо по `user_id` в query-param.

Примечание: Клиент может агрегировать данные в формат StudentProgress,
используя комбинацию этих эндпоинтов.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.logger import configure_logger
from src.core.security import authenticated
from src.database.db import get_db
from src.database.models import (
    Role,
    TopicProgress,
    SectionProgress,
    SubsectionProgress,
    TestAttempt,
)
from .schemas import (
    TopicProgressRead,
    SectionProgressRead,
    SubsectionProgressRead,
    TestAttemptRead,
)

router = APIRouter()
logger = configure_logger()

# -------------------------- helpers -----------------------------------------

def _resolve_user_id(
    requested: int | None, jwt_payload: dict
) -> int | None:
    """
    Возвращает фактический user_id для выборки:

    * Если текущий пользователь — студент, игнорируем `requested`
      и возвращаем его собственный `sub`.
    * Для учителя/админа — используем `requested` (если передан),
      иначе None, что означает «все пользователи».
    """
    role = Role(jwt_payload["role"])
    if role == Role.STUDENT:
        return jwt_payload["sub"]  # type: ignore[index]
    return requested

# -------------------------- endpoints ---------------------------------------

@router.get(
    "/topics",
    response_model=list[TopicProgressRead],
    dependencies=[Depends(authenticated)],
)
async def list_topic_progress(
    user_id: int | None = Query(None, description="Фильтр по пользователю"),
    session: AsyncSession = Depends(get_db),
    claims: dict = Depends(authenticated),
):
    """
    Возвращает прогресс по темам.
    """
    logger.debug(f"Fetching topic progress, user_id: {claims['sub']}, requested: {user_id}")
    uid = _resolve_user_id(user_id, claims)

    stmt = select(TopicProgress)
    if uid is not None:
        stmt = stmt.where(TopicProgress.user_id == uid)

    rows = (await session.execute(stmt)).scalars().all()
    logger.debug(f"Retrieved {len(rows)} topic progress records")
    return rows

@router.get(
    "/sections",
    response_model=list[SectionProgressRead],
    dependencies=[Depends(authenticated)],
)
async def list_section_progress(
    user_id: int | None = Query(None, description="Фильтр по пользователю"),
    session: AsyncSession = Depends(get_db),
    claims: dict = Depends(authenticated),
):
    """
    Возвращает прогресс по секциям.
    """
    logger.debug(f"Fetching section progress, user_id: {claims['sub']}, requested: {user_id}")
    uid = _resolve_user_id(user_id, claims)

    stmt = select(SectionProgress)
    if uid is not None:
        stmt = stmt.where(SectionProgress.user_id == uid)

    rows = (await session.execute(stmt)).scalars().all()
    logger.debug(f"Retrieved {len(rows)} section progress records")
    return rows

@router.get(
    "/subsections",
    response_model=list[SubsectionProgressRead],
    dependencies=[Depends(authenticated)],
)
async def list_subsection_progress(
    user_id: int | None = Query(None, description="Фильтр по пользователю"),
    session: AsyncSession = Depends(get_db),
    claims: dict = Depends(authenticated),
):
    """
    Возвращает прогресс по подсекциям.
    """
    logger.debug(f"Fetching subsection progress, user_id: {claims['sub']}, requested: {user_id}")
    uid = _resolve_user_id(user_id, claims)

    stmt = select(SubsectionProgress)
    if uid is not None:
        stmt = stmt.where(SubsectionProgress.user_id == uid)

    rows = (await session.execute(stmt)).scalars().all()
    logger.debug(f"Retrieved {len(rows)} subsection progress records")
    return rows

@router.get(
    "/tests",
    response_model=list[TestAttemptRead],
    dependencies=[Depends(authenticated)],
)
async def list_test_attempts(
    user_id: int | None = Query(None, description="Фильтр по пользователю"),
    session: AsyncSession = Depends(get_db),
    claims: dict = Depends(authenticated),
):
    """
    Возвращает историю попыток тестов.
    """
    logger.debug(f"Fetching test attempts, user_id: {claims['sub']}, requested: {user_id}")
    uid = _resolve_user_id(user_id, claims)

    stmt = select(TestAttempt)
    if uid is not None:
        stmt = stmt.where(TestAttempt.user_id == uid)

    rows = (await session.execute(stmt)).scalars().all()
    logger.debug(f"Retrieved {len(rows)} test attempt records")
    return rows
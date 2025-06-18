# TestWise/Backend/src/api/v1/profile/routes.py
# -*- coding: utf-8 -*-
"""
Маршрут `/api/v1/profile` — агрегированные данные прогресса текущего пользователя.
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.logger import configure_logger
from src.core.security import authenticated
from src.database.db import get_db
from src.database.models import (
    TopicProgress,
    SectionProgress,
    SubsectionProgress,
    TestAttempt,
)

from .schemas import ProfileRead

router = APIRouter()
logger = configure_logger()

@router.get("", response_model=ProfileRead, dependencies=[Depends(authenticated)])
async def read_profile(
    session: AsyncSession = Depends(get_db),
    claims: dict = Depends(authenticated),
):
    """
    Возвращает полный «дашборд» прогресса текущего пользователя.

    Доступ: любой авторизованный пользователь.
    """
    logger.debug(f"Fetching profile for user_id: {claims['sub']}")
    user_id = claims["sub"]

    # Собираем все кусочки прогресса параллельно.
    topic_stmt = select(TopicProgress).where(TopicProgress.user_id == user_id)
    section_stmt = select(SectionProgress).where(SectionProgress.user_id == user_id)
    subsection_stmt = select(SubsectionProgress).where(SubsectionProgress.user_id == user_id)
    tests_stmt = select(TestAttempt).where(TestAttempt.user_id == user_id)

    topics = (await session.execute(topic_stmt)).scalars().all()
    sections = (await session.execute(section_stmt)).scalars().all()
    subsections = (await session.execute(subsection_stmt)).scalars().all()
    attempts = (await session.execute(tests_stmt)).scalars().all()

    if not any((topics, sections, subsections, attempts)):
        logger.debug(f"No progress data found for user_id: {user_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Данные профиля не найдены"
        )

    profile = ProfileRead(
        user_id=user_id,
        topics=topics,
        sections=sections,
        subsections=subsections,
        tests=attempts,
        generated_at=datetime.now(tz=timezone.utc),
    )
    logger.debug(f"Profile generated for user_id: {user_id} with {len(topics)} topics, {len(sections)} sections, {len(subsections)} subsections, {len(attempts)} attempts")
    return profile
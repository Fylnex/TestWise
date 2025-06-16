# TestWise/Backend/src/core/progress.py
# -*- coding: utf-8 -*-
"""
This module handles progress-related logic for the TestWise application.
It provides functionality for saving and retrieving user progress.
"""

from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.logger import configure_logger
from src.database.models import Progress, User, Topic, Section
from src.utils.exceptions import NotFoundError, ValidationError

logger = configure_logger()


async def save_progress(
        session: AsyncSession,
        user_id: int,
        topic_id: int,
        section_id: int,
        score: float | None = None,
        time_spent: int | None = None
) -> Progress:
    """
    Saves or updates a user's progress for a section.

    Args:
        session (AsyncSession): Database session.
        user_id (int): ID of the user.
        topic_id (int): ID of the topic.
        section_id (int): ID of the section.
        score (float, optional): Score for the test (if applicable).
        time_spent (int, optional): Time spent on the section/test in seconds.

    Returns:
        Progress: The created or updated progress record.

    Exceptions:
        - NotFoundError: If user, topic, or section is not found.
        - ValidationError: If score is invalid.
    """
    # Validate inputs
    user = await session.get(User, user_id)
    if not user:
        raise NotFoundError(resource_type="User", resource_id=user_id)
    topic = await session.get(Topic, topic_id)
    if not topic:
        raise NotFoundError(resource_type="Topic", resource_id=topic_id)
    section = await session.get(Section, section_id)
    if not section:
        raise NotFoundError(resource_type="Section", resource_id=section_id)

    if score is not None and (score < 0 or score > 100):
        raise ValidationError(detail="Score must be between 0 and 100")

    # Check if progress exists
    stmt = select(Progress).where(
        Progress.user_id == user_id,
        Progress.section_id == section_id
    )
    result = await session.execute(stmt)
    progress = result.scalar_one_or_none()

    if progress:
        # Update existing progress
        progress.attempts += 1
        if score is not None:
            progress.score = score
        if time_spent is not None:
            progress.time_spent = (progress.time_spent or 0) + time_spent
        progress.completed = score is not None and score >= 60  # Example passing threshold
        progress.completed_at = datetime.utcnow() if progress.completed else progress.completed_at
        await session.commit()
        await session.refresh(progress)
        logger.info(f"Updated progress for user {user_id} in section {section_id}")
    else:
        # Create new progress
        progress = Progress(
            user_id=user_id,
            topic_id=topic_id,
            section_id=section_id,
            score=score,
            time_spent=time_spent,
            completed=score is not None and score >= 60,
            completed_at=datetime.utcnow() if score is not None and score >= 60 else None,
            attempts=1
        )
        session.add(progress)
        await session.commit()
        await session.refresh(progress)
        logger.info(f"Created progress for user {user_id} in section {section_id}")

    return progress


async def get_user_progress(session: AsyncSession, user_id: int, topic_id: int | None = None) -> list[Progress]:
    """
    Retrieves a user's progress for all sections or a specific topic.

    Args:
        session (AsyncSession): Database session.
        user_id (int): ID of the user.
        topic_id (int, optional): ID of the topic to filter progress.

    Returns:
        list[Progress]: List of progress records.

    Exceptions:
        - NotFoundError: If user is not found.
    """
    user = await session.get(User, user_id)
    if not user:
        raise NotFoundError(resource_type="User", resource_id=user_id)
    stmt = select(Progress).where(Progress.user_id == user_id)
    if topic_id:
        stmt = stmt.where(Progress.topic_id == topic_id)
    result = await session.execute(stmt)
    progress = result.scalars().all()
    logger.info(f"Retrieved progress for user {user_id}")
    return progress

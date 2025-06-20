# -*- coding: utf-8 -*-
"""
TestWise/Backend/src/repository/topic.py
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Repository for Topic, Section, and Subsection management.

This module provides data access operations for the Topic hierarchy, including
sections and subsections.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger import configure_logger
from src.domain.models import Section, Subsection, Topic, SubsectionType, User, SubsectionProgress
from src.repository.base import create_item, delete_item, get_item, update_item
from src.utils.exceptions import NotFoundError

logger = configure_logger()

# ---------------------------------------------------------------------------
# Topic / Section / Subsection
# ---------------------------------------------------------------------------

async def create_topic(
    session: AsyncSession,
    title: str,
    description: str | None = None,
    category: str | None = None,
    image: str | None = None,
) -> Topic:
    """Create a new topic with the given attributes."""
    return await create_item(
        session,
        Topic,
        title=title,
        description=description,
        category=category,
        image=image,
    )

async def get_topic(session: AsyncSession, topic_id: int) -> Topic:
    """Retrieve a topic by ID."""
    return await get_item(session, Topic, topic_id)

async def update_topic(
    session: AsyncSession,
    topic_id: int,
    **kwargs: Any,  # noqa: ANN401
) -> Topic:
    """Update an existing topic, excluding immutable fields."""
    kwargs.pop("id", None)
    return await update_item(session, Topic, topic_id, **kwargs)

async def delete_topic(session: AsyncSession, topic_id: int) -> None:
    """Archive a topic by setting is_archived=True."""
    topic = await get_item(session, Topic, topic_id)
    if topic.is_archived:
        raise NotFoundError(resource_type="Topic", resource_id=topic_id, details="Already archived")
    topic.is_archived = True
    await session.commit()
    logger.info(f"Archived topic {topic_id}")

async def archive_topic(session: AsyncSession, topic_id: int) -> None:
    """Explicitly archive a topic by setting is_archived=True."""
    topic = await get_item(session, Topic, topic_id)
    if topic.is_archived:
        raise NotFoundError(resource_type="Topic", resource_id=topic_id, details="Already archived")
    topic.is_archived = True
    await session.commit()
    logger.info(f"Archived topic {topic_id}")

async def restore_topic(session: AsyncSession, topic_id: int) -> None:
    """Restore an archived topic by setting is_archived=False."""
    topic = await get_item(session, Topic, topic_id)
    if not topic.is_archived:
        raise NotFoundError(resource_type="Topic", resource_id=topic_id, details="Not archived")
    topic.is_archived = False
    await session.commit()
    logger.info(f"Restored topic {topic_id}")

async def delete_topic_permanently(session: AsyncSession, topic_id: int) -> None:
    """Permanently delete an archived topic."""
    topic = await get_item(session, Topic, topic_id)
    if not topic.is_archived:
        raise NotFoundError(resource_type="Topic", resource_id=topic_id, details="Cannot delete non-archived topic")
    await delete_item(session, Topic, topic_id)
    logger.info(f"Permanently deleted topic {topic_id}")

# ----------------------------- Section helpers ---------------------------

async def create_section(
    session: AsyncSession,
    topic_id: int,
    title: str,
    content: str | None = None,
    description: str | None = None,
    order: int = 0,
) -> Section:
    """Create a new section under the specified topic."""
    await get_item(session, Topic, topic_id)
    return await create_item(
        session,
        Section,
        topic_id=topic_id,
        title=title,
        content=content,
        description=description,
        order=order,
    )

async def update_section(
    session: AsyncSession,
    section_id: int,
    **kwargs: Any,  # noqa: ANN401
) -> Section:
    """Update an existing section, excluding immutable fields."""
    kwargs.pop("id", None)
    return await update_item(session, Section, section_id, **kwargs)

# ----------------------------- Subsection helpers ---------------------------

async def create_subsection(
    session: AsyncSession,
    section_id: int,
    title: str,
    content: str | None = None,
    type: SubsectionType = SubsectionType.TEXT,
    order: int = 0,
    file_path: str | None = None,
) -> Subsection:
    """Create a new subsection under the specified section."""
    await get_item(session, Section, section_id)
    return await create_item(
        session,
        Subsection,
        section_id=section_id,
        title=title,
        content=content,
        type=type,
        order=order,
        file_path=file_path,
    )

async def get_subsection(session: AsyncSession, subsection_id: int) -> Subsection:
    """Retrieve a subsection by ID."""
    return await get_item(session, Subsection, subsection_id)

async def update_subsection(
    session: AsyncSession,
    subsection_id: int,
    **kwargs: Any,  # noqa: ANN401
) -> Subsection:
    """Update an existing subsection, excluding immutable fields."""
    kwargs.pop("id", None)
    return await update_item(session, Subsection, subsection_id, **kwargs)

async def delete_subsection(session: AsyncSession, subsection_id: int) -> None:
    """Archive a subsection by setting is_archived=True."""
    subsection = await get_item(session, Subsection, subsection_id)
    subsection.is_archived = True
    await session.commit()
    logger.info(f"Archived subsection {subsection_id}")

async def archive_subsection(session: AsyncSession, subsection_id: int) -> None:
    """Explicitly archive a subsection by setting is_archived=True."""
    subsection = await get_item(session, Subsection, subsection_id)
    if subsection.is_archived:
        raise NotFoundError(resource_type="Subsection", resource_id=subsection_id, details="Already archived")
    subsection.is_archived = True
    await session.commit()
    logger.info(f"Archived subsection {subsection_id}")

async def restore_subsection(session: AsyncSession, subsection_id: int) -> None:
    """Restore an archived subsection by setting is_archived=False."""
    subsection = await get_item(session, Subsection, subsection_id)
    if not subsection.is_archived:
        raise NotFoundError(resource_type="Subsection", resource_id=subsection_id, details="Not archived")
    subsection.is_archived = False
    await session.commit()
    logger.info(f"Restored subsection {subsection_id}")

async def delete_subsection_permanently(session: AsyncSession, subsection_id: int) -> None:
    """Permanently delete an archived subsection."""
    subsection = await get_item(session, Subsection, subsection_id)
    if not subsection.is_archived:
        raise NotFoundError(resource_type="Subsection", resource_id=subsection_id, details="Cannot delete non-archived subsection")
    await delete_item(session, Subsection, subsection_id)
    logger.info(f"Permanently deleted subsection {subsection_id}")

async def mark_subsection_viewed(
    session: AsyncSession,
    user_id: int,
    subsection_id: int,
) -> SubsectionProgress:
    """
    Idempotently mark a subsection as viewed and persist the timestamp.

    If a SubsectionProgress row doesn't exist, it will be created; otherwise,
    it is updated only when transitioning from not viewed to viewed.
    """
    await get_item(session, User, user_id)
    subsection = await get_item(session, Subsection, subsection_id)

    stmt = select(SubsectionProgress).where(
        SubsectionProgress.user_id == user_id,
        SubsectionProgress.subsection_id == subsection_id,
    )
    result = await session.execute(stmt)
    progress = result.scalar_one_or_none()

    if progress is None:
        progress = SubsectionProgress(
            user_id=user_id,
            subsection_id=subsection_id,
            is_viewed=True,
            viewed_at=datetime.now(),
        )
        session.add(progress)
        await session.commit()
        await session.refresh(progress)
        logger.info("Created progress row for viewed subsection %s by user %s", subsection_id, user_id)
    elif not progress.is_viewed:
        progress.is_viewed = True
        progress.viewed_at = datetime.now()
        await session.commit()
        await session.refresh(progress)
        logger.info("Marked subsection %s viewed for user %s", subsection_id, user_id)

    return progress
# -*- coding: utf-8 -*-
"""API v1 › Topics routes with progress endpoints."""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger import configure_logger
from src.domain.enums import Role
from src.domain.models import Topic, TopicProgress
from src.repository.topic import (
    create_topic,
    get_topic,
    update_topic,
    delete_topic,
    archive_topic,
    restore_topic,
    delete_topic_permanently,
)
from src.security.security import admin_or_teacher, authenticated
from src.database.db import get_db
from src.service.progress import calculate_topic_progress
from .schemas import (
    TopicCreateSchema,
    TopicProgressRead,
    TopicReadSchema,
    TopicUpdateSchema,
)

router = APIRouter()
logger = configure_logger()

# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------

@router.post("", response_model=TopicReadSchema, status_code=status.HTTP_201_CREATED)
async def create_topic_endpoint(
    topic_data: TopicCreateSchema,
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(admin_or_teacher),
):
    logger.debug(f"Creating topic with data: {topic_data.model_dump()}")
    topic = await create_topic(
        session,
        title=topic_data.title,
        description=topic_data.description,
        category=topic_data.category,
        image=topic_data.image,
    )
    logger.debug(f"Topic created with ID: {topic.id}")
    return TopicReadSchema.model_validate(topic)

@router.get("", response_model=List[TopicReadSchema])
async def list_topics_endpoint(
    session: AsyncSession = Depends(get_db),
    claims: dict = Depends(authenticated),
):
    logger.debug(f"Listing topics for user_id: {claims['sub']}")
    stmt = select(Topic)
    res = await session.execute(stmt)
    topics = res.scalars().all()

    user_role = Role(claims["role"])
    if user_role == Role.STUDENT:
        progress_stmt = select(TopicProgress).where(TopicProgress.user_id == claims["sub"])
        prog_res = await session.execute(progress_stmt)
        by_topic = {tp.topic_id: tp for tp in prog_res.scalars().all()}
        result = [
            TopicReadSchema.model_validate(t.__dict__ | {"progress": by_topic.get(t.id)})
            for t in topics
        ]
    else:
        result = [TopicReadSchema.model_validate(t.__dict__) for t in topics]
    logger.debug(f"Retrieved {len(result)} topics")
    return result

@router.get("/{topic_id}", response_model=TopicReadSchema)
async def get_topic_endpoint(
    topic_id: int,
    session: AsyncSession = Depends(get_db),
    claims: dict = Depends(authenticated),
):
    logger.debug(f"Fetching topic with ID: {topic_id} for user_id: {claims['sub']}")
    topic = await get_topic(session, topic_id)
    user_role = Role(claims["role"])
    if user_role == Role.STUDENT:
        tp_stmt = select(TopicProgress).where(
            TopicProgress.user_id == claims["sub"], TopicProgress.topic_id == topic_id
        )
        tp_res = await session.execute(tp_stmt)
        tp = tp_res.scalar_one_or_none()
        logger.debug(f"Topic {topic_id} retrieved with progress: {tp.completion_percentage if tp else None}")
        return TopicReadSchema.model_validate(topic.__dict__ | {"progress": tp if tp else None})
    logger.debug(f"Topic {topic_id} retrieved without progress")
    return TopicReadSchema.model_validate(topic.__dict__)

@router.put("/{topic_id}", response_model=TopicReadSchema)
async def update_topic_endpoint(
    topic_id: int,
    topic_data: TopicUpdateSchema,
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(admin_or_teacher),
):
    logger.debug(f"Updating topic {topic_id} with data: {topic_data.model_dump()}")
    topic = await update_topic(session, topic_id, **topic_data.model_dump(exclude_unset=True))
    logger.debug(f"Topic {topic_id} updated")
    return TopicReadSchema.model_validate(topic)

@router.delete("/{topic_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_topic_endpoint(
    topic_id: int,
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(admin_or_teacher),
):
    logger.debug(f"Archiving topic with ID: {topic_id}")
    await delete_topic(session, topic_id)

# ---------------------------------------------------------------------------
# Progress
# ---------------------------------------------------------------------------

@router.get("/{topic_id}/progress", response_model=TopicProgressRead)
async def get_topic_progress_endpoint(
    topic_id: int,
    session: AsyncSession = Depends(get_db),
    claims: dict = Depends(authenticated),
):
    logger.debug(f"Fetching progress for topic {topic_id}, user_id: {claims['sub']}")
    user_id = claims["sub"]
    await calculate_topic_progress(session, user_id, topic_id, commit=True)

    tp_stmt = select(TopicProgress).where(TopicProgress.user_id == user_id, TopicProgress.topic_id == topic_id)
    tp_res = await session.execute(tp_stmt)
    tp = tp_res.scalar_one_or_none()
    if tp is None:
        logger.debug(f"No progress found for topic {topic_id}, user_id {user_id}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Progress not found")
    logger.debug(f"Progress retrieved for topic {topic_id}: {tp.completion_percentage}")
    return TopicProgressRead.model_validate(tp)

# ---------------------------------------------------------------------------
# Archive / Restore / Permanent Delete
# ---------------------------------------------------------------------------

@router.post("/{topic_id}/archive", status_code=status.HTTP_204_NO_CONTENT)
async def archive_topic_endpoint(
    topic_id: int,
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(admin_or_teacher),
):
    logger.debug(f"Archiving topic with ID: {topic_id}")
    await archive_topic(session, topic_id)

@router.post("/{topic_id}/restore", status_code=status.HTTP_204_NO_CONTENT)
async def restore_topic_endpoint(
    topic_id: int,
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(admin_or_teacher),
):
    logger.debug(f"Restoring topic with ID: {topic_id}")
    await restore_topic(session, topic_id)

@router.delete("/{topic_id}/permanent", status_code=status.HTTP_204_NO_CONTENT)
async def delete_topic_permanently_endpoint(
    topic_id: int,
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(admin_or_teacher),
):
    logger.debug(f"Permanently deleting topic with ID: {topic_id}")
    await delete_topic_permanently(session, topic_id)
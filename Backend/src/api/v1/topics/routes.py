# -*- coding: utf-8 -*-
"""API v1 › Topics routes with progress endpoints."""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger import configure_logger
from src.domain.enums import Role
from src.domain.models import Topic, TopicProgress, User
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
    TopicBaseReadSchema,
)

router = APIRouter()
logger = configure_logger()

# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------

@router.post("", response_model=TopicBaseReadSchema, status_code=status.HTTP_201_CREATED)
async def create_topic_endpoint(
    topic_data: TopicCreateSchema,
    session: AsyncSession = Depends(get_db),
    claims: dict = Depends(admin_or_teacher),  # Переименуем _claims в claims для ясности
):
    """
    Создаёт новую тему с использованием идентификатора текущего пользователя из сессии.

    Args:
        topic_data (TopicCreateSchema): Данные для создания темы.
        session (AsyncSession): Асинхронная сессия базы данных.
        claims (dict): Данные из JWT токена (содержит user_id и role).

    Returns:
        TopicBaseReadSchema: Созданная тема с полным именем создателя.

    Raises:
        HTTPException: Если данные недействительны.
    """
    logger.debug(f"Creating topic with data: {topic_data.model_dump()}")
    creator_id = claims["sub"]  # Берем user_id из claims
    topic = await create_topic(
        session,
        title=topic_data.title,
        description=topic_data.description,
        category=topic_data.category,
        image=topic_data.image,
        creator_id=creator_id,  # Используем creator_id из сессии
    )
    # Получаем полное имя создателя
    creator_stmt = select(User.full_name).where(User.id == topic.creator_id)
    creator_result = await session.execute(creator_stmt)
    creator_full_name = creator_result.scalar_one_or_none() or "Неизвестно"
    logger.debug(f"Topic created with ID: {topic.id} by user {creator_id}")
    return TopicBaseReadSchema.model_validate({
        "id": topic.id,
        "title": topic.title,
        "description": topic.description,
        "category": topic.category,
        "image": topic.image,
        "created_at": topic.created_at,
        "is_archived": topic.is_archived,
        "creator_full_name": creator_full_name,
    })

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
            TopicReadSchema.model_validate({
                "id": t.id,
                "title": t.title,
                "description": t.description,
                "category": t.category,
                "image": t.image,
                "created_at": t.created_at,
                "is_archived": t.is_archived,
                "progress": by_topic.get(t.id) if by_topic.get(t.id) else None,
                "creator_full_name": (await session.execute(select(User.full_name).where(User.id == t.creator_id))).scalar_one_or_none() or "Неизвестно",
            })
            for t in topics
        ]
    else:
        result = [
            TopicReadSchema.model_validate({
                "id": t.id,
                "title": t.title,
                "description": t.description,
                "category": t.category,
                "image": t.image,
                "created_at": t.created_at,
                "is_archived": t.is_archived,
                "progress": None,
                "creator_full_name": (await session.execute(select(User.full_name).where(User.id == t.creator_id))).scalar_one_or_none() or "Неизвестно",
            })
            for t in topics
        ]
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
    creator_full_name = (await session.execute(select(User.full_name).where(User.id == topic.creator_id))).scalar_one_or_none() or "Неизвестно"
    if user_role == Role.STUDENT:
        tp_stmt = select(TopicProgress).where(
            TopicProgress.user_id == claims["sub"], TopicProgress.topic_id == topic_id
        )
        tp_res = await session.execute(tp_stmt)
        tp = tp_res.scalar_one_or_none()
        logger.debug(f"Topic {topic_id} retrieved with progress: {tp.completion_percentage if tp else None}")
        return TopicReadSchema.model_validate({
            "id": topic.id,
            "title": topic.title,
            "description": topic.description,
            "category": topic.category,
            "image": topic.image,
            "created_at": topic.created_at,
            "is_archived": topic.is_archived,
            "progress": tp if tp else None,
            "creator_full_name": creator_full_name,
        })
    logger.debug(f"Topic {topic_id} retrieved without progress")
    return TopicReadSchema.model_validate({
        "id": topic.id,
        "title": topic.title,
        "description": topic.description,
        "category": topic.category,
        "image": topic.image,
        "created_at": topic.created_at,
        "is_archived": topic.is_archived,
        "progress": None,
        "creator_full_name": creator_full_name,
    })

@router.put("/{topic_id}", response_model=TopicReadSchema)
async def update_topic_endpoint(
    topic_id: int,
    topic_data: TopicUpdateSchema,
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(admin_or_teacher),
):
    logger.debug(f"Updating topic {topic_id} with data: {topic_data.model_dump()}")
    topic = await update_topic(session, topic_id, **topic_data.model_dump(exclude_unset=True))
    await session.refresh(topic)
    logger.debug(f"Topic {topic_id} updated")
    return TopicReadSchema.model_validate({
        "id": topic.id,
        "title": topic.title,
        "description": topic.description,
        "category": topic.category,
        "image": topic.image,
        "created_at": topic.created_at,
        "is_archived": topic.is_archived,
        "progress": None,
        "creator_id": topic.creator_id,  # Добавлено
    })

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
# TestWise/Backend/src/api/v1/topics/routes.py
# -*- coding: utf-8 -*-
"""API v1 › Topics routes with progress endpoints."""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.crud import create_topic, delete_item, get_item, update_item
from src.core.logger import configure_logger
from src.core.progress import calculate_topic_progress
from src.core.security import admin_only, admin_or_teacher, authenticated
from src.database.db import get_db
from src.database.models import Role, Topic, TopicProgress
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
    topic = await create_topic(
        session,
        title=topic_data.title,
        description=topic_data.description,
        category=topic_data.category,
        image=topic_data.image,
    )
    return TopicReadSchema.model_validate(topic)


@router.put("/{topic_id}", response_model=TopicReadSchema)
async def update_topic_endpoint(
    topic_id: int,
    topic_data: TopicUpdateSchema,
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(admin_or_teacher),
):
    topic = await update_item(session, Topic, topic_id, **topic_data.model_dump(exclude_unset=True))
    return TopicReadSchema.model_validate(topic)


@router.delete("/{topic_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_topic_endpoint(
    topic_id: int,
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(admin_or_teacher),
):
    await delete_item(session, Topic, topic_id)
    logger.info("Удалена тема %s", topic_id)


# ---------------------------------------------------------------------------
# Read with progress
# ---------------------------------------------------------------------------


@router.get("", response_model=List[TopicReadSchema])
async def list_topics_endpoint(
    session: AsyncSession = Depends(get_db),
    claims: dict = Depends(authenticated),
):
    stmt = select(Topic)
    res = await session.execute(stmt)
    topics = res.scalars().all()

    user_role = Role(claims["role"])
    if user_role == Role.STUDENT:
        # attach progress
        progress_stmt = select(TopicProgress).where(TopicProgress.user_id == claims["sub" or "id"],)
        prog_res = await session.execute(progress_stmt)
        by_topic = {tp.topic_id: tp for tp in prog_res.scalars().all()}
        result = [
            TopicReadSchema.model_validate({**t.__dict__, "progress": by_topic.get(t.id)}) for t in topics
        ]
    else:
        result = [TopicReadSchema.model_validate(t) for t in topics]
    return result


@router.get("/{topic_id}", response_model=TopicReadSchema)
async def get_topic_endpoint(
    topic_id: int,
    session: AsyncSession = Depends(get_db),
    claims: dict = Depends(authenticated),
):
    topic = await get_item(session, Topic, topic_id)
    user_role = Role(claims["role"])
    if user_role == Role.STUDENT:
        tp_stmt = select(TopicProgress).where(
            TopicProgress.user_id == claims["sub" or "id"], TopicProgress.topic_id == topic_id
        )
        tp_res = await session.execute(tp_stmt)
        tp = tp_res.scalar_one_or_none()
        return TopicReadSchema.model_validate({**topic.__dict__, "progress": tp})
    return TopicReadSchema.model_validate(topic)


@router.get("/{topic_id}/progress", response_model=TopicProgressRead)
async def get_topic_progress_endpoint(
    topic_id: int,
    session: AsyncSession = Depends(get_db),
    claims: dict = Depends(authenticated),
):
    user_id = claims["sub" or "id"]
    # ensure fresh calculation
    await calculate_topic_progress(session, user_id, topic_id, commit=True)

    tp_stmt = select(TopicProgress).where(TopicProgress.user_id == user_id, TopicProgress.topic_id == topic_id)
    tp_res = await session.execute(tp_stmt)
    tp = tp_res.scalar_one_or_none()
    if tp is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Progress not found")
    return TopicProgressRead.model_validate(tp)

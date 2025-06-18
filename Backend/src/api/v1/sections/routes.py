# TestWise/Backend/src/api/v1/sections/routes.py
# -*- coding: utf-8 -*-
"""API v1 › Sections routes (no test logic)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.crud import (
    create_section,
    delete_item,
    get_item,
    update_item,
)
from src.core.logger import configure_logger
from src.core.progress import calculate_section_progress
from src.core.security import admin_or_teacher, authenticated
from src.database.db import get_db
from src.database.models import Section, SectionProgress, Subsection
from .schemas import (
    SectionCreateSchema,
    SectionProgressRead,
    SectionReadSchema,
    SectionUpdateSchema,
    SectionWithSubsections,
    SubsectionRead,
)

router = APIRouter()
logger = configure_logger()

# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------

@router.post("", response_model=SectionReadSchema, status_code=status.HTTP_201_CREATED)
async def create_section_endpoint(
        payload: SectionCreateSchema,
        session: AsyncSession = Depends(get_db),
        _claims: dict = Depends(admin_or_teacher),
):
    logger.debug(f"Creating section with payload: {payload.model_dump()}")
    section = await create_section(
        session,
        topic_id=payload.topic_id,
        title=payload.title,
        content=payload.content,
        description=payload.description,
        order=payload.order,
    )
    logger.debug(f"Section created with ID: {section.id}")
    return SectionReadSchema.model_validate(section)

@router.get("/{section_id}", response_model=SectionReadSchema)
async def get_section_endpoint(
        section_id: int,
        session: AsyncSession = Depends(get_db),
        _claims: dict = Depends(authenticated),
):
    logger.debug(f"Fetching section with ID: {section_id}")
    section = await get_item(session, Section, section_id)
    logger.debug(f"Section retrieved: {section.title}")
    return SectionReadSchema.model_validate(section)

@router.put("/{section_id}", response_model=SectionReadSchema)
async def update_section_endpoint(
        section_id: int,
        payload: SectionUpdateSchema,
        session: AsyncSession = Depends(get_db),
        _claims: dict = Depends(admin_or_teacher),
):
    logger.debug(f"Updating section {section_id} with payload: {payload.model_dump()}")
    section = await update_item(session, Section, section_id, **payload.model_dump(exclude_unset=True))
    logger.debug(f"Section {section_id} updated")
    return SectionReadSchema.model_validate(section)

@router.delete("/{section_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_section_endpoint(
        section_id: int,
        session: AsyncSession = Depends(get_db),
        _claims: dict = Depends(admin_or_teacher),
):
    logger.debug(f"Deleting section with ID: {section_id}")
    await delete_item(session, Section, section_id)
    logger.info(f"Удален раздел {section_id}")

# ---------------------------------------------------------------------------
# Nested resources
# ---------------------------------------------------------------------------

@router.get("/{section_id}/progress", response_model=SectionProgressRead)
async def get_section_progress_endpoint(
        section_id: int,
        session: AsyncSession = Depends(get_db),
        claims: dict = Depends(authenticated),
):
    logger.debug(f"Fetching progress for section {section_id}, user_id: {claims['sub']}")
    user_id = claims["sub" or "id"]
    await calculate_section_progress(session, user_id, section_id, commit=True)

    stmt = select(SectionProgress).where(SectionProgress.user_id == user_id, SectionProgress.section_id == section_id)
    res = await session.execute(stmt)
    progress = res.scalar_one_or_none()
    if progress is None:
        logger.debug(f"No progress found for section {section_id}, user_id {user_id}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Progress not found")
    logger.debug(f"Progress retrieved for section {section_id}")
    return SectionProgressRead.model_validate(progress)

@router.get("/{section_id}/subsections", response_model=SectionWithSubsections)
async def list_subsections_endpoint(
        section_id: int,
        session: AsyncSession = Depends(get_db),
        _claims: dict = Depends(authenticated),
):
    logger.debug(f"Listing subsections for section {section_id}")
    section = await get_item(session, Section, section_id)
    stmt = select(Subsection).where(Subsection.section_id == section_id).order_by(Subsection.order)
    res = await session.execute(stmt)
    subs = res.scalars().all()
    logger.debug(f"Retrieved {len(subs)} subsections for section {section_id}")
    return SectionWithSubsections.model_validate(
        {**section.__dict__, "subsections": [SubsectionRead.model_validate(s) for s in subs]}
    )
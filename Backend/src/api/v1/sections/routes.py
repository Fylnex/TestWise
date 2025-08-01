# TestWise/Backend/src/api/v1/sections/routes.py
# -*- coding: utf-8 -*-
"""API v1 › Sections routes (no test logic)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from src.config.logger import configure_logger
from src.domain.models import Section, SectionProgress, Subsection
from src.repository.base import list_items, get_item, update_item, archive_item, delete_item_permanently
from src.repository.topic import create_section
from src.security.security import admin_or_teacher, authenticated
from src.database.db import get_db
from src.service.progress import calculate_section_progress
from .schemas import (
    SectionCreateSchema,
    SectionProgressRead,
    SectionReadSchema,
    SectionUpdateSchema,
    SectionWithSubsections,
)
from ..subsections.schemas import SubsectionReadSchema

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


@router.get("", response_model=List[SectionReadSchema])
async def list_sections_endpoint(
        topic_id: Optional[int] = None,
        session: AsyncSession = Depends(get_db),
        _claims: dict = Depends(authenticated),
):
    logger.debug(f"Fetching sections with topic_id: {topic_id}")
    filters = {"is_archived": False}
    if topic_id:
        filters["topic_id"] = topic_id
    sections = await list_items(session, Section, **filters)
    logger.debug(f"Retrieved {len(sections)} sections")
    return [SectionReadSchema.model_validate(s) for s in sections]


@router.get("/{section_id}", response_model=SectionReadSchema)
async def get_section_endpoint(
        section_id: int,
        session: AsyncSession = Depends(get_db),
        _claims: dict = Depends(authenticated),
):
    logger.debug(f"Fetching section with ID: {section_id}")
    section = await get_item(session, Section, section_id, is_archived=False)
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
    logger.debug(f"Archiving section with ID: {section_id}")
    await archive_item(session, Section, section_id)
    logger.info(f"Раздел {section_id} архивирован")


@router.post("/{section_id}/archive", status_code=status.HTTP_204_NO_CONTENT)
async def archive_section_endpoint(
        section_id: int,
        session: AsyncSession = Depends(get_db),
        _claims: dict = Depends(admin_or_teacher),
):
    logger.debug(f"Archiving section with ID: {section_id}")
    await archive_item(session, Section, section_id)
    logger.info(f"Раздел {section_id} архивирован")


@router.post("/{section_id}/restore", status_code=status.HTTP_204_NO_CONTENT)
async def restore_section_endpoint(
        section_id: int,
        session: AsyncSession = Depends(get_db),
        _claims: dict = Depends(admin_or_teacher),
):
    logger.debug(f"Restoring section with ID: {section_id}")
    section = await get_item(session, Section, section_id, is_archived=True)
    section.is_archived = False
    await session.commit()
    logger.info(f"Раздел {section_id} восстановлен")


@router.delete("/{section_id}/permanent", status_code=status.HTTP_204_NO_CONTENT)
async def delete_section_permanently_endpoint(
        section_id: int,
        session: AsyncSession = Depends(get_db),
        _claims: dict = Depends(admin_or_teacher),
):
    logger.debug(f"Permanently deleting section with ID: {section_id}")
    await delete_item_permanently(session, Section, section_id)
    logger.info(f"Раздел {section_id} удален окончательно")


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
    user_id = claims["sub"] or claims["id"]
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
    section = await get_item(session, Section, section_id, is_archived=False)
    stmt = select(Subsection) \
        .where(Subsection.section_id == section_id, Subsection.is_archived == False) \
        .order_by(Subsection.order)
    res = await session.execute(stmt)
    subs = res.scalars().all()
    logger.debug(f"Retrieved {len(subs)} subsections for section {section_id}")
    return SectionWithSubsections.model_validate(
        {
            **section.__dict__,
            "subsections": [
                SubsectionReadSchema.model_validate(s)
                for s in subs
            ],
        }
    )

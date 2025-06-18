# TestWise/Backend/src/api/v1/subsections/routes.py
# -*- coding: utf-8 -*-
"""API v1 › Subsections routes."""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.crud import (
    create_subsection,
    delete_subsection,
    get_subsection,
    mark_subsection_viewed,
    update_subsection,
)
from src.core.logger import configure_logger
from src.core.security import admin_or_teacher, authenticated
from src.database.db import get_db
from src.database.models import Role, Subsection, SubsectionProgress
from .schemas import (
    SubsectionCreateSchema,
    SubsectionProgressRead,
    SubsectionReadSchema,
    SubsectionUpdateSchema,
)

router = APIRouter()
logger = configure_logger()

# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------

@router.post("", response_model=SubsectionReadSchema, status_code=status.HTTP_201_CREATED)
async def create_subsection_endpoint(
    payload: SubsectionCreateSchema,
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(admin_or_teacher),
):
    logger.debug(f"Creating subsection with payload: {payload.model_dump()}")
    subsection = await create_subsection(
        session,
        section_id=payload.section_id,
        title=payload.title,
        content=payload.content,
        type=payload.type,
        order=payload.order,
    )
    logger.debug(f"Subsection created with ID: {subsection.id}")
    return SubsectionReadSchema.model_validate(subsection)

@router.get("/{subsection_id}", response_model=SubsectionReadSchema)
async def get_subsection_endpoint(
    subsection_id: int,
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(authenticated),
):
    logger.debug(f"Fetching subsection with ID: {subsection_id}")
    subsection = await get_subsection(session, subsection_id)
    logger.debug(f"Subsection retrieved: {subsection.title}")
    return SubsectionReadSchema.model_validate(subsection)

@router.put("/{subsection_id}", response_model=SubsectionReadSchema)
async def update_subsection_endpoint(
    subsection_id: int,
    payload: SubsectionUpdateSchema,
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(admin_or_teacher),
):
    logger.debug(f"Updating subsection {subsection_id} with payload: {payload.model_dump()}")
    subsection = await update_subsection(session, subsection_id, **payload.model_dump(exclude_unset=True))
    logger.debug(f"Subsection {subsection_id} updated")
    return SubsectionReadSchema.model_validate(subsection)

@router.delete("/{subsection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subsection_endpoint(
    subsection_id: int,
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(admin_or_teacher),
):
    logger.debug(f"Deleting subsection with ID: {subsection_id}")
    await delete_subsection(session, subsection_id)

# ---------------------------------------------------------------------------
# Mark viewed
# ---------------------------------------------------------------------------

@router.post("/{subsection_id}/view", response_model=SubsectionProgressRead)
async def view_subsection_endpoint(
    subsection_id: int,
    session: AsyncSession = Depends(get_db),
    claims: dict = Depends(authenticated),
):
    logger.debug(f"Marking subsection {subsection_id} as viewed for user_id: {claims['sub']}")
    user_id = claims["sub" or "id"]
    progress = await mark_subsection_viewed(session, user_id, subsection_id)
    logger.debug(f"Subsection {subsection_id} marked as viewed, progress: {progress.progress}")
    return SubsectionProgressRead.model_validate(progress)
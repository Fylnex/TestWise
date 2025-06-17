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
    subsection = await create_subsection(
        session,
        section_id=payload.section_id,
        title=payload.title,
        content=payload.content,
        type=payload.type,
        order=payload.order,
    )
    return SubsectionReadSchema.model_validate(subsection)


@router.get("/{subsection_id}", response_model=SubsectionReadSchema)
async def get_subsection_endpoint(
    subsection_id: int,
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(authenticated),
):
    subsection = await get_subsection(session, subsection_id)
    return SubsectionReadSchema.model_validate(subsection)


@router.put("/{subsection_id}", response_model=SubsectionReadSchema)
async def update_subsection_endpoint(
    subsection_id: int,
    payload: SubsectionUpdateSchema,
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(admin_or_teacher),
):
    subsection = await update_subsection(session, subsection_id, **payload.model_dump(exclude_unset=True))
    return SubsectionReadSchema.model_validate(subsection)


@router.delete("/{subsection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subsection_endpoint(
    subsection_id: int,
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(admin_or_teacher),
):
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
    user_id = claims["sub" or "id"]
    progress = await mark_subsection_viewed(session, user_id, subsection_id)
    return SubsectionProgressRead.model_validate(progress)

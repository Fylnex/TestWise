# -*- coding: utf-8 -*-
"""API v1 › Subsections routes."""

from __future__ import annotations

import os
import shutil
from pathlib import Path

from fastapi import APIRouter, Depends, status, UploadFile, File, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger import configure_logger
from src.database.db import get_db
from src.domain.enums import SubsectionType
from src.repository.topic import (
    create_subsection,
    get_subsection,
    update_subsection,
    delete_subsection,
    mark_subsection_viewed,
    archive_subsection,
    restore_subsection,
    delete_subsection_permanently,
)
from src.security.security import admin_or_teacher, authenticated
from .schemas import (
    SubsectionProgressRead,
    SubsectionReadSchema,
    SubsectionUpdateSchema,
)

router = APIRouter()
logger = configure_logger()

# Define the base path for media storage
MEDIA_PATH = Path("Backend/media/subsections")
PDF_PATH = MEDIA_PATH / "pdfs"

# Ensure the directories exist
os.makedirs(PDF_PATH, exist_ok=True)

# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------

@router.post("", response_model=SubsectionReadSchema, status_code=status.HTTP_201_CREATED)
async def create_subsection_endpoint(
    section_id: int = Form(...),
    title: str = Form(...),
    type: SubsectionType = Form(...),
    order: int = Form(0),
    content: str = Form(None),
    file: UploadFile | None = File(None),
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(admin_or_teacher),
):
    """
    Create a new subsection.

    - For **text** subsections, provide `content`.
    - For **pdf** subsections, upload a `file`.
    """
    logger.debug(f"Creating subsection for section_id: {section_id}")

    file_path = None
    if type == SubsectionType.PDF:
        if not file:
            raise ValueError("File must be provided for PDF subsection type.")
        # Sanitize filename to prevent security issues
        safe_filename = Path(file.filename).name
        file_location = PDF_PATH / safe_filename
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
        file_path = str(file_location)
        logger.debug(f"PDF file saved at: {file_path}")

    elif type == SubsectionType.TEXT and not content:
        raise ValueError("Content must be provided for TEXT subsection type.")

    subsection = await create_subsection(
        session,
        section_id=section_id,
        title=title,
        content=content,
        type=type,
        order=order,
        file_path=file_path,
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
    logger.debug(f"Archiving subsection with ID: {subsection_id}")
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
    user_id = claims.get("sub") or claims.get("id")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not identify user from token")

    progress = await mark_subsection_viewed(session, user_id, subsection_id)
    logger.debug(f"Subsection {subsection_id} marked as viewed, progress: {progress.is_viewed}")
    return SubsectionProgressRead.model_validate(progress)


# ---------------------------------------------------------------------------
# Archive / Restore / Permanent Delete
# ---------------------------------------------------------------------------

@router.post("/{subsection_id}/archive", status_code=status.HTTP_204_NO_CONTENT)
async def archive_subsection_endpoint(
        subsection_id: int,
        session: AsyncSession = Depends(get_db),
        _claims: dict = Depends(admin_or_teacher),
):
    logger.debug(f"Archiving subsection with ID: {subsection_id}")
    await archive_subsection(session, subsection_id)


@router.post("/{subsection_id}/restore", status_code=status.HTTP_204_NO_CONTENT)
async def restore_subsection_endpoint(
        subsection_id: int,
        session: AsyncSession = Depends(get_db),
        _claims: dict = Depends(admin_or_teacher),
):
    logger.debug(f"Restoring subsection with ID: {subsection_id}")
    await restore_subsection(session, subsection_id)


@router.delete("/{subsection_id}/permanent", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subsection_permanently_endpoint(
        subsection_id: int,
        session: AsyncSession = Depends(get_db),
        _claims: dict = Depends(admin_or_teacher),
):
    logger.debug(f"Permanently deleting subsection with ID: {subsection_id}")
    await delete_subsection_permanently(session, subsection_id)

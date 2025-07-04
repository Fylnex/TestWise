# TestWise/Backend/src/api/v1/subsections/routes.py
# -*- coding: utf-8 -*-
"""API v1 › Subsections routes: поддержка JSON‑эндпоинта для TEXT и multipart/form-data для PDF."""

from __future__ import annotations
import os
import shutil
from pathlib import Path

from fastapi import (
    APIRouter,
    Depends,
    status,
    UploadFile,
    File,
    Form,
    HTTPException,
    Body,
)
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
    SubsectionCreateSchema,
)

router = APIRouter()
logger = configure_logger()

# Пути для хранения PDF
MEDIA_PATH = Path("Backend/media/subsections")
PDF_PATH = MEDIA_PATH / "pdfs"
PDF_PATH.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------

@router.post(
    "/json",
    response_model=SubsectionReadSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new TEXT subsection via JSON",
)
async def create_subsection_json(
    payload: SubsectionCreateSchema = Body(...),
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(admin_or_teacher),
):
    """
    Создать новую **TEXT**‑подсекцию через JSON.
    PDF-подсекции создаются через multipart/form-data в основном эндпоинте.
    """
    if payload.type == SubsectionType.PDF:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="PDF subsections must be uploaded via multipart/form-data",
        )

    logger.debug(f"Creating TEXT subsection via JSON: {payload.model_dump()}")
    sub = await create_subsection(
        session=session,
        section_id=payload.section_id,
        title=payload.title,
        content=payload.content,
        type=payload.type,
        order=payload.order,
        file_path=None,
    )
    return SubsectionReadSchema.model_validate(sub)


@router.post(
    "",
    response_model=SubsectionReadSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new subsection with optional file upload",
)
async def create_subsection_multipart(
    section_id: int = Form(...),
    title: str = Form(...),
    type: SubsectionType = Form(...),
    order: int = Form(0),
    content: str | None = Form(None),
    file: UploadFile | None = File(None),
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(admin_or_teacher),
):
    """
    Создать новую подсекцию.
    - **TEXT**: передавать content.
    - **PDF**: загружать file.
    """
    logger.debug(f"Creating subsection via multipart: section_id={section_id}, type={type}")

    file_path: str | None = None
    if type == SubsectionType.PDF:
        if not file:
            raise HTTPException(status_code=422, detail="File must be provided for PDF subsection type.")
        safe_name = Path(file.filename).name
        dest = PDF_PATH / safe_name
        with open(dest, "wb+") as f:
            shutil.copyfileobj(file.file, f)
        file_path = str(dest)
        logger.debug(f"Saved PDF to {file_path}")
    elif type == SubsectionType.TEXT and not content:
        raise HTTPException(status_code=422, detail="Content must be provided for TEXT subsection type.")

    sub = await create_subsection(
        session=session,
        section_id=section_id,
        title=title,
        content=content,
        type=type,
        order=order,
        file_path=file_path,
    )
    logger.debug(f"Subsection created with ID: {sub.id}")
    return SubsectionReadSchema.model_validate(sub)


@router.get("/{subsection_id}", response_model=SubsectionReadSchema)
async def get_subsection_endpoint(
    subsection_id: int,
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(authenticated),
):
    logger.debug(f"Fetching subsection with ID: {subsection_id}")
    sub = await get_subsection(session, subsection_id)
    return SubsectionReadSchema.model_validate(sub)


@router.put(
    "/{subsection_id}/json",
    response_model=SubsectionReadSchema,
    status_code=status.HTTP_200_OK,
    summary="Update a TEXT subsection via JSON",
)
async def update_subsection_json(
    subsection_id: int,
    payload: SubsectionUpdateSchema = Body(...),
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(admin_or_teacher),
):
    if payload.type == SubsectionType.PDF:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Use multipart/form-data endpoint to update PDF subsections",
        )
    sub = await update_subsection(
        session,
        subsection_id,
        **payload.model_dump(exclude_unset=True),
    )
    return SubsectionReadSchema.model_validate(sub)


@router.put("/{subsection_id}", response_model=SubsectionReadSchema)
async def update_subsection_form(
    subsection_id: int,
    section_id: int = Form(...),
    title: str = Form(...),
    type: SubsectionType = Form(...),
    order: int = Form(0),
    content: str = Form(None),
    file: UploadFile | None = File(None),
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(admin_or_teacher),
):
    file_path = None
    if type == SubsectionType.PDF:
        if not file:
            raise HTTPException(status_code=422, detail="File must be provided for PDF")
        safe = Path(file.filename).name
        dest = PDF_PATH / safe
        with open(dest, "wb+") as f:
            shutil.copyfileobj(file.file, f)
        file_path = str(dest)

    data = {
        "title": title,
        "order": order,
        "type": type,
    }
    if type == SubsectionType.TEXT:
        data["content"] = content
    else:
        data["file_path"] = file_path

    sub = await update_subsection(session, subsection_id, **data)
    return SubsectionReadSchema.model_validate(sub)


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
    user_id = claims.get("sub") or claims.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Could not identify user from token")
    progress = await mark_subsection_viewed(session, user_id, subsection_id)
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
    await archive_subsection(session, subsection_id)


@router.post("/{subsection_id}/restore", status_code=status.HTTP_204_NO_CONTENT)
async def restore_subsection_endpoint(
    subsection_id: int,
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(admin_or_teacher),
):
    await restore_subsection(session, subsection_id)


@router.delete("/{subsection_id}/permanent", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subsection_permanently_endpoint(
    subsection_id: int,
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(admin_or_teacher),
):
    await delete_subsection_permanently(session, subsection_id)

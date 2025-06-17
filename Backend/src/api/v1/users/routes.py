# TestWise/Backend/src/api/v1/users/routes.py
# -*- coding: utf-8 -*-
"""API v1 › Users routes
~~~~~~~~~~~~~~~~~~~~~~~~
Adds list‑users endpoint with optional role filter and migrates Pydantic v2
usage (`model_dump`).  Teachers are limited to retrieving students only.
"""

from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.crud import create_user, delete_item, get_item, update_item
from src.core.logger import configure_logger
from src.core.security import admin_only, admin_or_teacher
from src.database.db import get_db
from src.database.models import Role, User
from .schemas import UserCreateSchema, UserReadSchema, UserUpdateSchema

router = APIRouter()
logger = configure_logger()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------


@router.post("", response_model=UserReadSchema, status_code=status.HTTP_201_CREATED)
async def create_user_endpoint(
    user_data: UserCreateSchema,
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(admin_only),
):
    user = await create_user(
        session,
        username=user_data.username,
        email=user_data.email,
        password=user_data.password,
        role=user_data.role,
    )
    return user


# ---------------------------------------------------------------------------
# Read (single)
# ---------------------------------------------------------------------------


@router.get("/{user_id}", response_model=UserReadSchema)
async def get_user_endpoint(
    user_id: int,
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(admin_or_teacher),
):
    user = await get_item(session, User, user_id)
    return user


# ---------------------------------------------------------------------------
# Read (list with filter)
# ---------------------------------------------------------------------------


@router.get("", response_model=List[UserReadSchema])
async def list_users_endpoint(
    role: Optional[Role] = Query(None, description="Filter by role"),
    session: AsyncSession = Depends(get_db),
    claims: dict = Depends(admin_or_teacher),
):
    """List users.

    *Admins* may filter by any role or omit the filter.  *Teachers* may **only**
    fetch students; if they omit the query param it defaults to ``role=student``.
    """

    requester_role = Role(claims["role"])

    # Teachers are limited to students only
    if requester_role == Role.TEACHER:
        if role is not None and role != Role.STUDENT:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Teachers can list students only",
            )
        role = Role.STUDENT  # default filter

    # Build query
    stmt = select(User)
    if role is not None:
        stmt = stmt.where(User.role == role)

    res = await session.execute(stmt)
    users = list(res.scalars().all())
    return users


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------


@router.put("/{user_id}", response_model=UserReadSchema)
async def update_user_endpoint(
    user_id: int,
    user_data: UserUpdateSchema,
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(admin_only),
):
    update_kwargs = user_data.model_dump(exclude_unset=True)
    if "password" in update_kwargs:
        update_kwargs["password"] = pwd_context.hash(update_kwargs["password"])
    user = await update_item(session, User, user_id, **update_kwargs)
    return user


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_endpoint(
    user_id: int,
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(admin_only),
):
    await delete_item(session, User, user_id)
    logger.info("Удален пользователь %s", user_id)

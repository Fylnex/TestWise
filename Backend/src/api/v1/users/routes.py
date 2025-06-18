# TestWise/Backend/src/api/v1/users/routes.py
# -*- coding: utf-8 -*-
"""API v1 › Users routes
~~~~~~~~~~~~~~~~~~~~~~~~
Полный набор эндпоинтов для управления пользователями:
- CRUD
- фильтрация
- массовое обновление ролей/статуса
- экспорт в CSV
- сброс пароля

Учтены права доступа: admin_only, admin_or_teacher.
"""

from __future__ import annotations

import csv
import secrets
from io import StringIO
from typing import List, Optional

from fastapi import (
    APIRouter,
    Body,
    Depends,
    HTTPException,
    Query,
    status,
)
from fastapi.responses import FileResponse
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
    logger.debug(f"Creating user with data: {user_data.model_dump()}")
    existing_user = await session.execute(
        select(User).where(User.username == user_data.username)
    )
    if existing_user.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already exists")

    user = await create_user(
        session,
        username=user_data.username,
        email=user_data.email,
        password=user_data.password,
        role=user_data.role,
        is_active=user_data.is_active,
    )
    logger.debug(f"User created with ID: {user.id}")
    return UserReadSchema.model_validate(user)


# ---------------------------------------------------------------------------
# Read (single)
# ---------------------------------------------------------------------------

@router.get("/{user_id}", response_model=UserReadSchema)
async def get_user_endpoint(
    user_id: int,
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(admin_or_teacher),
):
    logger.debug(f"Fetching user with ID: {user_id}")
    user = await get_item(session, User, user_id)
    logger.debug(f"User retrieved: {user.username}")
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
    logger.debug(f"Listing users, role filter: {role}, requester role: {claims['role']}")
    requester_role = Role(claims["role"])

    if requester_role == Role.TEACHER:
        if role is not None and role != Role.STUDENT:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Teachers can list students only",
            )
        role = Role.STUDENT

    stmt = select(User)
    if role is not None:
        stmt = stmt.where(User.role == role)

    res = await session.execute(stmt)
    users = list(res.scalars().all())
    logger.debug(f"Retrieved {len(users)} users")
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
    logger.debug(f"Updating user {user_id} with data: {user_data.model_dump()}")
    update_kwargs = user_data.model_dump(exclude_unset=True)
    if "password" in update_kwargs:
        update_kwargs["password"] = pwd_context.hash(update_kwargs["password"])
    user = await update_item(session, User, user_id, **update_kwargs)
    logger.debug(f"User {user_id} updated")
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
    logger.debug(f"Deleting user with ID: {user_id}")
    await delete_item(session, User, user_id)
    logger.info(f"Удален пользователь {user_id}")


# ---------------------------------------------------------------------------
# Reset password (admin-only)
# ---------------------------------------------------------------------------

@router.post("/{user_id}/reset-password", status_code=status.HTTP_200_OK)
async def reset_password_endpoint(
    user_id: int,
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(admin_only),
):
    user = await get_item(session, User, user_id)
    new_password = secrets.token_hex(8)
    user.password = pwd_context.hash(new_password)
    await session.commit()
    logger.info(f"Password reset for user {user_id}")
    return {"message": "Password reset successfully", "new_password": new_password}


# ---------------------------------------------------------------------------
# Bulk update roles
# ---------------------------------------------------------------------------

@router.put("/bulk/roles", response_model=List[UserReadSchema])
async def bulk_update_roles(
    request: dict = Body(...),  # { userIds: List[int], role: str }
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(admin_only),
):
    user_ids = request.get("userIds")
    role = request.get("role")
    if not user_ids or role not in Role.__members__:
        raise HTTPException(status_code=400, detail="Invalid request format or role")
    users = []
    for user_id in user_ids:
        user = await get_item(session, User, user_id)
        user.role = Role(role)
        await session.commit()
        users.append(user)
    return [UserReadSchema.model_validate(u) for u in users]


# ---------------------------------------------------------------------------
# Bulk update is_active
# ---------------------------------------------------------------------------

@router.put("/bulk/status", response_model=List[UserReadSchema])
async def bulk_update_status(
    request: dict = Body(...),  # { userIds: List[int], isActive: bool }
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(admin_only),
):
    user_ids = request.get("userIds")
    is_active = request.get("isActive")
    if not isinstance(is_active, bool):
        raise HTTPException(status_code=400, detail="isActive must be a boolean")
    users = []
    for user_id in user_ids:
        user = await get_item(session, User, user_id)
        user.is_active = is_active
        await session.commit()
        users.append(user)
    return [UserReadSchema.model_validate(u) for u in users]


# ---------------------------------------------------------------------------
# Export users (CSV)
# ---------------------------------------------------------------------------

@router.get("/export", response_class=FileResponse)
async def export_users(
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(admin_only),
):
    stmt = select(User)
    if search:
        stmt = stmt.where(User.username.ilike(f"%{search}%"))
    if role and role != "all":
        stmt = stmt.where(User.role == Role(role))
    if is_active is not None:
        stmt = stmt.where(User.is_active == is_active)

    users = (await session.execute(stmt)).scalars().all()

    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Username", "Email", "Role", "IsActive", "CreatedAt"])
    for user in users:
        writer.writerow([
            user.id,
            user.username,
            user.email,
            user.role.value,
            user.is_active,
            user.created_at,
        ])
    output.seek(0)

    return FileResponse(
        path=output.getvalue().encode(),
        media_type="text/csv",
        filename="users.csv",
    )
# TestWise/Backend/src/api/v1/users/schemas.py
# -*- coding: utf-8 -*-
"""Pydantic schemas for Users API (v1)."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr

from src.database.models import Role


class UserCreateSchema(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: Role


class UserUpdateSchema(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[Role] = None
    is_active: Optional[bool] = None


class UserReadSchema(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: Role
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Filters
# ---------------------------------------------------------------------------


class UserFilter(BaseModel):
    """Query‑param helper used by GET /users."""

    role: Optional[Role] = None  # when omitted, disables role filtering for admins

# TestWise/Backend/src/api/v1/users/schemas.py
# -*- coding: utf-8 -*-
"""
This module defines Pydantic schemas for user-related API endpoints.
"""

from pydantic import BaseModel, EmailStr
from src.database.models import Role
from datetime import datetime
from typing import Optional

class UserCreateSchema(BaseModel):
    """
    Schema for creating a new user.
    """
    username: str
    email: EmailStr
    password: str
    role: Role

class UserUpdateSchema(BaseModel):
    """
    Schema for updating a user.
    """
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[Role] = None
    is_active: Optional[bool] = None

class UserReadSchema(BaseModel):
    """
    Schema for reading user data.
    """
    id: int
    username: str
    email: EmailStr
    role: Role
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
# TestWise/Backend/src/api/v1/auth/schemas.py
# -*- coding: utf-8 -*-
"""
This module defines Pydantic schemas for authentication-related API endpoints.
"""

from pydantic import BaseModel, EmailStr
from datetime import datetime

from src.domain.enums import Role


class LoginSchema(BaseModel):
    """
    Schema for user login request.
    """
    username: str
    password: str

class TokenSchema(BaseModel):
    """
    Schema for JWT token response.
    """
    access_token: str
    refresh_token: str
    token_type: str

class UserReadSchema(BaseModel):
    id: int
    username: str
    full_name: str
    role: Role
    is_active: bool
    created_at: datetime
    last_login: datetime | None
    refresh_token: str | None
    is_archived: bool

    class Config:
        orm_mode = True
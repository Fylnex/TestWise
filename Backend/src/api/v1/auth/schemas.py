# TestWise/Backend/src/api/v1/auth/schemas.py
# -*- coding: utf-8 -*-
"""
This module defines Pydantic schemas for authentication-related API endpoints.
"""

from pydantic import BaseModel, EmailStr
from src.database.models import Role
from datetime import datetime

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
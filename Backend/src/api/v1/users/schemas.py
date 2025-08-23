# TestWise/Backend/src/api/v1/users/schemas.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from src.domain.enums import Role


class UserCreateSchema(BaseModel):
    """Схема для создания пользователя."""
    username: str
    full_name: str
    password: str
    role: Role  # Используем enum Role напрямую
    is_active: bool = True

    class Config:
        json_schema_extra = {
            "example": {
                "username": "newuser",
                "full_name": "New User",
                "password": "securepassword123",
                "role": "student",
                "is_active": True
            }
        }

class UserUpdateSchema(BaseModel):
    """Схема для обновления пользователя."""
    full_name: Optional[str] = None
    last_login: Optional[datetime] = None
    is_active: Optional[bool] = None
    role: Optional[Role] = None

    class Config:
        json_schema_extra = {
            "example": {
                "full_name": "Updated User",
                "last_login": "2025-06-20T15:42:00",
                "is_active": True,
                "role": "student"
            }
        }

class UserReadSchema(BaseModel):
    """Схема для чтения данных пользователя."""
    id: int
    username: str
    full_name: str
    role: Role
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    is_archived: bool

    class Config:
        from_attributes = True
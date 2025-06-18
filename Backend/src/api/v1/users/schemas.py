# TestWise/Backend/src/api/v1/users/schemas.py
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from src.database.models import Role

class UserCreateSchema(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: Role  # Используем enum Role напрямую
    is_active: bool = True

    class Config:
        json_schema_extra = {
            "example": {
                "username": "newuser",
                "email": "user@example.com",
                "password": "securepassword123",
                "role": "student",
                "is_active": True
            }
        }

class UserUpdateSchema(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[Role] = None
    is_active: Optional[bool] = None

    class Config:
        json_schema_extra = {
            "example": {
                "username": "updateduser",
                "email": "updated@example.com",
                "password": "newpassword123",
                "role": "teacher",
                "is_active": False
            }
        }

class UserReadSchema(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: Role
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True
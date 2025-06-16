# TestWise/Backend/src/api/v1/groups/schemas.py
# -*- coding: utf-8 -*-
"""
Этот модуль определяет Pydantic-схемы для эндпоинтов, связанных с группами.
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class GroupCreateSchema(BaseModel):
    """
    Схема для создания новой группы.
    """
    name: str
    start_year: int
    end_year: int
    description: Optional[str] = None

class GroupUpdateSchema(BaseModel):
    """
    Схема для обновления группы.
    """
    name: Optional[str] = None
    start_year: Optional[int] = None
    end_year: Optional[int] = None
    description: Optional[str] = None

class GroupReadSchema(BaseModel):
    """
    Схема для чтения данных группы.
    """
    id: int
    name: str
    start_year: int
    end_year: int
    description: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
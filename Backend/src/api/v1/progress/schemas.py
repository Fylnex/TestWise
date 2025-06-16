# TestWise/Backend/src/api/v1/progress/schemas.py
# -*- coding: utf-8 -*-
"""
Этот модуль определяет Pydantic-схемы для эндпоинтов, связанных с прогрессом.
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ProgressCreateSchema(BaseModel):
    """
    Схема для создания записи о прогрессе.
    """
    user_id: int
    topic_id: int
    section_id: int
    score: Optional[float] = None
    time_spent: Optional[int] = None

class ProgressUpdateSchema(BaseModel):
    """
    Схема для обновления записи о прогрессе.
    """
    score: Optional[float] = None
    time_spent: Optional[int] = None

class ProgressReadSchema(BaseModel):
    """
    Схема для чтения данных о прогрессе.
    """
    id: int
    user_id: int
    topic_id: int
    section_id: int
    score: Optional[float]
    time_spent: Optional[int]
    completed: bool
    completed_at: Optional[datetime]
    attempts: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
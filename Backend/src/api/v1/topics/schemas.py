# TestWise/Backend/src/api/v1/topics/schemas.py
# -*- coding: utf-8 -*-
"""
Этот модуль определяет Pydantic-схемы для эндпоинтов, связанных с темами.
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TopicCreateSchema(BaseModel):
    """
    Схема для создания новой темы.
    """
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    image: Optional[str] = None

class TopicUpdateSchema(BaseModel):
    """
    Схема для обновления темы.
    """
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    image: Optional[str] = None

class TopicReadSchema(BaseModel):
    """
    Схема для чтения данных темы.
    """
    id: int
    title: str
    description: Optional[str]
    category: Optional[str]
    image: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
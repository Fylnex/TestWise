# TestWise/Backend/src/api/v1/sections/schemas.py
# -*- coding: utf-8 -*-
"""
Этот модуль определяет Pydantic-схемы для эндпоинтов, связанных с разделами.
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from src.database.models import TestType

class SectionCreateSchema(BaseModel):
    """
    Схема для создания нового раздела.
    """
    topic_id: int
    title: str
    content: Optional[str] = None
    is_test: bool = False
    test_type: Optional[TestType] = None
    control_questions_percentage: Optional[int] = None

class SectionUpdateSchema(BaseModel):
    """
    Схема для обновления раздела.
    """
    title: Optional[str] = None
    content: Optional[str] = None
    is_test: Optional[bool] = None
    test_type: Optional[TestType] = None
    control_questions_percentage: Optional[int] = None

class SectionReadSchema(BaseModel):
    """
    Схема для чтения данных раздела.
    """
    id: int
    topic_id: int
    title: str
    content: Optional[str]
    is_test: bool
    test_type: Optional[TestType]
    control_questions_percentage: Optional[int]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
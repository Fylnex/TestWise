# TestWise/Backend/src/api/v1/questions/schemas.py
# -*- coding: utf-8 -*-
"""
Этот модуль определяет Pydantic-схемы для эндпоинтов, связанных с вопросами.
"""

from datetime import datetime
from typing import Optional, Any, List

from pydantic import BaseModel

from src.database.models import QuestionType


class QuestionCreateSchema(BaseModel):
    """
    Схема для создания нового вопроса.
    """
    section_id: int
    question: str
    question_type: QuestionType
    options: Optional[List[Any]] = None
    correct_answer: Optional[Any] = None
    hint: Optional[str] = None
    is_control: bool = False
    image: Optional[str] = None


class QuestionUpdateSchema(BaseModel):
    """
    Схема для обновления вопроса.
    """
    question: Optional[str] = None
    question_type: Optional[QuestionType] = None
    options: Optional[List[Any]] = None
    correct_answer: Optional[Any] = None
    hint: Optional[str] = None
    is_control: Optional[bool] = None
    image: Optional[str] = None


class QuestionReadSchema(BaseModel):
    """
    Схема для чтения данных вопроса.
    """
    id: int
    section_id: int
    question: str
    question_type: QuestionType
    options: Optional[List[Any]]
    correct_answer: Optional[Any]
    hint: Optional[str]
    is_control: bool
    image: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

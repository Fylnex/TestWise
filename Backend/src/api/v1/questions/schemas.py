# -*- coding: utf-8 -*-
"""
Pydantic-схемы для работы с вопросами.
"""

from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel

from src.database.models import QuestionType


class QuestionCreateSchema(BaseModel):
    """
    Схема для создания вопроса.
    """
    section_id: int
    test_id: Optional[int] = None          # <-- новый аргумент
    question: str
    question_type: QuestionType
    options: Optional[List[Any]] = None
    correct_answer: Optional[Any] = None
    hint: Optional[str] = None
    is_final: bool = False                 # <-- было is_control
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
    is_final: Optional[bool] = None        # <-- было is_control
    image: Optional[str] = None
    test_id: Optional[int] = None          # разрешаем перенос вопроса в тест / из теста


class QuestionReadSchema(BaseModel):
    """
    Схема для чтения вопроса.
    """
    id: int
    section_id: int
    test_id: Optional[int]
    question: str
    question_type: QuestionType
    options: Optional[List[Any]]
    correct_answer: Optional[Any]
    hint: Optional[str]
    is_final: bool                         # <-- было is_control
    image: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

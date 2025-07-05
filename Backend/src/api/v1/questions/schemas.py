# TestWise/Backend/src/api/v1/questions/schemas.py
# -*- coding: utf-8 -*-
"""
Pydantic-схемы для работы с вопросами.
"""

from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel

from src.domain.enums import QuestionType


class QuestionCreateSchema(BaseModel):
    test_id: int
    question: str
    question_type: QuestionType
    options: Optional[List[Any]] = None
    correct_answer: Optional[Any] = None
    hint: Optional[str] = None
    is_final: bool = False
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
    is_final: Optional[bool] = None
    image: Optional[str] = None
    test_id: Optional[int] = None


class QuestionReadSchema(BaseModel):
    id: int
    test_id: int
    question: str
    question_type: QuestionType
    options: Optional[List[Any]]
    correct_answer: Optional[Any]
    hint: Optional[str]
    is_final: bool
    image: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    is_archived: bool

    class Config:
        from_attributes = True

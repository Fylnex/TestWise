# TestWise/Backend/src/api/v1/tests/schemas.py
# -*- coding: utf-8 -*-
"""
Этот модуль определяет Pydantic-схемы для эндпоинтов, связанных с тестами.
"""

from datetime import datetime
from typing import List, Any, Optional

from pydantic import BaseModel

from src.database.models import QuestionType


class TestStartSchema(BaseModel):
    """
    Схема для запроса на начало теста.
    """
    section_id: int
    num_questions: int


class TestQuestionSchema(BaseModel):
    """
    Схема для вопроса в тесте.
    """
    id: int
    question: str
    question_type: QuestionType
    options: Optional[List[Any]] = None
    hint: Optional[str] = None
    image: Optional[str] = None

    class Config:
        from_attributes = True


class TestStartResponseSchema(BaseModel):
    """
    Схема для ответа на начало теста.
    """
    test_id: int
    questions: List[TestQuestionSchema]
    start_time: datetime
    duration: int


class TestSubmitSchema(BaseModel):
    """
    Схема для отправки ответов на тест.
    """
    section_id: int
    answers: List[dict]  # [{"question_id": int, "answer": Any}]


class TestSubmitResponseSchema(BaseModel):
    """
    Схема для ответа на отправку теста.
    """
    score: float
    time_spent: int
    completed: bool

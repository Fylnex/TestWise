# TestWise/Backend/src/api/v1/tests/schemas.py
# -*- coding: utf-8 -*-
"""
Pydantic-схемы для работы с тестами.
"""

from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, Field

from src.database.models import QuestionType, TestType


# ----------------------------- CRUD -----------------------------------------


class TestCreateSchema(BaseModel):
    """
    Схема создания теста (учителя / админы).
    """
    title: str
    type: TestType
    duration: Optional[int] = Field(
        default=None, description="Максимальная длительность, сек. 0/None — без лимита"
    )
    section_id: Optional[int] = Field(default=None, description="Тест по секции")
    topic_id: Optional[int] = Field(default=None, description="Глобальный тест по теме")
    question_ids: Optional[List[int]] = Field(default=None, description="Фиксированный набор вопросов")


class TestReadSchema(BaseModel):
    """
    Полное представление теста.
    """
    id: int
    title: str
    type: TestType
    duration: Optional[int]
    section_id: Optional[int]
    topic_id: Optional[int]
    question_ids: Optional[List[int]]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# ----------------------------- START / SUBMIT -------------------------------


class TestQuestionSchema(BaseModel):
    """
    Упрощённое представление вопроса, выдаваемое студенту.
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
    Ответ на старт теста.
    """
    attempt_id: int
    test_id: int
    questions: List[TestQuestionSchema]
    start_time: datetime
    duration: Optional[int]


class TestSubmitSchema(BaseModel):
    """
    Пакет с ответами студента.
    """
    attempt_id: int
    answers: List[dict]  # [{"question_id": int, "answer": Any}]
    time_spent: int      # сек


class TestAttemptRead(BaseModel):
    """
    Полное состояние попытки.
    """
    id: int
    user_id: int
    test_id: int
    attempt_number: int
    score: Optional[float]
    time_spent: Optional[int]
    answers: Optional[Any]
    started_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True

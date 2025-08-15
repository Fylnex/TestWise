# -*- coding: utf-8 -*-
"""
Pydantic‑схемы для работы с тестами.
"""

from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, Field, field_serializer

from src.domain.enums import TestType, QuestionType, TestAttemptStatus
from src.api.v1.questions.schemas import QuestionReadSchema

# ----------------------------- CRUD -----------------------------------------

class TestCreateSchema(BaseModel):
    title: str
    type: TestType
    duration: Optional[int] = Field(
        default=None,
        description="Максимальная длительность, сек. 0/None — без лимита"
    )
    section_id: Optional[int] = Field(default=None, description="Тест по секции")
    topic_id: Optional[int] = Field(default=None, description="Глобальный тест по теме")
    max_attempts: Optional[int] = Field(default=3, description="Максимальное количество попыток")

class TestReadSchema(BaseModel):
    id: int
    title: str
    type: TestType
    duration: Optional[int]
    section_id: Optional[int]
    topic_id: Optional[int]
    description: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_archived: bool
    last_score: Optional[float] = None
    questions: List[QuestionReadSchema]
    max_attempts: Optional[int]

    class Config:
        from_attributes = True

# ----------------------------- START / SUBMIT -------------------------------

class TestQuestionSchema(BaseModel):
    id: int
    question: str
    question_type: QuestionType
    options: Optional[List[str]] = None
    hint: Optional[str] = None
    image: Optional[str] = None

    class Config:
        orm_mode = True

class TestStartResponseSchema(BaseModel):
    attempt_id: int
    test_id: int
    questions: List[TestQuestionSchema]
    start_time: datetime
    duration: Optional[int]
    attempt_number: int

    class Config:
        from_attributes = True

class TestSubmitSchema(BaseModel):
    attempt_id: int
    answers: List[dict]  # [{"question_id": int, "answer": Any}]
    time_spent: int      # сек

class TestAttemptRead(BaseModel):
    id: int
    user_id: int
    test_id: int
    attempt_number: int
    score: Optional[float]
    time_spent: Optional[int]
    answers: Optional[Any]
    started_at: datetime
    completed_at: Optional[datetime]
    status: TestAttemptStatus
    correctCount: Optional[int] = None
    totalQuestions: Optional[int] = None

    @field_serializer("started_at", "completed_at", when_used="json")
    def serialize_datetime(self, value: Optional[datetime]):
        return value.isoformat() if value else None

    class Config:
        from_attributes = True

# ----------------------------- Attempt Status -------------------------------

class TestAttemptStatusResponse(BaseModel):
    attempt_id: int
    test_id: int
    status: TestAttemptStatus
    completed_at: Optional[datetime] = None
    score: Optional[float] = None
    questions: List[TestQuestionSchema]
    start_time: datetime
    duration: Optional[int] = None
    attempt_number: int

    @field_serializer("start_time", "completed_at", when_used="json")
    def serialize_datetime(self, value: Optional[datetime]):
        return value.isoformat() if value else None

    class Config:
        from_attributes = True
# -*- coding: utf-8 -*-
"""
Pydantic-схемы, отражающие модели прогресса.
"""

from datetime import datetime
from typing import Optional, Any

from pydantic import BaseModel


class TopicProgressRead(BaseModel):
    id: int
    user_id: int
    topic_id: int
    status: str
    completion_percentage: float
    last_accessed: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class SectionProgressRead(BaseModel):
    id: int
    user_id: int
    section_id: int
    status: str
    completion_percentage: float
    last_accessed: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class SubsectionProgressRead(BaseModel):
    id: int
    user_id: int
    subsection_id: int
    is_viewed: bool
    viewed_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


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
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

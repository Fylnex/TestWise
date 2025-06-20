# -*- coding: utf-8 -*-
"""
Pydantic-схемы для прогресса пользователей.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from src.domain.enums import ProgressStatus

class TopicProgressRead(BaseModel):
    id: int
    user_id: int
    topic_id: int
    status: ProgressStatus
    completion_percentage: float
    last_accessed: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SectionProgressRead(BaseModel):
    id: int
    user_id: int
    section_id: int
    status: ProgressStatus
    completion_percentage: float
    last_accessed: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SubsectionProgressRead(BaseModel):
    id: int
    user_id: int
    subsection_id: int
    is_viewed: bool
    viewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TestAttemptRead(BaseModel):
    id: int
    user_id: int
    test_id: int
    attempt_number: int
    score: Optional[float] = None
    time_spent: Optional[int] = None
    answers: Optional[dict] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
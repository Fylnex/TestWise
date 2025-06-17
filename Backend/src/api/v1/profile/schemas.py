# TestWise/Backend/src/api/v1/profile/schemas.py
# -*- coding: utf-8 -*-
"""
Pydantic-схемы для агрегированного профиля пользователя.
"""

from datetime import datetime
from typing import List, Optional, Any

from pydantic import BaseModel

from src.api.v1.progress.schemas import (
    TopicProgressRead,
    SectionProgressRead,
    SubsectionProgressRead,
    TestAttemptRead,
)


class ProfileRead(BaseModel):
    """
    Агрегированные данные профиля.
    """
    user_id: int
    topics: List[TopicProgressRead]
    sections: List[SectionProgressRead]
    subsections: List[SubsectionProgressRead]
    tests: List[TestAttemptRead]
    generated_at: datetime

    class Config:
        from_attributes = True

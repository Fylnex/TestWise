# -*- coding: utf-8 -*-
"""
TestWise/Backend/src/api/v1/profile/schemas.py
Pydantic-схемы для агрегированного профиля пользователя.
"""

from datetime import datetime
from typing import List

from pydantic import BaseModel

from src.api.v1.progress.schemas import (
    TopicProgressRead,
    SectionProgressRead,
    SubsectionProgressRead,
    TestAttemptRead,
)
from src.api.v1.groups.schemas import GroupReadSchema  # Импорт схемы групп

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

# Опционально: можно добавить схему для my-groups
class MyGroupsResponse(BaseModel):
    """
    Ответ с данными групп текущего пользователя.
    """
    groups: List[GroupReadSchema]

    class Config:
        from_attributes = True
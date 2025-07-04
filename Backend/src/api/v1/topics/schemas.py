# -*- coding: utf-8 -*-
"""Pydantic schemas for Topic endpoints."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from src.domain.enums import ProgressStatus

class TopicCreateSchema(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    image: Optional[str] = None

class TopicUpdateSchema(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    image: Optional[str] = None
    creator_id: Optional[int] = None  # Оставляем для обновления, если нужно

class TopicBaseReadSchema(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    image: Optional[str] = None
    created_at: datetime
    is_archived: bool
    creator_full_name: str  # Заменили creator_id на creator_full_name

    class Config:
        from_attributes = True

class TopicProgressRead(BaseModel):
    id: int
    topic_id: int
    completion_percentage: float
    status: ProgressStatus
    last_accessed: datetime

    class Config:
        from_attributes = True

class TopicReadSchema(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    image: Optional[str] = None
    created_at: datetime
    is_archived: bool
    progress: Optional[TopicProgressRead] = None
    creator_full_name: str  # Заменили creator_id на creator_full_name

    class Config:
        from_attributes = True
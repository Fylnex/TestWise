# TestWise/Backend/src/api/v1/topics/schemas.py
# -*- coding: utf-8 -*-
"""Pydantic schemas for Topic endpoints."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from src.database.models import ProgressStatus


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
    description: Optional[str]
    category: Optional[str]
    image: Optional[str]
    created_at: datetime
    progress: Optional[TopicProgressRead] = None

    class Config:
        from_attributes = True

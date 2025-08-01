# Backend/src/api/v1/sections/schemas.py

# -*- coding: utf-8 -*-
"""Pydantic schemas for Section endpoints."""

from __future__ import annotations
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

from src.domain.enums import ProgressStatus
from src.api.v1.subsections.schemas import SubsectionReadSchema

class SectionCreateSchema(BaseModel):
    topic_id: int
    title: str
    content: Optional[str] = None
    description: Optional[str] = None
    order: int = 0

class SectionUpdateSchema(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None

class SectionReadSchema(BaseModel):
    id: int
    topic_id: int
    title: str
    content: Optional[str]
    description: Optional[str]
    order: int
    created_at: datetime
    is_archived: bool

    class Config:
        from_attributes = True

class SectionProgressRead(BaseModel):
    id: int
    section_id: int
    completion_percentage: float
    status: ProgressStatus

    class Config:
        from_attributes = True

class SectionWithSubsections(SectionReadSchema):
    subsections: List[SubsectionReadSchema]

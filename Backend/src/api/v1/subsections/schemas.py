# -*- coding: utf-8 -*-
"""Pydantic schemas for Subsection endpoints."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from src.domain.enums import SubsectionType

class SubsectionCreateSchema(BaseModel):
    section_id: int
    title: str
    content: Optional[str] = None
    type: SubsectionType = SubsectionType.TEXT
    order: int = 0

class SubsectionUpdateSchema(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    type: Optional[SubsectionType] = None
    order: Optional[int] = None

class SubsectionReadSchema(BaseModel):
    id: int
    section_id: int
    title: str
    content: Optional[str]
    type: SubsectionType
    order: int
    created_at: datetime
    is_archived: bool

    class Config:
        from_attributes = True

class SubsectionProgressRead(BaseModel):
    id: int
    subsection_id: int
    is_viewed: bool
    viewed_at: Optional[datetime]

    class Config:
        from_attributes = True
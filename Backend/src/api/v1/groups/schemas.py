# TestWise/Backend/src/api/v1/groups/schemas.py
# -*- coding: utf-8 -*-
"""Pydantic schemas for Group endpoints."""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from src.database.models import GroupStudentStatus

# ---------------------------------------------------------------------------
# Base group schemas
# ---------------------------------------------------------------------------


class GroupCreateSchema(BaseModel):
    name: str
    start_year: int
    end_year: int
    description: Optional[str] = None


class GroupUpdateSchema(BaseModel):
    name: Optional[str] = None
    start_year: Optional[int] = None
    end_year: Optional[int] = None
    description: Optional[str] = None


class GroupReadSchema(BaseModel):
    id: int
    name: str
    start_year: int
    end_year: int
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Student membership schemas
# ---------------------------------------------------------------------------


class GroupStudentCreate(BaseModel):
    user_ids: List[int] = Field(..., min_items=1)


class GroupStudentRead(BaseModel):
    group_id: int
    user_id: int
    status: GroupStudentStatus
    joined_at: datetime
    left_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class GroupStudentUpdate(BaseModel):
    status: GroupStudentStatus


class GroupWithStudentsRead(GroupReadSchema):
    students: List[GroupStudentRead]

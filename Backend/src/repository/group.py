# -*- coding: utf-8 -*-
"""
TestWise/Backend/src/repository/group.py
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Repository for Group and membership management.

This module provides data access operations for Group entities and their
student/teacher associations.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger import configure_logger
from src.domain.models import Group, GroupStudentStatus, GroupStudents, User
from src.repository.base import create_item, delete_item, get_item, update_item
from src.utils.exceptions import NotFoundError

logger = configure_logger()

# ---------------------------------------------------------------------------
# Group & membership helpers
# ---------------------------------------------------------------------------

async def create_group(
    session: AsyncSession,
    name: str,
    start_year: int,
    end_year: int,
    description: str | None = None,
) -> Group:
    """Create a new group with the given attributes."""
    return await create_item(
        session,
        Group,
        name=name,
        start_year=start_year,
        end_year=end_year,
        description=description,
    )

async def add_student_to_group(session: AsyncSession, user_id: int, group_id: int) -> GroupStudents:
    """Add a student to a group with ACTIVE status."""
    await get_item(session, User, user_id)
    await get_item(session, Group, group_id)
    return await create_item(
        session,
        GroupStudents,
        user_id=user_id,
        group_id=group_id,
        status=GroupStudentStatus.ACTIVE,
    )

async def remove_student_from_group(session: AsyncSession, user_id: int, group_id: int) -> None:
    """Remove a student from a group."""
    stmt = select(GroupStudents).where(
        GroupStudents.user_id == user_id, GroupStudents.group_id == group_id
    )
    result = await session.execute(stmt)
    link = result.scalar_one_or_none()
    if not link:
        raise NotFoundError(resource_type="GroupStudents", resource_id=f"{user_id}-{group_id}")
    await delete_item(session, GroupStudents, link.id)

async def update_student_status(
    session: AsyncSession, user_id: int, group_id: int, status: GroupStudentStatus
) -> GroupStudents:
    """Update the status of a student's group membership."""
    stmt = select(GroupStudents).where(
        GroupStudents.user_id == user_id, GroupStudents.group_id == group_id
    )
    result = await session.execute(stmt)
    link = result.scalar_one_or_none()
    if not link:
        raise NotFoundError(resource_type="GroupStudents", resource_id=f"{user_id}-{group_id}")
    link.status = status
    link.updated_at = datetime.now()
    await update_item(session, GroupStudents, link.id)
    return link
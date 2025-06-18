# TestWise/Backend/src/api/v1/groups/routes.py
# -*- coding: utf-8 -*-
"""API v1 › Groups routes
~~~~~~~~~~~~~~~~~~~~~~~~~
Adds student‑management sub‑routes (add/remove/update list) with role guards
(`admin_or_teacher`).
"""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.crud import (
    add_student_to_group,
    create_group,
    delete_item,
    get_item,
    remove_student_from_group,
    update_item,
    update_student_status,
)
from src.core.logger import configure_logger
from src.core.security import admin_only, admin_or_teacher
from src.database.db import get_db
from src.database.models import Group, GroupStudents
from .schemas import (
    GroupCreateSchema,
    GroupReadSchema,
    GroupStudentCreate,
    GroupStudentRead,
    GroupStudentUpdate,
    GroupUpdateSchema,
    GroupWithStudentsRead,
)

router = APIRouter()
logger = configure_logger()

# ---------------------------------------------------------------------------
# Base CRUD for Groups
# ---------------------------------------------------------------------------

@router.post("", response_model=GroupReadSchema, status_code=status.HTTP_201_CREATED)
async def create_group_endpoint(
    group_data: GroupCreateSchema,
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(admin_only),
):
    logger.debug(f"Creating group with data: {group_data.model_dump()}")
    group = await create_group(
        session,
        name=group_data.name,
        start_year=group_data.start_year,
        end_year=group_data.end_year,
        description=group_data.description,
    )
    logger.debug(f"Group created with ID: {group.id}")
    return group

@router.get("", response_model=List[GroupReadSchema])
async def list_groups_endpoint(
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(admin_or_teacher),
):
    logger.debug("Listing all groups")
    stmt = select(Group)
    res = await session.execute(stmt)
    groups = res.scalars().all()
    logger.debug(f"Retrieved {len(groups)} groups")
    return [GroupReadSchema.model_validate(group) for group in groups]

@router.get("/{group_id}", response_model=GroupReadSchema)
async def get_group_endpoint(
    group_id: int,
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(admin_or_teacher),
):
    logger.debug(f"Fetching group with ID: {group_id}")
    group = await get_item(session, Group, group_id)
    logger.debug(f"Group retrieved: {group.name}")
    return group

@router.put("/{group_id}", response_model=GroupReadSchema)
async def update_group_endpoint(
    group_id: int,
    group_data: GroupUpdateSchema,
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(admin_only),
):
    logger.debug(f"Updating group {group_id} with data: {group_data.model_dump()}")
    group = await update_item(
        session, Group, group_id, **group_data.model_dump(exclude_unset=True)
    )
    logger.debug(f"Group {group_id} updated")
    return group

@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_group_endpoint(
    group_id: int,
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(admin_only),
):
    logger.debug(f"Deleting group with ID: {group_id}")
    await delete_item(session, Group, group_id)
    logger.info(f"Удалена группа {group_id}")

# ---------------------------------------------------------------------------
# Student management sub‑routes
# ---------------------------------------------------------------------------

@router.post("/{group_id}/students", response_model=List[GroupStudentRead])
async def add_students_endpoint(
    group_id: int,
    payload: GroupStudentCreate,
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(admin_or_teacher),
):
    logger.debug(f"Adding students to group {group_id} with payload: {payload.model_dump()}")
    students: List[GroupStudentRead] = []
    for user_id in payload.user_ids:
        gs = await add_student_to_group(session, user_id, group_id)
        students.append(GroupStudentRead.model_validate(gs))
    logger.debug(f"Added {len(students)} students to group {group_id}")
    return students

@router.delete("/{group_id}/students/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_student_endpoint(
    group_id: int,
    user_id: int,
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(admin_or_teacher),
):
    logger.debug(f"Removing student {user_id} from group {group_id}")
    await remove_student_from_group(session, user_id, group_id)

@router.put("/{group_id}/students/{user_id}/status", response_model=GroupStudentRead)
async def update_student_status_endpoint(
    group_id: int,
    user_id: int,
    payload: GroupStudentUpdate,
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(admin_or_teacher),
):
    logger.debug(f"Updating status for student {user_id} in group {group_id} with payload: {payload.model_dump()}")
    gs = await update_student_status(session, user_id, group_id, payload.status)
    logger.debug(f"Status updated for student {user_id} in group {group_id}")
    return GroupStudentRead.model_validate(gs)

@router.get("/{group_id}/students", response_model=GroupWithStudentsRead)
async def list_group_students_endpoint(
    group_id: int,
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(admin_or_teacher),
):
    logger.debug(f"Listing students for group {group_id}")
    group = await get_item(session, Group, group_id)
    stmt = select(GroupStudents).where(GroupStudents.group_id == group_id)
    res = await session.execute(stmt)
    students_links = res.scalars().all()
    group_read = GroupWithStudentsRead.model_validate(
        {
            **group.__dict__,
            "students": [GroupStudentRead.model_validate(link) for link in students_links],
        }
    )
    logger.debug(f"Retrieved {len(students_links)} students for group {group_id}")
    return group_read
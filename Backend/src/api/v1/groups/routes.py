# TestWise/Backend/src/api/v1/groups/routes.py
# -*- coding: utf-8 -*-
"""API v1 › Groups routes
~~~~~~~~~~~~~~~~~~~~~~~~~
Adds student‑management sub‑routes (add/remove/update list) with role guards
(`admin_or_teacher`) and teacher management sub-routes.
"""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger import configure_logger
from src.database.db import get_db
from src.domain.models import Group, GroupStudents, GroupTeachers
from src.repository.base import update_item, archive_item, delete_item_permanently, get_item
from src.repository.group import create_group, update_student_status, add_student_to_group
from src.security.security import admin_only, admin_or_teacher
from .schemas import (
    GroupCreateSchema,
    GroupReadSchema,
    GroupStudentCreate,
    GroupStudentRead,
    GroupStudentUpdate,
    GroupTeacherCreate,
    GroupTeacherRead,
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
    """Создает новую группу.

    Args:
        group_data (GroupCreateSchema): Данные новой группы.
            - name (str): Название группы (обязательно).
            - start_year (int): Год начала (обязательно).
            - end_year (int): Год окончания (обязательно).
            - description (str, optional): Описание группы.

    Returns:
        GroupReadSchema: Данные созданной группы.

    Raises:
        HTTPException: Если данные некорректны (400).
    """
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
    """Возвращает список групп.

    Returns:
        List[GroupReadSchema]: Список групп.

    Raises:
        HTTPException: Если доступ запрещен (403).
    """
    logger.debug("Listing all groups")
    stmt = select(Group).where(Group.is_archived == False)
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
    """Получает данные группы по ID.

    Args:
        group_id (int): ID группы.

    Returns:
        GroupReadSchema: Данные группы.

    Raises:
        HTTPException: Если группа не найдена (404).
    """
    logger.debug(f"Fetching group with ID: {group_id}")
    group = await get_item(session, Group, group_id, is_archived=False)
    logger.debug(f"Group retrieved: {group.name}")
    return group

@router.put("/{group_id}", response_model=GroupReadSchema)
async def update_group_endpoint(
    group_id: int,
    group_data: GroupUpdateSchema,
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(admin_only),
):
    """Обновляет данные группы.

    Args:
        group_id (int): ID группы.
        group_data (GroupUpdateSchema): Обновляемые поля.
            - name (str, optional): Новое название.
            - start_year (int, optional): Новый год начала.
            - end_year (int, optional): Новый год окончания.
            - description (str, optional): Новое описание.

    Returns:
        GroupReadSchema: Обновленные данные группы.

    Raises:
        HTTPException: Если группа не найдена (404).
    """
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
        _claims: dict = Depends(admin_or_teacher),
):
    """Архивирует группу.

    Args:
        group_id (int): ID группы.

    Raises:
        HTTPException: Если группа не найдена (404).
    """
    logger.debug(f"Archiving group with ID: {group_id}")
    await archive_item(session, Group, group_id)
    logger.info(f"Группа {group_id} архивирована")


@router.post("/{group_id}/archive", status_code=status.HTTP_204_NO_CONTENT)
async def archive_group_endpoint(
        group_id: int,
        session: AsyncSession = Depends(get_db),
        _claims: dict = Depends(admin_or_teacher),
):
    """Архивирует группу.

    Args:
        group_id (int): ID группы.

    Raises:
        HTTPException: Если группа не найдена (404).
    """
    logger.debug(f"Archiving group with ID: {group_id}")
    await archive_item(session, Group, group_id)
    logger.info(f"Группа {group_id} архивирована")


@router.post("/{group_id}/restore", status_code=status.HTTP_204_NO_CONTENT)
async def restore_group_endpoint(
        group_id: int,
        session: AsyncSession = Depends(get_db),
        _claims: dict = Depends(admin_or_teacher),
):
    """Восстанавливает архивированную группу.

    Args:
        group_id (int): ID группы.

    Raises:
        HTTPException: Если группа не найдена (404).
    """
    logger.debug(f"Restoring group with ID: {group_id}")
    group = await get_item(session, Group, group_id, is_archived=True)
    group.is_archived = False
    await session.commit()
    logger.info(f"Группа {group_id} восстановлена")


@router.delete("/{group_id}/permanent", status_code=status.HTTP_204_NO_CONTENT)
async def delete_group_permanently_endpoint(
        group_id: int,
        session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(admin_only),
):
    """Окончательно удаляет архивированную группу.

    Args:
        group_id (int): ID группы.

    Raises:
        HTTPException: Если группа не найдена (404).
    """
    logger.debug(f"Permanently deleting group with ID: {group_id}")
    await delete_item_permanently(session, Group, group_id)
    logger.info(f"Группа {group_id} удалена окончательно")

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
    """Добавляет студентов в группу.

    Args:
        group_id (int): ID группы.
        payload (GroupStudentCreate): Список ID студентов.
            - user_ids (List[int]): Список ID пользователей (обязательно, минимум 1).

    Returns:
        List[GroupStudentRead]: Список добавленных связей студентов.

    Raises:
        HTTPException: Если группа или студенты не найдены (404).
    """
    logger.debug(f"Adding students to group {group_id} with payload: {payload.model_dump()}")
    students: List[GroupStudentRead] = []
    for user_id in payload.user_ids:
        gs = await add_student_to_group(session, user_id, group_id)
        students.append(GroupStudentRead.model_validate(gs))
    logger.debug(f"Added {len(students)} students to group {group_id}")
    return students


@router.get("/{group_id}/students", response_model=GroupWithStudentsRead)
async def list_group_students_endpoint(
        group_id: int,
        session: AsyncSession = Depends(get_db),
        _claims: dict = Depends(admin_or_teacher),
):
    """Возвращает список студентов группы.

    Args:
        group_id (int): ID группы.

    Returns:
        GroupWithStudentsRead: Группа с списком студентов.

    Raises:
        HTTPException: Если группа не найдена (404).
    """
    logger.debug(f"Listing students for group {group_id}")
    group = await get_item(session, Group, group_id, is_archived=False)
    stmt = select(GroupStudents).where(GroupStudents.group_id == group_id, GroupStudents.is_archived == False)
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

@router.delete("/{group_id}/students/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_student_endpoint(
    group_id: int,
    user_id: int,
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(admin_or_teacher),
):
    """Архивирует связь студента с группой.

    Args:
        group_id (int): ID группы.
        user_id (int): ID студента.

    Raises:
        HTTPException: Если связь не найдена (404).
    """
    logger.debug(f"Archiving student {user_id} from group {group_id}")
    stmt = select(GroupStudents).where(GroupStudents.group_id == group_id, GroupStudents.user_id == user_id)
    res = await session.execute(stmt)
    link = res.scalar_one_or_none()
    if not link:
        raise HTTPException(status_code=404, detail="Student-group link not found")
    link.is_archived = True
    await session.commit()
    logger.info(f"Student {user_id} archived from group {group_id}")

@router.put("/{group_id}/students/{user_id}/status", response_model=GroupStudentRead)
async def update_student_status_endpoint(
    group_id: int,
    user_id: int,
    payload: GroupStudentUpdate,
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(admin_or_teacher),
):
    """Обновляет статус студента в группе.

    Args:
        group_id (int): ID группы.
        user_id (int): ID студента.
        payload (GroupStudentUpdate): Новый статус.
            - status (GroupStudentStatus): Новый статус (active/inactive).

    Returns:
        GroupStudentRead: Обновленная связь студента.

    Raises:
        HTTPException: Если связь не найдена (404).
    """
    logger.debug(f"Updating status for student {user_id} in group {group_id} with payload: {payload.model_dump()}")
    gs = await update_student_status(session, user_id, group_id, payload.status)
    logger.debug(f"Status updated for student {user_id} in group {group_id}")
    return GroupStudentRead.model_validate(gs)


# ---------------------------------------------------------------------------
# Teacher management sub‑routes
# ---------------------------------------------------------------------------

@router.post("/{group_id}/teachers", response_model=List[GroupTeacherRead])
async def add_teachers_endpoint(
        group_id: int,
        payload: GroupTeacherCreate,
        session: AsyncSession = Depends(get_db),
        _claims: dict = Depends(admin_only),
):
    """Назначает учителей группе.

    Args:
        group_id (int): ID группы.
        payload (GroupTeacherCreate): Список ID учителей.
            - user_ids (List[int]): Список ID пользователей (обязательно, минимум 1).

    Returns:
        List[GroupTeacherRead]: Список назначенных учителей.

    Raises:
        HTTPException: Если группа или учителя не найдены (404).
    """
    logger.debug(f"Adding teachers to group {group_id} with payload: {payload.model_dump()}")
    teachers: List[GroupTeacherRead] = []
    for user_id in payload.user_ids:
        stmt = select(GroupTeachers).where(GroupTeachers.group_id == group_id, GroupTeachers.user_id == user_id)
        res = await session.execute(stmt)
        if not res.scalar_one_or_none():
            gt = GroupTeachers(group_id=group_id, user_id=user_id)
            session.add(gt)
            await session.commit()
            teachers.append(GroupTeacherRead.model_validate(gt))
    logger.debug(f"Added {len(teachers)} teachers to group {group_id}")
    return teachers


@router.get("/{group_id}/teachers", response_model=List[GroupTeacherRead])
async def list_group_teachers_endpoint(
    group_id: int,
    session: AsyncSession = Depends(get_db),
    _claims: dict = Depends(admin_or_teacher),
):
    """Возвращает список учителей группы.

    Args:
        group_id (int): ID группы.

    Returns:
        List[GroupTeacherRead]: Список учителей.

    Raises:
        HTTPException: Если группа не найдена (404).
    """
    logger.debug(f"Listing teachers for group {group_id}")
    await get_item(session, Group, group_id, is_archived=False)
    stmt = select(GroupTeachers).where(GroupTeachers.group_id == group_id, GroupTeachers.is_archived == False)
    res = await session.execute(stmt)
    teachers_links = res.scalars().all()
    logger.debug(f"Retrieved {len(teachers_links)} teachers for group {group_id}")
    return [GroupTeacherRead.model_validate(link) for link in teachers_links]


@router.delete("/{group_id}/teachers/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_teacher_endpoint(
        group_id: int,
        user_id: int,
        session: AsyncSession = Depends(get_db),
        _claims: dict = Depends(admin_only),
):
    """Архивирует связь учителя с группой.

    Args:
        group_id (int): ID группы.
        user_id (int): ID учителя.

    Raises:
        HTTPException: Если связь не найдена (404).
    """
    logger.debug(f"Archiving teacher {user_id} from group {group_id}")
    stmt = select(GroupTeachers).where(GroupTeachers.group_id == group_id, GroupTeachers.user_id == user_id)
    res = await session.execute(stmt)
    link = res.scalar_one_or_none()
    if not link:
        raise HTTPException(status_code=404, detail="Teacher-group link not found")
    link.is_archived = True
    await session.commit()
    logger.info(f"Teacher {user_id} archived from group {group_id}")

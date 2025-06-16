# TestWise/Backend/src/api/v1/groups/routes.py
# -*- coding: utf-8 -*-
"""
Этот модуль определяет маршруты FastAPI для эндпоинтов, связанных с группами.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.crud import create_group, get_item, update_item, delete_item
from src.core.logger import configure_logger
from src.core.security import restrict_to_roles
from src.database.db import get_db
from src.database.models import Group, Role
from .schemas import GroupCreateSchema, GroupUpdateSchema, GroupReadSchema

router = APIRouter()
logger = configure_logger()


@router.post("", response_model=GroupReadSchema)
async def create_group_endpoint(group_data: GroupCreateSchema, session: AsyncSession = Depends(get_db),
                                _token: dict = Depends(restrict_to_roles([Role.ADMIN]))):
    """
    Создает новую группу.

    Аргументы:
        group_data (GroupCreateSchema): Данные для новой группы.
        session (AsyncSession): Сессия базы данных.
        _token (dict): Декодированный JWT-токен (только для админа).

    Возвращает:
        GroupReadSchema: Данные созданной группы.

    Исключения:
        - ConflictError: Если группа с таким именем уже существует.
    """
    group = await create_group(
        session,
        name=group_data.name,
        start_year=group_data.start_year,
        end_year=group_data.end_year,
        description=group_data.description
    )
    return group


@router.get("/{group_id}", response_model=GroupReadSchema)
async def get_group(group_id: int, session: AsyncSession = Depends(get_db),
                    _token: dict = Depends(restrict_to_roles([Role.ADMIN, Role.TEACHER]))):
    """
    Получает группу по ID.

    Аргументы:
        group_id (int): ID группы для получения.
        session (AsyncSession): Сессия базы данных.
        _token (dict): Декодированный JWT-токен (админ или учитель).

    Возвращает:
        GroupReadSchema: Данные группы.

    Исключения:
        - NotFoundError: Если группа не найдена.
    """
    group = await get_item(session, Group, group_id)
    return group


@router.put("/{group_id}", response_model=GroupReadSchema)
async def update_group(group_id: int, group_data: GroupUpdateSchema, session: AsyncSession = Depends(get_db),
                       _token: dict = Depends(restrict_to_roles([Role.ADMIN]))):
    """
    Обновляет группу.

    Аргументы:
        group_id (int): ID группы для обновления.
        group_data (GroupUpdateSchema): Данные для обновления.
        session (AsyncSession): Сессия базы данных.
        _token (dict): Декодированный JWT-токен (только для админа).

    Возвращает:
        GroupReadSchema: Обновленные данные группы.

    Исключения:
        - NotFoundError: Если группа не найдена.
        - ConflictError: Если имя группы уже существует.
    """
    update_data = group_data.dict(exclude_unset=True)
    group = await update_item(session, Group, group_id, **update_data)
    return group


@router.delete("/{group_id}")
async def delete_group(group_id: int, session: AsyncSession = Depends(get_db),
                       _token: dict = Depends(restrict_to_roles([Role.ADMIN]))):
    """
    Удаляет группу.

    Аргументы:
        group_id (int): ID группы для удаления.
        session (AsyncSession): Сессия базы данных.
        _token (dict): Декодированный JWT-токен (только для админа).

    Исключения:
        - NotFoundError: Если группа не найдена.
    """
    await delete_item(session, Group, group_id)
    logger.info(f"Удалена группа {group_id}")
    return {"detail": "Группа удалена"}

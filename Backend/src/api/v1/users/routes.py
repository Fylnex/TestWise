# TestWise/Backend/src/api/v1/users/routes.py
# -*- coding: utf-8 -*-
"""
Этот модуль определяет маршруты FastAPI для эндпоинтов, связанных с пользователями.
"""

from fastapi import APIRouter, Depends
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.crud import create_user, get_item, update_item, delete_item
from src.core.logger import configure_logger
from src.core.security import restrict_to_roles
from src.database.db import get_db
from src.database.models import User, Role
from .schemas import UserCreateSchema, UserUpdateSchema, UserReadSchema

router = APIRouter()
logger = configure_logger()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("", response_model=UserReadSchema)
async def create_user_endpoint(user_data: UserCreateSchema, session: AsyncSession = Depends(get_db),
                               _token: dict = Depends(restrict_to_roles([Role.ADMIN]))):
    """
    Создает нового пользователя.

    Аргументы:
        user_data (UserCreateSchema): Данные для нового пользователя.
        session (AsyncSession): Сессия базы данных.
        _token (dict): Декодированный JWT-токен (только для админа).

    Возвращает:
        UserReadSchema: Данные созданного пользователя.

    Исключения:
        - ConflictError: Если имя пользователя или email уже существуют.
    """
    user = await create_user(
        session,
        username=user_data.username,
        email=user_data.email,
        password=user_data.password,
        role=user_data.role
    )
    return user


@router.get("/{user_id}", response_model=UserReadSchema)
async def get_user(user_id: int, session: AsyncSession = Depends(get_db),
                   _token: dict = Depends(restrict_to_roles([Role.ADMIN, Role.TEACHER]))):
    """
    Получает пользователя по ID.

    Аргументы:
        user_id (int): ID пользователя для получения.
        session (AsyncSession): Сессия базы данных.
        _token (dict): Декодированный JWT-токен (админ или учитель).

    Возвращает:
        UserReadSchema: Данные пользователя.

    Исключения:
        - NotFoundError: Если пользователь не найден.
    """
    user = await get_item(session, User, user_id)
    return user


@router.put("/{user_id}", response_model=UserReadSchema)
async def update_user(user_id: int, user_data: UserUpdateSchema, session: AsyncSession = Depends(get_db),
                      _token: dict = Depends(restrict_to_roles([Role.ADMIN]))):
    """
    Обновляет пользователя.

    Аргументы:
        user_id (int): ID пользователя для обновления.
        user_data (UserUpdateSchema): Данные для обновления.
        session (AsyncSession): Сессия базы данных.
        _token (dict): Декодированный JWT-токен (только для админа).

    Возвращает:
        UserReadSchema: Обновленные данные пользователя.

    Исключения:
        - NotFoundError: Если пользователь не найден.
        - ConflictError: Если имя пользователя или email уже существуют.
    """
    update_data = user_data.dict(exclude_unset=True)
    if update_data.get("password"):
        update_data["password"] = pwd_context.hash(update_data["password"])
    user = await update_item(session, User, user_id, **update_data)
    return user


@router.delete("/{user_id}")
async def delete_user(user_id: int, session: AsyncSession = Depends(get_db),
                      _token: dict = Depends(restrict_to_roles([Role.ADMIN]))):
    """
    Удаляет пользователя.

    Аргументы:
        user_id (int): ID пользователя для удаления.
        session (AsyncSession): Сессия базы данных.
        _token (dict): Декодированный JWT-токен (только для админа).

    Исключения:
        - NotFoundError: Если пользователь не найден.
    """
    await delete_item(session, User, user_id)
    logger.info(f"Удален пользователь {user_id}")
    return {"detail": "Пользователь удален"}

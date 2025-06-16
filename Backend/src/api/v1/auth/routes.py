# TestWise/Backend/src/api/v1/auth/routes.py
# -*- coding: utf-8 -*-
"""
Этот модуль определяет маршруты FastAPI для эндпоинтов, связанных с аутентификацией.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.crud import get_user_by_username, get_item
from src.core.logger import configure_logger
from src.core.security import create_access_token, restrict_to_roles
from src.database.db import get_db
from src.database.models import Role, User
from .schemas import LoginSchema, TokenSchema, UserReadSchema

router = APIRouter()
logger = configure_logger()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("/login", response_model=TokenSchema)
async def login(login_data: LoginSchema, session: AsyncSession = Depends(get_db)):
    """
    Аутентифицирует пользователя и возвращает JWT-токен.

    Аргументы:
        login_data (LoginSchema): Учетные данные пользователя.
        session (AsyncSession): Сессия базы данных.

    Возвращает:
        TokenSchema: JWT-токен и тип токена.

    Исключения:
        - HTTPException: Если учетные данные недействительны.
    """
    try:
        user = await get_user_by_username(session, login_data.username)
        if not pwd_context.verify(login_data.password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Недействительные учетные данные",
                headers={"WWW-Authenticate": "Bearer"}
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Пользователь неактивен"
            )
        access_token = create_access_token({"user_id": user.id, "role": user.role})
        logger.info(f"Пользователь {user.username} вошел в систему")
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        logger.error(f"Ошибка входа для {login_data.username}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Недействительные учетные данные",
            headers={"WWW-Authenticate": "Bearer"}
        )


@router.get("/me", response_model=UserReadSchema)
async def get_current_user(token: dict = Depends(restrict_to_roles([Role.ADMIN, Role.TEACHER, Role.STUDENT])),
                           session: AsyncSession = Depends(get_db)):
    """
    Получает данные текущего пользователя.

    Аргументы:
        token (dict): Декодированный JWT-токен с user_id и role.
        session (AsyncSession): Сессия базы данных.

    Возвращает:
        UserReadSchema: Данные текущего пользователя.

    Исключения:
        - NotFoundError: Если пользователь не найден.
    """
    user = await get_item(session, User, token["user_id"])
    logger.info(f"Получены данные для пользователя {user.username}")
    return user

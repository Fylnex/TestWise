# TestWise/Backend/src/api/v1/auth/routes.py
# -*- coding: utf-8 -*-
"""
Маршруты FastAPI для аутентификации.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.crud import get_user_by_username, get_item
from src.core.logger import configure_logger
from src.core.security import (
    create_access_token,
    authenticated,          # ← preset «ADMIN | TEACHER | STUDENT»
)
from src.database.db import get_db
from src.database.models import Role, User
from .schemas import LoginSchema, TokenSchema, UserReadSchema

router = APIRouter()
logger = configure_logger()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ---------------------------------------------------------------------------#
# /login                                                                      #
# ---------------------------------------------------------------------------#
@router.post("/login", response_model=TokenSchema, status_code=status.HTTP_200_OK)
async def login(
    credentials: LoginSchema,
    session: AsyncSession = Depends(get_db),
):
    """
    Аутентифицирует пользователя и возвращает JWT-токен.

    Исключения:
        * 401 ― неверные учётные данные.
        * 403 ― пользователь неактивен.
    """
    user = await get_user_by_username(session, credentials.username)

    if not pwd_context.verify(credentials.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Недействительные учётные данные",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Пользователь неактивен",
        )

    # ► сохраняем ID в стандартном claim *sub*
    token = create_access_token({"sub": user.id, "role": user.role})
    logger.info("Пользователь %s авторизовался", user.username)

    return {"access_token": token, "token_type": "bearer"}


# ---------------------------------------------------------------------------#
# /me                                                                         #
# ---------------------------------------------------------------------------#
@router.get("/me", response_model=UserReadSchema, dependencies=[Depends(authenticated)])
async def read_current_user(
    session: AsyncSession = Depends(get_db),
    claims: dict = Depends(authenticated),
):
    """
    Возвращает данные текущего пользователя.
    """
    user = await get_item(session, User, claims["sub"])
    return user

# TestWise/Backend/src/api/v1/auth/routes.py
# -*- coding: utf-8 -*-
"""
Маршруты FastAPI для аутентификации.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger import configure_logger
from src.domain.models import User
from src.repository.base import update_item, get_item
from src.repository.user import get_user_by_username
from src.security.security import create_access_token, create_refresh_token, verify_token, authenticated
from src.database.db import get_db
from .schemas import LoginSchema, TokenSchema, UserReadSchema

router = APIRouter()
logger = configure_logger()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

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
    logger.debug(f"Attempting login with credentials: {credentials.model_dump()}")
    user = await get_user_by_username(session, credentials.username.strip())  # Обрезаем пробелы
    if not pwd_context.verify(credentials.password, user.password):
        logger.debug(f"Login failed: invalid password for user {credentials.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Недействительные учётные данные",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        logger.debug(f"Login failed: user {credentials.username} is inactive")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Пользователь неактивен",
        )
    access_token = create_access_token({"sub": str(user.id), "role": user.role})
    refresh_token = create_refresh_token({"sub": str(user.id), "role": user.role})
    user.refresh_token = refresh_token
    await update_item(session, User, user.id, refresh_token=refresh_token)
    logger.info(f"Пользователь {user.username} авторизовался, token: {access_token}")
    logger.debug(f"Login successful, returning token: {access_token}")
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

@router.post("/refresh", response_model=TokenSchema, status_code=status.HTTP_200_OK)
async def refresh_token(
        request: Request,
        session: AsyncSession = Depends(get_db),
):
    """
    Обновляет Access Token на основе Refresh Token.

    Исключения:
        * 401 ― недействительный или истёкший Refresh Token.
    """
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        logger.debug("No or invalid Authorization header")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    refresh_token = auth.split(" ", 1)[1]
    logger.debug(f"Attempting to refresh token with: {refresh_token}")
    try:
        payload = verify_token(refresh_token, "refresh")
        user_id = payload.get("sub")
        if not user_id:
            logger.debug("No sub in payload")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )
        user = await get_item(session, User, int(user_id))  # Преобразуем sub в int
        if not user or user.refresh_token != refresh_token:
            logger.debug(f"Invalid refresh token for user {user_id}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )
        new_access_token = create_access_token({"sub": str(user.id), "role": user.role})
        logger.info(f"Refreshed token for user {user_id}")
        return {"access_token": new_access_token, "refresh_token": refresh_token, "token_type": "bearer"}
    except HTTPException as exc:
        logger.error(f"HTTP Exception during refresh: {str(exc)}")
        raise exc
    except Exception as exc:
        logger.error(f"Refresh token error: {str(exc)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

@router.get("/me", response_model=UserReadSchema, dependencies=[Depends(authenticated)])
async def read_current_user(
        request: Request,
    session: AsyncSession = Depends(get_db),
    claims: dict = Depends(authenticated),
):
    """
    Возвращает данные текущего пользователя.
    """
    logger.debug(f"Request to /me with headers: {dict(request.headers)}")
    logger.info(f"Request to /me, headers: {dict(request.headers)}")
    user = await get_item(session, User, int(claims["sub"]))  # Преобразуем sub в int
    logger.debug(f"Retrieved user data: {user.username}")
    return user
# TestWise/Backend/src/api/v1/progress/routes.py
# -*- coding: utf-8 -*-
"""
Этот модуль определяет маршруты FastAPI для эндпоинтов, связанных с прогрессом.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.database.db import get_db
from src.core.progress import save_progress, get_user_progress
from src.core.security import restrict_to_roles
from src.core.logger import configure_logger
from src.database.models import Role
from .schemas import ProgressCreateSchema, ProgressUpdateSchema, ProgressReadSchema

router = APIRouter()
logger = configure_logger()

@router.post("", response_model=ProgressReadSchema)
async def create_progress_endpoint(progress_data: ProgressCreateSchema, session: AsyncSession = Depends(get_db),
                                   _token: dict = Depends(restrict_to_roles([Role.ADMIN, Role.TEACHER]))):
    """
    Создает новую запись о прогрессе.

    Аргументы:
        progress_data (ProgressCreateSchema): Данные для новой записи.
        session (AsyncSession): Сессия базы данных.
        _token (dict): Декодированный JWT-токен (админ или учитель).

    Возвращает:
        ProgressReadSchema: Данные созданной записи.

    Исключения:
        - NotFoundError: Если пользователь, тема или раздел не найдены.
        - ValidationError: Если оценка недействительна.
    """
    progress = await save_progress(
        session,
        user_id=progress_data.user_id,
        topic_id=progress_data.topic_id,
        section_id=progress_data.section_id,
        score=progress_data.score,
        time_spent=progress_data.time_spent
    )
    return progress

@router.get("/{user_id}", response_model=list[ProgressReadSchema])
async def get_progress(user_id: int, session: AsyncSession = Depends(get_db),
                       _token: dict = Depends(restrict_to_roles([Role.ADMIN, Role.TEACHER, Role.STUDENT]))):
    """
    Получает прогресс пользователя.

    Аргументы:
        user_id (int): ID пользователя для получения прогресса.
        session (AsyncSession): Сессия базы данных.
        _token (dict): Декодированный JWT-токен (админ, учитель или студент).

    Возвращает:
        list[ProgressReadSchema]: Список записей о прогрессе.

    Исключения:
        - NotFoundError: Если пользователь не найден.
    """
    progress = await get_user_progress(session, user_id)
    return progress
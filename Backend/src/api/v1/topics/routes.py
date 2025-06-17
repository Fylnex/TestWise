# TestWise/Backend/src/api/v1/topics/routes.py
# -*- coding: utf-8 -*-
"""
Этот модуль определяет маршруты FastAPI для эндпоинтов, связанных с темами.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.database.db import get_db
from src.core.crud import create_topic, get_item, update_item, delete_item
from src.core.security import restrict_to_roles
from src.core.logger import configure_logger
from src.database.models import Topic, Role
from .schemas import TopicCreateSchema, TopicUpdateSchema, TopicReadSchema

router = APIRouter()
logger = configure_logger()

@router.post("", response_model=TopicReadSchema)
async def create_topic_endpoint(topic_data: TopicCreateSchema, session: AsyncSession = Depends(get_db),
                                _token: dict = Depends(restrict_to_roles([Role.ADMIN, Role.TEACHER]))):
    """
    Создает новую тему.

    Аргументы:
        topic_data (TopicCreateSchema): Данные для новой темы.
        session (AsyncSession): Сессия базы данных.
        _token (dict): Декодированный JWT-токен (админ или учитель).

    Возвращает:
        TopicReadSchema: Данные созданной темы.

    Исключения:
        - ConflictError: Если тема не может быть создана из-за ограничений БД.
    """
    topic = await create_topic(
        session,
        title=topic_data.title,
        description=topic_data.description,
        category=topic_data.category,
        image=topic_data.image
    )
    return topic

@router.get("/{topic_id}", response_model=TopicReadSchema)
async def get_topic(topic_id: int, session: AsyncSession = Depends(get_db),
                    _token: dict = Depends(restrict_to_roles([Role.ADMIN, Role.TEACHER, Role.STUDENT]))):
    """
    Получает тему по ID.

    Аргументы:
        topic_id (int): ID темы для получения.
        session (AsyncSession): Сессия базы данных.
        _token (dict): Декодированный JWT-токен (админ, учитель или студент).

    Возвращает:
        TopicReadSchema: Данные темы.

    Исключения:
        - NotFoundError: Если тема не найдена.
    """
    topic = await get_item(session, Topic, topic_id)
    return topic

@router.put("/{topic_id}", response_model=TopicReadSchema)
async def update_topic(topic_id: int, topic_data: TopicUpdateSchema, session: AsyncSession = Depends(get_db),
                       _token: dict = Depends(restrict_to_roles([Role.ADMIN, Role.TEACHER]))):
    """
    Обновляет тему.

    Аргументы:
        topic_id (int): ID темы для обновления.
        topic_data (TopicUpdateSchema): Данные для обновления.
        session (AsyncSession): Сессия базы данных.
        _token (dict): Декодированный JWT-токен (админ или учитель).

    Возвращает:
        TopicReadSchema: Обновленные данные темы.

    Исключения:
        - NotFoundError: Если тема не найдена.
        - ConflictError: Если обновление нарушает ограничения БД.
    """
    update_data = topic_data.dict(exclude_unset=True)
    topic = await update_item(session, Topic, topic_id, **update_data)
    return topic

@router.delete("/{topic_id}")
async def delete_topic(topic_id: int, session: AsyncSession = Depends(get_db),
                       _token: dict = Depends(restrict_to_roles([Role.ADMIN, Role.TEACHER]))):
    """
    Удаляет тему.

    Аргументы:
        topic_id (int): ID темы для удаления.
        session (AsyncSession): Сессия базы данных.
        _token (dict): Декодированный JWT-токен (админ или учитель).

    Исключения:
        - NotFoundError: Если тема не найдена.
    """
    await delete_item(session, Topic, topic_id)
    logger.info(f"Удалена тема {topic_id}")
    return {"detail": "Тема удалена"}
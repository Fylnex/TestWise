# TestWise/Backend/src/api/v1/sections/routes.py
# -*- coding: utf-8 -*-
"""
Этот модуль определяет маршруты FastAPI для эндпоинтов, связанных с разделами.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.database.db import get_db
from src.core.crud import create_section, get_item, update_item, delete_item
from src.core.security import restrict_to_roles
from src.core.logger import configure_logger
from src.database.models import Section, Role
from .schemas import SectionCreateSchema, SectionUpdateSchema, SectionReadSchema

router = APIRouter()
logger = configure_logger()

@router.post("", response_model=SectionReadSchema)
async def create_section_endpoint(section_data: SectionCreateSchema, session: AsyncSession = Depends(get_db),
                                  _token: dict = Depends(restrict_to_roles([Role.ADMIN, Role.TEACHER]))):
    """
    Создает новый раздел.

    Аргументы:
        section_data (SectionCreateSchema): Данные для нового раздела.
        session (AsyncSession): Сессия базы данных.
        _token (dict): Декодированный JWT-токен (админ или учитель).

    Возвращает:
        SectionReadSchema: Данные созданного раздела.

    Исключения:
        - NotFoundError: Если тема не найдена.
        - ValidationError: Если параметры теста недействительны.
    """
    section = await create_section(
        session,
        topic_id=section_data.topic_id,
        title=section_data.title,
        content=section_data.content,
        is_test=section_data.is_test,
        test_type=section_data.test_type,
        control_questions_percentage=section_data.control_questions_percentage
    )
    return section

@router.get("/{section_id}", response_model=SectionReadSchema)
async def get_section(section_id: int, session: AsyncSession = Depends(get_db),
                      _token: dict = Depends(restrict_to_roles([Role.ADMIN, Role.TEACHER, Role.STUDENT]))):
    """
    Получает раздел по ID.

    Аргументы:
        section_id (int): ID раздела для получения.
        session (AsyncSession): Сессия базы данных.
        _token (dict): Декодированный JWT-токен (админ, учитель или студент).

    Возвращает:
        SectionReadSchema: Данные раздела.

    Исключения:
        - NotFoundError: Если раздел не найден.
    """
    section = await get_item(session, Section, section_id)
    return section

@router.put("/{section_id}", response_model=SectionReadSchema)
async def update_section(section_id: int, section_data: SectionUpdateSchema, session: AsyncSession = Depends(get_db),
                         _token: dict = Depends(restrict_to_roles([Role.ADMIN, Role.TEACHER]))):
    """
    Обновляет раздел.

    Аргументы:
        section_id (int): ID раздела для обновления.
        section_data (SectionUpdateSchema): Данные для обновления.
        session (AsyncSession): Сессия базы данных.
        _token (dict): Декодированный JWT-токен (админ или учитель).

    Возвращает:
        SectionReadSchema: Обновленные данные раздела.

    Исключения:
        - NotFoundError: Если раздел не найден.
        - ValidationError: Если параметры теста недействительны.
    """
    update_data = section_data.dict(exclude_unset=True)
    section = await update_item(session, Section, section_id, **update_data)
    return section

@router.delete("/{section_id}")
async def delete_section(section_id: int, session: AsyncSession = Depends(get_db),
                         _token: dict = Depends(restrict_to_roles([Role.ADMIN, Role.TEACHER]))):
    """
    Удаляет раздел.

    Аргументы:
        section_id (int): ID раздела для удаления.
        session (AsyncSession): Сессия базы данных.
        _token (dict): Декодированный JWT-токен (админ или учитель).

    Исключения:
        - NotFoundError: Если раздел не найден.
    """
    await delete_item(session, Section, section_id)
    logger.info(f"Удален раздел {section_id}")
    return {"detail": "Раздел удален"}
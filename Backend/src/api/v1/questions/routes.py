# TestWise/Backend/src/api/v1/questions/routes.py
# -*- coding: utf-8 -*-
"""
Этот модуль определяет маршруты FastAPI для эндпоинтов, связанных с вопросами.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.crud import create_question, get_item, update_item, delete_item
from src.core.logger import configure_logger
from src.core.security import restrict_to_roles
from src.database.db import get_db
from src.database.models import Question, Role
from .schemas import QuestionCreateSchema, QuestionUpdateSchema, QuestionReadSchema

router = APIRouter()
logger = configure_logger()


@router.post("", response_model=QuestionReadSchema)
async def create_question_endpoint(question_data: QuestionCreateSchema, session: AsyncSession = Depends(get_db),
                                   _token: dict = Depends(restrict_to_roles([Role.ADMIN, Role.TEACHER]))):
    """
    Создает новый вопрос.

    Аргументы:
        question_data (QuestionCreateSchema): Данные для нового вопроса.
        session (AsyncSession): Сессия базы данных.
        _token (dict): Декодированный JWT-токен (админ или учитель).

    Возвращает:
        QuestionReadSchema: Данные созданного вопроса.

    Исключения:
        - NotFoundError: Если раздел не найден.
        - ValidationError: Если параметры вопроса недействительны.
    """
    question = await create_question(
        session,
        section_id=question_data.section_id,
        question=question_data.question,
        question_type=question_data.question_type,
        options=question_data.options,
        correct_answer=question_data.correct_answer,
        hint=question_data.hint,
        is_control=question_data.is_control,
        image=question_data.image
    )
    return question


@router.get("/{question_id}", response_model=QuestionReadSchema)
async def get_question(question_id: int, session: AsyncSession = Depends(get_db),
                       _token: dict = Depends(restrict_to_roles([Role.ADMIN, Role.TEACHER, Role.STUDENT]))):
    """
    Получает вопрос по ID.

    Аргументы:
        question_id (int): ID вопроса для получения.
        session (AsyncSession): Сессия базы данных.
        _token (dict): Декодированный JWT-токен (админ, учитель или студент).

    Возвращает:
        QuestionReadSchema: Данные вопроса.

    Исключения:
        - NotFoundError: Если вопрос не найден.
    """
    question = await get_item(session, Question, question_id)
    return question


@router.put("/{question_id}", response_model=QuestionReadSchema)
async def update_question(question_id: int, question_data: QuestionUpdateSchema,
                          session: AsyncSession = Depends(get_db),
                          _token: dict = Depends(restrict_to_roles([Role.ADMIN, Role.TEACHER]))):
    """
    Обновляет вопрос.

    Аргументы:
        question_id (int): ID вопроса для обновления.
        question_data (QuestionUpdateSchema): Данные для обновления.
        session (AsyncSession): Сессия базы данных.
        _token (dict): Декодированный JWT-токен (админ или учитель).

    Возвращает:
        QuestionReadSchema: Обновленные данные вопроса.

    Исключения:
        - NotFoundError: Если вопрос не найден.
        - ValidationError: Если параметры вопроса недействительны.
    """
    update_data = question_data.dict(exclude_unset=True)
    question = await update_item(session, Question, question_id, **update_data)
    return question


@router.delete("/{question_id}")
async def delete_question(question_id: int, session: AsyncSession = Depends(get_db),
                          _token: dict = Depends(restrict_to_roles([Role.ADMIN, Role.TEACHER]))):
    """
    Удаляет вопрос.

    Аргументы:
        question_id (int): ID вопроса для удаления.
        session (AsyncSession): Сессия базы данных.
        _token (dict): Декодированный JWT-токен (админ или учитель).

    Исключения:
        - NotFoundError: Если вопрос не найден.
    """
    await delete_item(session, Question, question_id)
    logger.info(f"Удален вопрос {question_id}")
    return {"detail": "Вопрос удален"}

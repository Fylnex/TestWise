# -*- coding: utf-8 -*-
"""
Этот модуль определяет маршруты FastAPI для эндпоинтов, связанных с вопросами.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.crud import create_question, delete_item, get_item, update_item
from src.core.logger import configure_logger
from src.core.security import require_roles
from src.database.db import get_db
from src.database.models import Question, Role
from .schemas import QuestionCreateSchema, QuestionReadSchema, QuestionUpdateSchema

router = APIRouter()
logger = configure_logger()

@router.post(
    "",
    response_model=QuestionReadSchema,
    dependencies=[Depends(require_roles(Role.ADMIN, Role.TEACHER))],
)
async def create_question_endpoint(
    question_data: QuestionCreateSchema,
    session: AsyncSession = Depends(get_db),
):
    """
    Создает новый вопрос.

    Аргументы:
        question_data (QuestionCreateSchema): Данные для нового вопроса.
        session (AsyncSession): Сессия базы данных.

    Возвращает:
        QuestionReadSchema: Данные созданного вопроса.

    Исключения:
        - NotFoundError: Если раздел/тест не найдены.
        - ValidationError: Если параметры вопроса недействительны.
    """
    logger.debug(f"Creating question with data: {question_data.model_dump()}")
    question = await create_question(
        session=session,
        section_id=question_data.section_id,
        test_id=question_data.test_id,
        question=question_data.question,
        question_type=question_data.question_type,
        options=question_data.options,
        correct_answer=question_data.correct_answer,
        hint=question_data.hint,
        is_final=question_data.is_final,
        image=question_data.image,
    )
    logger.debug(f"Question created with ID: {question.id}")
    return question

@router.get(
    "/{question_id}",
    response_model=QuestionReadSchema,
    dependencies=[Depends(require_roles(Role.ADMIN, Role.TEACHER, Role.STUDENT))],
)
async def get_question_endpoint(
    question_id: int,
    session: AsyncSession = Depends(get_db),
):
    """
    Получает вопрос по ID.

    Аргументы:
        question_id (int): ID вопроса.
        session (AsyncSession): Сессия базы данных.

    Возвращает:
        QuestionReadSchema: Данные вопроса.

    Исключения:
        - NotFoundError: Если вопрос не найден.
    """
    logger.debug(f"Fetching question with ID: {question_id}")
    return await get_item(session, Question, question_id)

@router.put(
    "/{question_id}",
    response_model=QuestionReadSchema,
    dependencies=[Depends(require_roles(Role.ADMIN, Role.TEACHER))],
)
async def update_question_endpoint(
    question_id: int,
    question_data: QuestionUpdateSchema,
    session: AsyncSession = Depends(get_db),
):
    """
    Обновляет вопрос.

    Аргументы:
        question_id (int): ID вопроса.
        question_data (QuestionUpdateSchema): Обновляемые поля.
        session (AsyncSession): Сессия базы данных.

    Возвращает:
        QuestionReadSchema: Обновленные данные вопроса.

    Исключения:
        - NotFoundError: Если вопрос не найден.
        - ValidationError: Если данные некорректны.
    """
    logger.debug(f"Updating question {question_id} with data: {question_data.model_dump()}")
    update_data = question_data.model_dump(exclude_unset=True)
    logger.debug(f"Update data: {update_data}")
    return await update_item(session, Question, question_id, **update_data)

@router.delete(
    "/{question_id}",
    dependencies=[Depends(require_roles(Role.ADMIN, Role.TEACHER))],
)
async def delete_question_endpoint(
    question_id: int,
    session: AsyncSession = Depends(get_db),
):
    """
    Удаляет вопрос.

    Аргументы:
        question_id (int): ID вопроса.
        session (AsyncSession): Сессия базы данных.

    Исключения:
        - NotFoundError: Если вопрос не найден.
    """
    logger.debug(f"Deleting question with ID: {question_id}")
    await delete_item(session, Question, question_id)
    logger.info(f"Удалён вопрос {question_id}")
    return {"detail": "Вопрос удалён"}
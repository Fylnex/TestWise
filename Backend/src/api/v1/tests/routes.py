# TestWise/Backend/src/api/v1/tests/routes.py
# -*- coding: utf-8 -*-
"""
Этот модуль определяет маршруты FastAPI для эндпоинтов, связанных с тестами.
"""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.logger import configure_logger
from src.core.progress import save_progress
from src.core.security import restrict_to_roles
from src.core.tests import generate_test_questions
from src.database.db import get_db
from src.database.models import Section, Question, Role
from .schemas import TestStartSchema, TestStartResponseSchema, TestSubmitSchema, TestSubmitResponseSchema

router = APIRouter()
logger = configure_logger()


@router.post("/start", response_model=TestStartResponseSchema)
async def start_test(test_data: TestStartSchema, session: AsyncSession = Depends(get_db),
                     token: dict = Depends(restrict_to_roles([Role.STUDENT]))):
    """
    Начинает тест, возвращает вопросы и устанавливает таймер.

    Аргументы:
        test_data (TestStartSchema): Данные для начала теста (section_id, num_questions).
        session (AsyncSession): Сессия базы данных.
        token (dict): Декодированный JWT-токен (только для студента).

    Возвращает:
        TestStartResponseSchema: Данные теста (вопросы, время начала, длительность).

    Исключения:
        - NotFoundError: Если раздел не найден.
        - ValidationError: Если недостаточно вопросов.
    """
    section = await session.get(Section, test_data.section_id)
    if not section or not section.is_test:
        raise HTTPException(status_code=404, detail="Раздел не является тестом")

    questions = await generate_test_questions(session, test_data.section_id, test_data.num_questions)
    duration = 3600  # Длительность теста в секундах (1 час)

    logger.info(f"Тест начат для пользователя {token['user_id']} в разделе {test_data.section_id}")
    return {
        "test_id": test_data.section_id,
        "questions": questions,
        "start_time": datetime.utcnow(),
        "duration": duration
    }


@router.post("/submit", response_model=TestSubmitResponseSchema)
async def submit_test(test_data: TestSubmitSchema, session: AsyncSession = Depends(get_db),
                      token: dict = Depends(restrict_to_roles([Role.STUDENT]))):
    """
    Принимает ответы на тест, рассчитывает оценку и сохраняет прогресс.

    Аргументы:
        test_data (TestSubmitSchema): Данные с ответами на тест.
        session (AsyncSession): Сессия базы данных.
        token (dict): Декодированный JWT-токен (только для студента).

    Возвращает:
        TestSubmitResponseSchema: Результат теста (оценка, время, статус).

    Исключения:
        - NotFoundError: Если раздел или вопросы не найдены.
        - ValidationError: Если данные недействительны.
    """
    section = await session.get(Section, test_data.section_id)
    if not section or not section.is_test:
        raise HTTPException(status_code=404, detail="Раздел не является тестом")

    # Рассчитываем оценку
    correct_answers = 0
    total_questions = len(test_data.answers)

    for answer in test_data.answers:
        question = await session.get(Question, answer["question_id"])
        if not question or question.section_id != test_data.section_id:
            raise HTTPException(status_code=400, detail=f"Недействительный вопрос {answer['question_id']}")

        if question.correct_answer == answer["answer"]:
            correct_answers += 1

    score = (correct_answers / total_questions) * 100 if total_questions > 0 else 0
    time_spent = 1800  # Пример: время в секундах (будет зависеть от фронтенда)

    # Сохраняем прогресс
    progress = await save_progress(
        session,
        user_id=token["user_id"],
        topic_id=section.topic_id,
        section_id=test_data.section_id,
        score=score,
        time_spent=time_spent
    )

    logger.info(f"Тест завершен для пользователя {token['user_id']} в разделе {test_data.section_id}, оценка: {score}")
    return {
        "score": progress.score,
        "time_spent": progress.time_spent,
        "completed": progress.completed
    }

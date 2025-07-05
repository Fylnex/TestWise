# -*- coding: utf-8 -*-
"""
TestWise/Backend/src/service/tests.py
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Dynamic test generation & attempt lifecycle helpers.

Переписанные генераторы тестов без использования question_ids и section_id.
"""
from __future__ import annotations
import random
from datetime import datetime
from typing import Any, Dict, List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger import configure_logger
from src.domain.enums import QuestionType
from src.domain.models import Question, Section, Test, TestAttempt, TestType, Topic
from src.repository.test import create_test
from src.repository.question import create_question
from src.repository.test import create_test_attempt, submit_test as submit_test_crud
from src.service.progress import check_test_availability
from src.utils.exceptions import NotFoundError, ValidationError

logger = configure_logger()


async def _fetch_questions_by_test_ids(
    session: AsyncSession, test_ids: List[int], only_final: bool = False
) -> List[Question]:
    """Выбираем все вопросы по списку test_id."""
    stmt = select(Question).where(Question.test_id.in_(test_ids))
    if only_final:
        stmt = stmt.where(Question.is_final.is_(True))
    res = await session.execute(stmt)
    return list(res.scalars().all())


async def _random_sample_questions(
    questions: List[Question], num: int | None = None
) -> List[Question]:
    """Случайная выборка объектов Question."""
    if num is None or num >= len(questions):
        return questions
    return random.sample(questions, num)


async def generate_hinted_test(
    session: AsyncSession,
    section_id: int,
    num_questions: int = 10,
    duration: int | None = 15,
    title: str | None = None,
) -> Test:
    """
    Создаёт новый hinted‑тест, клонируя в него ненулевые вопросы из всех статичных тестов раздела.

    - Ищем все тесты раздела (неархивированные).
    - Собираем их вопросы с is_final=False.
    - Случайно выбираем up to num_questions вопросов.
    - Клонируем их под новый тест, сохраняя текст, варианты, ответ, подсказку.
    """
    # 1. Проверяем раздел
    section: Section | None = await session.get(Section, section_id)
    if section is None:
        raise NotFoundError("Section", section_id)

    # 2. Берём IDs всех тестов раздела
    res = await session.execute(
        select(Test.id).where(Test.section_id == section_id, Test.is_archived.is_(False))
    )
    test_ids = [row[0] for row in res.all()]
    if not test_ids:
        raise ValidationError(detail="В разделе нет тестов для взятия вопросов")

    # 3. Выборка и фильтрация вопросов
    all_questions = await _fetch_questions_by_test_ids(session, test_ids, only_final=False)
    if not all_questions:
        raise ValidationError(detail="В разделе нет подходящих вопросов")
    chosen = await _random_sample_questions(all_questions, num_questions)

    # 4. Создаём новый тест
    new_test = await create_test(
        session=session,
        title=title or f"Hinted Quiz: {section.title}",
        type=TestType.HINTED,
        duration=duration,
        section_id=section_id,
        topic_id=None,
    )
    logger.info("Generated hinted test %s", new_test.id)

    # 5. Клонируем вопросы
    for q in chosen:
        await create_question(
            session=session,
            test_id=new_test.id,
            question=q.question,
            question_type=q.question_type,
            options=q.options,
            correct_answer=q.correct_answer,
            hint=q.hint,
            is_final=False,
            image=q.image,
        )
    await session.refresh(new_test)
    return new_test


async def generate_section_final_test(
    session: AsyncSession,
    section_id: int,
    num_questions: int | None = None,
    duration: int | None = 20,
    title: str | None = None,
) -> Test:
    """
    Аналогично hinted, но используем только is_final=True вопросы.
    """
    section = await session.get(Section, section_id)
    if section is None:
        raise NotFoundError("Section", section_id)

    res = await session.execute(
        select(Test.id).where(Test.section_id == section_id, Test.is_archived.is_(False))
    )
    test_ids = [row[0] for row in res.all()]
    all_questions = await _fetch_questions_by_test_ids(session, test_ids, only_final=True)
    if not all_questions:
        raise ValidationError(detail="Нет итоговых вопросов в разделе")

    chosen = await _random_sample_questions(all_questions, num_questions)

    new_test = await create_test(
        session=session,
        title=title or f"Final Test: {section.title}",
        type=TestType.SECTION_FINAL,
        duration=duration,
        section_id=section_id,
        topic_id=None,
    )
    for q in chosen:
        await create_question(
            session=session,
            test_id=new_test.id,
            question=q.question,
            question_type=q.question_type,
            options=q.options,
            correct_answer=q.correct_answer,
            hint=q.hint,
            is_final=True,
            image=q.image,
        )
    await session.refresh(new_test)
    return new_test


async def generate_global_final_test(
    session: AsyncSession,
    topic_id: int,
    num_questions: int = 30,
    duration: int | None = 40,
    title: str | None = None,
) -> Test:
    """
    Итоговый тест по теме: берём вопросы is_final=True из всех разделов темы.
    """
    topic = await session.get(Topic, topic_id)
    if topic is None:
        raise NotFoundError("Topic", topic_id)

    # Все разделы темы
    res = await session.execute(
        select(Section.id).where(Section.topic_id == topic_id, Section.is_archived.is_(False))
    )
    section_ids = [row[0] for row in res.all()]
    # Все тесты этих разделов
    res2 = await session.execute(
        select(Test.id).where(Test.section_id.in_(section_ids), Test.is_archived.is_(False))
    )
    test_ids = [row[0] for row in res2.all()]
    all_questions = await _fetch_questions_by_test_ids(session, test_ids, only_final=True)
    if not all_questions:
        raise ValidationError(detail="Нет итоговых вопросов в теме")

    chosen = await _random_sample_questions(all_questions, num_questions)

    new_test = await create_test(
        session=session,
        title=title or f"Global Final: {topic.title}",
        type=TestType.GLOBAL_FINAL,
        duration=duration,
        section_id=None,
        topic_id=topic_id,
    )
    for q in chosen:
        await create_question(
            session=session,
            test_id=new_test.id,
            question=q.question,
            question_type=q.question_type,
            options=q.options,
            correct_answer=q.correct_answer,
            hint=q.hint,
            is_final=True,
            image=q.image,
        )
    await session.refresh(new_test)
    return new_test


# ---------------------------------------------------------------------------#
# Attempt lifecycle                                                         #
# ---------------------------------------------------------------------------#

async def start_test(session: AsyncSession, user_id: int, test_id: int) -> TestAttempt:
    if not await check_test_availability(session, user_id, test_id):
        raise ValidationError(detail="Test not yet available")
    return await create_test_attempt(session, user_id, test_id)


async def submit_test(
    session: AsyncSession,
    attempt_id: int,
    answers: Dict[int, Any],
) -> TestAttempt:
    attempt = await session.get(TestAttempt, attempt_id)
    if attempt is None:
        raise NotFoundError("TestAttempt", attempt_id)
    if attempt.completed_at is not None:
        raise ValidationError(detail="Attempt already submitted")

    test = await session.get(Test, attempt.test_id)
    if test is None:
        raise NotFoundError("Test", attempt.test_id)

    # Pull all questions of this test
    res = await session.execute(
        select(Question).where(Question.test_id == test.id)
    )
    questions = {q.id: q for q in res.scalars().all()}

    correct = 0
    for q_id, q in questions.items():
        ua = answers.get(q_id)
        if ua is None:
            continue

        # SINGLE_CHOICE или OPEN_TEXT
        if q.question_type in {QuestionType.SINGLE_CHOICE, QuestionType.OPEN_TEXT}:
            # если пользователь прислал индекс, достаём реальный ответ из options
            if isinstance(ua, int) and q.options:
                user_value = q.options[ua]
            else:
                user_value = ua
            if user_value == q.correct_answer:
                correct += 1

        # MULTIPLE_CHOICE
        else:
            # нормализуем вход: список строк
            if isinstance(ua, list):
                # список индексов?
                if all(isinstance(x, int) for x in ua) and q.options:
                    user_list = [q.options[i] for i in ua if 0 <= i < len(q.options)]
                else:
                    user_list = [str(x) for x in ua]
            elif isinstance(ua, int) and q.options:
                user_list = [q.options[ua]]
            else:
                user_list = [ua]

            # нормализуем правильный ответ в список строк
            ca = q.correct_answer or []
            if isinstance(ca, list):
                correct_list = ca
            else:
                correct_list = [ca]

            if sorted(user_list) == sorted(correct_list):
                correct += 1

    score = (correct / len(questions) * 100) if questions else 0.0
    spent = int((datetime.now() - attempt.started_at).total_seconds())

    result = await submit_test_crud(
        session=session,
        attempt_id=attempt_id,
        score=round(score, 2),
        time_spent=spent,
        answers=answers,
    )
    logger.info(f"Attempt {attempt_id} scored {score:.2f}%")
    return result



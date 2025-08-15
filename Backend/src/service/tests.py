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

from fastapi import HTTPException

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger import configure_logger
from src.domain.enums import QuestionType
from src.domain.models import Question, Section, Test, TestAttempt, TestType, Topic
from src.repository.test import create_test, create_test_attempt, submit_test as submit_test_crud
from src.repository.question import create_question
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
    section: Section | None = await session.get(Section, section_id)
    if section is None:
        raise NotFoundError("Section", section_id)

    res = await session.execute(
        select(Test.id).where(Test.section_id == section_id, Test.is_archived.is_(False))
    )
    test_ids = [row[0] for row in res.all()]
    if not test_ids:
        raise ValidationError(detail="В разделе нет тестов для взятия вопросов")

    all_questions = await _fetch_questions_by_test_ids(session, test_ids, only_final=False)
    if not all_questions:
        raise ValidationError(detail="В разделе нет подходящих вопросов")
    chosen = await _random_sample_questions(all_questions, num_questions)

    new_test = await create_test(
        session=session,
        title=title or f"Hinted Quiz: {section.title}",
        type=TestType.HINTED,
        duration=duration,
        section_id=section_id,
        topic_id=None,
    )
    logger.info("Generated hinted test %s", new_test.id)

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

    res = await session.execute(
        select(Section.id).where(Section.topic_id == topic_id, Section.is_archived.is_(False))
    )
    section_ids = [row[0] for row in res.all()]
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
    attempt = await create_test_attempt(session, user_id, test_id)

    # Получаем вопросы и рандомизируем варианты
    q_stmt = select(Question).where(
        Question.test_id == test_id,
        Question.is_archived.is_(False),
        Question.correct_answer.is_not(None),
        Question.correct_answer != []
    )
    questions = (await session.execute(q_stmt)).scalars().all()
    randomized_questions = []
    randomized_config = {}  # Инициализируем как словарь для накопления
    for q in questions:
        q_dict = {k: v for k, v in q.__dict__.items() if k in ['id', 'question', 'question_type', 'options', 'hint', 'image']}
        if q.options:
            options = q.options.copy()
            random.shuffle(options)
            q_dict['options'] = options
            if isinstance(q.correct_answer, str):
                try:
                    original_index = q.options.index(q.correct_answer)
                    correct_index = options.index(q.correct_answer)
                    q_dict['correct_answer_index'] = correct_index
                except ValueError:
                    continue
            elif isinstance(q.correct_answer, list):
                try:
                    original_indices = [q.options.index(a) for a in q.correct_answer]
                    correct_indices = [options.index(a) for a in q.correct_answer]
                    q_dict['correct_answer_indices'] = correct_indices
                except ValueError:
                    continue
            randomized_config[str(q.id)] = {
                'options': options,
                'correct_answer_index': q_dict.get('correct_answer_index'),
                'correct_answer_indices': q_dict.get('correct_answer_indices'),
                'original_correct_answer': q.correct_answer
            }
        randomized_questions.append(q_dict)
    random.shuffle(randomized_questions)

    # Сохраняем конфигурацию в попытке
    attempt.randomized_config = randomized_config
    await session.commit()

    # Логирование собранного теста
    question_ids = [q.get('id') for q in randomized_questions]
    logger.debug(
        f"Test {test_id} started for user {user_id}, attempt_id={attempt.id}, "
        f"total_questions={len(randomized_questions)}, question_ids={question_ids}"
    )
    for q in randomized_questions:
        q_id = q.get('id')
        config = randomized_config.get(str(q_id), {})
        options = config.get('options', [])
        correct_index = config.get('correct_answer_index')
        correct_indices = config.get('correct_answer_indices')
        original_answer = config.get('original_correct_answer')
        logger.debug(
            f"Question {q_id}: randomized_options={options}, "
            f"correct_index={correct_index}, correct_indices={correct_indices}, "
            f"original_correct_answer={original_answer}"
        )

    return attempt

async def submit_test(
    session: AsyncSession,
    attempt_id: int,
    answers: Dict[int, Any],
) -> TestAttempt:
    attempt = await session.get(TestAttempt, attempt_id)
    if attempt is None or attempt.completed_at is not None:
        raise ValidationError(detail="Attempt not found or already submitted")

    test = await session.get(Test, attempt.test_id)
    if test.max_attempts is not None:
        # Проверка количества попыток
        stmt = (
            select(TestAttempt)
            .where(
                TestAttempt.user_id == attempt.user_id,
                TestAttempt.test_id == attempt.test_id,
                TestAttempt.completed_at.is_not(None)
            )
        )
        completed_attempts = (await session.execute(stmt)).scalars().all()
        logger.debug(f"Completed attempts: {len(completed_attempts)}, max attempts: {test.max_attempts}")
        if len(completed_attempts) >= test.max_attempts:
            raise HTTPException(status_code=429, detail="Превышено максимальное количество попыток. Перейдите к материалам.")

    q_stmt = select(Question).where(Question.test_id == test.id, Question.is_archived.is_(False))
    questions = {q.id: q for q in (await session.execute(q_stmt)).scalars().all()}

    correct = 0
    total_questions = len(questions)
    user_answers = {}
    randomized_config = attempt.randomized_config or {}

    for q_id, user_answer in answers.items():
        q = questions.get(int(q_id))
        if q is None:
            continue

        user_answers[q_id] = user_answer
        config = randomized_config.get(str(q_id), {})
        options = config.get('options', q.options or [])
        user_answer_text = (
            [options[i] for i in user_answer if i < len(options)] if isinstance(user_answer, list) and options
            else options[user_answer] if isinstance(user_answer, int) and user_answer < len(options)
            else user_answer
        )
        original_correct_answer = config.get('original_correct_answer', q.correct_answer)

        is_correct = False
        if q.question_type == QuestionType.MULTIPLE_CHOICE:
            correct_indices = config.get('correct_answer_indices', [])
            if isinstance(user_answer, list) and sorted(user_answer) == sorted(correct_indices):
                correct += 1
                is_correct = True
        elif q.question_type == QuestionType.SINGLE_CHOICE:
            correct_index = config.get('correct_answer_index')
            if isinstance(user_answer, int) and correct_index is not None and user_answer == correct_index:
                correct += 1
                is_correct = True
        elif q.question_type == QuestionType.OPEN_TEXT:
            if str(user_answer).strip().lower() == str(q.correct_answer).strip().lower():
                correct += 1
                is_correct = True

        logger.debug(
            f"Question {q_id}: user_answer={user_answer}, user_answer_text={user_answer_text}, "
            f"correct_index={config.get('correct_answer_index')}, "
            f"correct_indices={config.get('correct_answer_indices')}, "
            f"original_correct_answer={original_correct_answer}, is_correct={is_correct}"
        )

    score = (correct / total_questions * 100) if total_questions > 0 else 0.0
    spent = int((datetime.now() - attempt.started_at).total_seconds())

    # Преобразуем ключи в строки
    answers_str_keys = {str(k): v for k, v in user_answers.items()}
    result = await submit_test_crud(
        session=session,
        attempt_id=attempt_id,
        score=round(score, 2),
        time_spent=spent,
        answers=answers_str_keys,
    )
    logger.info(
        f"Attempt {attempt_id} submitted: score={score:.2f}%, "
        f"correct={correct}/{total_questions}, user_answers={user_answers}"
    )

    return result
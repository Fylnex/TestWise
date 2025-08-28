# TestWise/Backend/src/api/v1/tests/routes.py
# -*- coding: utf-8 -*-
"""
Маршруты FastAPI для работы с тестами.
"""
import random
from datetime import datetime
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import JSONResponse

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from src.api.v1.questions.schemas import QuestionReadSchema
from src.api.v1.tests.schemas import (
    TestReadSchema,
    TestCreateSchema,
    TestSubmitSchema,
    TestAttemptRead,
    TestStartResponseSchema, TestQuestionSchema, TestAttemptStatusResponse,
)
from src.config.logger import configure_logger
from src.database.db import get_db
from src.domain.enums import Role, QuestionType, TestType, TestAttemptStatus
from src.domain.models import Test, Question, TestAttempt
from src.repository.base import get_item, list_items
from src.repository.test import (
    create_test,
    update_test,
    delete_test,
    archive_test,
    restore_test,
    delete_test_permanently,
    list_tests,
    get_test,
    get_test_attempts,
)
from src.repository.question import delete_questions_by_test
from src.security.security import admin_or_teacher, authenticated, require_roles
from src.service.tests import submit_test, start_test
from src.service.progress import check_test_availability

router = APIRouter()
logger = configure_logger()


# ---------------------------------------------------------------------------#
# CRUD (учителя / админы)                                                    #
# ---------------------------------------------------------------------------#

@router.post(
    "",
    response_model=TestReadSchema,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(admin_or_teacher)],
)
async def create_test_endpoint(
        payload: TestCreateSchema,
        session: AsyncSession = Depends(get_db),
):
    logger.debug(f"Creating test with payload: {payload.model_dump()}")
    test = await create_test(
        session=session,
        title=payload.title,
        type=payload.type,
        duration=payload.duration,
        section_id=payload.section_id,
        topic_id=payload.topic_id,
    )
    logger.debug(f"Test created with ID: {test.id}")
    return TestReadSchema.model_validate(
        {**test.__dict__, "questions": [], "last_score": None}
    )


@router.get(
    "/{test_id}",
    response_model=TestReadSchema,
    dependencies=[Depends(authenticated)],
)
async def get_test_endpoint(
        test_id: int,
        session: AsyncSession = Depends(get_db),
):
    test = await get_item(session, Test, test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    q_stmt = select(Question).where(
        Question.test_id == test_id,
        Question.is_archived.is_(False),
        Question.correct_answer.is_not(None),
        Question.correct_answer != [],
    )
    questions = (await session.execute(q_stmt)).scalars().all()

    # Рандомизация вариантов ответов
    validated_questions = []
    for q in questions:
        q_dict = q.__dict__.copy()
        if q.options:
            options = q.options.copy()
            random.shuffle(options)
            q_dict['options'] = options
            # Удаляем информацию о правильных ответах
            q_dict.pop('correct_answer', None)
            q_dict.pop('correct_answer_index', None)
            q_dict.pop('correct_answer_indices', None)
        validated_questions.append(QuestionReadSchema.model_validate(q_dict))

    # Include max_attempts from the test object
    test_data = {
        "id": test.id,
        "topic_id": test.topic_id,
        "section_id": test.section_id,
        "title": test.title,
        "description": test.description or "",  # Обработка случая, если description отсутствует
        "type": test.type,
        "duration": test.duration,
        "questions": validated_questions,
        "created_at": test.created_at,
        "updated_at": test.updated_at,
        "is_archived": test.is_archived,
        "max_attempts": test.max_attempts,
    }

    return TestReadSchema(**test_data)


@router.put(
    "/{test_id}",
    response_model=TestReadSchema,
    dependencies=[Depends(admin_or_teacher)],
)
async def update_test_endpoint(
        test_id: int,
        payload: TestCreateSchema,
        session: AsyncSession = Depends(get_db),
):
    logger.debug(f"Updating test {test_id} with payload: {payload.model_dump()}")
    update_data = payload.model_dump(exclude_unset=True)
    logger.debug(f"Update data: {update_data}")
    updated = await update_test(session, test_id, **update_data)
    return TestReadSchema.model_validate(
        {**updated.__dict__, "questions": [], "last_score": None}
    )


@router.delete(
    "/{test_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(admin_or_teacher)],
)
async def delete_test_endpoint(
        test_id: int,
        session: AsyncSession = Depends(get_db),
):
    logger.debug(f"Archiving test with ID: {test_id}")
    # Сначала удаляем все вопросы теста
    await delete_questions_by_test(session, test_id)
    # Затем удаляем сам тест
    await delete_test(session, test_id)


# ---------------------------------------------------------------------------#
# Новый эндпоинт для списка тестов                                           #
# ---------------------------------------------------------------------------#

@router.get(
    "",
    response_model=List[TestReadSchema],
    dependencies=[Depends(authenticated)],
)
async def list_tests_endpoint(
        topic_id: Optional[int] = None,
        section_id: Optional[int] = None,
        session: AsyncSession = Depends(get_db),
        claims: dict[str, Any] = Depends(authenticated),
):
    logger.debug(f"Fetching tests with topic_id: {topic_id}, section_id: {section_id}")
    if (topic_id is None) == (section_id is None):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either topic_id or section_id must be provided (but not both)"
        )

    filters = {"is_archived": False}
    if topic_id:
        filters["topic_id"] = topic_id
    else:
        filters["section_id"] = section_id

    tests = await list_tests(session, Test, **filters)
    logger.debug(f"Retrieved {len(tests)} tests")

    user_id = claims["sub"]
    out: List[TestReadSchema] = []
    for t in tests:
        attempts = await get_test_attempts(session, user_id, t.id)
        last = max(attempts, key=lambda a: a.started_at) if attempts else None
        last_score = last.score if last else None

        out.append(TestReadSchema.model_validate({
            **t.__dict__,
            "questions": [],
            "last_score": last_score,
        }))

    return out


# ---------------------------------------------------------------------------#
# Студенческие действия                                                      #
# ---------------------------------------------------------------------------#

@router.post(
    "/{test_id}/start",
    response_model=TestStartResponseSchema,
    dependencies=[Depends(require_roles(Role.STUDENT))],
)
async def start_test_endpoint(
        test_id: int,
        target_questions: Optional[int] = Query(None, ge=1, description="Target number of questions"),
        session: AsyncSession = Depends(get_db),
        claims: dict[str, Any] = Depends(authenticated),
):
    logger.debug(f"Starting test {test_id} for user_id: {claims['sub']} with target_questions={target_questions}")
    user_id = int(claims["sub"])  # Приведение к int на всякий случай

    if not await check_test_availability(session, user_id, test_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Тест недоступен")

    test = await get_test(session, test_id, options=[joinedload(Test.questions)])
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    now = datetime.now()

    # Получаем предыдущие попытки
    stmt = (
        select(TestAttempt)
        .where(TestAttempt.user_id == user_id, TestAttempt.test_id == test_id)
        .order_by(TestAttempt.attempt_number.desc())
    )
    attempts = (await session.execute(stmt)).scalars().all()
    max_attempts = test.max_attempts or (3 if test.type in [TestType.SECTION_FINAL, TestType.GLOBAL_FINAL] else None)
    if max_attempts and len(attempts) >= max_attempts:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail=f"Превышено максимальное количество попыток ({max_attempts})")

    # Ищем активную попытку
    existing = next((a for a in attempts if a.completed_at is None), None)

    if existing:
        elapsed = (now - existing.started_at).total_seconds() / 60
        if test.duration and test.duration > 0 and elapsed > test.duration:
            # Закрываем просроченную попытку
            existing.completed_at = now
            existing.status = TestAttemptStatus.COMPLETED
            await session.commit()
            existing = None
        else:
            attempt = existing
            attempt_number = attempt.attempt_number

    # Если нет активной — создаём новую
    if existing is None:
        attempt_number = (attempts[0].attempt_number + 1) if attempts else 1
        attempt = TestAttempt(
            user_id=user_id,
            test_id=test_id,
            attempt_number=attempt_number,
            started_at=now,
            status=TestAttemptStatus.IN_PROGRESS
        )
        session.add(attempt)
        await session.commit()
        await session.refresh(attempt)

    # Выбираем и рандомизируем вопросы
    q_stmt = select(Question).where(
        Question.test_id == test_id,
        Question.is_archived.is_(False),
        Question.correct_answer.is_not(None),
        Question.correct_answer != [],
    )
    questions = (await session.execute(q_stmt)).scalars().all()
    total_questions = len(questions)

    if target_questions is None:
        target_questions = total_questions
    if total_questions < target_questions:
        logger.warning(f"Only {total_questions} questions available for test {test_id}, using all")
        target_questions = total_questions

    questions = random.sample(questions, target_questions)

    randomized_questions = []
    randomized_config = {}
    for q in questions:
        q_dict = {
            'id': q.id,
            'question': q.question,
            'question_type': q.question_type,
            'options': q.options.copy() if q.options else None,
            'hint': q.hint,
            'image': q.image
        }
        if q.options:
            options = q.options.copy()
            random.shuffle(options)
            q_dict['options'] = options

            if q.question_type == QuestionType.SINGLE_CHOICE:
                try:
                    correct_answer_str = q.correct_answer
                    if isinstance(correct_answer_str, str):
                        q_dict['correct_answer_index'] = options.index(correct_answer_str)
                except ValueError:
                    q_dict['correct_answer_index'] = None

            elif q.question_type == QuestionType.MULTIPLE_CHOICE:
                try:
                    correct_answers = q.correct_answer if isinstance(q.correct_answer, list) else [q.correct_answer]
                    q_dict['correct_answer_indices'] = [
                        options.index(ans) for ans in correct_answers if ans in options
                    ]
                except ValueError:
                    q_dict['correct_answer_indices'] = []

            randomized_config[str(q.id)] = {
                'question': q.question,
                'question_type': q.question_type,
                'options': options,
                'hint': q.hint,
                'image': q.image,
                'correct_answer_index': q_dict.get('correct_answer_index'),
                'correct_answer_indices': q_dict.get('correct_answer_indices')
            }
        else:
            randomized_config[str(q.id)] = {
                'question': q.question,
                'question_type': q.question_type,
                'hint': q.hint,
                'image': q.image,
                'correct_answer': q.correct_answer
            }
        randomized_questions.append(q_dict)

    random.shuffle(randomized_questions)

    # Сохраняем конфиг в попытке
    attempt.randomized_config = randomized_config
    await session.commit()

    logger.debug(
        f"Test {test_id} started, attempt_id={attempt.id}, "
        f"questions={len(questions)} (target={target_questions}, total={total_questions})"
    )

    return TestStartResponseSchema(
        attempt_id=attempt.id,
        test_id=test.id,
        questions=[TestQuestionSchema.model_validate(q) for q in randomized_questions],
        start_time=attempt.started_at,
        duration=test.duration,
        attempt_number=attempt.attempt_number
    )


@router.get(
    "/{test_id}/status",
    response_model=TestAttemptStatusResponse,
    dependencies=[Depends(require_roles(Role.STUDENT))],
)
async def get_test_attempt_status(
        test_id: int,
        claims: dict[str, Any] = Depends(authenticated),
        session: AsyncSession = Depends(get_db),
):
    logger.debug(f"Received request for test attempt status, test_id: {test_id}, user_id: {claims['sub']}")
    user_id = int(claims["sub"])

    # Поиск последней активной попытки
    stmt = (
        select(TestAttempt)
        .where(
            TestAttempt.test_id == test_id,
            TestAttempt.user_id == user_id,
            TestAttempt.status == TestAttemptStatus.IN_PROGRESS,
            TestAttempt.completed_at.is_(None)
        )
        .options(selectinload(TestAttempt.test))
        .order_by(TestAttempt.started_at.desc())
    )
    attempt = (await session.execute(stmt)).scalars().first()

    if not attempt:
        logger.debug(f"No active attempt found for test_id: {test_id}, user_id: {user_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active attempt found for this test"
        )

    # Проверка, не истекло ли время попытки
    test = attempt.test
    if test.duration and test.duration > 0:
        elapsed_time = (datetime.now() - attempt.started_at).total_seconds() / 60
        if elapsed_time > test.duration:
            logger.debug(f"Attempt {attempt.id} for test {test_id} has expired (elapsed: {elapsed_time} min, duration: {test.duration} min)")
            attempt.status = TestAttemptStatus.COMPLETED
            attempt.completed_at = datetime.now()
            await session.commit()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active attempt found for this test (previous attempt expired)"
            )

    # Формирование списка вопросов из randomized_config
    randomized_questions = []
    for q_id, q_config in attempt.randomized_config.items():
        question_data = {
            "id": int(q_id),
            "question": q_config.get("question"),
            "question_type": q_config.get("question_type"),
            "options": q_config.get("options"),
            "hint": q_config.get("hint"),
            "image": q_config.get("image")
        }
        randomized_questions.append(question_data)

    response = TestAttemptStatusResponse(
        attempt_id=attempt.id,
        test_id=attempt.test_id,
        status=attempt.status,
        completed_at=attempt.completed_at,
        score=attempt.score,
        questions=[TestQuestionSchema.model_validate(q) for q in randomized_questions],
        start_time=attempt.started_at,
        duration=attempt.test.duration,
        attempt_number=attempt.attempt_number
    )

    logger.debug(f"Returning attempt status for attempt_id: {attempt.id}, test_id: {test_id}")
    return response



@router.post(
    "/{test_id}/submit",
    response_model=TestAttemptRead,
    dependencies=[Depends(require_roles(Role.STUDENT))],
)
async def submit_test_endpoint(
        test_id: int,
        payload: TestSubmitSchema,
        session: AsyncSession = Depends(get_db),
        claims: dict[str, Any] = Depends(authenticated),
):
    logger.debug(f"Submitting test {test_id} for user_id: {claims['sub']} with payload: {payload.model_dump()}")
    if not payload.answers:
        logger.warning(f"No answers provided for test {test_id}, attempt {payload.attempt_id}")
        attempt = await submit_test(session, payload.attempt_id, {})
        return TestAttemptRead(
            **attempt.__dict__,
            correctCount=0,
            totalQuestions=0,
        )

    for a in payload.answers:
        q = await get_item(session, Question, a["question_id"])
        if q is None or q.test_id != test_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Неверный вопрос для данного теста")

    if not payload.attempt_id:
        raise HTTPException(status_code=422, detail="Attempt ID is required")
    if not payload.time_spent:
        payload.time_spent = 0  # Дефолтное значение

    attempt = await submit_test(
        session=session,
        attempt_id=payload.attempt_id,
        answers={a["question_id"]: a["answer"] for a in payload.answers},
    )
    total_questions = len(payload.answers)
    correct_count = int(attempt.score / 100 * total_questions) if attempt.score else 0

    # Логирование с текстовым представлением ответов
    for a in payload.answers:
        q = await get_item(session, Question, a["question_id"])
        user_answer = a["answer"]
        user_answer_text = (
            [q.options[i] for i in user_answer if i < len(q.options)] if isinstance(user_answer, list) and q.options
            else q.options[user_answer] if isinstance(user_answer, int) and user_answer < len(q.options)
            else user_answer
        )
        logger.debug(
            f"Question {a['question_id']}: user_answer={user_answer}, "
            f"user_answer_text={user_answer_text}, correct_answer={q.correct_answer}"
        )
    logger.debug(f"Test {test_id} submitted, score: {attempt.score}, correct: {correct_count}/{total_questions}")

    return TestAttemptRead(
        id=attempt.id,
        user_id=attempt.user_id,
        test_id=attempt.test_id,
        attempt_number=attempt.attempt_number,
        score=attempt.score,
        time_spent=attempt.time_spent,
        answers=None,
        started_at=attempt.started_at,
        completed_at=attempt.completed_at,
        status=attempt.status,
        correctCount=correct_count,
        totalQuestions=total_questions,
    )


# ---------------------------------------------------------------------------#
# Archive / Restore / Permanent Delete                                       #
# ---------------------------------------------------------------------------#

@router.post(
    "/{test_id}/archive",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(admin_or_teacher)],
)
async def archive_test_endpoint(
        test_id: int,
        session: AsyncSession = Depends(get_db),
):
    logger.debug(f"Archiving test with ID: {test_id}")
    await archive_test(session, test_id)


@router.post(
    "/{test_id}/restore",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(admin_or_teacher)],
)
async def restore_test_endpoint(
        test_id: int,
        session: AsyncSession = Depends(get_db),
):
    logger.debug(f"Restoring test with ID: {test_id}")
    await restore_test(session, test_id)


@router.delete(
    "/{test_id}/permanent",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(admin_or_teacher)],
)
async def delete_test_permanently_endpoint(
        test_id: int,
        session: AsyncSession = Depends(get_db),
):
    logger.debug(f"Permanently deleting test with ID: {test_id}")
    await delete_test_permanently(session, test_id)

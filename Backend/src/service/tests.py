# -*- coding: utf-8 -*-
"""
TestWise/Backend/src/service/tests.py
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Dynamic test generation & attempt lifecycle helpers.

This module focuses on **assembling** tests (as rows in the *tests* table)
from available questions and delegating persistence of attempts to
``repository``.  Scoring is extremely simple (percentage of correct answers)
but is easy to replace with something more sophisticated later.
"""

from __future__ import annotations

import random
from datetime import datetime
from typing import Any, Dict, List

from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger import configure_logger
from src.domain.models import (
    Question,
    QuestionType,
    Section,
    Test,
    TestAttempt,
    TestType,
    Topic,
)
from src.repository.test import (
    create_test,
    create_test_attempt,
    submit_test as submit_test_crud,
)
from src.service.progress import check_test_availability
from src.utils.exceptions import NotFoundError, ValidationError

logger = configure_logger()


# ---------------------------------------------------------------------------
# Question helpers
# ---------------------------------------------------------------------------

async def _fetch_questions(
        session: AsyncSession, stmt: Select, limit: int | None = None
) -> List[Question]:
    """Fetch a list of questions based on the provided statement."""
    if limit is not None:
        stmt = stmt.limit(limit)
    res = await session.execute(stmt)
    return list(res.scalars().all())


async def _random_sample_questions(
        questions: List[Question], num: int | None = None
) -> List[int]:
    """Randomly sample question IDs from the given list."""
    if num is None or num >= len(questions):
        return [q.id for q in questions]
    return [q.id for q in random.sample(questions, num)]


# ---------------------------------------------------------------------------
# Test generators
# ---------------------------------------------------------------------------

async def generate_hinted_test(
        session: AsyncSession,
        section_id: int,
        num_questions: int = 10,
        duration: int | None = 15,
        title: str | None = None,
) -> Test:
    """Create or return a *hinted* test for a section."""
    section: Section | None = await session.get(Section, section_id)
    if section is None:
        raise NotFoundError(resource_type="Section", resource_id=section_id)

    stmt = select(Question).where(Question.section_id == section_id, Question.is_final.is_(False))
    questions = await _fetch_questions(session, stmt)
    if not questions:
        raise ValidationError(detail="Section contains no suitable questions")

    question_ids = await _random_sample_questions(questions, num_questions)

    test = await create_test(
        session,
        title or f"Hinted Quiz: {section.title}",
        TestType.HINTED,
        section_id=section_id,
        duration=duration,
        question_ids=question_ids,
    )
    logger.info("Generated hinted test %s with %s Qs", test.id, len(question_ids))
    return test


async def generate_section_final_test(
        session: AsyncSession,
        section_id: int,
        num_questions: int | None = None,
        duration: int | None = 20,
        title: str | None = None,
) -> Test:
    """Create a *section_final* test consisting of questions marked ``is_final``."""
    section: Section | None = await session.get(Section, section_id)
    if section is None:
        raise NotFoundError(resource_type="Section", resource_id=section_id)

    stmt = select(Question).where(Question.section_id == section_id, Question.is_final.is_(True))
    questions = await _fetch_questions(session, stmt)
    if not questions:
        raise ValidationError(detail="Section has no final questions")

    question_ids = await _random_sample_questions(questions, num_questions)

    test = await create_test(
        session,
        title or f"Final Test: {section.title}",
        TestType.SECTION_FINAL,
        section_id=section_id,
        duration=duration,
        question_ids=question_ids,
    )
    logger.info("Generated section-final test %s with %s Qs", test.id, len(question_ids))
    return test


async def generate_global_final_test(
        session: AsyncSession,
        topic_id: int,
        num_questions: int = 30,
        duration: int | None = 40,
        title: str | None = None,
) -> Test:
    """Create a *global_final* test across all sections of a topic."""
    topic: Topic | None = await session.get(Topic, topic_id)
    if topic is None:
        raise NotFoundError(resource_type="Topic", resource_id=topic_id)

    stmt = select(Question).join(Section).where(
        Section.topic_id == topic_id, Question.is_final.is_(True)
    )
    questions = await _fetch_questions(session, stmt)
    if not questions:
        raise ValidationError(detail="Topic has no final questions")

    question_ids = await _random_sample_questions(questions, num_questions)

    test = await create_test(
        session,
        title or f"Global Final: {topic.title}",
        TestType.GLOBAL_FINAL,
        topic_id=topic_id,
        duration=duration,
        question_ids=question_ids,
    )
    logger.info("Generated global-final test %s with %s Qs", test.id, len(question_ids))
    return test


# ---------------------------------------------------------------------------
# Attempt lifecycle wrappers (delegates to crud)
# ---------------------------------------------------------------------------

async def start_test(session: AsyncSession, user_id: int, test_id: int) -> TestAttempt:
    """Begin a test attempt after availability check."""
    if not await check_test_availability(session, user_id, test_id):
        raise ValidationError(detail="Test not yet available")
    return await create_test_attempt(session, user_id, test_id)


async def submit_test(
        session: AsyncSession,
        attempt_id: int,
        answers: Dict[int, Any],  # question_id -> raw answer
) -> TestAttempt:
    """Score answers, finalise attempt, and persist via CRUD layer."""
    attempt: TestAttempt | None = await session.get(TestAttempt, attempt_id)
    if attempt is None:
        raise NotFoundError(resource_type="TestAttempt", resource_id=attempt_id)
    if attempt.completed_at is not None:
        raise ValidationError(detail="Attempt already submitted")

    test: Test | None = await session.get(Test, attempt.test_id)
    if test is None:
        raise NotFoundError(resource_type="Test", resource_id=attempt.test_id)

    # Pull question set
    stmt = select(Question).where(Question.id.in_(test.question_ids))
    res = await session.execute(stmt)
    questions = {q.id: q for q in res.scalars().all()}

    # Simple scoring: +1 for each correct
    correct_count = 0
    for q_id, q in questions.items():
        user_answer = answers.get(q_id)
        if user_answer is None:
            continue
        if q.question_type in {QuestionType.SINGLE_CHOICE, QuestionType.OPEN_TEXT}:
            if user_answer == q.correct_answer:
                correct_count += 1
        elif q.question_type == QuestionType.MULTIPLE_CHOICE:
            # Treat as unordered list equality
            if sorted(user_answer) == sorted(q.correct_answer or []):
                correct_count += 1

    score_percentage = (correct_count / len(questions)) * 100.0 if questions else 0.0
    time_spent = int((datetime.now() - attempt.started_at).total_seconds())

    attempt = await submit_test_crud(
        session=session,
        attempt_id=attempt_id,
        score=round(score_percentage, 2),
        time_spent=time_spent,
        answers=answers,
    )
    logger.info(
        f"Attempt {attempt_id} submitted: {correct_count}/{len(questions)} correct ({score_percentage:.2f}%)")

    return attempt

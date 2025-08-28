# -*- coding: utf-8 -*-
"""
TestWise/Backend/src/repository/question.py
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Repository for Question entity management.

This module provides data access operations specific to the Question model.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.logger import configure_logger
from src.domain.models import Question, QuestionType, Test, Section
from src.repository.base import create_item, get_item, update_item
from src.utils.exceptions import NotFoundError, ValidationError

logger = configure_logger()

# ---------------------------------------------------------------------------
# Questions & Tests
# ---------------------------------------------------------------------------

async def create_question(
    session: AsyncSession,
    test_id: int,
    question: str,
    question_type: QuestionType,
    options: list | None = None,
    correct_answer: any | None = None,
    hint: str | None = None,
    is_final: bool = False,
    image: str | None = None,
) -> Question:
    # Проверяем, что тест существует и не архивирован
    await get_item(session, Test, test_id)
    return await create_item(
        session,
        Question,
        test_id=test_id,
        question=question,
        question_type=question_type,
        options=options,
        correct_answer=correct_answer,
        hint=hint,
        is_final=is_final,
        image=image,
    )

async def update_question(
    session: AsyncSession,
    question_id: int,
    **kwargs: Any,  # noqa: ANN401
) -> Question:
    """Update an existing question, excluding immutable fields."""
    kwargs.pop("id", None)
    return await update_item(session, Question, question_id, **kwargs)

async def delete_question(session: AsyncSession, question_id: int) -> None:
    """Archive a question by setting is_archived=True."""
    question = await get_item(session, Question, question_id)
    if question.is_archived:
        raise NotFoundError(resource_type="Question", resource_id=question_id, details="Already archived")
    question.is_archived = True
    await session.commit()
    logger.info(f"Archived question {question_id}")

async def delete_questions_by_test(session: AsyncSession, test_id: int) -> None:
    """Archive all questions for a specific test."""
    stmt = select(Question).where(Question.test_id == test_id, Question.is_archived == False)
    questions = (await session.execute(stmt)).scalars().all()
    
    for question in questions:
        question.is_archived = True
    
    await session.commit()
    logger.info(f"Archived {len(questions)} questions for test {test_id}")
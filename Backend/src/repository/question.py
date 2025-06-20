# -*- coding: utf-8 -*-
"""
TestWise/Backend/src/repository/question.py
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Repository for Question entity management.

This module provides data access operations specific to the Question model.
"""

from __future__ import annotations

from typing import Any

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
    section_id: int,
    question: str,
    question_type: QuestionType,
    options: list[str] | None = None,
    correct_answer: Any | None = None,  # noqa: ANN401
    hint: str | None = None,
    is_final: bool = False,
    image: str | None = None,
    test_id: int | None = None,
) -> Question:
    """Create a new question with validation for choice types."""
    await get_item(session, Section, section_id)
    if test_id is not None:
        await get_item(session, Test, test_id)
    if question_type in {QuestionType.SINGLE_CHOICE, QuestionType.MULTIPLE_CHOICE} and (
        not options or len(options) < 2
    ):
        raise ValidationError(detail="Choice questions must include at least two options")
    return await create_item(
        session,
        Question,
        section_id=section_id,
        question=question,
        question_type=question_type,
        options=options,
        correct_answer=correct_answer,
        hint=hint,
        is_final=is_final,
        image=image,
        test_id=test_id,
    )

async def update_question(
    session: AsyncSession,
    question_id: int,
    **kwargs: Any,  # noqa: ANN401
) -> Question:
    """Update an existing question, excluding immutable fields."""
    kwargs.pop("id", None)
    return await update_item(session, Question, question_id, **kwargs)
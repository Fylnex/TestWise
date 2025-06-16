# TestWise/Backend/src/core/tests.py
# -*- coding: utf-8 -*-
"""
This module handles test-related logic for the TestWise application.
It provides functionality for dynamically generating tests based on test type and control question percentage.
"""

import random

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.logger import configure_logger
from src.database.models import Section, Question, TestType
from src.utils.exceptions import NotFoundError, ValidationError

logger = configure_logger()


async def generate_test_questions(session: AsyncSession, section_id: int, num_questions: int) -> list[Question]:
    """
    Generates a list of questions for a test based on section ID and test type.

    Args:
        session (AsyncSession): Database session.
        section_id (int): ID of the section (test).
        num_questions (int): Number of questions to generate.

    Returns:
        list[Question]: List of randomly selected questions.

    Exceptions:
        - NotFoundError: If the section is not found.
        - ValidationError: If insufficient questions are available.
    """
    section = await session.get(Section, section_id)
    if not section or not section.is_test:
        raise NotFoundError(resource_type="Section", resource_id=section_id)

    if section.test_type == TestType.HINTS:
        # Only non-control questions for hints test
        stmt = select(Question).where(
            Question.section_id == section_id,
            Question.is_control == False
        )
    else:
        # Mix of control and non-control questions for final test
        control_percentage = section.control_questions_percentage or 0
        num_control = int(num_questions * (control_percentage / 100))
        num_regular = num_questions - num_control

        # Check available questions
        regular_count = await session.scalar(
            select(func.count()).select_from(Question).where(
                Question.section_id == section_id,
                Question.is_control == False
            )
        )
        control_count = await session.scalar(
            select(func.count()).select_from(Question).where(
                Question.section_id == section_id,
                Question.is_control == True
            )
        )

        if regular_count < num_regular or control_count < num_control:
            raise ValidationError(
                detail=f"Insufficient questions: need {num_regular} regular and {num_control} control, "
                       f"but only {regular_count} regular and {control_count} control available"
            )

        # Fetch regular questions
        regular_stmt = select(Question).where(
            Question.section_id == section_id,
            Question.is_control == False
        ).limit(num_regular)
        regular_questions = (await session.execute(regular_stmt)).scalars().all()

        # Fetch control questions
        control_stmt = select(Question).where(
            Question.section_id == section_id,
            Question.is_control == True
        ).limit(num_control)
        control_questions = (await session.execute(control_stmt)).scalars().all()

        questions = regular_questions + control_questions
        random.shuffle(questions)
        return questions

    # Fetch questions for hints test
    result = await session.execute(stmt.limit(num_questions))
    questions = result.scalars().all()

    if len(questions) < num_questions:
        raise ValidationError(
            detail=f"Insufficient questions: need {num_questions}, but only {len(questions)} available"
        )

    random.shuffle(questions)
    logger.info(f"Generated {len(questions)} questions for section {section_id}")
    return questions

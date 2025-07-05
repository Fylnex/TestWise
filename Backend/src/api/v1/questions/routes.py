# TestWise/Backend/src/api/v1/questions/routes.py
# -*- coding: utf-8 -*-
"""
Этот модуль определяет маршруты FastAPI для эндпоинтов, связанных с вопросами.
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status

from src.config.logger import configure_logger
from src.database.db import get_db
from src.domain.enums import Role
from src.domain.models import Question
from src.repository.base import (
    get_item,
    update_item,
    archive_item,
    delete_item_permanently,
    list_items,
)
from src.repository.question import create_question
from src.security.security import require_roles, authenticated
from .schemas import (
    QuestionCreateSchema,
    QuestionReadSchema,
    QuestionUpdateSchema,
)

router = APIRouter()
logger = configure_logger()


@router.post(
    "",
    response_model=QuestionReadSchema,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(Role.ADMIN, Role.TEACHER))],
)
async def create_question_endpoint(
    question_data: QuestionCreateSchema,
    session: AsyncSession = Depends(get_db),
):
    """
    Создаёт новый вопрос.

    - **test_id**: ID теста, которому принадлежит вопрос.
    - **question**: текст вопроса.
    - **question_type**: тип вопроса.
    - **options**: список вариантов (for multiple_choice).
    - **correct_answer**: правильный ответ.
    - **hint**: подсказка.
    - **is_final**: признак итогового вопроса.
    - **image**: URL изображения.
    """
    question = await create_question(
        session=session,
        test_id=question_data.test_id,
        question=question_data.question,
        question_type=question_data.question_type,
        options=question_data.options,
        correct_answer=question_data.correct_answer,
        hint=question_data.hint,
        is_final=question_data.is_final,
        image=question_data.image,
    )
    return question


@router.get(
    "",
    response_model=List[QuestionReadSchema],
    dependencies=[Depends(authenticated)],
)
async def list_questions_endpoint(
    test_id: Optional[int] = None,
    session: AsyncSession = Depends(get_db),
):
    """
    Возвращает список вопросов для теста.

    - **test_id**: обязательный query-параметр.
    """
    if test_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Параметр test_id обязателен",
        )
    questions = await list_items(
        session,
        Question,
        is_archived=False,
        test_id=test_id,
    )
    return [QuestionReadSchema.model_validate(q) for q in questions]


@router.post(
    "/{test_id}/questions",
    response_model=List[QuestionReadSchema],
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(Role.ADMIN, Role.TEACHER))],
)
async def add_questions_to_test(
        test_id: int,
        questions: List[QuestionCreateSchema],
        session: AsyncSession = Depends(get_db),
):
    """
    Пакетное добавление нескольких вопросов к указанному тесту.

    - **test_id**: путь; ID теста.
    - **body**: список объектов QuestionCreateSchema.
    """
    created = []
    for q in questions:
        data = q.model_dump()
        created.append(
            await create_question(
                session=session,
                section_id=data["section_id"],
                test_id=test_id,
                question=data["question"],
                question_type=data["question_type"],
                options=data.get("options"),
                correct_answer=data.get("correct_answer"),
                hint=data.get("hint"),
                is_final=data.get("is_final", False),
                image=data.get("image"),
            )
        )
    return created


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
    Получает один вопрос по его ID.

    - **question_id**: путь; ID вопроса.
    """
    return await get_item(
        session,
        Question,
        question_id,
        is_archived=False,
    )


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
    Обновляет поля существующего вопроса.

    - **question_id**: путь; ID вопроса.
    - **body**: QuestionUpdateSchema с изменёнными полями.
    """
    update_data = question_data.model_dump(exclude_unset=True)
    return await update_item(
        session,
        Question,
        question_id,
        **update_data,
    )


@router.delete(
    "/{question_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles(Role.ADMIN, Role.TEACHER))],
)
async def delete_question_endpoint(
    question_id: int,
    session: AsyncSession = Depends(get_db),
):
    """
    Архивирует вопрос (логическое удаление).

    - **question_id**: путь; ID вопроса.
    """
    await archive_item(session, Question, question_id)


@router.post(
    "/{question_id}/archive",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles(Role.ADMIN, Role.TEACHER))],
)
async def archive_question_endpoint(
    question_id: int,
    session: AsyncSession = Depends(get_db),
):
    """
    Архивирует вопрос (повторно, если нужно).

    - **question_id**: путь; ID вопроса.
    """
    await archive_item(session, Question, question_id)


@router.post(
    "/{question_id}/restore",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_roles(Role.ADMIN, Role.TEACHER))],
)
async def restore_question_endpoint(
    question_id: int,
    session: AsyncSession = Depends(get_db),
):
    """
    Восстанавливает ранее архивированный вопрос.

    - **question_id**: путь; ID вопроса.
    """
    question = await get_item(
        session,
        Question,
        question_id,
        is_archived=True,
    )
    question.is_archived = False
    await session.commit()
    return {"detail": "Вопрос восстановлен"}


@router.delete(
    "/{question_id}/permanent",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles(Role.ADMIN, Role.TEACHER))],
)
async def delete_question_permanently_endpoint(
    question_id: int,
    session: AsyncSession = Depends(get_db),
):
    """
    Окончательно удаляет вопрос из базы.

    - **question_id**: путь; ID вопроса.
    """
    await delete_item_permanently(session, Question, question_id)

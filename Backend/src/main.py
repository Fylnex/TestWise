# TestWise/Backend/src/main.py
# -*- coding: utf-8 -*-
"""
Точка входа FastAPI-приложения TestWise.
"""

from fastapi import FastAPI

from src.api.v1.auth import router as auth_router
from src.api.v1.groups import router as groups_router
from src.api.v1.progress import router as progress_router
from src.api.v1.questions import router as questions_router
from src.api.v1.sections import router as sections_router
from src.api.v1.subsections import router as subsections_router  # ← новое
from src.api.v1.tests import router as tests_router
from src.api.v1.topics import router as topics_router
from src.api.v1.users import router as users_router
from src.api.v1.profile import router as profile_router          # ← новое

from src.core.logger import configure_logger
from src.database.db import init_db

app = FastAPI(
    title="TestWise API",
    description="API для образовательной платформы TestWise",
    version="0.1.0",
)

logger = configure_logger()

# Подключаем роутеры
app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(users_router, prefix="/api/v1/users", tags=["users"])
app.include_router(groups_router, prefix="/api/v1/groups", tags=["groups"])
app.include_router(topics_router, prefix="/api/v1/topics", tags=["topics"])
app.include_router(sections_router, prefix="/api/v1/sections", tags=["sections"])
app.include_router(subsections_router, prefix="/api/v1/subsections", tags=["subsections"])  # ← новое
app.include_router(questions_router, prefix="/api/v1/questions", tags=["questions"])
app.include_router(progress_router, prefix="/api/v1/progress", tags=["progress"])
app.include_router(profile_router, prefix="/api/v1/profile", tags=["profile"])             # ← новое
app.include_router(tests_router, prefix="/api/v1/tests", tags=["tests"])


@app.on_event("startup")
async def startup_event():
    """
    Инициализация приложения:
    * Создание таблиц БД.
    * Логирование запуска.
    """
    logger.info("Запуск TestWise API")
    await init_db()
    logger.info("База данных инициализирована")


@app.get("/")
async def root():
    """Проверка живости приложения."""
    return {"message": "TestWise API работает"}

# TestWise/Backend/src/utils/backup.py
# -*- coding: utf-8 -*-
"""
Этот модуль содержит функции для создания и восстановления бэкапов базы данных.
"""

import aiofiles
import os
import shutil
from datetime import datetime
from src.core.logger import configure_logger
from pathlib import Path

logger = configure_logger()

async def create_backup(db_path: str = "database.sqlite", backup_dir: str = "backups") -> str:
    """
    Создает бэкап базы данных SQLite.

    Аргументы:
        db_path (str): Путь к текущей базе данных.
        backup_dir (str): Директория для хранения бэкапов.

    Возвращает:
        str: Путь к созданному бэкап-файлу.

    Исключения:
        - FileNotFoundError: Если база данных не найдена.
        - OSError: Если не удалось создать бэкап.
    """
    if not os.path.exists(db_path):
        logger.error(f"База данных {db_path} не найдена")
        raise FileNotFoundError(f"База данных {db_path} не найдена")

    os.makedirs(backup_dir, exist_ok=True)
    timestamp = datetime.utcnow().strftime("%Y-%m-%d_%H-%M-%S")
    backup_path = os.path.join(backup_dir, f"backup_{timestamp}.sqlite")

    try:
        shutil.copy(db_path, backup_path)
        logger.info(f"Бэкап создан: {backup_path}")
        return backup_path
    except OSError as e:
        logger.error(f"Ошибка при создании бэкапа: {str(e)}")
        raise OSError(f"Не удалось создать бэкап: {str(e)}")

async def restore_backup(backup_path: str, db_path: str = "database.sqlite") -> None:
    """
    Восстанавливает базу данных из бэкапа.

    Аргументы:
        backup_path (str): Путь к файлу бэкапа.
        db_path (str): Путь к текущей базе данных.

    Исключения:
        - FileNotFoundError: Если файл бэкапа не найден.
        - OSError: Если не удалось восстановить бэкап.
    """
    if not os.path.exists(backup_path):
        logger.error(f"Файл бэкапа {backup_path} не найден")
        raise FileNotFoundError(f"Файл бэкапа {backup_path} не найден")

    # Проверяем, является ли файл SQLite-базой
    try:
        with open(backup_path, "rb") as f:
            header = f.read(16).decode("utf-8")
            if not header.startswith("SQLite format 3"):
                logger.error(f"Файл {backup_path} не является SQLite-базой")
                raise OSError(f"Файл {backup_path} не является SQLite-базой")
    except Exception as e:
        logger.error(f"Ошибка проверки файла бэкапа: {str(e)}")
        raise OSError(f"Невалидный файл бэкапа: {str(e)}")

    # Создаем бэкап текущей БД перед восстановлением
    try:
        if os.path.exists(db_path):
            await create_backup(db_path, "backups")
    except Exception as e:
        logger.error(f"Ошибка при создании бэкапа текущей БД: {str(e)}")
        raise OSError(f"Не удалось создать бэкап текущей БД: {str(e)}")

    # Восстанавливаем бэкап
    try:
        shutil.copy(backup_path, db_path)
        logger.info(f"База данных восстановлена из {backup_path}")
    except OSError as e:
        logger.error(f"Ошибка при восстановлении бэкапа: {str(e)}")
        raise OSError(f"Не удалось восстановить бэкап: {str(e)}")
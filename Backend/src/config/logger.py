# -*- coding: utf-8 -*-
"""
TestWise/Backend/src/config/logger.py
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Setting up logging configuration with Loguru.

This module configures a logger with file and console output, including custom
formatting, rotation, and color schemes for different log levels.
"""

from pathlib import Path
from loguru import logger
from .settings import settings

def configure_logger(prefix: str = "TESTWISE") -> logger:
    """
    Configures the Loguru logger with a specific prefix and color.

    Args:
        prefix (str): The prefix to include in log messages (default: "TESTWISE").

    Returns:
        logger: Configured Loguru logger instance.

    Exceptions:
        - IOError: If the log file cannot be created or written to.
    """
    # Remove default handlers
    logger.remove()

    # Ensure log directory exists
    log_path = Path(settings.log_dir)
    log_path.mkdir(parents=True, exist_ok=True)

    # Add file handler
    logger.add(
        log_path / settings.log_file,
        level="DEBUG",
        format=(
            "<green>{{time:YYYY-MM-DD HH:mm:ss.SSS}}</green> | "
            "<b>{level:<8}</b> | "
            "<cyan>{name}:{function}:{line}</cyan> | "
            f"{prefix} <b>{{message}}</b>"
        ),
        rotation="10 MB",
        retention="30 days",
        compression="zip"
    )

    # Add console handler with level-specific colors
    logger.add(
        sink=lambda msg: print(msg, end=""),
        level="DEBUG",
        format=(
            "<green>{{time:YYYY-MM-DD HH:mm:ss.SSS}}</green> | "
            "<level>{level:<8}</level> | "
            "<cyan>{name}:{function}:{line}</cyan> | "
            f"{prefix} <b>{{message}}</b>"
        ),
        colorize=True,  # Enabling color support
    )

    # Setting colors for log levels
    logger.level("DEBUG", color="<blue>")
    logger.level("INFO", color="<green>")
    logger.level("WARNING", color="<yellow>")
    logger.level("ERROR", color="<red>")
    logger.level("CRITICAL", color="<magenta>")

    return logger
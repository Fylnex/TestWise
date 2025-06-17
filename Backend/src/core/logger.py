# -*- coding: utf-8 -*-
"""
This module configures the Loguru logger for the TestWise application.
It sets up logging to a file with a custom format including timestamp, level, and prefix.
"""

from pathlib import Path
from loguru import logger
from src.core.config import settings

def configure_logger(prefix: str = "TESTWISE", color: str = "green") -> logger:
    """
    Configures the Loguru logger with a specific prefix and color.

    Args:
        prefix (str): The prefix to include in log messages (default: "TESTWISE").
        color (str): The color for the timestamp in logs (default: "green").

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
            f"<{color}>{{time:YYYY-MM-DD HH:mm:ss.SSS}}</{color}> | "
            "<b>{level:<8}</b> | "
            "<cyan>{name}:{function}:{line}</cyan> | "
            f"{prefix} <b>{{message}}</b>"
        ),
        rotation="10 MB",
        retention="30 days",
        compression="zip"
    )

    return logger
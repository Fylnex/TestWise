# TestWise/Backend/src/core/security.py
# -*- coding: utf-8 -*-
"""core.security
~~~~~~~~~~~~~~~~
JWT helpers and role‑based access checks.

Key points
==========
* Uses *python‑jose* for compact JWS handling.
* Export **create_access_token**, **verify_token**, and **require_roles**
  (a FastAPI dependency factory).
* Teachers can now manage group membership (`GroupStudents`) so they have the
  same rights as admins for that sub‑API.  The dependency is granular — you
  pass the *minimal* set of roles accepted for a given route.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from functools import wraps
from typing import Callable, List, Sequence

from fastapi import Depends, HTTPException, Request, status
from jose import JWTError, jwt


from src.config.logger import configure_logger
from src.config.settings import settings
from src.domain.enums import Role

logger = configure_logger()

# ---------------------------------------------------------------------------
# JWT helpers
# ---------------------------------------------------------------------------

# Отдельные секреты для access и refresh токенов
ACCESS_TOKEN_SECRET = settings.jwt_secret
REFRESH_TOKEN_SECRET = settings.jwt_secret + "_refresh"

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now() + (
        expires_delta
        if expires_delta is not None
        else timedelta(minutes=settings.access_token_expire_minutes)
    )
    to_encode.update({"exp": expire, "token_type": "access"})
    if "sub" in to_encode and not isinstance(to_encode["sub"], str):
        to_encode["sub"] = str(to_encode["sub"])
    encoded_jwt = jwt.encode(to_encode, ACCESS_TOKEN_SECRET, algorithm=settings.jwt_algorithm)
    return encoded_jwt

def create_refresh_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now() + (
        expires_delta
        if expires_delta is not None
        else timedelta(days=7)  # Refresh Token действует 7 дней
    )
    to_encode.update({"exp": expire, "token_type": "refresh"})
    if "sub" in to_encode and not isinstance(to_encode["sub"], str):
        to_encode["sub"] = str(to_encode["sub"])
    encoded_jwt = jwt.encode(to_encode, REFRESH_TOKEN_SECRET, algorithm=settings.jwt_algorithm)
    return encoded_jwt

def verify_token(token: str, expected_type: str = "access") -> dict:
    secret = ACCESS_TOKEN_SECRET if expected_type == "access" else REFRESH_TOKEN_SECRET
    try:
        payload = jwt.decode(token, secret, algorithms=[settings.jwt_algorithm])
        logger.debug(f"Decoded payload: {payload}")
        token_type = payload.get("token_type")
        if token_type != expected_type:
            logger.debug(f"Token type mismatch. Expected {expected_type}, got {token_type}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token type. Expected {expected_type}, got {token_type}",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return payload
    except JWTError as exc:
        logger.error(f"JWT verification failed: {str(exc)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

# ---------------------------------------------------------------------------
# Role‑based guard
# ---------------------------------------------------------------------------

def _extract_token(request: Request) -> str:
    auth: str | None = request.headers.get("Authorization")
    logger.debug(f"Extracted Authorization header: {auth}")  # Включаем отладку
    if not auth or not auth.startswith("Bearer "):
        logger.debug(f"Authorization header missing or invalid: {auth}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = auth.split(" ", 1)[1]
    logger.debug(f"Extracted token: {token[:20]}...")
    return token

def require_roles(*allowed_roles: Role) -> Callable[[Request], dict]:
    allowed: set[Role] = set(allowed_roles)

    async def checker(request: Request) -> dict:
        logger.debug(f"Checking roles for path: {request.url.path}")
        logger.debug(f"Allowed roles: {allowed}")
        token = _extract_token(request)
        logger.debug(f"Extracted token: {token[:20]}...")  # Логируем начало токена
        payload = verify_token(token, "access")
        logger.debug(f"Decoded payload: {payload}")
        try:
            role = Role(payload["role"])
            logger.debug(f"User role: {role}")
            logger.debug(f"Role type: {type(role)}")
            logger.debug(f"Role value: {role.value if hasattr(role, 'value') else role}")
        except (KeyError, ValueError) as exc:
            logger.error(f"Invalid role in payload: {payload}", exc_info=True)
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload") from exc

        if role not in allowed:
            logger.debug(f"Role {role} not in allowed roles: {allowed}")
            logger.debug(f"User ID: {payload.get('sub')}, Role: {role}, Path: {request.url.path}")
            logger.debug(f"Allowed roles for this endpoint: {allowed}")
            logger.debug(f"Role comparison: {role} in {allowed} = {role in allowed}")
            logger.debug(f"Role types: {type(role)} vs {[type(r) for r in allowed]}")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        logger.debug(f"Role {role} authorized for path: {request.url.path}")
        logger.debug(f"User ID: {payload.get('sub')}, Role: {role}, Path: {request.url.path}")
        return payload

    return checker

# Convenience presets --------------------------------------------------------

admin_only = require_roles(Role.ADMIN)

authenticated = require_roles(Role.ADMIN, Role.TEACHER, Role.STUDENT)

admin_or_teacher = require_roles(Role.ADMIN, Role.TEACHER)

# Добавляем отладочную информацию для admin_or_teacher
async def debug_admin_or_teacher(request: Request) -> dict:
    logger.debug(f"admin_or_teacher dependency called for path: {request.url.path}")
    logger.debug(f"Role.ADMIN: {Role.ADMIN}")
    logger.debug(f"Role.TEACHER: {Role.TEACHER}")
    result = await require_roles(Role.ADMIN, Role.TEACHER)(request)
    logger.debug(f"admin_or_teacher dependency result: {result}")
    return result

# Добавляем отладочную информацию для admin_or_teacher
async def debug_admin_or_teacher(request: Request) -> dict:
    logger.debug(f"admin_or_teacher dependency called for path: {request.url.path}")
    result = await require_roles(Role.ADMIN, Role.TEACHER)(request)
    logger.debug(f"admin_or_teacher dependency result: {result}")
    return result
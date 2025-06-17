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

from src.core.config import settings  # type: ignore
from src.database.models import Role


# ---------------------------------------------------------------------------
# JWT helpers
# ---------------------------------------------------------------------------


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:  # noqa:ANN401
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta
        if expires_delta is not None
        else timedelta(minutes=settings.access_token_expire_minutes)
    )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return encoded_jwt


def verify_token(token: str) -> dict:  # noqa:ANN401
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
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
    if not auth or not auth.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return auth.split(" ", 1)[1]


def require_roles(*allowed_roles: Role) -> Callable[[Request], dict]:
    """FastAPI dependency factory enforcing that the JWT contains one of roles."""

    # Fast‑path: convert list->set once
    allowed: set[Role] = set(allowed_roles)

    async def checker(request: Request) -> dict:  # noqa:ANN401
        token = _extract_token(request)
        payload = verify_token(token)
        try:
            role = Role(payload["role"])
        except (KeyError, ValueError) as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload") from exc

        if role not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return payload

    return checker


# Convenience presets --------------------------------------------------------


admin_only = require_roles(Role.ADMIN)

authenticated = require_roles(Role.ADMIN, Role.TEACHER, Role.STUDENT)

# Teachers can create + manage group membership just like admins for that
# sub‑API (covered in routes/group).  Use where appropriate:
admin_or_teacher = require_roles(Role.ADMIN, Role.TEACHER)

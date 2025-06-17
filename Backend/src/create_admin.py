import asyncio
from datetime import datetime

from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from sqlalchemy.ext.declarative import declarative_base

from src.core.config import settings
from src.database.models import User, Role, Base

# Настройка хеширования пароля
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Хеширует пароль с использованием bcrypt."""
    return pwd_context.hash(password)

async def create_admin_user():
    """Создает пользователя admin с паролем 12345."""
    # Настройка подключения к базе данных
    engine = create_async_engine(settings.database_url, echo=False)

    # Создание таблиц, если они не существуют
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Настройка сессии
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Проверка, существует ли пользователь admin
        result = await session.execute(
            select(User).where(User.username == "admin")
        )
        existing_user = result.scalar_one_or_none()

        if existing_user:
            print("Пользователь admin уже существует.")
            return

        # Создание нового пользователя
        admin_user = User(
            username="admin",
            email="admin@example.com",
            password=hash_password("12345"),
            role=Role.ADMIN,
            is_active=True,
            created_at=datetime.now()
        )

        session.add(admin_user)
        await session.commit()
        print("Пользователь admin успешно создан: username=admin, password=12345")

if __name__ == "__main__":
    asyncio.run(create_admin_user())
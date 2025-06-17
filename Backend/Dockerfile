# Базовый образ Python 3.10
FROM python:3.10-slim

# Устанавливаем Poetry
ENV POETRY_VERSION=1.8.3
RUN pip install --no-cache-dir poetry==$POETRY_VERSION

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы Poetry и устанавливаем зависимости
COPY pyproject.toml poetry.lock ./
RUN poetry config virtualenvs.create false && \
    poetry install --no-interaction --no-ansi

# Копируем код приложения
COPY src ./src

# Указываем порт
ENV PORT=8000
EXPOSE $PORT

# Запускаем сервер через uvicorn
CMD ["sh", "-c", "poetry run uvicorn src.main:app --host 0.0.0.0 --port $PORT"]
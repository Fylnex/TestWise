# TestWise Backend

TestWise — это образовательная платформа для создания и прохождения тестов. Этот репозиторий содержит бэкенд приложения, реализованный на FastAPI с использованием SQLite и Poetry для управления зависимостями.

## Требования

- **Python 3.10+** (для локального запуска)
- **Poetry 1.8.3** (для управления зависимостями)
- **Docker** и **Docker Compose** (для запуска в контейнере)
- **SQLite** и утилита `sqlite3` (для работы с базой данных)

## Установка и запуск

### Локальный запуск

1. Клонируйте репозиторий:
   ```bash
   git clone <repository-url>
   cd TestWise/Backend
   ```

2. Установите Poetry:
   ```bash
   pip install poetry==1.8.3
   ```

3. Установите зависимости:
   ```bash
   poetry install --no-dev
   ```

4. Создайте файл `.env` на основе `.env.example`:
   ```bash
   cp .env.example .env
   ```

5. Запустите сервер:
   ```bash
   poetry run uvicorn src.main:app --reload --port 8000
   ```

6. Откройте Swagger UI для тестирования API:
   ```
   http://localhost:8000/docs
   ```

### Запуск через Docker

1. Клонируйте репозиторий:
   ```bash
   git clone <repository-url>
   cd TestWise/Backend
   ```

2. Создайте файл `.env` на основе `.env.example`:
   ```bash
   cp .env.example .env
   ```
   - Измените `PORT` в `.env`, если нужно (по умолчанию `8000`).

3. Запустите Docker Compose:
   ```bash
   docker-compose up --build
   ```

4. Откройте Swagger UI:
   ```
   http://localhost:8000/docs
   ```

5. Для остановки:
   ```bash
   docker-compose down
   ```

## Создание пользователей

Для тестирования API нужно создать администратора и студента в базе данных.

1. Сгенерируйте хеши паролей с помощью Python:
   ```python
   from passlib.context import CryptContext
   pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
   print(pwd_context.hash("admin123"))  # Для админа
   print(pwd_context.hash("student123"))  # Для студента
   ```
   Сохраните хеши (например, `$2b$12$xxx...` и `$2b$12$yyy...`).

2. Откройте консоль SQLite:
   ```bash
   sqlite3 database.sqlite
   ```

3. Выполните SQL-запросы, заменив `xxx` и `yyy` на ваши хеши:
   ```sql
   INSERT INTO users (username, email, password, role, is_active, created_at, updated_at)
   VALUES ('admin', 'admin@testwise.com', '$2b$12$xxx...', 'admin', 1, datetime('now'), datetime('now'));

   INSERT INTO users (username, email, password, role, is_active, created_at, updated_at)
   VALUES ('student1', 'student1@testwise.com', '$2b$12$yyy...', 'student', 1, datetime('now'), datetime('now'));
   ```

4. Проверьте таблицу:
   ```sql
   SELECT * FROM users;
   ```

5. Выйдите из консоли:
   ```sql
   .exit
   ```

## Тестирование API через Swagger UI

1. Откройте Swagger UI:
   ```
   http://localhost:8000/docs
   ```

2. Авторизуйтесь:
   - Перейдите к `POST /api/v1/auth/login`.
   - Отправьте запрос:
     ```json
     {
       "username": "admin",
       "password": "admin123"
     }
     ```
   - Скопируйте `access_token` из ответа.
   - Нажмите `Authorize` в правом верхнем углу и введите `Bearer <access_token>`.

3. Примеры тестирования эндпоинтов:

   - **Создать группу** (`POST /api/v1/groups`):
     ```json
     {
       "name": "Group 2023",
       "start_year": 2023,
       "end_year": 2025,
       "description": "Test group"
     }
     ```

   - **Создать тему** (`POST /api/v1/topics`):
     ```json
     {
       "title": "Математика",
       "description": "Основы алгебры",
       "category": "Математика",
       "image": "https://example.com/math.jpg"
     }
     ```

   - **Создать раздел** (`POST /api/v1/sections`):
     ```json
     {
       "topic_id": 1,
       "title": "Линейные уравнения",
       "content": "Учебный материал",
       "is_test": true,
       "test_type": "hints",
       "control_questions_percentage": 20
     }
     ```

   - **Создать вопрос** (`POST /api/v1/questions`):
     ```json
     {
       "section_id": 1,
       "question": "Решите: 2x + 3 = 7",
       "question_type": "single_choice",
       "options": ["x = 1", "x = 2", "x = 3", "x = 4"],
       "correct_answer": 0,
       "hint": "Вычтите 3 и разделите на 2",
       "is_control": false
     }
     ```

   - **Начать тест** (`POST /api/v1/tests/start`, для студента):
     ```json
     {
       "section_id": 1,
       "num_questions": 5
     }
     ```

   - **Отправить тест** (`POST /api/v1/tests/submit`, для студента):
     ```json
     {
       "section_id": 1,
       "answers": [
         {"question_id": 1, "answer": 0}
       ]
     }
     ```

   - **Проверить прогресс** (`GET /api/v1/progress/{user_id}`):
     - Замените `{user_id}` на ID студента (например, `2`).

## Тестирование с Pytest

1. Установите dev-зависимости:
   ```bash
   poetry install
   ```

2. Запустите тесты:
   ```bash
   poetry run pytest
   ```

3. Для подробного вывода:
   ```bash
   poetry run pytest -v
   ```

4. Тесты находятся в папке `tests/` и покрывают эндпоинты `/auth`, `/users`, `/groups`, `/topics`.

## Восстановление бэкапа

1. Убедитесь, что файл бэкапа существует (например, `backups/backup_2025-06-16_12-00-00.sqlite`).

2. Выполните восстановление через Python:
   ```python
   import asyncio
   from src.database.backup import restore_backup

   async def main():
       await restore_backup("backups/backup_2025-06-16_12-00-00.sqlite")

   asyncio.run(main())
   ```

3. Проверьте логи в `logs/app.log` для подтверждения восстановления.

## Скачивание OpenAPI-спецификации

1. Откройте:
   ```
   http://localhost:8000/openapi.json
   ```

2. Сохраните файл `openapi.json` для генерации клиентского кода.

## Изменение порта

1. Откройте файл `.env`.
2. Измените значение `PORT`:
   ```env
   PORT=8080
   ```
3. Перезапустите Docker Compose:
   ```bash
   docker-compose down
   docker-compose up --build
   ```
4. Swagger UI будет доступен на новом порте (например, `http://localhost:8080/docs`).

## Проверка логов и базы данных

- **Логи**: Находятся в `./logs/app.log`. Просмотрите их для отладки:
  ```bash
  cat logs/app.log
  ```

- **База данных**: Файл `./database.sqlite`. Откройте с помощью `sqlite3`:
  ```bash
  sqlite3 database.sqlite
  ```

## Для фронтенд-разработчиков

- Используйте Swagger UI (`/docs`) для тестирования API.
- Скачайте `openapi.json` для генерации клиентских библиотек.
- Настройте CORS в `src/main.py`, если фронтенд работает на другом домене.
- Для вопросов пишите в <контакты команды>.
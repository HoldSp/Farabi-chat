# KazNU RAG MVP

Минимальный локальный RAG-конвейер для публичных источников КазНУ. Этот подкаталог не вмешивается в основной Node.js проект и запускается отдельно.

## Что входит

- краулер для `farabi.university`, `welcome.kaznu.kz`, `pps.kaznu.kz`, `elibrary.kaznu.kz`
- очистка HTML через `trafilatura`
- извлечение текста из PDF через `PyMuPDF`
- чанкинг документов
- локальная векторная база на `QdrantClient(path=...)`
- FastAPI endpoint `/ask` с генерацией ответа через Ollama

## Структура

```text
kaznu-rag/
├─ app/
├─ crawler/
├─ data/
│  ├─ raw_html/
│  ├─ raw_pdf/
│  ├─ cleaned/
│  └─ chunks/
├─ scripts/
├─ .env.example
├─ README.md
└─ requirements.txt
```

## Быстрый старт

```powershell
cd kaznu-rag
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
Copy-Item .env.example .env
ollama pull qwen2.5:7b-instruct-q4_K_M
python crawler/simple_crawler.py
python scripts/clean_html.py
python scripts/clean_pdf.py
python scripts/make_chunks.py
python scripts/index_qdrant.py
uvicorn app.main:app --reload
```

Swagger UI будет доступен по адресу `http://127.0.0.1:8000/docs`.
Пользовательский интерфейс для вопросов будет доступен по адресу `http://127.0.0.1:8000/chat`.

## Тестовые вопросы

- Как подать документы в КазНУ?
- Какие есть бакалаврские программы?
- Какие факультеты есть в КазНУ?
- Как найти преподавателя?
- Что есть в библиотеке КазНУ?
- Есть ли электронный читательский билет?
- Где контакты факультета?
- Какие программы есть для иностранных абитуриентов?

## Замечания

- Скрипты ожидают запуск из директории `kaznu-rag`.
- `data/` игнорируется git, кроме пустых каталогов.
- Первый запуск `sentence-transformers` скачает модель `intfloat/multilingual-e5-base`.
- Перед `uvicorn` должны быть выполнены краулинг, очистка, чанкинг и индексация.
- Если в Windows появляются TLS-ошибки на сайтах КазНУ, временно установите `VERIFY_SSL=false` в `.env` перед запуском краулера.
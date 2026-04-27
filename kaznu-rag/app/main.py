from __future__ import annotations

import os
from pathlib import Path
import re
import textwrap
from typing import Literal

import requests
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer


BASE_DIR = Path(__file__).resolve().parents[1]
STATIC_DIR = Path(__file__).resolve().with_name("static")
load_dotenv(BASE_DIR / ".env")

app = FastAPI(title="KazNU RAG MVP")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


def resolve_project_path(value: str, default_relative_path: str) -> str:
    configured = value or default_relative_path
    path = Path(configured)
    if not path.is_absolute():
        path = BASE_DIR / path
    return str(path)


COLLECTION = os.getenv("QDRANT_COLLECTION", "kaznu_chunks")
QDRANT_PATH = resolve_project_path(os.getenv("QDRANT_PATH", ""), "data/qdrant_db")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:7b-instruct-q4_K_M")
MAX_RETURNED_SOURCES = 3

client = QdrantClient(path=QDRANT_PATH)
embed_model = SentenceTransformer("intfloat/multilingual-e5-base")


class Query(BaseModel):
    question: str
    history: list["ChatMessage"] = []


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    text: str
    sources: list[str] = []


DOMAIN_HINTS = {
    "welcome.kaznu.kz": ({"поступить", "поступление", "прием", "абитуриент", "бакалавр", "магистр", "phd", "документ", "экзамен", "грант", "ielts", "toefl", "apply"}, 0.45),
    "pps.kaznu.kz": ({"факультет", "преподаватель", "профиль", "кафедра", "сотрудник", "faculty", "teacher"}, 0.45),
    "elibrary.kaznu.kz": ({"библиотека", "читатель", "книга", "журнал", "scopus", "library", "elibrary"}, 0.4),
    "farabi.university": ({"новость", "сервис", "университет", "кампус", "program", "service", "экзамен", "расписание"}, 0.18),
}

INTENT_PROFILES = {
    "admissions": {
        "keywords": {"поступить", "поступление", "подать", "прием", "абитуриент", "документ", "документы", "балл", "грант", "ент", "экзамен", "бакалавр", "магистр", "магистратур", "докторантур", "ielts", "toefl"},
        "preferred_domains": {"welcome.kaznu.kz", "farabi.university"},
    },
    "faculty": {
        "keywords": {"факультет", "преподаватель", "профессор", "кафедр", "сотрудник", "декан", "учител", "teacher", "faculty"},
        "preferred_domains": {"pps.kaznu.kz", "welcome.kaznu.kz"},
    },
    "library": {
        "keywords": {"библиотек", "книга", "журнал", "читател", "статья", "scopus", "wos", "library", "elibrary"},
        "preferred_domains": {"elibrary.kaznu.kz"},
    },
}

STOPWORDS = {
    "как", "какие", "какой", "какая", "какое", "где", "когда", "ли", "для", "или", "это", "все", "всё", "про", "надо",
    "можно", "нужно", "есть", "если", "чтобы", "ответь", "отвечай", "напиши", "скажи", "пожалуйста", "русском",
    "русский", "русском", "английском", "казахском", "языке", "язык", "the", "and", "for", "with", "about",
}

LANGUAGE_PATTERNS = {
    "russian": ("на русском", "по-русски", "русском", "русский"),
    "kazakh": ("на казахском", "по-казахски", "қазақша", "казахском", "казахский"),
    "english": ("in english", "на английском", "по-английски", "английском", "english"),
}

LANGUAGE_LABELS = {
    "russian": "русском",
    "kazakh": "казахском",
    "english": "английском",
}

SOURCE_SECTION_RE = re.compile(r"(?:\n|^)\s*(Источники|Источник|Sources|Ссылки)\s*:\s*.*$", re.IGNORECASE | re.DOTALL)
HAN_RE = re.compile(r"[\u4e00-\u9fff]")

TOKEN_SUFFIXES = (
    "иями", "ями", "ами", "иях", "ях", "ах", "ов", "ев", "ий", "ый", "ой", "ая", "яя",
    "ое", "ее", "ые", "ие", "ого", "ему", "ому", "ую", "юю", "ия", "ья", "ие", "ые",
    "ий", "ый", "ой", "а", "я", "ы", "и", "е", "о", "у", "ю", "ь",
)


def normalize_token(token: str) -> str:
    normalized = token.lower()
    for suffix in TOKEN_SUFFIXES:
        if len(normalized) > len(suffix) + 2 and normalized.endswith(suffix):
            normalized = normalized[: -len(suffix)]
            break
    return normalized


PROCEDURE_KEYWORDS = {normalize_token(word) for word in {"подать", "документ", "документы", "прием", "поступление", "поступить", "найти", "поиск", "справочник", "фамилия", "должность"}}
ADMISSIONS_EVIDENCE_KEYWORDS = {normalize_token(word) for word in {"документ", "документы", "прием", "комиссия", "экзамен", "ielts", "toefl", "расписание", "абитуриент"}}
FACULTY_EVIDENCE_KEYWORDS = {normalize_token(word) for word in {"телефонный", "справочник", "фамилия", "имя", "отчество", "должность", "автобиография", "faculty", "teacher"}}


def tokenize(value: str) -> set[str]:
    return {
        normalized
        for token in re.findall(r"[\w-]+", value.lower())
        if len(token) > 2
        for normalized in [normalize_token(token)]
        if normalized and normalized not in STOPWORDS and len(normalized) > 2
    }


def normalize_vocabulary(words: set[str]) -> set[str]:
    return {normalize_token(word) for word in words}


NORMALIZED_DOMAIN_HINTS = {
    domain: (normalize_vocabulary(hints), boost)
    for domain, (hints, boost) in DOMAIN_HINTS.items()
}

NORMALIZED_INTENT_PROFILES = {
    name: {
        "keywords": normalize_vocabulary(profile["keywords"]),
        "preferred_domains": profile["preferred_domains"],
    }
    for name, profile in INTENT_PROFILES.items()
}


def detect_requested_language(question: str) -> str | None:
    lowered = question.lower()
    for language, patterns in LANGUAGE_PATTERNS.items():
        if any(pattern in lowered for pattern in patterns):
            return language
    return None


def detect_response_language(question: str, history: list["ChatMessage"]) -> str:
    requested = detect_requested_language(question)
    if requested:
        return requested

    sample = " ".join([message.text for message in history[-2:]] + [question])
    if re.search(r"[әіңғүұқөһ]", sample.lower()):
        return "kazakh"
    if re.search(r"[a-z]", sample.lower()) and not re.search(r"[а-яё]", sample.lower()):
        return "english"
    return "russian"


def detect_intent(question_tokens: set[str]) -> str | None:
    best_name = None
    best_score = 0
    for name, profile in NORMALIZED_INTENT_PROFILES.items():
        score = len(question_tokens & profile["keywords"])
        if score > best_score:
            best_name = name
            best_score = score
    return best_name


def get_hit_domain(url: str) -> str:
    for domain in NORMALIZED_DOMAIN_HINTS:
        if domain in url:
            return domain
    return ""


def is_document_url(url: str) -> bool:
    lowered = url.lower()
    return lowered.endswith((".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx"))


def has_direct_answer_signal(question_tokens: set[str], text_tokens: set[str]) -> bool:
    matched = question_tokens & text_tokens
    return len(matched) >= 2


def find_last_assistant_message(history: list["ChatMessage"]) -> "ChatMessage" | None:
    for message in reversed(history):
        if message.role == "assistant" and message.text.strip():
            return message
    return None


def is_rewrite_request(question: str, history: list["ChatMessage"]) -> bool:
    if not history:
        return False
    requested_language = detect_requested_language(question)
    if not requested_language:
        return False
    question_tokens = tokenize(question)
    return len(question_tokens) <= 4 or any(word in question.lower() for word in ("перев", "ответ", "напиши", "скажи"))


def clean_answer_text(answer: str) -> str:
    cleaned = SOURCE_SECTION_RE.sub("", answer or "").strip()
    return cleaned or "Не удалось сформировать ответ по найденному контексту."


def format_history(history: list["ChatMessage"], limit: int = 6) -> str:
    formatted = []
    for message in history[-limit:]:
        role = "Пользователь" if message.role == "user" else "Ассистент"
        formatted.append(f"{role}: {message.text.strip()}")
    return "\n".join(formatted)


def search_chunks(question: str, limit: int = 5):
    query_vector = embed_model.encode([f"query: {question}"], normalize_embeddings=True)[0]
    return client.query_points(
        collection_name=COLLECTION,
        query=query_vector.tolist(),
        limit=limit,
    ).points


def rerank_hits(question: str, hits, limit: int = 5):
    question_tokens = tokenize(question)
    active_intent = detect_intent(question_tokens)
    preferred_domains = NORMALIZED_INTENT_PROFILES.get(active_intent, {}).get("preferred_domains", set())
    ranked_hits = []
    seen_urls = set()

    for hit in hits:
        payload = hit.payload or {}
        text = payload.get("text", "")
        url = payload.get("url", "")
        if not text or not url:
            continue
        if url in seen_urls:
            continue
        seen_urls.add(url)

        text_tokens = tokenize(text[:2500])
        overlap = len(question_tokens & text_tokens)
        overlap_score = overlap / max(len(question_tokens), 1)
        vector_score = float(getattr(hit, "score", 0.0) or 0.0)
        direct_signal = has_direct_answer_signal(question_tokens, text_tokens)
        hit_domain = get_hit_domain(url)

        domain_score = 0.0
        for domain, (hints, boost) in NORMALIZED_DOMAIN_HINTS.items():
            if domain in url:
                domain_score = boost if question_tokens & hints else 0.0
                break

        if preferred_domains:
            if hit_domain in preferred_domains:
                domain_score += 0.35
            elif hit_domain:
                domain_score -= 0.25

        file_penalty = -0.3 if is_document_url(url) and active_intent != "library" else 0.0
        weak_match_penalty = -0.2 if overlap == 0 and not direct_signal else 0.0

        total_score = vector_score + overlap_score + domain_score + file_penalty + weak_match_penalty
        ranked_hits.append({
            "hit": hit,
            "score": total_score,
            "overlap": overlap,
            "vector_score": vector_score,
            "preferred_domain": hit_domain in preferred_domains,
            "direct_signal": direct_signal,
        })

    ranked_hits.sort(key=lambda item: item["score"], reverse=True)
    return ranked_hits[:limit]


def ask_ollama(prompt: str) -> str:
    response = requests.post(
        f"{OLLAMA_URL}/api/generate",
        json={
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": 0.2},
        },
        timeout=120,
    )
    response.raise_for_status()
    body = response.json()
    return body.get("response", "")


def build_retrieval_fallback(context_parts: list[str]) -> str:
    snippets = []
    for part in context_parts[:3]:
        lines = [line.strip() for line in part.splitlines() if line.strip()]
        if len(lines) < 2:
            continue
        snippets.append(textwrap.shorten(lines[1], width=280, placeholder="..."))

    if not snippets:
        return "Не удалось сгенерировать ответ и в retrieved-контексте недостаточно текста для краткой выжимки."

    joined = "\n".join(f"- {snippet}" for snippet in snippets)
    return (
        "Ollama сейчас недоступен, поэтому ниже показана краткая выжимка из найденных источников:\n"
        f"{joined}"
    )


def build_language_safe_fallback(context_parts: list[str], confidence_low: bool) -> str:
    snippets = []
    for part in context_parts[:2]:
        lines = [line.strip() for line in part.splitlines() if line.strip()]
        if len(lines) < 2:
            continue
        snippets.append(textwrap.shorten(lines[1], width=260, placeholder="..."))

    if confidence_low:
        prefix = "Точной пошаговой инструкции в базе не найдено."
    else:
        prefix = "По найденному контексту доступна следующая информация:"

    if not snippets:
        return prefix

    return f"{prefix}\n\n" + "\n".join(f"- {snippet}" for snippet in snippets)


def build_intent_safe_fallback(question: str, hits) -> str:
    question_tokens = tokenize(question)
    active_intent = detect_intent(question_tokens)

    if active_intent == "faculty":
        for hit in hits:
            payload = hit.payload or {}
            url = payload.get("url", "")
            text = payload.get("text", "")
            if "pps.kaznu.kz" in url and "Телефонный справочник" in text:
                return (
                    "Найти преподавателя можно через сайт PPS.KAZNU.KZ. "
                    "В найденном контексте есть телефонный справочник с поиском по фамилии, имени, отчеству, должности и автобиографии. "
                    "Также на странице можно выбрать нужный факультет и выполнить поиск там."
                )

    if active_intent == "admissions":
        for hit in hits:
            payload = hit.payload or {}
            url = payload.get("url", "")
            text = payload.get("text", "")
            if "welcome.kaznu.kz" in url or "farabi.university" in url:
                snippets = []
                if "бакалавриат" in text.lower() or "магистратур" in text.lower() or "докторантур" in text.lower():
                    snippets.append("в базе есть общая информация о программах: бакалавриат, магистратура и докторантура PhD")
                if "творческих экзаменов" in text.lower():
                    snippets.append("найден раздел с программами и расписаниями творческих экзаменов 2025-2026")

                if snippets:
                    return (
                        "Точной пошаговой инструкции по подаче документов в текущей базе нет. "
                        "Из admission-источников удалось найти только общую информацию: "
                        + "; ".join(snippets)
                        + "."
                    )

        return "Точной пошаговой инструкции по подаче документов в текущей базе нет. В индексе есть только общие admission-страницы без полной процедуры поступления."

    return ""


def contains_disallowed_script(answer: str, response_language: str) -> bool:
    if response_language in {"russian", "kazakh"}:
        return bool(HAN_RE.search(answer or ""))
    return False


def build_answer_prompt(
    question: str,
    history: list["ChatMessage"],
    context_parts: list[str],
    response_language: str,
    confidence_low: bool,
) -> str:
    history_block = format_history(history)
    answer_mode = (
        "Точного ответа в контексте может не быть. Сформируй ровно два коротких абзаца: в первом честно скажи, каких точных данных не хватает; во втором укажи только ближайшую полезную информацию, найденную по теме, если она есть."
        if confidence_low
        else "Если контекст отвечает на вопрос напрямую, дай короткий точный ответ без домыслов."
    )
    return (
        "Ты помощник по публичным сервисам и источникам КазНУ.\n"
        f"Всегда отвечай на {LANGUAGE_LABELS[response_language]} языке. Никогда не переходи на китайский или другой язык самовольно.\n"
        "Используй только факты из истории диалога и контекста ниже. Не придумывай правила, баллы, дедлайны, адреса и процедуры.\n"
        f"{answer_mode}\n"
        "Если пользователь просит процедуру, а в источниках есть только общая информация, так и скажи: точной пошаговой инструкции в базе не найдено.\n"
        "Не советуй обратиться на сайт, в комиссию или в поддержку, если такого совета нет прямо в контексте.\n"
        "Не добавляй в текст ответа раздел 'Источники' или список ссылок: ссылки вернутся отдельно.\n\n"
        f"История диалога:\n{history_block or 'Истории нет.'}\n\n"
        f"Контекст:\n{'\n\n---\n\n'.join(context_parts)}\n\n"
        f"Текущий вопрос: {question}"
    )


def build_rewrite_prompt(question: str, history: list["ChatMessage"], response_language: str) -> str:
    last_assistant = find_last_assistant_message(history)
    previous_answer = last_assistant.text if last_assistant else ""
    return (
        "Ты помощник по публичным сервисам КазНУ.\n"
        f"Перепиши предыдущий ответ на {LANGUAGE_LABELS[response_language]} языке.\n"
        "Не добавляй новых фактов, не меняй смысл и не выдумывай новые источники.\n"
        "Если в предыдущем ответе было указано, что данных не хватает, сохрани это ограничение.\n\n"
        f"Предыдущий ответ:\n{previous_answer}\n\n"
        f"Инструкция пользователя: {question}"
    )


def is_low_confidence_result(question: str, ranked_hits: list[dict]) -> bool:
    if not ranked_hits:
        return True

    question_tokens = tokenize(question)
    active_intent = detect_intent(question_tokens)
    meaningful_token_count = len(question_tokens)
    top_overlap = ranked_hits[0]["overlap"]
    preferred_hits = sum(1 for item in ranked_hits[:3] if item["preferred_domain"])
    direct_hits = sum(1 for item in ranked_hits[:3] if item["direct_signal"])
    top_text_tokens = set()
    for item in ranked_hits[:3]:
        payload = item["hit"].payload or {}
        top_text_tokens |= tokenize(payload.get("text", "")[:2500])

    if active_intent == "admissions" and preferred_hits < 2:
        return True
    if active_intent == "admissions" and question_tokens & PROCEDURE_KEYWORDS and len(top_text_tokens & ADMISSIONS_EVIDENCE_KEYWORDS) < 2:
        return True
    if active_intent == "faculty" and question_tokens & PROCEDURE_KEYWORDS and len(top_text_tokens & FACULTY_EVIDENCE_KEYWORDS) < 2:
        return True
    if meaningful_token_count >= 2 and top_overlap == 0:
        return True
    if meaningful_token_count >= 3 and top_overlap < 2 and direct_hits == 0:
        return True
    if preferred_hits == 0 and top_overlap < 2:
        return True
    return False


def select_sources(ranked_hits: list[dict], confidence_low: bool, question: str) -> list[str]:
    question_tokens = tokenize(question)
    active_intent = detect_intent(question_tokens)
    preferred_domains = NORMALIZED_INTENT_PROFILES.get(active_intent, {}).get("preferred_domains", set())

    candidates = ranked_hits
    if confidence_low and preferred_domains:
        preferred_candidates = [
            item for item in ranked_hits
            if get_hit_domain(item["hit"].payload.get("url", "")) in preferred_domains and not is_document_url(item["hit"].payload.get("url", ""))
        ]
        if preferred_candidates:
            candidates = preferred_candidates

    sources = []
    for item in candidates:
        payload = item["hit"].payload or {}
        url = payload.get("url", "")
        if not url:
            continue
        if confidence_low and is_document_url(url):
            continue
        sources.append(url)

    return list(dict.fromkeys(sources))[:MAX_RETURNED_SOURCES]


def select_context_hits(ranked_hits: list[dict], confidence_low: bool, question: str) -> list[dict]:
    if not confidence_low:
        return ranked_hits

    question_tokens = tokenize(question)
    active_intent = detect_intent(question_tokens)
    preferred_domains = NORMALIZED_INTENT_PROFILES.get(active_intent, {}).get("preferred_domains", set())
    if not preferred_domains:
        return ranked_hits

    filtered_hits = [
        item for item in ranked_hits
        if get_hit_domain(item["hit"].payload.get("url", "")) in preferred_domains and not is_document_url(item["hit"].payload.get("url", ""))
    ]
    return filtered_hits or ranked_hits


@app.get("/health")
def health_check():
    return {"status": "ok", "collection": COLLECTION}


@app.get("/")
def root():
    return RedirectResponse(url="/chat", status_code=307)


@app.get("/chat")
def chat_page():
    return FileResponse(STATIC_DIR / "chat.html")


@app.post("/ask")
def ask(query: Query):
    question = query.question.strip()
    history = query.history[-8:]

    if not question:
        return {"answer": "Вопрос пустой. Напиши, что именно ты хочешь узнать о КазНУ.", "sources": []}

    response_language = detect_response_language(question, history)

    if is_rewrite_request(question, history):
        last_assistant = find_last_assistant_message(history)
        if not last_assistant:
            return {"answer": "У меня нет предыдущего ответа в истории, который можно переписать. Сначала задай основной вопрос о КазНУ.", "sources": []}

        try:
            answer = ask_ollama(build_rewrite_prompt(question, history, response_language))
        except requests.RequestException:
            answer = last_assistant.text
        return {
            "answer": clean_answer_text(answer),
            "sources": list(dict.fromkeys(last_assistant.sources))[:MAX_RETURNED_SOURCES],
        }

    try:
        ranked_hits = rerank_hits(question, search_chunks(question, limit=24), limit=5)
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Search failed: {error}") from error

    if not ranked_hits:
        return {"answer": "Недостаточно данных в базе. Сначала загрузите и проиндексируйте документы.", "sources": []}

    confidence_low = is_low_confidence_result(question, ranked_hits)
    context_hit_rows = select_context_hits(ranked_hits, confidence_low, question)
    hits = [item["hit"] for item in context_hit_rows]
    sources = []
    context_parts = []
    for hit in hits:
        payload = hit.payload or {}
        url = payload.get("url", "")
        text = payload.get("text", "")
        if not text:
            continue
        sources.append(url)
        context_parts.append(f"Источник: {url}\n{text}")

    if confidence_low:
        answer = build_intent_safe_fallback(question, hits) or build_language_safe_fallback(context_parts, confidence_low)
    else:
        prompt = build_answer_prompt(question, history, context_parts, response_language, confidence_low)

        try:
            answer = clean_answer_text(ask_ollama(prompt))
        except requests.RequestException:
            answer = build_retrieval_fallback(context_parts)

        if contains_disallowed_script(answer, response_language):
            confidence_low = True
            answer = build_language_safe_fallback(context_parts, confidence_low)

    unique_sources = select_sources(ranked_hits, confidence_low, question)
    return {"answer": answer, "sources": unique_sources}
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
RAW_HTML_DIR = DATA_DIR / "raw_html"
RAW_PDF_DIR = DATA_DIR / "raw_pdf"
CLEANED_DIR = DATA_DIR / "cleaned"
CHUNKS_DIR = DATA_DIR / "chunks"
CRAWL_META_PATH = DATA_DIR / "crawl_meta.json"

SEED_URLS = [
    "https://farabi.university/?lang=ru",
    "https://welcome.kaznu.kz/ru/",
    "https://pps.kaznu.kz/ru",
    "https://elibrary.kaznu.kz/ru/",
]

ALLOWED_DOMAINS = {
    "farabi.university",
    "welcome.kaznu.kz",
    "pps.kaznu.kz",
    "elibrary.kaznu.kz",
}

BLOCK_PATTERNS = [
    "/search",
    "/login",
    "/register",
    "/wp-admin",
    "/feed",
]

DEFAULT_HEADERS = {
    "User-Agent": "KazNU-RAG-Bot/0.1 (educational research; contact local operator)",
    "Accept-Language": "ru,en;q=0.8,kz;q=0.7",
}

for directory in (RAW_HTML_DIR, RAW_PDF_DIR, CLEANED_DIR, CHUNKS_DIR):
    directory.mkdir(parents=True, exist_ok=True)
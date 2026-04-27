import json
import sys
import uuid
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from crawler.config import CHUNKS_DIR, CLEANED_DIR


OUTPUT_PATH = CHUNKS_DIR / "chunks.json"
INPUT_FILES = [CLEANED_DIR / "cleaned_html.json", CLEANED_DIR / "cleaned_pdf.json"]


def chunk_text(text: str, chunk_size: int = 1200, overlap: int = 200) -> list[str]:
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks


def load_documents() -> list[dict]:
    documents = []
    for file_path in INPUT_FILES:
        if not file_path.exists():
            continue
        documents.extend(json.loads(file_path.read_text(encoding="utf-8")))
    return documents


def main() -> None:
    all_docs = load_documents()
    chunked = []

    for doc in all_docs:
        for index, part in enumerate(chunk_text(doc["text"])):
            if len(part.strip()) < 200:
                continue
            chunked.append(
                {
                    "id": str(uuid.uuid5(uuid.NAMESPACE_URL, f"{doc['url']}:{index}")),
                    "url": doc["url"],
                    "source_type": doc["source_type"],
                    "chunk_index": index,
                    "text": part,
                }
            )

    OUTPUT_PATH.write_text(
        json.dumps(chunked, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Saved {len(chunked)} chunks to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
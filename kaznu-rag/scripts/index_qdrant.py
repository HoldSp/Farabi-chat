import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams
from sentence_transformers import SentenceTransformer

BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from crawler.config import CHUNKS_DIR


load_dotenv()

COLLECTION = os.getenv("QDRANT_COLLECTION", "kaznu_chunks")
QDRANT_PATH = os.getenv("QDRANT_PATH", "data/qdrant_db")
CHUNKS_PATH = CHUNKS_DIR / "chunks.json"
BATCH_SIZE = 64


def batched(items, size: int):
    for start in range(0, len(items), size):
        yield items[start : start + size]


def main() -> None:
    client = QdrantClient(path=QDRANT_PATH)
    model = SentenceTransformer("intfloat/multilingual-e5-base")
    chunks = json.loads(CHUNKS_PATH.read_text(encoding="utf-8"))
    dimension = model.get_sentence_embedding_dimension()

    if client.collection_exists(COLLECTION):
        client.delete_collection(COLLECTION)

    client.create_collection(
        collection_name=COLLECTION,
        vectors_config=VectorParams(size=dimension, distance=Distance.COSINE),
    )

    total_indexed = 0
    for batch in batched(chunks, BATCH_SIZE):
        texts = [f"passage: {item['text']}" for item in batch]
        vectors = model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
        points = [
            PointStruct(
                id=item["id"],
                vector=vector.tolist(),
                payload={
                    "url": item["url"],
                    "text": item["text"],
                    "source_type": item["source_type"],
                    "chunk_index": item["chunk_index"],
                },
            )
            for item, vector in zip(batch, vectors)
        ]
        client.upsert(collection_name=COLLECTION, points=points)
        total_indexed += len(points)
        print(f"Indexed {total_indexed}/{len(chunks)}")

    print(f"Indexed total: {total_indexed}")


if __name__ == "__main__":
    main()
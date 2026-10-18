import json
import faiss
from sentence_transformers import SentenceTransformer

from config import INDEX_PATH, CHUNKS_PATH, EMBEDDING_MODEL, TOP_K

def load_retriever():
    if not INDEX_PATH.exists() or not CHUNKS_PATH.exists():
        raise FileNotFoundError(
            "Index not found. Run build_index.py after adding documents."
        )

    index = faiss.read_index(str(INDEX_PATH))
    chunks = json.loads(CHUNKS_PATH.read_text(encoding="utf-8"))
    model = SentenceTransformer(EMBEDDING_MODEL)
    return model, index, chunks

def retrieve(query, model, index, chunks, top_k=TOP_K):
    query = str(query or "").strip()
    if not query:
        raise ValueError("Enter a non-empty question.")

    query_vector = model.encode(
        [query],
        convert_to_numpy=True,
        normalize_embeddings=True
    ).astype("float32")

    k = min(max(1, int(top_k)), index.ntotal)
    scores, positions = index.search(query_vector, k)

    results = []
    for score, position in zip(scores[0], positions[0]):
        if position < 0:
            continue

        chunk = chunks[int(position)]
        results.append({
            "source": chunk["source"],
            "chunk_id": chunk["chunk_id"],
            "similarity_score": round(float(score), 4),
            "text": chunk["text"]
        })

    return results

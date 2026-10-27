import json
from pathlib import Path
import numpy as np

try:
    import faiss
    from sentence_transformers import SentenceTransformer
except ImportError:
    faiss = None
    SentenceTransformer = None

from config import (
    DOCUMENTS_PATH, INDEX_PATH, CHUNKS_PATH,
    EMBEDDING_MODEL, ARTIFACTS_DIR
)
from eda import load_documents
from preprocessing import prepare_documents

def main():
    documents = load_documents(DOCUMENTS_PATH)
    if not documents:
        raise FileNotFoundError(
            f"No .txt or .md documents found in {DOCUMENTS_PATH}. "
            "Add verified documents before building the index."
        )

    chunks = prepare_documents(documents)
    if not chunks:
        raise ValueError("Documents did not produce any searchable chunks.")

    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

    CHUNKS_PATH.write_text(
        json.dumps(chunks, indent=2, ensure_ascii=False),
        encoding="utf-8"
    )
    print("Chunk metadata saved:", CHUNKS_PATH)
    print("Indexed chunks:", len(chunks))

    if SentenceTransformer is not None and faiss is not None:
        try:
            model = SentenceTransformer(EMBEDDING_MODEL)
            texts = [chunk["text"] for chunk in chunks]

            embeddings = model.encode(
                texts,
                convert_to_numpy=True,
                normalize_embeddings=True,
                show_progress_bar=True
            ).astype("float32")

            index = faiss.IndexFlatIP(embeddings.shape[1])
            index.add(np.ascontiguousarray(embeddings))

            faiss.write_index(index, str(INDEX_PATH))
            print("FAISS index saved:", INDEX_PATH)
        except Exception as e:
            print(f"Notice: FAISS indexing skipped due to: {e}. Chunks are saved for TF-IDF RAG fallback.")
    else:
        print("SentenceTransformer or FAISS not installed. Chunks metadata saved; runtime will use dense TF-IDF fallback.")

if __name__ == "__main__":
    main()

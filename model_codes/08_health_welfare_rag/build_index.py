import json
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer

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

    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    faiss.write_index(index, str(INDEX_PATH))

    CHUNKS_PATH.write_text(
        json.dumps(chunks, indent=2, ensure_ascii=False),
        encoding="utf-8"
    )

    print("FAISS index saved:", INDEX_PATH)
    print("Chunk metadata saved:", CHUNKS_PATH)
    print("Indexed chunks:", len(chunks))

if __name__ == "__main__":
    main()

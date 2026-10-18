from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
RAW_DATA_DIR = BASE_DIR / "data" / "raw"
PROCESSED_DIR = BASE_DIR / "data" / "processed"
ARTIFACTS_DIR = BASE_DIR / "artifacts"
EVALUATION_DIR = BASE_DIR / "evaluation"

DOCUMENTS_PATH = RAW_DATA_DIR
INDEX_PATH = ARTIFACTS_DIR / "faiss_index"
CHUNKS_PATH = ARTIFACTS_DIR / "chunks.json"
METRICS_PATH = EVALUATION_DIR / "evaluation_results.json"

EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
TOP_K = 4
CHUNK_SIZE = 900
CHUNK_OVERLAP = 150

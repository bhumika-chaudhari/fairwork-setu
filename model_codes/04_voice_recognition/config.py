from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

RAW_DATA_DIR = BASE_DIR / "data" / "raw"
PROCESSED_DIR = BASE_DIR / "data" / "processed"
ARTIFACTS_DIR = BASE_DIR / "artifacts"
EVALUATION_DIR = BASE_DIR / "evaluation"

MODEL_NAME = "base"
DEFAULT_LANGUAGE = None
SUPPORTED_LANGUAGES = ["en", "hi"]
DEVICE = "cpu"

TRANSCRIPTION_JSON = PROCESSED_DIR / "transcriptions.json"

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
RAW_DATA_PATH = BASE_DIR / "data" / "raw" / "transactions.csv"
PROCESSED_DIR = BASE_DIR / "data" / "processed"
ARTIFACTS_DIR = BASE_DIR / "artifacts"
EVALUATION_DIR = BASE_DIR / "evaluation"

MODEL_PATH = ARTIFACTS_DIR / "transaction_extractor.joblib"
METRICS_PATH = EVALUATION_DIR / "metrics.json"

TEXT_COLUMN = "text"
AMOUNT_COLUMN = "amount"
TYPE_COLUMN = "transaction_type"
CATEGORY_COLUMN = "category"
DATE_COLUMN = "date"

RANDOM_STATE = 42
TEST_SIZE = 0.2

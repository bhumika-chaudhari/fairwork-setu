import json
import joblib
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from config import (
    RAW_DATA_PATH, DATE_COLUMN, TARGET_COLUMN, FREQUENCY,
    MODEL_PATH, HISTORY_PATH, TEST_DATA_PATH,
    ARTIFACTS_DIR, PROCESSED_DIR, TEST_SIZE
)
from preprocessing import prepare_series, make_features

def main():
    if not RAW_DATA_PATH.exists():
        raise FileNotFoundError(f"Dataset not found: {RAW_DATA_PATH}")

    series = prepare_series(
        pd.read_csv(RAW_DATA_PATH), DATE_COLUMN, TARGET_COLUMN, FREQUENCY
    )
    features = make_features(series)

    if len(features) < 20:
        raise ValueError("Too few usable periods. Provide more historical data.")

    split = int(len(features) * (1 - TEST_SIZE))
    if split <= 0 or split >= len(features):
        raise ValueError("Insufficient rows for chronological train/test split.")

    X = features.drop(columns=["income"])
    y = features["income"]
    model = RandomForestRegressor(
        n_estimators=300, min_samples_leaf=2,
        random_state=42, n_jobs=-1
    )
    model.fit(X.iloc[:split], y.iloc[:split])

    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    series.rename("income").to_frame().to_csv(HISTORY_PATH, index_label="date")
    features.iloc[split:].to_csv(TEST_DATA_PATH, index_label="date")

    metadata = {
        "date_column": DATE_COLUMN,
        "target_column": TARGET_COLUMN,
        "frequency": FREQUENCY,
        "feature_columns": X.columns.tolist(),
        "train_rows": split,
        "test_rows": len(features) - split
    }
    (ARTIFACTS_DIR / "metadata.json").write_text(
        json.dumps(metadata, indent=2), encoding="utf-8"
    )
    print("Model saved:", MODEL_PATH)
    print("Training rows:", split, "| Test rows:", len(features) - split)

if __name__ == "__main__":
    main()

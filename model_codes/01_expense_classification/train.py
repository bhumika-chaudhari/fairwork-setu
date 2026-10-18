import json
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

from config import (
    RAW_DATA_PATH, TARGET_COLUMN, MODEL_PATH,
    TEST_DATA_PATH, ARTIFACTS_DIR, PROCESSED_DIR
)
from preprocessing import clean_dataset

def main():
    if not RAW_DATA_PATH.exists():
        raise FileNotFoundError(
            f"Dataset not found: {RAW_DATA_PATH}\n"
            "Add your dataset before training."
        )

    df = pd.read_csv(RAW_DATA_PATH)
    X, y = clean_dataset(df, TARGET_COLUMN)

    if y.nunique() < 2:
        raise ValueError("Training requires at least two expense categories.")

    if y.value_counts().min() < 2:
        raise ValueError(
            "At least one category has fewer than 2 rows. "
            "Add more examples or revise the train/test split."
        )

    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.2,
        random_state=42,
        stratify=y
    )

    model = Pipeline([
        ("tfidf", TfidfVectorizer(
            lowercase=True,
            ngram_range=(1, 2),
            max_features=30000,
            sublinear_tf=True
        )),
        ("classifier", LogisticRegression(
            max_iter=1000,
            class_weight="balanced",
            random_state=42
        ))
    ])

    model.fit(X_train, y_train)

    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    joblib.dump(model, MODEL_PATH)

    test_df = pd.DataFrame({
        "transaction_text": X_test,
        "actual_category": y_test
    })
    test_df.to_csv(TEST_DATA_PATH, index=False)

    metadata = {
        "target_column": TARGET_COLUMN,
        "feature_columns": [c for c in df.columns if c != TARGET_COLUMN],
        "classes": sorted(y.unique().tolist()),
        "train_rows": len(X_train),
        "test_rows": len(X_test)
    }
    with (ARTIFACTS_DIR / "metadata.json").open("w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"Model saved: {MODEL_PATH}")
    print(f"Test data saved: {TEST_DATA_PATH}")
    print(f"Training rows: {len(X_train)}")
    print(f"Testing rows: {len(X_test)}")

if __name__ == "__main__":
    main()

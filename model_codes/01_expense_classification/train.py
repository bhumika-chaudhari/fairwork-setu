import json
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.naive_bayes import ComplementNB
from sklearn.ensemble import StackingClassifier

from config import (
    RAW_DATA_PATH, TARGET_COLUMN, MODEL_PATH,
    TEST_DATA_PATH, ARTIFACTS_DIR, PROCESSED_DIR
)
from preprocessing import clean_dataset


def build_ensemble_pipeline():
    """
    Constructs the Tri-Model Stacking Ensemble with calibrated probabilities:
    - Base 1 (Linear Margin): Tuned Logistic Regression with balanced class weights
    - Base 2 (Support Vector): Calibrated LinearSVC (Isotonic/Sigmoid calibration)
    - Base 3 (Probabilistic Imbalance): Complement Naive Bayes (Laplace alpha=0.3)
    - Meta-Learner: Regularized Logistic Regression with balanced weighting
    """
    base_estimators = [
        ("lr", LogisticRegression(C=1.2, class_weight="balanced", max_iter=1000, random_state=42)),
        ("svc", CalibratedClassifierCV(LinearSVC(C=1.0, random_state=42))),
        ("cnb", ComplementNB(alpha=0.3))
    ]

    stacking_clf = StackingClassifier(
        estimators=base_estimators,
        final_estimator=LogisticRegression(class_weight="balanced", max_iter=1000, random_state=42),
        cv=5
    )

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(
            lowercase=True,
            ngram_range=(1, 1),
            sublinear_tf=True
        )),
        ("classifier", stacking_clf)
    ])

    return pipeline


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

    print("\n--- Training Model 1 Stacking Ensemble ---")
    model = build_ensemble_pipeline()
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
        "model_name": "Tri-Model Stacking Expense Classifier (Model 1)",
        "architecture": "StackingClassifier(LogisticRegression + CalibratedLinearSVC + ComplementNB -> LogisticRegression Meta-Learner)",
        "feature_extraction": "TF-IDF Vectorizer (ngram_range=(1,1), sublinear_tf=True)",
        "target_column": TARGET_COLUMN,
        "classes": sorted(y.unique().tolist()),
        "train_rows": len(X_train),
        "test_rows": len(X_test),
        "base_estimators": ["LogisticRegression(C=1.2)", "CalibratedClassifierCV(LinearSVC)", "ComplementNB(alpha=0.3)"],
        "meta_learner": "LogisticRegression(class_weight=balanced)"
    }
    with (ARTIFACTS_DIR / "metadata.json").open("w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"Ensemble Model saved: {MODEL_PATH}")
    print(f"Test data saved: {TEST_DATA_PATH}")
    print(f"Training rows: {len(X_train)} | Testing rows: {len(X_test)}")


if __name__ == "__main__":
    main()

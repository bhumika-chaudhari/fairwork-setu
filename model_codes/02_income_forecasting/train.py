import json
import joblib
import pandas as pd
from sklearn.model_selection import KFold
from sklearn.ensemble import (
    RandomForestRegressor, GradientBoostingRegressor,
    ExtraTreesRegressor, StackingRegressor
)
from sklearn.linear_model import Ridge

from config import (
    RAW_DATA_PATH, DATE_COLUMN, TARGET_COLUMN, FREQUENCY,
    MODEL_PATH, HISTORY_PATH, TEST_DATA_PATH,
    ARTIFACTS_DIR, PROCESSED_DIR, TEST_SIZE
)
from preprocessing import prepare_series, make_features


def build_income_ensemble():
    """
    Constructs the Multi-Model Stacking Regressor for daily gig earnings:
    - Base 1 (Non-linear Volume): Random Forest Regressor (300 trees, max_depth=6)
    - Base 2 (Variance Reduction): Extra Trees Regressor (250 trees, max_depth=6)
    - Base 3 (Residual Correction): Gradient Boosting Regressor (120 trees, lr=0.05)
    - Base 4 (Linear Trend Anchor): Regularized Ridge Regressor (alpha=15.0)
    - Meta-Learner: Non-Negative Ridge Regressor blending multi-horizon signals
    """
    base_estimators = [
        ("rf", RandomForestRegressor(n_estimators=300, min_samples_leaf=2, max_depth=6, random_state=42)),
        ("et", ExtraTreesRegressor(n_estimators=250, min_samples_leaf=2, max_depth=6, random_state=42)),
        ("gb", GradientBoostingRegressor(n_estimators=120, learning_rate=0.05, max_depth=3, min_samples_leaf=2, random_state=42)),
        ("ridge", Ridge(alpha=15.0, random_state=42))
    ]

    return StackingRegressor(
        estimators=base_estimators,
        final_estimator=Ridge(alpha=25.0, positive=True, random_state=42),
        cv=KFold(n_splits=4, shuffle=False)
    )


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

    print("\n--- Training Model 2 Stacking Regressor Ensemble ---")
    model = build_income_ensemble()
    model.fit(X.iloc[:split], y.iloc[:split])

    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    series.rename("income").to_frame().to_csv(HISTORY_PATH, index_label="date")
    features.iloc[split:].to_csv(TEST_DATA_PATH, index_label="date")

    metadata = {
        "model_name": "Multi-Model Stacking Income Forecaster (Model 2)",
        "architecture": "StackingRegressor(RandomForest + ExtraTrees + GradientBoosting + Ridge -> Non-Negative Ridge Meta-Learner)",
        "date_column": DATE_COLUMN,
        "target_column": TARGET_COLUMN,
        "frequency": FREQUENCY,
        "feature_columns": X.columns.tolist(),
        "train_rows": split,
        "test_rows": len(features) - split,
        "base_estimators": ["RandomForest(n=300)", "ExtraTrees(n=250)", "GradientBoosting(n=120)", "Ridge(alpha=15.0)"],
        "meta_learner": "Ridge(alpha=25.0, positive=True)"
    }
    (ARTIFACTS_DIR / "metadata.json").write_text(
        json.dumps(metadata, indent=2), encoding="utf-8"
    )
    print("Ensemble Model saved:", MODEL_PATH)
    print("Training rows:", split, "| Test rows:", len(features) - split)


if __name__ == "__main__":
    main()

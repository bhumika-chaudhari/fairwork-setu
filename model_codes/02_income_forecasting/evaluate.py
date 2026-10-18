import json
import joblib
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from config import MODEL_PATH, TEST_DATA_PATH, METRICS_PATH, EVALUATION_DIR

def main():
    if not MODEL_PATH.exists() or not TEST_DATA_PATH.exists():
        raise FileNotFoundError("Run train.py after adding the dataset.")

    model = joblib.load(MODEL_PATH)
    test = pd.read_csv(TEST_DATA_PATH, index_col=0, parse_dates=True)
    X = test.drop(columns=["income"])
    y = test["income"]
    pred = model.predict(X)

    metrics = {
        "mae": float(mean_absolute_error(y, pred)),
        "rmse": float(mean_squared_error(y, pred) ** 0.5),
        "rolling_mean_baseline_mae": float(
            mean_absolute_error(y, test["rolling_mean_7"])
        ),
        "r2": float(r2_score(y, pred)) if len(y) > 1 else None,
        "test_rows": int(len(y))
    }

    EVALUATION_DIR.mkdir(parents=True, exist_ok=True)
    METRICS_PATH.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    pd.DataFrame({
        "actual_income": y,
        "predicted_income": pred,
        "rolling_mean_baseline": test["rolling_mean_7"]
    }, index=test.index).to_csv(
        EVALUATION_DIR / "predictions_vs_actual.csv", index_label="date"
    )
    print(json.dumps(metrics, indent=2))

if __name__ == "__main__":
    main()

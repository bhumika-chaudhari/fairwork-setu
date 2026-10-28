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

    mae = float(mean_absolute_error(y, pred))
    rmse = float(mean_squared_error(y, pred) ** 0.5)
    r2 = float(r2_score(y, pred)) if len(y) > 1 else None
    rolling_mae = float(mean_absolute_error(y, test["rolling_mean_7"]))

    # Historical Baseline Single Random Forest Reference
    baseline_single_rf_mae = 76.60
    baseline_single_rf_rmse = 123.25
    baseline_single_rf_r2 = 0.5594

    metrics = {
        "model_architecture": "Multi-Model Stacking Regressor (Model 2)",
        "base_models": ["RandomForestRegressor(n=300)", "ExtraTreesRegressor(n=250)", "GradientBoostingRegressor(n=120)", "Ridge(alpha=15.0)"],
        "meta_learner": "Ridge(alpha=25.0, positive=True)",
        "mae": round(mae, 2),
        "rmse": round(rmse, 2),
        "r2": round(r2, 4),
        "test_rows": int(len(y)),
        "comparisons": {
            "rolling_mean_7_sma_mae": round(rolling_mae, 2),
            "sma_error_reduction_pct": f"{((rolling_mae - mae) / rolling_mae) * 100:.1f}%",
            "baseline_single_rf_mae": baseline_single_rf_mae,
            "baseline_single_rf_rmse": baseline_single_rf_rmse,
            "baseline_single_rf_r2": baseline_single_rf_r2,
            "mae_reduction_vs_single_rf_pct": f"{((baseline_single_rf_mae - mae) / baseline_single_rf_mae) * 100:.2f}%",
            "rmse_reduction_vs_single_rf_pct": f"{((baseline_single_rf_rmse - rmse) / baseline_single_rf_rmse) * 100:.2f}%",
            "r2_improvement_vs_single_rf": f"+{r2 - baseline_single_rf_r2:.4f}"
        }
    }

    EVALUATION_DIR.mkdir(parents=True, exist_ok=True)
    METRICS_PATH.write_text(json.dumps(metrics, indent=2), encoding="utf-8")

    pd.DataFrame({
        "actual_income": y,
        "predicted_income": [round(p, 2) for p in pred],
        "rolling_mean_baseline": [round(r, 2) for r in test["rolling_mean_7"]],
        "absolute_error": [round(abs(a - p), 2) for a, p in zip(y, pred)]
    }, index=test.index).to_csv(
        EVALUATION_DIR / "predictions_vs_actual.csv", index_label="date"
    )

    print("\n" + "=" * 65)
    print("       MODEL 2 STACKING REGRESSOR EVALUATION REPORT")
    print("=" * 65)
    print(f"Test MAE:  ₹{metrics['mae']:.2f}  (Baseline Single RF: ₹76.60 -> {metrics['comparisons']['mae_reduction_vs_single_rf_pct']} error cut)")
    print(f"Test RMSE: ₹{metrics['rmse']:.2f}  (Baseline Single RF: ₹123.25 -> {metrics['comparisons']['rmse_reduction_vs_single_rf_pct']} error cut)")
    print(f"Test R²:    {metrics['r2']:.4f}  (Baseline Single RF: 0.5594 -> {metrics['comparisons']['r2_improvement_vs_single_rf']})")
    print(f"SMA Cut:    {metrics['comparisons']['sma_error_reduction_pct']} error cut over 7-Day Moving Average (₹{rolling_mae:.2f})")
    print(f"Evaluated Test Periods: {len(y)} days")
    print(f"Metrics saved to: {METRICS_PATH}")
    print("=" * 65 + "\n")


if __name__ == "__main__":
    main()

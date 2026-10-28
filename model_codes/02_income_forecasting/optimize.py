"""
Hyperparameter Optimization & Model Selection for Model 2 (Income Forecaster)
Evaluates and compares:
1. Naive Benchmark (7-Day Rolling Moving Average)
2. Baseline Single Model (Default Random Forest Regressor)
3. Tuned Random Forest (Time-Series Cross-Validated)
4. Multi-Model Stacking Regressor (RF + ExtraTrees + GradientBoosting + Ridge Meta-Learner)
5. Blended Voting Regressor (Variance-Weighted Ensemble)
"""

import json
import pandas as pd
from sklearn.model_selection import TimeSeriesSplit, KFold, GridSearchCV
from sklearn.ensemble import (
    RandomForestRegressor, GradientBoostingRegressor,
    ExtraTreesRegressor, StackingRegressor, VotingRegressor
)
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from config import (
    RAW_DATA_PATH, DATE_COLUMN, TARGET_COLUMN, FREQUENCY,
    TEST_SIZE, EVALUATION_DIR
)
from preprocessing import prepare_series, make_features


def run_optimization():
    print("=" * 70)
    print("📈 MODEL 2: INCOME FORECASTING HYPERPARAMETER OPTIMIZATION & SELECTION")
    print("=" * 70 + "\n")

    if not RAW_DATA_PATH.exists():
        raise FileNotFoundError(f"Dataset not found: {RAW_DATA_PATH}")

    series = prepare_series(pd.read_csv(RAW_DATA_PATH), DATE_COLUMN, TARGET_COLUMN, FREQUENCY)
    features = make_features(series)
    split = int(len(features) * (1 - TEST_SIZE))

    X_train = features.drop(columns=["income"]).iloc[:split]
    y_train = features["income"].iloc[:split]
    X_test = features.drop(columns=["income"]).iloc[split:]
    y_test = features["income"].iloc[split:]

    # 1. NAIVE BENCHMARK (7-Day Moving Average)
    print("Evaluating 1. Naive Baseline (7-Day Simple Moving Average)...")
    baseline_sma_preds = features["rolling_mean_7"].iloc[split:]
    sma_mae = float(mean_absolute_error(y_test, baseline_sma_preds))
    sma_rmse = float(mean_squared_error(y_test, baseline_sma_preds) ** 0.5)
    print(f"   -> SMA Baseline: MAE = ₹{sma_mae:.2f} | RMSE = ₹{sma_rmse:.2f}\n")

    # 2. BASELINE SINGLE MODEL (Default Random Forest)
    print("Evaluating 2. Baseline Single Model (Default Random Forest Regressor)...")
    rf_base = RandomForestRegressor(n_estimators=300, min_samples_leaf=2, random_state=42, n_jobs=-1)
    rf_base.fit(X_train, y_train)
    rf_base_preds = rf_base.predict(X_test)
    base_mae = float(mean_absolute_error(y_test, rf_base_preds))
    base_rmse = float(mean_squared_error(y_test, rf_base_preds) ** 0.5)
    base_r2 = float(r2_score(y_test, rf_base_preds))
    print(f"   -> Baseline RF: MAE = ₹{base_mae:.2f} | RMSE = ₹{base_rmse:.2f} | R² = {base_r2:.4f}\n")

    # 3. TIME-SERIES HYPERPARAMETER TUNING
    print("Running 3. TimeSeriesSplit Hyperparameter Search on Random Forest...")
    tscv = TimeSeriesSplit(n_splits=4)
    param_grid = {
        "n_estimators": [150, 250, 300],
        "max_depth": [4, 6, 8],
        "min_samples_leaf": [2, 4]
    }
    grid_search = GridSearchCV(
        RandomForestRegressor(random_state=42, n_jobs=-1),
        param_grid,
        cv=tscv,
        scoring="neg_mean_absolute_error",
        n_jobs=-1
    )
    grid_search.fit(X_train, y_train)
    tuned_rf = grid_search.best_estimator_
    tuned_preds = tuned_rf.predict(X_test)
    tuned_mae = float(mean_absolute_error(y_test, tuned_preds))
    tuned_rmse = float(mean_squared_error(y_test, tuned_preds) ** 0.5)
    tuned_r2 = float(r2_score(y_test, tuned_preds))
    print(f"   -> Best Params: {grid_search.best_params_}")
    print(f"   -> Tuned RF: MAE = ₹{tuned_mae:.2f} | RMSE = ₹{tuned_rmse:.2f} | R² = {tuned_r2:.4f}\n")

    # 4. MULTI-MODEL STACKING REGRESSOR
    print("Evaluating 4. Multi-Model Stacking Regressor (RF + ExtraTrees + GradientBoosting + Ridge)...")
    rf_comp = RandomForestRegressor(n_estimators=300, min_samples_leaf=2, max_depth=6, random_state=42)
    et_comp = ExtraTreesRegressor(n_estimators=250, min_samples_leaf=2, max_depth=6, random_state=42)
    gb_comp = GradientBoostingRegressor(n_estimators=120, learning_rate=0.05, max_depth=3, min_samples_leaf=2, random_state=42)
    ridge_comp = Ridge(alpha=15.0, random_state=42)

    stacking_reg = StackingRegressor(
        estimators=[
            ("rf", rf_comp),
            ("et", et_comp),
            ("gb", gb_comp),
            ("ridge", ridge_comp)
        ],
        final_estimator=Ridge(alpha=25.0, positive=True, random_state=42),
        cv=KFold(n_splits=4, shuffle=False)
    )
    stacking_reg.fit(X_train, y_train)
    stack_preds = stacking_reg.predict(X_test)
    stack_mae = float(mean_absolute_error(y_test, stack_preds))
    stack_rmse = float(mean_squared_error(y_test, stack_preds) ** 0.5)
    stack_r2 = float(r2_score(y_test, stack_preds))
    print(f"   -> Stacking Regressor: MAE = ₹{stack_mae:.2f} | RMSE = ₹{stack_rmse:.2f} | R² = {stack_r2:.4f}\n")

    # 5. BLENDED VOTING REGRESSOR
    print("Evaluating 5. Blended Voting Regressor (Variance-Weighted)...")
    voting_reg = VotingRegressor(
        estimators=[
            ("rf", rf_comp),
            ("et", et_comp),
            ("gb", gb_comp),
            ("ridge", ridge_comp)
        ],
        weights=[1.5, 1.5, 0.5, 0.5]
    )
    voting_reg.fit(X_train, y_train)
    vote_preds = voting_reg.predict(X_test)
    vote_mae = float(mean_absolute_error(y_test, vote_preds))
    vote_rmse = float(mean_squared_error(y_test, vote_preds) ** 0.5)
    vote_r2 = float(r2_score(y_test, vote_preds))
    print(f"   -> Blended Regressor: MAE = ₹{vote_mae:.2f} | RMSE = ₹{vote_rmse:.2f} | R² = {vote_r2:.4f}\n")

    # SUMMARY OUTPUT
    results = {
        "naive_baseline_sma": {
            "name": "7-Day Simple Moving Average",
            "mae": round(sma_mae, 2),
            "rmse": round(sma_rmse, 2)
        },
        "baseline_single_model": {
            "name": "Single Random Forest Regressor (Baseline)",
            "mae": round(base_mae, 2),
            "rmse": round(base_rmse, 2),
            "r2": round(base_r2, 4),
            "reduction_vs_sma": f"{((sma_mae - base_mae) / sma_mae) * 100:.1f}% error cut"
        },
        "tuned_single_model": {
            "name": "Tuned Random Forest Regressor",
            "best_params": grid_search.best_params_,
            "mae": round(tuned_mae, 2),
            "rmse": round(tuned_rmse, 2),
            "r2": round(tuned_r2, 4)
        },
        "stacking_ensemble": {
            "name": "Multi-Model Stacking Regressor (RF + ET + GB + Ridge)",
            "mae": round(stack_mae, 2),
            "rmse": round(stack_rmse, 2),
            "r2": round(stack_r2, 4),
            "reduction_vs_baseline": f"{((base_mae - stack_mae) / base_mae) * 100:.2f}% error cut",
            "reduction_vs_sma": f"{((sma_mae - stack_mae) / sma_mae) * 100:.1f}% error cut"
        },
        "blended_ensemble": {
            "name": "Variance-Weighted Blended Regressor",
            "weights": [1.5, 1.5, 0.5, 0.5],
            "mae": round(vote_mae, 2),
            "rmse": round(vote_rmse, 2),
            "r2": round(vote_r2, 4),
            "reduction_vs_baseline": f"{((base_mae - vote_mae) / base_mae) * 100:.2f}% error cut"
        }
    }

    EVALUATION_DIR.mkdir(parents=True, exist_ok=True)
    out_file = EVALUATION_DIR / "optimization_results.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    print("=" * 70)
    print(f"🎉 Optimization Complete! Results saved to: {out_file}")
    print(f"MAE Progression:  SMA: ₹{sma_mae:.2f} -> Baseline RF: ₹{base_mae:.2f} -> Ensemble: ₹{vote_mae:.2f}")
    print(f"RMSE Progression: Baseline RF: ₹{base_rmse:.2f} -> Ensemble: ₹{vote_rmse:.2f}")
    print(f"R² Progression:   Baseline RF: {base_r2:.4f} -> Ensemble: {vote_r2:.4f}")
    print("=" * 70)


if __name__ == "__main__":
    run_optimization()

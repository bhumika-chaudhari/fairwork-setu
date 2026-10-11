"""
=================================================================================
FairWork Setu - Standalone AI/ML Demonstration
Model 1: Linear Regression — Financial Cash-Flow Prediction
=================================================================================
Academic Project Demonstration for College Evaluation.
This is a standalone, independent script designed to illustrate the methodology,
feature engineering, training, and evaluation of Ordinary Least Squares (OLS)
Linear Regression for informal gig worker cash-flow forecasting.

NOTE: This model is completely decoupled from the production application.
It utilizes reproducible, clearly labeled synthetic benchmark data simulating
urban Indian gig worker financial profiles (delivery riders, auto drivers, etc.).
=================================================================================
"""

import sys
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


def generate_synthetic_cashflow_data(num_samples: int = 600, random_seed: int = 42) -> pd.DataFrame:
    """
    Generates a reproducible synthetic dataset reflecting realistic financial
    and operational dynamics of Indian gig economy platform workers.

    Features:
    - hours_worked: Active duty hours per day (4 to 14 hrs)
    - trips_completed: Number of gigs / rides / delivery orders completed (5 to 30)
    - daily_gross_income: Daily revenue earned in INR (₹)
    - daily_expense: Daily operational and living expenses in INR (₹)
    - fuel_transport_cost: Transportation / fuel cost component in INR (₹)
    - fuel_expense_ratio: Ratio of fuel cost to total daily expense
    - is_weekend: Binary indicator for weekend surge pricing (0 = Weekday, 1 = Weekend)
    - rolling_7d_income_avg: 7-day moving average of previous earnings in INR (₹)
    - target (next_day_net_cashflow): Net retained savings / cash flow for following day in INR (₹)
    """
    np.random.seed(random_seed)

    # 1. Operational workload features
    hours_worked = np.random.uniform(5.0, 13.0, size=num_samples)
    trips_completed = np.round(hours_worked * np.random.uniform(1.2, 2.3, size=num_samples)).astype(int)
    is_weekend = np.random.binomial(n=1, p=2 / 7, size=num_samples)

    # 2. Earnings dynamics (base rate + trip incentive + weekend boost + stochastic noise)
    base_pay = 250.0
    trip_rate = trips_completed * np.random.uniform(35.0, 55.0, size=num_samples)
    hour_rate = hours_worked * np.random.uniform(25.0, 40.0, size=num_samples)
    weekend_bonus = is_weekend * np.random.uniform(150.0, 300.0, size=num_samples)
    noise_inc = np.random.normal(0, 50.0, size=num_samples)

    daily_gross_income = np.round(base_pay + trip_rate + hour_rate + weekend_bonus + noise_inc, 2)
    daily_gross_income = np.maximum(daily_gross_income, 300.0)  # Minimum floor

    # 3. Expense dynamics (fuel driven by trips, plus daily food and maintenance)
    fuel_transport_cost = np.round(trips_completed * np.random.uniform(9.0, 15.0, size=num_samples) + np.random.normal(0, 15.0, size=num_samples), 2)
    fuel_transport_cost = np.maximum(fuel_transport_cost, 60.0)

    food_living_cost = np.random.uniform(100.0, 220.0, size=num_samples)
    misc_platform_cost = np.random.uniform(20.0, 60.0, size=num_samples)
    daily_expense = np.round(fuel_transport_cost + food_living_cost + misc_platform_cost, 2)

    fuel_expense_ratio = np.round(fuel_transport_cost / daily_expense, 4)

    # 4. 7-Day Rolling income approximation (smoothed historical baseline)
    rolling_7d_income_avg = np.round(daily_gross_income * 0.7 + np.random.normal(daily_gross_income.mean(), 80.0, size=num_samples) * 0.3, 2)

    # 5. Target Variable: Next-day net cash flow (₹)
    # Ground-truth relationship: Net Cash Flow = (Income - Expense) with temporal carryover and slight operational friction
    daily_net_today = daily_gross_income - daily_expense
    next_day_net_cashflow = (
        0.55 * daily_net_today
        + 0.30 * (rolling_7d_income_avg - daily_expense)
        + 15.0 * hours_worked
        - 8.0 * trips_completed
        + 45.0 * is_weekend
        + np.random.normal(0, 45.0, size=num_samples)
    )
    next_day_net_cashflow = np.round(next_day_net_cashflow, 2)

    df = pd.DataFrame({
        "hours_worked": np.round(hours_worked, 1),
        "trips_completed": trips_completed,
        "is_weekend": is_weekend,
        "daily_gross_income": daily_gross_income,
        "daily_expense": daily_expense,
        "fuel_transport_cost": fuel_transport_cost,
        "fuel_expense_ratio": fuel_expense_ratio,
        "rolling_7d_income_avg": rolling_7d_income_avg,
        "next_day_net_cashflow": next_day_net_cashflow,
    })

    return df


def train_and_evaluate_linear_regression():
    print("=" * 80)
    print("FAIRWORK SETU — MODEL 1: LINEAR REGRESSION (CASH-FLOW PREDICTION)")
    print("Status: Standalone Demonstration Script (Academic Evaluation)")
    print("=" * 80)

    # Step 1: Data Acquisition
    print("\n[Step 1] Generating synthetic benchmark dataset...")
    df = generate_synthetic_cashflow_data(num_samples=600, random_seed=42)
    print(f"  -> Generated {len(df)} records simulating daily gig worker profiles.")
    print(f"  -> Feature summary:")
    print(df.describe().round(2).to_string())

    # Step 2: Feature Matrix and Target Separation
    feature_columns = [
        "hours_worked",
        "trips_completed",
        "is_weekend",
        "daily_gross_income",
        "daily_expense",
        "fuel_transport_cost",
        "fuel_expense_ratio",
        "rolling_7d_income_avg",
    ]
    target_column = "next_day_net_cashflow"

    X = df[feature_columns]
    y = df[target_column]

    # Step 3: Train / Test Split (80% Training, 20% Testing)
    print("\n[Step 2] Performing Train/Test Split (80/20)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42
    )
    print(f"  -> Training Samples: {X_train.shape[0]}")
    print(f"  -> Testing Samples:  {X_test.shape[0]}")

    # Step 4: Feature Standardization (Z-score Scaling)
    print("\n[Step 3] Standardizing features using StandardScaler...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Step 5: Model Training
    print("\n[Step 4] Fitting Ordinary Least Squares (OLS) Linear Regression model...")
    model = LinearRegression(fit_intercept=True)
    model.fit(X_train_scaled, y_train)

    # Step 6: Model Evaluation on Test Set
    print("\n[Step 5] Evaluating model performance on unseen test set...")
    y_pred = model.predict(X_test_scaled)

    mae = mean_absolute_error(y_test, y_pred)
    mse = mean_squared_error(y_test, y_pred)
    rmse = np.sqrt(mse)
    r2 = r2_score(y_test, y_pred)

    n = len(y_test)
    p = X.shape[1]
    adj_r2 = 1 - (1 - r2) * (n - 1) / (n - p - 1)

    print("-" * 50)
    print("  MODEL EVALUATION METRICS:")
    print(f"  - Mean Absolute Error (MAE):     ₹{mae:.2f}")
    print(f"  - Mean Squared Error (MSE):      ₹{mse:.2f}")
    print(f"  - Root Mean Squared Error (RMSE): ₹{rmse:.2f}")
    print(f"  - R² Score (Variance Explained): {r2:.4f} ({r2 * 100:.2f}%)")
    print(f"  - Adjusted R² Score:             {adj_r2:.4f}")
    print("-" * 50)

    # Step 7: Feature Coefficient Analysis
    print("\n[Step 6] Analyzing Feature Coefficients (Standardized Impact):")
    coef_df = pd.DataFrame({
        "Feature": feature_columns,
        "Coefficient (Beta)": model.coef_,
        "Absolute Impact": np.abs(model.coef_),
    }).sort_values(by="Absolute Impact", ascending=False)

    print(f"  Model Intercept (Baseline Net Cash Flow): ₹{model.intercept_:.2f}")
    print(coef_df.to_string(index=False))

    # Step 8: Sample Predictions vs Actual
    print("\n[Step 7] Sample Predictions vs Actual (First 10 Test Cases):")
    comparison_df = pd.DataFrame({
        "Actual (₹)": y_test.values[:10],
        "Predicted (₹)": np.round(y_pred[:10], 2),
        "Abs Error (₹)": np.round(np.abs(y_test.values[:10] - y_pred[:10]), 2),
        "% Error": np.round(np.abs(y_test.values[:10] - y_pred[:10]) / np.maximum(y_test.values[:10], 1) * 100, 1),
    })
    print(comparison_df.to_string(index=False))

    # Step 9: Hypothetical Inference Demonstration
    print("\n[Step 8] Live Inference Demonstration for New Worker Profile:")
    sample_worker = pd.DataFrame([{
        "hours_worked": 10.5,
        "trips_completed": 19,
        "is_weekend": 1,
        "daily_gross_income": 1150.0,
        "daily_expense": 380.0,
        "fuel_transport_cost": 240.0,
        "fuel_expense_ratio": 240.0 / 380.0,
        "rolling_7d_income_avg": 980.0,
    }])

    sample_scaled = scaler.transform(sample_worker)
    predicted_cashflow = model.predict(sample_scaled)[0]

    print("  Worker Input:")
    for k, v in sample_worker.iloc[0].items():
        print(f"    • {k}: {v}")
    print(f"\n  🎯 PREDICTED NEXT-DAY NET CASH FLOW: ₹{predicted_cashflow:.2f}")
    if predicted_cashflow > 400:
        print("  💡 Financial Recommendation: Healthy positive cash flow projected. Suggest transferring surplus to liquid emergency reserve.")
    elif predicted_cashflow > 0:
        print("  💡 Financial Recommendation: Moderate cash flow. Maintain fuel expense cap to preserve daily net buffer.")
    else:
        print("  ⚠️ Financial Warning: Negative net cash flow projected. Recommend limiting non-essential expenditure.")

    print("\n" + "=" * 80)
    print("Linear Regression demonstration completed successfully.")
    print("=" * 80)


if __name__ == "__main__":
    train_and_evaluate_linear_regression()

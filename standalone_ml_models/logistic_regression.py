"""
=================================================================================
FairWork Setu - Standalone AI/ML Demonstration
Model 2: Logistic Regression — Budget-Overrun Risk Classification
=================================================================================
Academic Project Demonstration for College Evaluation.
This is a standalone, independent script designed to illustrate the methodology,
feature engineering, training, and evaluation of Logistic Regression for
binary classification of financial deficit / budget-overrun risk among informal workers.

NOTE: This model is completely decoupled from the production application.
It utilizes reproducible, clearly labeled synthetic benchmark data simulating
urban Indian gig worker financial profiles.
=================================================================================
"""

import sys
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report,
)


def generate_synthetic_budget_data(num_samples: int = 600, random_seed: int = 42) -> pd.DataFrame:
    """
    Generates a reproducible synthetic dataset for gig worker budget overrun classification.

    Features:
    - daily_income: Total earnings earned in INR (₹)
    - daily_expense: Everyday operational & living expenses in INR (₹)
    - expense_income_ratio: Ratio of expenses to income
    - emergency_cost: Unplanned emergency or repair expense in INR (₹)
    - daily_emi_obligation: Fixed daily debt / chit-fund / rent commitment in INR (₹)
    - liquid_savings_buffer: Readily accessible cash reserve in INR (₹)
    - platform_target_missed: Binary flag (1 = target missed due to rain/traffic/app, 0 = achieved)

    Target:
    - budget_overrun_risk: Binary indicator (1 = High Risk of Deficit/Overrun, 0 = Financially Stable)
    """
    np.random.seed(random_seed)

    # 1. Earnings and expense generation
    daily_income = np.random.normal(loc=900.0, scale=280.0, size=num_samples)
    daily_income = np.clip(daily_income, 350.0, 1800.0)

    daily_expense = np.random.normal(loc=480.0, scale=170.0, size=num_samples)
    daily_expense = np.clip(daily_expense, 180.0, 1100.0)

    expense_income_ratio = np.round(daily_expense / daily_income, 4)

    # 2. Emergency costs (e.g. tyre puncture, medical syrup, phone repair) occurring with 22% probability
    has_emergency = np.random.binomial(n=1, p=0.22, size=num_samples)
    emergency_cost = np.where(has_emergency == 1, np.random.uniform(150.0, 750.0, size=num_samples), 0.0)
    emergency_cost = np.round(emergency_cost, 2)

    # 3. Daily debt / chit-fund EMI obligation
    daily_emi_obligation = np.random.choice([0.0, 50.0, 100.0, 150.0, 220.0], size=num_samples, p=[0.25, 0.25, 0.25, 0.15, 0.10])

    # 4. Liquid savings buffer (cash on hand or digital balance)
    liquid_savings_buffer = np.random.exponential(scale=650.0, size=num_samples)
    liquid_savings_buffer = np.round(np.clip(liquid_savings_buffer, 0.0, 3500.0), 2)

    # 5. Platform incentive missed flag
    platform_target_missed = np.random.binomial(n=1, p=0.30, size=num_samples)

    # 6. Latent Deficit Score & Target Label Calculation
    # Deficit occurs when total outflows exceed total inflows, mediated by available savings buffer
    total_outflows = daily_expense + emergency_cost + daily_emi_obligation
    net_daily_gap = total_outflows - daily_income

    # Log-odds calculation: positive net gap, high ratio, low savings increase overrun probability
    log_odds = (
        2.5 * (expense_income_ratio - 0.75)
        + 0.003 * net_daily_gap
        + 0.002 * emergency_cost
        + 0.003 * daily_emi_obligation
        - 0.0018 * liquid_savings_buffer
        + 0.65 * platform_target_missed
        - 0.40  # Prior calibration
    )

    # Sigmoid function P(Y=1)
    probabilities = 1.0 / (1.0 + np.exp(-log_odds))
    budget_overrun_risk = (probabilities >= 0.50).astype(int)

    df = pd.DataFrame({
        "daily_income": np.round(daily_income, 2),
        "daily_expense": np.round(daily_expense, 2),
        "expense_income_ratio": expense_income_ratio,
        "emergency_cost": emergency_cost,
        "daily_emi_obligation": daily_emi_obligation,
        "liquid_savings_buffer": liquid_savings_buffer,
        "platform_target_missed": platform_target_missed,
        "budget_overrun_risk": budget_overrun_risk,
    })

    return df


def train_and_evaluate_logistic_regression():
    print("=" * 80)
    print("FAIRWORK SETU — MODEL 2: LOGISTIC REGRESSION (BUDGET OVERRUN CLASSIFICATION)")
    print("Status: Standalone Demonstration Script (Academic Evaluation)")
    print("=" * 80)

    # Step 1: Data Generation
    print("\n[Step 1] Generating synthetic benchmark budget dataset...")
    df = generate_synthetic_budget_data(num_samples=600, random_seed=42)
    print(f"  -> Generated {len(df)} financial records.")

    # Target class distribution
    class_counts = df["budget_overrun_risk"].value_counts()
    print("  -> Class Distribution:")
    print(f"     Class 0 (Stable / Within Budget): {class_counts.get(0, 0)} ({class_counts.get(0, 0)/len(df)*100:.1f}%)")
    print(f"     Class 1 (Budget Overrun Risk):    {class_counts.get(1, 0)} ({class_counts.get(1, 0)/len(df)*100:.1f}%)")

    # Step 2: Feature Matrix and Target Definition
    feature_columns = [
        "daily_income",
        "daily_expense",
        "expense_income_ratio",
        "emergency_cost",
        "daily_emi_obligation",
        "liquid_savings_buffer",
        "platform_target_missed",
    ]
    target_column = "budget_overrun_risk"

    X = df[feature_columns]
    y = df[target_column]

    # Step 3: Stratified Train/Test Split (80% Train, 20% Test)
    print("\n[Step 2] Splitting into Stratified Train/Test sets (80/20)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"  -> Training Samples: {X_train.shape[0]} (Overrun cases: {y_train.sum()})")
    print(f"  -> Testing Samples:  {X_test.shape[0]} (Overrun cases: {y_test.sum()})")

    # Step 4: Standardization
    print("\n[Step 3] Standardizing continuous features using StandardScaler...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Step 5: Model Training
    print("\n[Step 4] Fitting Logistic Regression with L2 regularization and balanced weights...")
    model = LogisticRegression(
        penalty="l2",
        C=1.0,
        class_weight="balanced",
        solver="lbfgs",
        max_iter=1000,
        random_state=42,
    )
    model.fit(X_train_scaled, y_train)

    # Step 6: Evaluation on Test Data
    print("\n[Step 5] Evaluating classifier on unseen test set...")
    y_pred = model.predict(X_test_scaled)
    y_pred_proba = model.predict_proba(X_test_scaled)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    roc_auc = roc_auc_score(y_test, y_pred_proba)
    cm = confusion_matrix(y_test, y_pred)

    print("-" * 50)
    print("  MODEL EVALUATION METRICS:")
    print(f"  - Accuracy:                 {acc:.4f} ({acc * 100:.2f}%)")
    print(f"  - Precision (Class 1 Risk): {prec:.4f}")
    print(f"  - Recall (Class 1 Risk):    {rec:.4f}")
    print(f"  - F1-Score:                 {f1:.4f}")
    print(f"  - ROC-AUC Score:            {roc_auc:.4f}")
    print("-" * 50)

    print("\n[Step 6] Confusion Matrix:")
    print(f"                Predicted Safe (0)   Predicted Overrun (1)")
    print(f"  Actual Safe (0)      TN = {cm[0, 0]:<15} FP = {cm[0, 1]}")
    print(f"  Actual Overrun (1)   FN = {cm[1, 0]:<15} TP = {cm[1, 1]}")

    print("\n[Step 7] Detailed Classification Report:")
    print(classification_report(y_test, y_pred, target_names=["Safe (0)", "Overrun Risk (1)"]))

    # Step 8: Interpretability via Odds Ratios
    print("[Step 8] Model Feature Importance & Odds Ratio Interpretation:")
    odds_ratios = np.exp(model.coef_[0])
    interp_df = pd.DataFrame({
        "Feature": feature_columns,
        "Log-Odds Coef (Beta)": np.round(model.coef_[0], 4),
        "Odds Ratio exp(Beta)": np.round(odds_ratios, 4),
    }).sort_values(by="Odds Ratio exp(Beta)", ascending=False)

    print(interp_df.to_string(index=False))
    print("\n  Statistical Interpretation:")
    print("  • Odds Ratio > 1.0: Increases probability of budget overrun (risk factor).")
    print("  • Odds Ratio < 1.0: Decreases probability of budget overrun (protective buffer).")

    # Step 9: Demonstration Case Studies
    print("\n[Step 9] Case Study Demonstrations (Two Contrasting Profiles):")

    case_studies = pd.DataFrame([
        {
            "daily_income": 620.0,
            "daily_expense": 580.0,
            "expense_income_ratio": 580.0 / 620.0,
            "emergency_cost": 350.0,
            "daily_emi_obligation": 150.0,
            "liquid_savings_buffer": 80.0,
            "platform_target_missed": 1,
        },
        {
            "daily_income": 1250.0,
            "daily_expense": 420.0,
            "expense_income_ratio": 420.0 / 1250.0,
            "emergency_cost": 0.0,
            "daily_emi_obligation": 50.0,
            "liquid_savings_buffer": 1500.0,
            "platform_target_missed": 0,
        },
    ])

    case_scaled = scaler.transform(case_studies)
    case_probs = model.predict_proba(case_scaled)[:, 1]
    case_classes = model.predict(case_scaled)

    for i, row in case_studies.iterrows():
        p = case_probs[i]
        c = case_classes[i]
        label = "🚨 HIGH OVERRUN RISK" if c == 1 else "✅ FINANCIALLY STABLE"
        print(f"\n  --- Worker Profile #{i + 1} ---")
        print(f"  Income: ₹{row['daily_income']}, Expense: ₹{row['daily_expense']}, EMI: ₹{row['daily_emi_obligation']}, Emergency: ₹{row['emergency_cost']}, Savings: ₹{row['liquid_savings_buffer']}")
        print(f"  Predicted Probability of Overrun: {p * 100:.2f}%")
        print(f"  Classification Output: {label}")
        if c == 1:
            print("  Recommended FairWork Action: Alert worker of deficit risk; suggest deferring non-critical tools purchase.")
        else:
            print("  Recommended FairWork Action: Confirm budget healthy; recommend auto-allocating surplus to emergency vault.")

    print("\n" + "=" * 80)
    print("Logistic Regression demonstration completed successfully.")
    print("=" * 80)


if __name__ == "__main__":
    train_and_evaluate_logistic_regression()

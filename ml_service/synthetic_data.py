"""
Synthetic data generator and data preparation utilities for Setu ML Service.
Uses deterministic seeds for reproducible demonstrations.
"""

from datetime import datetime, timedelta
from typing import Any, Dict, List, Tuple
import numpy as np


def generate_synthetic_daily_data(
    num_days: int = 90, seed: int = 42
) -> List[Dict[str, Any]]:
    """
    Generates realistic daily financial history for an Indian gig worker / driver.
    Deterministic random seed ensures reproducible results for evaluation and demonstrations.
    """
    rng = np.random.default_rng(seed)
    start_date = datetime.now() - timedelta(days=num_days)

    records: List[Dict[str, Any]] = []
    running_balance = 3500.0  # Starting cash balance in INR

    for i in range(num_days):
        current_date = start_date + timedelta(days=i)
        dow = current_date.weekday()  # 0=Mon, 6=Sun

        # Weekend boost (Fri, Sat, Sun usually have higher delivery/rides demand)
        is_weekend = dow in (4, 5, 6)
        base_income = 850.0 if is_weekend else 650.0
        income_noise = rng.normal(0, 140.0)
        daily_income = float(max(0.0, round(base_income + income_noise, 2)))

        # Expenses: fuel (daily), food/chai (daily), occasional maintenance/repairs
        fuel = float(rng.uniform(120.0, 220.0))
        food = float(rng.uniform(80.0, 160.0))
        maintenance = float(rng.choice([0.0, 0.0, 0.0, 150.0, 450.0]))
        daily_expense = float(round(fuel + food + maintenance, 2))

        # Monthly rent / subscription deduction every 30 days
        if i % 30 == 0 and i > 0:
            daily_expense += 2200.0

        daily_net = float(round(daily_income - daily_expense, 2))
        running_balance = float(round(max(200.0, running_balance + daily_net), 2))

        records.append(
            {
                "date": current_date.strftime("%Y-%m-%d"),
                "day_index": i,
                "day_of_week": dow,
                "income": daily_income,
                "expense": daily_expense,
                "net": daily_net,
                "balance": running_balance,
            }
        )

    return records


def process_user_transactions(
    transactions: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Aggregates raw user transactions into daily chronological summaries.
    Each transaction expected to have: amount, type ('income'|'expense'), timestamp.
    """
    if not transactions:
        return []

    # Group by date YYYY-MM-DD
    by_date: Dict[str, Dict[str, float]] = {}
    for tx in transactions:
        try:
            ts = tx.get("timestamp") or ""
            dt_str = ts[:10] if len(ts) >= 10 else datetime.now().strftime("%Y-%m-%d")
        except Exception:
            dt_str = datetime.now().strftime("%Y-%m-%d")

        if dt_str not in by_date:
            by_date[dt_str] = {"income": 0.0, "expense": 0.0}

        tx_type = tx.get("type", "expense")
        amount = float(tx.get("amount", 0.0))

        if tx_type == "income":
            by_date[dt_str]["income"] += amount
        else:
            by_date[dt_str]["expense"] += amount

    # Sort chronologically
    sorted_dates = sorted(by_date.keys())
    results: List[Dict[str, Any]] = []
    running_balance = 2000.0

    for idx, d_str in enumerate(sorted_dates):
        inc = round(by_date[d_str]["income"], 2)
        exp = round(by_date[d_str]["expense"], 2)
        net = round(inc - exp, 2)
        running_balance = round(max(0.0, running_balance + net), 2)
        try:
            dow = datetime.strptime(d_str, "%Y-%m-%d").weekday()
        except Exception:
            dow = 0

        results.append(
            {
                "date": d_str,
                "day_index": idx,
                "day_of_week": dow,
                "income": inc,
                "expense": exp,
                "net": net,
                "balance": running_balance,
            }
        )

    return results


def generate_budget_training_dataset(
    num_samples: int = 180, seed: int = 42
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Generates training data for Logistic Regression budget-risk model.
    Features:
      0: daily_expense_mean
      1: expense_volatility (std)
      2: expense_to_income_ratio
      3: max_single_expense_ratio (relative to budget)
      4: budget_amount
      5: burn_rate_projected
    Labels:
      0: Within Budget, 1: Over Budget (exceeded budget limit)
    """
    rng = np.random.default_rng(seed)
    X = np.zeros((num_samples, 6), dtype=np.float32)
    y = np.zeros(num_samples, dtype=np.int32)

    for i in range(num_samples):
        budget = rng.choice([3000.0, 5000.0, 8000.0, 10000.0, 12000.0])
        daily_expense_mean = rng.uniform(80.0, 600.0)
        expense_volatility = rng.uniform(20.0, 250.0)
        daily_income_mean = rng.uniform(300.0, 1200.0)
        ratio = daily_expense_mean / max(daily_income_mean, 10.0)
        max_expense = rng.uniform(daily_expense_mean, daily_expense_mean * 3.5)
        max_single_ratio = max_expense / budget

        # Project 30-day spending
        projected_total = daily_expense_mean * 30 + rng.normal(0, expense_volatility * 4)
        burn_rate = projected_total / budget

        # Label: did projected spending exceed budget?
        # Non-trivial probabilistic boundary with noise
        logit = (burn_rate - 1.0) * 4.5 + (ratio - 0.7) * 2.0
        prob = 1.0 / (1.0 + np.exp(-np.clip(logit, -10, 10)))
        label = 1 if prob >= 0.5 else 0

        X[i] = [
            daily_expense_mean,
            expense_volatility,
            ratio,
            max_single_ratio,
            budget,
            burn_rate,
        ]
        y[i] = label

    return X, y

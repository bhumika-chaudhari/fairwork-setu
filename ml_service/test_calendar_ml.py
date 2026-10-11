import sys
import os
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(__file__))

from synthetic_data import process_user_transactions
from models.linear_regression import linear_model
from models.logistic_regression import logistic_model
from models.lstm_model import lstm_model
from models.kmeans_clustering import kmeans_model

def run_calendar_test():
    print("=== Testing Calendar-Based Multi-Date Transactions Pipeline ===")
    
    # 1. Simulate transactions across different calendar dates including past dates, today, and month boundaries
    test_transactions = [
        # Today
        {
            "id": "tx_today_1",
            "type": "income",
            "amount": 750.0,
            "category": "work_earnings",
            "timestamp": "2026-10-11T10:00:00.000Z",
            "description": "Morning deliveries"
        },
        {
            "id": "tx_today_2",
            "type": "expense",
            "amount": 180.0,
            "category": "travel_fuel",
            "timestamp": "2026-10-11T12:30:00.000Z",
            "description": "Fuel refill"
        },
        # Yesterday
        {
            "id": "tx_yest_1",
            "type": "income",
            "amount": 820.0,
            "category": "work_earnings",
            "timestamp": "2026-10-10T16:00:00.000Z",
            "description": "Ride sharing"
        },
        {
            "id": "tx_yest_2",
            "type": "expense",
            "amount": 120.0,
            "category": "food",
            "timestamp": "2026-10-10T13:00:00.000Z",
            "description": "Lunch"
        },
        # 3 Days Ago
        {
            "id": "tx_3days_1",
            "type": "income",
            "amount": 900.0,
            "category": "work_earnings",
            "timestamp": "2026-10-08T18:00:00.000Z",
            "description": "Electrical gig"
        },
        # Month Boundary: September 30
        {
            "id": "tx_month_boundary_1",
            "type": "income",
            "amount": 650.0,
            "category": "work_earnings",
            "timestamp": "2026-09-30T14:00:00.000Z",
            "description": "End of month job"
        },
        {
            "id": "tx_month_boundary_2",
            "type": "expense",
            "amount": 300.0,
            "category": "tools",
            "timestamp": "2026-09-30T17:00:00.000Z",
            "description": "Tool replacement"
        },
        # Year Boundary: December 31 -> January 1
        {
            "id": "tx_year_boundary_1",
            "type": "income",
            "amount": 1200.0,
            "category": "work_earnings",
            "timestamp": "2025-12-31T20:00:00.000Z",
            "description": "New year eve delivery rush"
        },
        {
            "id": "tx_year_boundary_2",
            "type": "income",
            "amount": 800.0,
            "category": "work_earnings",
            "timestamp": "2026-01-01T11:00:00.000Z",
            "description": "New year day earnings"
        }
    ]

    print(f"Total simulated transactions across calendar dates: {len(test_transactions)}")
    
    # Verify aggregation by date
    daily = process_user_transactions(test_transactions)
    print(f"Processed into {len(daily)} distinct daily buckets.")
    assert len(daily) == 6, f"Expected 6 distinct days, got {len(daily)}"
    
    dates_found = [d["date"] for d in daily]
    print(f"Dates grouped: {dates_found}")
    assert "2026-10-11" in dates_found
    assert "2026-10-10" in dates_found
    assert "2026-10-08" in dates_found
    assert "2026-09-30" in dates_found
    assert "2025-12-31" in dates_found
    assert "2026-01-01" in dates_found

    # Verify Day totals
    oct11 = next(d for d in daily if d["date"] == "2026-10-11")
    assert oct11["income"] == 750.0
    assert oct11["expense"] == 180.0
    assert oct11["net"] == 570.0
    print("✓ Oct 11 Daily Summary Verified: Income=750, Expense=180, Net=570")

    sep30 = next(d for d in daily if d["date"] == "2026-09-30")
    assert sep30["income"] == 650.0
    assert sep30["expense"] == 300.0
    assert sep30["net"] == 350.0
    print("✓ Sept 30 Month Boundary Verified: Income=650, Expense=300, Net=350")

    # 2. Test Model 1: Linear Regression with multi-date transactions
    print("\n--- Testing Model 1: Linear Regression ---")
    lr_pred = linear_model.predict_next_7_days(test_transactions)
    print(f"LR Model Status: {lr_pred.get('status')}, Is Synthetic: {lr_pred.get('is_synthetic')}")
    assert len(lr_pred.get("forecast_7_days", [])) == 7
    print("✓ Linear Regression 7-day forecast generated successfully")

    # 3. Test Model 2: Logistic Regression Budget Risk with multi-date transactions
    print("\n--- Testing Model 2: Logistic Regression ---")
    log_pred = logistic_model.predict_risk(test_transactions, budget_amount=5000.0)
    print(f"Logistic Risk Level: {log_pred.get('risk_level')}, Probability: {log_pred.get('over_budget_probability')}")
    assert "over_budget_probability" in log_pred
    print("✓ Logistic Regression risk evaluated successfully")

    # 4. Test Model 3: PyTorch LSTM Deep Learning Forecast
    print("\n--- Testing Model 3: PyTorch LSTM ---")
    lstm_pred = lstm_model.predict_next_7_days(test_transactions, force_demo=True)
    assert len(lstm_pred.get("forecast_7_days", [])) == 7
    print("✓ LSTM 7-day sequence forecast generated successfully")

    # 5. Test Model 4: K-Means Clustering on multi-date transactions
    print("\n--- Testing Model 4: K-Means Clustering ---")
    km_pred = kmeans_model.predict_clusters(test_transactions)
    assert len(km_pred.get("cluster_summaries", [])) == 3
    print("✓ K-Means pattern discovery executed successfully")

    print("\n>>> ALL CALENDAR TRANSACTION & AI/ML PIPELINE TESTS PASSED! <<<")

if __name__ == "__main__":
    run_calendar_test()

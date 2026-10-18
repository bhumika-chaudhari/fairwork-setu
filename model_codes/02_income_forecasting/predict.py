import argparse
import joblib
import pandas as pd
from config import MODEL_PATH, HISTORY_PATH, FREQUENCY, FORECAST_PERIODS

def main():
    parser = argparse.ArgumentParser(description="Forecast future income.")
    parser.add_argument("--periods", type=int, default=FORECAST_PERIODS)
    args = parser.parse_args()

    if args.periods < 1:
        raise ValueError("--periods must be at least 1.")
    if not MODEL_PATH.exists() or not HISTORY_PATH.exists():
        raise FileNotFoundError("Run train.py after adding the dataset.")

    model = joblib.load(MODEL_PATH)
    history = pd.read_csv(HISTORY_PATH, parse_dates=["date"])
    series = history.set_index("date")["income"].sort_index()

    if len(series) < 14:
        raise ValueError("At least 14 periods of history are required.")

    forecasts = []
    for _ in range(args.periods):
        next_date = pd.date_range(
            start=series.index[-1], periods=2, freq=FREQUENCY
        )[1]
        values = series.to_numpy()
        row = {
            "lag_1": values[-1], "lag_2": values[-2],
            "lag_3": values[-3], "lag_7": values[-7],
            "lag_14": values[-14],
            "rolling_mean_3": values[-3:].mean(),
            "rolling_mean_7": values[-7:].mean(),
            "rolling_mean_14": values[-14:].mean(),
            "period_day": next_date.day,
            "period_month": next_date.month,
            "period_weekday": next_date.dayofweek
        }
        X = pd.DataFrame([row])[model.feature_names_in_]
        prediction = max(0.0, float(model.predict(X)[0]))
        forecasts.append({
            "date": next_date.strftime("%Y-%m-%d"),
            "predicted_income": round(prediction, 2)
        })
        series.loc[next_date] = prediction

    result = pd.DataFrame(forecasts)
    print(result.to_string(index=False))
    output = MODEL_PATH.parent / "income_forecast.csv"
    result.to_csv(output, index=False)
    print("Forecast saved:", output)

if __name__ == "__main__":
    main()

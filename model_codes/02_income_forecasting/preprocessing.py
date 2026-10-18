import pandas as pd

def prepare_series(df, date_column, target_column, frequency="D"):
    missing = [c for c in [date_column, target_column] if c not in df.columns]
    if missing:
        raise ValueError(
            f"Missing columns: {missing}. Available columns: {df.columns.tolist()}"
        )

    data = df[[date_column, target_column]].copy()
    data[date_column] = pd.to_datetime(data[date_column], errors="coerce")
    data[target_column] = pd.to_numeric(data[target_column], errors="coerce")
    data = data.dropna(subset=[date_column, target_column])

    if data.empty:
        raise ValueError("No valid dated income records found.")

    if (data[target_column] < 0).any():
        raise ValueError(
            "Negative values found. Review refunds or adjustments before forecasting."
        )

    series = (
        data.groupby(date_column)[target_column]
        .sum()
        .sort_index()
        .resample(frequency)
        .sum(min_count=1)
        .dropna()
    )
    series.name = "income"
    return series

def make_features(series):
    df = pd.DataFrame({"income": series})
    for lag in (1, 2, 3, 7, 14):
        df[f"lag_{lag}"] = df["income"].shift(lag)
    for window in (3, 7, 14):
        df[f"rolling_mean_{window}"] = (
            df["income"].shift(1).rolling(window).mean()
        )
    df["period_day"] = df.index.day
    df["period_month"] = df.index.month
    df["period_weekday"] = df.index.dayofweek
    return df.dropna()

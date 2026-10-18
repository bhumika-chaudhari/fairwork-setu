import pandas as pd

def clean_dataset(df, target_column):
    if target_column not in df.columns:
        raise ValueError(
            f"Target column '{target_column}' not found. "
            f"Available columns: {df.columns.tolist()}"
        )

    df = df.drop_duplicates().copy()
    df = df.dropna(subset=[target_column])

    # Use all remaining transaction fields as model input.
    feature_columns = [c for c in df.columns if c != target_column]
    if not feature_columns:
        raise ValueError("No feature columns found.")

    # Convert each row's transaction details into one text string.
    X = df[feature_columns].fillna("").astype(str).agg(" ".join, axis=1)
    X = X.str.replace(r"\s+", " ", regex=True).str.strip()
    y = df[target_column].astype(str).str.strip()

    valid = X.ne("") & y.ne("")
    X, y = X[valid], y[valid]

    if len(X) == 0:
        raise ValueError("No usable rows remain after preprocessing.")

    return X, y

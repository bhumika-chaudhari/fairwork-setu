import pandas as pd
from sklearn.impute import SimpleImputer
from config import EXCLUDED_COLUMNS

def select_features(df):
    excluded = [c for c in EXCLUDED_COLUMNS if c in df.columns]
    candidates = df.drop(columns=excluded, errors="ignore")
    numeric = candidates.select_dtypes(include="number").copy()

    if numeric.empty:
        raise ValueError(
            "No numeric transaction features found. "
            "Review the real dataset columns."
        )

    numeric = numeric.replace([float("inf"), float("-inf")], float("nan"))
    numeric = numeric.loc[:, numeric.notna().any(axis=0)]

    if numeric.empty:
        raise ValueError("All candidate numeric features are empty.")

    return numeric

def fit_preprocessor(X):
    imputer = SimpleImputer(strategy="median")
    transformed = imputer.fit_transform(X)
    return imputer, transformed

def transform_features(df, columns, imputer):
    X = df.reindex(columns=columns)
    X = X.apply(pd.to_numeric, errors="coerce")
    X = X.replace([float("inf"), float("-inf")], float("nan"))
    return imputer.transform(X)

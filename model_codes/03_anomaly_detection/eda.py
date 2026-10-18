import pandas as pd
from config import RAW_DATA_PATH, EVALUATION_DIR

def main():
    if not RAW_DATA_PATH.exists():
        print(f"Dataset not found: {RAW_DATA_PATH}")
        print("Add transactions.csv to data/raw when the dataset is ready.")
        return

    df = pd.read_csv(RAW_DATA_PATH)
    EVALUATION_DIR.mkdir(parents=True, exist_ok=True)

    print("Shape:", df.shape)
    print("\nColumns and data types:\n", df.dtypes)
    print("\nMissing values:\n", df.isnull().sum())
    print("\nDuplicate rows:", df.duplicated().sum())
    print("\nSample:\n", df.head(10).to_string())

    numeric = df.select_dtypes(include="number")
    if not numeric.empty:
        print("\nNumeric summary:\n", numeric.describe().to_string())

    summary = (
        f"Shape: {df.shape}\n"
        f"Columns: {df.columns.tolist()}\n"
        f"Missing values:\n{df.isnull().sum()}\n"
        f"Duplicate rows: {df.duplicated().sum()}\n"
    )
    (EVALUATION_DIR / "eda_summary.txt").write_text(
        summary, encoding="utf-8"
    )

if __name__ == "__main__":
    main()

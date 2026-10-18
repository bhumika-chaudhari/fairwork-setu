import pandas as pd
from config import RAW_DATA_PATH, DATE_COLUMN, TARGET_COLUMN, EVALUATION_DIR

def main():
    if not RAW_DATA_PATH.exists():
        print(f"Dataset not found: {RAW_DATA_PATH}")
        print("Add income.csv to data/raw when the dataset is ready.")
        return

    df = pd.read_csv(RAW_DATA_PATH)
    EVALUATION_DIR.mkdir(parents=True, exist_ok=True)

    print("Shape:", df.shape)
    print("\nColumns:\n", df.dtypes)
    print("\nMissing values:\n", df.isnull().sum())
    print("\nDuplicate rows:", df.duplicated().sum())
    print("\nSample:\n", df.head(10).to_string())

    if DATE_COLUMN in df:
        dates = pd.to_datetime(df[DATE_COLUMN], errors="coerce")
        print("\nDate range:", dates.min(), "to", dates.max())
        print("Invalid dates:", dates.isna().sum())

    if TARGET_COLUMN in df:
        income = pd.to_numeric(df[TARGET_COLUMN], errors="coerce")
        print("\nIncome summary:\n", income.describe())

    (EVALUATION_DIR / "eda_summary.txt").write_text(
        f"Shape: {df.shape}\nColumns: {df.columns.tolist()}\n"
        f"Missing values:\n{df.isnull().sum()}\n",
        encoding="utf-8"
    )

if __name__ == "__main__":
    main()

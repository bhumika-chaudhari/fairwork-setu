import pandas as pd
from config import RAW_DATA_PATH, EVALUATION_DIR, TEXT_COLUMN

def main():
    if not RAW_DATA_PATH.exists():
        print(f"Dataset not found: {RAW_DATA_PATH}")
        print("Add transactions.csv when the finalized dataset is ready.")
        return

    df = pd.read_csv(RAW_DATA_PATH)
    EVALUATION_DIR.mkdir(parents=True, exist_ok=True)

    print("Shape:", df.shape)
    print("\nColumns:\n", df.dtypes)
    print("\nMissing values:\n", df.isnull().sum())
    print("\nDuplicate rows:", df.duplicated().sum())
    print("\nSample:\n", df.head(10).to_string())

    if TEXT_COLUMN in df.columns:
        print("\nEmpty text records:",
              df[TEXT_COLUMN].fillna("").astype(str).str.strip().eq("").sum())

    summary = (
        f"Shape: {df.shape}\n"
        f"Columns: {df.columns.tolist()}\n"
        f"Missing values:\n{df.isnull().sum()}\n"
    )
    (EVALUATION_DIR / "eda_summary.txt").write_text(
        summary, encoding="utf-8"
    )

if __name__ == "__main__":
    main()

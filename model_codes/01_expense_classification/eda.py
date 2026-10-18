import pandas as pd
from config import RAW_DATA_PATH, TARGET_COLUMN, EVALUATION_DIR

def main():
    if not RAW_DATA_PATH.exists():
        print(f"Dataset not found: {RAW_DATA_PATH}")
        print("Place your CSV in data/raw/ and name it transactions.csv.")
        return

    df = pd.read_csv(RAW_DATA_PATH)
    EVALUATION_DIR.mkdir(parents=True, exist_ok=True)

    print("\n--- DATASET SHAPE ---")
    print(df.shape)

    print("\n--- COLUMN NAMES ---")
    print(df.columns.tolist())

    print("\n--- DATA TYPES ---")
    print(df.dtypes)

    print("\n--- MISSING VALUES ---")
    print(df.isnull().sum())

    print("\n--- DUPLICATE ROWS ---")
    print(df.duplicated().sum())

    print("\n--- SAMPLE ROWS ---")
    print(df.head(10).to_string())

    if TARGET_COLUMN in df.columns:
        print("\n--- TARGET CLASS COUNTS ---")
        print(df[TARGET_COLUMN].value_counts(dropna=False))
    else:
        print(f"\nTarget column '{TARGET_COLUMN}' not found.")
        print("Update TARGET_COLUMN in config.py after checking the columns.")

    report = EVALUATION_DIR / "eda_summary.txt"
    with report.open("w", encoding="utf-8") as f:
        f.write(f"Shape: {df.shape}\n\n")
        f.write(f"Columns:\n{df.dtypes.to_string()}\n\n")
        f.write(f"Missing values:\n{df.isnull().sum().to_string()}\n")
        f.write(f"\nDuplicate rows: {df.duplicated().sum()}\n")

    print(f"\nEDA summary saved to: {report}")

if __name__ == "__main__":
    main()

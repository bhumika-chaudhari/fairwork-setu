import pandas as pd
from config import RAW_DATA_PATH, TEXT_COLUMN, PROCESSED_DIR
from preprocessing import prepare_dataset

def main():
    if not RAW_DATA_PATH.exists():
        raise FileNotFoundError(
            f"Dataset not found: {RAW_DATA_PATH}. "
            "Add the finalized transaction dataset first."
        )

    df = pd.read_csv(RAW_DATA_PATH)
    result = prepare_dataset(df, TEXT_COLUMN)

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    output_path = PROCESSED_DIR / "extracted_transactions.csv"
    result.to_csv(output_path, index=False)

    print("Processed records:", len(result))
    print("Saved:", output_path)
    print("\nExtracted sample:")
    print(result.head(10).to_string(index=False))

if __name__ == "__main__":
    main()

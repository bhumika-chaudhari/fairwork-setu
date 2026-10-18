import pandas as pd
from config import WORKER_DATA_PATH, COURSE_DATA_PATH

def inspect_dataset(path):
    if not path.exists():
        print(f"Dataset not found: {path}")
        return

    df = pd.read_csv(path)
    print(f"\nDataset: {path.name}")
    print("Shape:", df.shape)
    print("\nColumns:\n", df.dtypes)
    print("\nMissing values:\n", df.isnull().sum())
    print("\nDuplicate rows:", df.duplicated().sum())
    print("\nSample:\n", df.head(10).to_string())

def main():
    inspect_dataset(WORKER_DATA_PATH)
    inspect_dataset(COURSE_DATA_PATH)

if __name__ == "__main__":
    main()

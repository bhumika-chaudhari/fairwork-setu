import argparse
import pandas as pd
from sentence_transformers import SentenceTransformer

from config import MODEL_NAME, RAW_DATA_PATH, TOP_K, WORKER_DATA_PATH
from preprocessing import prepare_jobs, prepare_workers
from match import match_jobs

def main():
    parser = argparse.ArgumentParser(
        description="Recommend suitable jobs for a Setu worker."
    )
    parser.add_argument("--worker-id", required=True)
    parser.add_argument("--top-k", type=int, default=TOP_K)
    args = parser.parse_args()

    if args.top_k < 1:
        raise ValueError("--top-k must be at least 1.")

    if not RAW_DATA_PATH.exists() or not WORKER_DATA_PATH.exists():
        raise FileNotFoundError(
            "Add jobs.csv and workers.csv to data/raw before prediction."
        )

    jobs = prepare_jobs(pd.read_csv(RAW_DATA_PATH))
    workers = prepare_workers(pd.read_csv(WORKER_DATA_PATH))

    selected = workers[
        workers["worker_id"].astype(str).str.lower() == str(args.worker_id).strip().lower()
    ]
    if selected.empty:
        raise ValueError(f"Worker ID not found: {args.worker_id}")

    model = SentenceTransformer(MODEL_NAME)
    recommendations = match_jobs(
        selected.iloc[0], jobs, model, args.top_k
    )

    if recommendations.empty:
        print("No matching jobs found.")
        return

    columns = [
        "job_id", "title", "location",
        "employment_type", "match_percentage"
    ]
    print(recommendations[columns].to_string(index=False))

if __name__ == "__main__":
    main()

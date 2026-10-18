import argparse
import pandas as pd
from sentence_transformers import SentenceTransformer

from config import WORKER_DATA_PATH, COURSE_DATA_PATH, MODEL_NAME, TOP_K
from preprocessing import prepare_workers, prepare_courses
from recommend import recommend_courses

def main():
    parser = argparse.ArgumentParser(
        description="Recommend skill-building courses for a Setu worker."
    )
    parser.add_argument("--worker-id", required=True)
    parser.add_argument("--top-k", type=int, default=TOP_K)
    args = parser.parse_args()

    if args.top_k < 1:
        raise ValueError("--top-k must be at least 1.")

    if not WORKER_DATA_PATH.exists() or not COURSE_DATA_PATH.exists():
        raise FileNotFoundError(
            "Add workers.csv and courses.csv to data/raw first."
        )

    workers = prepare_workers(pd.read_csv(WORKER_DATA_PATH))
    courses = prepare_courses(pd.read_csv(COURSE_DATA_PATH))

    selected = workers[
        workers["worker_id"].astype(str).str.lower() == str(args.worker_id).strip().lower()
    ]
    if selected.empty:
        raise ValueError(f"Worker ID not found: {args.worker_id}")

    worker = selected.iloc[0]
    model = SentenceTransformer(MODEL_NAME)
    results = recommend_courses(worker, courses, model, args.top_k)

    if results.empty:
        print("No course recommendations found.")
        return

    columns = [
        "course_id", "title", "provider",
        "matched_skills", "match_percentage", "course_url"
    ]
    print(results[columns].to_string(index=False))

if __name__ == "__main__":
    main()

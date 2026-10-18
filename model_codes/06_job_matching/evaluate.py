import json
import pandas as pd
from config import RAW_DATA_PATH, WORKER_DATA_PATH, EVALUATION_DIR
from preprocessing import prepare_jobs, prepare_workers
from sentence_transformers import SentenceTransformer
from match import match_jobs

def reciprocal_rank(recommendations, relevant_job_ids):
    for rank, job_id in enumerate(recommendations["job_id"], start=1):
        if str(job_id) in relevant_job_ids:
            return 1.0 / rank
    return 0.0

def main():
    if not RAW_DATA_PATH.exists() or not WORKER_DATA_PATH.exists():
        raise FileNotFoundError(
            "Evaluation requires jobs.csv and workers.csv."
        )

    jobs = prepare_jobs(pd.read_csv(RAW_DATA_PATH))
    workers = prepare_workers(pd.read_csv(WORKER_DATA_PATH))

    # Relevance labels must be provided by reviewed human judgments.
    # Expected file: evaluation/relevance_labels.csv
    labels_path = EVALUATION_DIR / "relevance_labels.csv"
    if not labels_path.exists():
        print("Missing evaluation/relevance_labels.csv")
        print("Create it with columns: worker_id,job_id,relevant")
        print("Use relevant=1 for relevant jobs and 0 otherwise.")
        return

    labels = pd.read_csv(labels_path)
    required = {"worker_id", "job_id", "relevant"}
    if not required.issubset(labels.columns):
        raise ValueError(f"Labels must contain columns: {sorted(required)}")

    model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    reciprocal_ranks = []
    precisions = []

    for _, worker in workers.iterrows():
        worker_id = str(worker["worker_id"]).strip().lower()
        worker_labels = labels[
            (labels["worker_id"].astype(str).str.strip().str.lower() == worker_id) &
            (labels["relevant"] == 1)
        ]
        relevant_ids = set(worker_labels["job_id"].astype(str).str.strip().str.lower())
        if not relevant_ids:
            continue

        ranked = match_jobs(worker, jobs, model, top_k=5)
        ranked_ids = ranked["job_id"].astype(str).str.strip().str.lower().tolist()

        reciprocal_ranks.append(reciprocal_rank(ranked, relevant_ids))
        precisions.append(
            sum(job_id in relevant_ids for job_id in ranked_ids) /
            max(1, len(ranked_ids))
        )

    if not reciprocal_ranks:
        print("No workers with positive relevance labels to evaluate.")
        return

    metrics = {
        "evaluated_workers": len(reciprocal_ranks),
        "mean_reciprocal_rank": sum(reciprocal_ranks) / len(reciprocal_ranks),
        "precision_at_5": sum(precisions) / len(precisions)
    }

    EVALUATION_DIR.mkdir(parents=True, exist_ok=True)
    (EVALUATION_DIR / "metrics.json").write_text(
        json.dumps(metrics, indent=2), encoding="utf-8"
    )
    print(json.dumps(metrics, indent=2))

if __name__ == "__main__":
    main()

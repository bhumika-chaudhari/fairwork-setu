import json
import pandas as pd

from config import WORKER_DATA_PATH, COURSE_DATA_PATH, EVALUATION_DIR
from preprocessing import prepare_workers, prepare_courses
from sentence_transformers import SentenceTransformer
from recommend import recommend_courses

def average_precision_at_k(ranked_ids, relevant_ids, k=5):
    relevant_ids = set(relevant_ids)
    if not relevant_ids:
        return None

    hits = 0
    total = 0.0
    for rank, item_id in enumerate(ranked_ids[:k], start=1):
        if str(item_id) in relevant_ids:
            hits += 1
            total += hits / rank

    return total / min(len(relevant_ids), k)

def main():
    if not WORKER_DATA_PATH.exists() or not COURSE_DATA_PATH.exists():
        raise FileNotFoundError(
            "Evaluation requires workers.csv and courses.csv."
        )

    labels_path = EVALUATION_DIR / "relevance_labels.csv"
    if not labels_path.exists():
        print("Missing evaluation/relevance_labels.csv")
        print("Create it with columns: worker_id,course_id,relevant")
        print("Use relevant=1 for a course judged relevant and 0 otherwise.")
        return

    labels = pd.read_csv(labels_path)
    required = {"worker_id", "course_id", "relevant"}
    if not required.issubset(labels.columns):
        raise ValueError(f"Labels must contain columns: {sorted(required)}")

    workers = prepare_workers(pd.read_csv(WORKER_DATA_PATH))
    courses = prepare_courses(pd.read_csv(COURSE_DATA_PATH))
    model = SentenceTransformer(
        "sentence-transformers/all-MiniLM-L6-v2"
    )

    scores = []
    for _, worker in workers.iterrows():
        worker_id = str(worker["worker_id"]).strip().lower()
        relevant = labels[
            (labels["worker_id"].astype(str).str.strip().str.lower() == worker_id) &
            (labels["relevant"] == 1)
        ]["course_id"].astype(str).str.strip().str.lower().tolist()

        if not relevant:
            continue

        ranked = recommend_courses(worker, courses, model, top_k=5)
        ranked_ids = ranked["course_id"].astype(str).str.strip().str.lower().tolist()
        score = average_precision_at_k(
            ranked_ids, relevant, k=5
        )
        if score is not None:
            scores.append(score)

    if not scores:
        print("No workers with positive relevance labels to evaluate.")
        return

    metrics = {
        "evaluated_workers": len(scores),
        "mean_average_precision_at_5": sum(scores) / len(scores)
    }

    EVALUATION_DIR.mkdir(parents=True, exist_ok=True)
    (EVALUATION_DIR / "metrics.json").write_text(
        json.dumps(metrics, indent=2), encoding="utf-8"
    )
    print(json.dumps(metrics, indent=2))

if __name__ == "__main__":
    main()

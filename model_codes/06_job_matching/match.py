import pandas as pd
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

from config import MODEL_NAME, TOP_K
from preprocessing import prepare_jobs, prepare_workers

def match_jobs(worker, jobs, model, top_k=TOP_K):
    if jobs.empty:
        return pd.DataFrame()

    worker_text = worker.get("worker_text", "")
    if not worker_text.strip():
        raise ValueError("Worker profile contains no matching information.")

    job_texts = jobs["job_text"].tolist()
    embeddings = model.encode(
        [worker_text] + job_texts,
        normalize_embeddings=True
    )

    scores = cosine_similarity(
        embeddings[0:1],
        embeddings[1:]
    )[0]

    results = jobs.copy()
    results["similarity_score"] = scores
    results["match_percentage"] = (scores * 100).round(2)

    # Keep location visible for review; similarity alone does not
    # establish eligibility, distance, pay fairness or job availability.
    return results.sort_values(
        "similarity_score", ascending=False
    ).head(max(1, int(top_k)))

def main():
    from config import RAW_DATA_PATH, WORKER_DATA_PATH

    if not RAW_DATA_PATH.exists():
        raise FileNotFoundError(
            f"Add the job dataset first: {RAW_DATA_PATH}"
        )
    if not WORKER_DATA_PATH.exists():
        raise FileNotFoundError(
            f"Add the worker dataset first: {WORKER_DATA_PATH}"
        )

    jobs = prepare_jobs(pd.read_csv(RAW_DATA_PATH))
    workers = prepare_workers(pd.read_csv(WORKER_DATA_PATH))

    model = SentenceTransformer(MODEL_NAME)
    all_results = []

    for _, worker in workers.iterrows():
        recommendations = match_jobs(worker, jobs, model)
        if recommendations.empty:
            continue

        recommendations.insert(0, "worker_id", worker["worker_id"])
        all_results.append(recommendations)

    if not all_results:
        print("No recommendations generated.")
        return

    from config import PROCESSED_DIR
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    output = PROCESSED_DIR / "job_recommendations.csv"
    pd.concat(all_results, ignore_index=True).to_csv(output, index=False)
    print("Recommendations saved:", output)
    print(pd.concat(all_results, ignore_index=True).head(20).to_string(index=False))

if __name__ == "__main__":
    main()

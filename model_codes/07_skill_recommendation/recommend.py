import pandas as pd
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

from config import MODEL_NAME, TOP_K
from preprocessing import prepare_courses, extract_skills

def recommend_courses(worker, courses, model, top_k=TOP_K):
    if courses.empty:
        return pd.DataFrame()

    profile_text = str(worker.get("profile_text", "")).strip()
    if not profile_text:
        raise ValueError("Worker profile has no usable text.")

    worker_skills = worker.get("extracted_skills", [])
    if not isinstance(worker_skills, list):
        worker_skills = extract_skills(str(worker_skills))

    course_texts = courses["course_text"].tolist()
    embeddings = model.encode(
        [profile_text] + course_texts,
        normalize_embeddings=True
    )

    scores = cosine_similarity(
        embeddings[0:1],
        embeddings[1:]
    )[0]

    results = courses.copy()
    results["similarity_score"] = scores
    results["match_percentage"] = (scores * 100).round(2)

    # Skill overlap is shown separately from semantic similarity.
    results["matched_skills"] = results["skills_taught"].map(
        lambda text: ", ".join(
            skill for skill in worker_skills
            if skill in extract_skills(text)
        )
    )

    return results.sort_values(
        "similarity_score", ascending=False
    ).head(max(1, int(top_k)))

def main():
    from config import WORKER_DATA_PATH, COURSE_DATA_PATH, PROCESSED_DIR
    from preprocessing import prepare_workers, prepare_courses

    if not WORKER_DATA_PATH.exists():
        raise FileNotFoundError(f"Add worker data: {WORKER_DATA_PATH}")
    if not COURSE_DATA_PATH.exists():
        raise FileNotFoundError(f"Add course data: {COURSE_DATA_PATH}")

    workers = prepare_workers(pd.read_csv(WORKER_DATA_PATH))
    courses = prepare_courses(pd.read_csv(COURSE_DATA_PATH))
    model = SentenceTransformer(MODEL_NAME)

    outputs = []
    for _, worker in workers.iterrows():
        ranked = recommend_courses(worker, courses, model)
        if ranked.empty:
            continue
        ranked.insert(0, "worker_id", worker["worker_id"])
        outputs.append(ranked)

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    if not outputs:
        print("No course recommendations generated.")
        return

    output_path = PROCESSED_DIR / "course_recommendations.csv"
    pd.concat(outputs, ignore_index=True).to_csv(output_path, index=False)
    print("Recommendations saved:", output_path)

if __name__ == "__main__":
    main()

import json
from config import EVALUATION_DIR
from retrieve import load_retriever, retrieve

def main():
    labels_path = EVALUATION_DIR / "retrieval_labels.jsonl"

    if not labels_path.exists():
        print("Evaluation labels not found:", labels_path)
        print(
            'Create JSONL rows such as '
            '{"query":"eligibility for scheme X","relevant_sources":["scheme_x.md"]}'
        )
        return

    model, index, chunks = load_retriever()
    reciprocal_ranks = []

    with labels_path.open(encoding="utf-8") as file:
        for line in file:
            if not line.strip():
                continue

            record = json.loads(line)
            query = record.get("query", "").strip()
            relevant_sources = set(record.get("relevant_sources", []))

            if not query or not relevant_sources:
                continue

            results = retrieve(query, model, index, chunks, top_k=4)
            rank_score = 0.0

            for rank, result in enumerate(results, start=1):
                if result["source"] in relevant_sources:
                    rank_score = 1.0 / rank
                    break

            reciprocal_ranks.append(rank_score)

    if not reciprocal_ranks:
        print("No valid labelled queries found.")
        return

    metrics = {
        "labelled_queries": len(reciprocal_ranks),
        "mean_reciprocal_rank_at_4": (
            sum(reciprocal_ranks) / len(reciprocal_ranks)
        )
    }

    EVALUATION_DIR.mkdir(parents=True, exist_ok=True)
    (EVALUATION_DIR / "evaluation_results.json").write_text(
        json.dumps(metrics, indent=2), encoding="utf-8"
    )
    print(json.dumps(metrics, indent=2))

if __name__ == "__main__":
    main()

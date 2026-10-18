import argparse
from retrieve import load_retriever, retrieve

def main():
    parser = argparse.ArgumentParser(
        description="Retrieve relevant health and welfare document passages."
    )
    parser.add_argument("--query", required=True)
    parser.add_argument("--top-k", type=int, default=4)
    args = parser.parse_args()

    if args.top_k < 1:
        raise ValueError("--top-k must be at least 1.")

    model, index, chunks = load_retriever()
    results = retrieve(args.query, model, index, chunks, args.top_k)

    if not results:
        print("No relevant passages retrieved. Consult an official source.")
        return

    print("\nRetrieved passages (not a medical diagnosis or eligibility decision):")
    for rank, result in enumerate(results, start=1):
        print(f"\n[{rank}] Source: {result['source']}")
        print("Similarity:", result["similarity_score"])
        print(result["text"])

    print("\nUse the source documents to verify dates, eligibility and instructions.")

if __name__ == "__main__":
    main()

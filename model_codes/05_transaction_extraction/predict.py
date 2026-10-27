import argparse
import json
from pathlib import Path

from preprocessing import extract_transaction, extract_compound_transactions

def main():
    parser = argparse.ArgumentParser(
        description="Extract compound transaction details from text (Model 5)."
    )
    parser.add_argument(
        "--text",
        help="Transaction text to extract details from."
    )
    parser.add_argument(
        "--input",
        help="Optional text file containing one transaction per line."
    )
    parser.add_argument(
        "--output",
        default="model_codes/05_transaction_extraction/data/processed/predictions.json"
    )
    args = parser.parse_args()

    if not args.text and not args.input:
        parser.error("Provide either --text or --input.")

    if args.text:
        texts = [args.text]
    else:
        input_path = Path(args.input)
        if not input_path.is_file():
            raise FileNotFoundError(f"Input file not found: {input_path}")
        texts = [
            line.strip()
            for line in input_path.read_text(encoding="utf-8").splitlines()
            if line.strip()
        ]

    results = []
    for text in texts:
        compound = extract_compound_transactions(text)
        if len(compound["transactions"]) > 1:
            results.append({"text": text, "compound": True, **compound})
        else:
            results.append({"text": text, "compound": False, **extract_transaction(text)})

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(results, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )

    print(json.dumps(results, ensure_ascii=False, indent=2))
    print("Saved:", output_path)

if __name__ == "__main__":
    main()

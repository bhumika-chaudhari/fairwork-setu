import argparse
import joblib
from config import MODEL_PATH

def main():
    parser = argparse.ArgumentParser(
        description="Predict the category of an expense transaction."
    )
    parser.add_argument(
        "--text",
        required=True,
        help="Transaction details, e.g. 'Uber ride 250 rupees'"
    )
    args = parser.parse_args()

    if not MODEL_PATH.exists():
        raise FileNotFoundError("Model not found. Run train.py first.")

    model = joblib.load(MODEL_PATH)
    prediction = model.predict([args.text])[0]

    print(f"Transaction: {args.text}")
    print(f"Predicted expense category: {prediction}")

    if hasattr(model, "predict_proba"):
        probabilities = model.predict_proba([args.text])[0]
        best_index = probabilities.argmax()
        print(f"Confidence: {probabilities[best_index]:.2%}")

if __name__ == "__main__":
    main()

import argparse
import json
import joblib
import pandas as pd
from config import MODEL_PATH, PREPROCESSOR_PATH, FEATURES_PATH

def main():
    parser = argparse.ArgumentParser(
        description="Flag potentially anomalous transactions."
    )
    parser.add_argument("--input", required=True,
                        help="Path to a transaction CSV file")
    parser.add_argument("--output", default="anomaly_predictions.csv",
                        help="Path for the output CSV")
    args = parser.parse_args()

    for path in [MODEL_PATH, PREPROCESSOR_PATH, FEATURES_PATH]:
        if not path.exists():
            raise FileNotFoundError(
                f"Missing artifact: {path}. Run train.py first."
            )

    df = pd.read_csv(args.input)
    model = joblib.load(MODEL_PATH)
    imputer = joblib.load(PREPROCESSOR_PATH)
    columns = json.loads(FEATURES_PATH.read_text(encoding="utf-8"))

    X = df.reindex(columns=columns)
    X = X.apply(pd.to_numeric, errors="coerce")
    X = X.replace([float("inf"), float("-inf")], float("nan"))
    values = imputer.transform(X)

    result = df.copy()
    result["anomaly_label"] = model.predict(values)
    result["anomaly_score"] = -model.decision_function(values)
    result["is_anomaly"] = result["anomaly_label"] == -1
    result.to_csv(args.output, index=False)

    print("Predictions saved:", args.output)
    print("Flagged anomalies:", int(result["is_anomaly"].sum()))
    print("Total transactions:", len(result))

if __name__ == "__main__":
    main()

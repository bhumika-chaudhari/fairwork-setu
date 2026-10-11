"""
Model 4: K-Means Clustering Spending Pattern Discovery
Uses scikit-learn KMeans with StandardScaler.
Clusters transactions based on amount, day of week, relative magnitude, and category.
Interprets clusters purely from empirical centroids.
"""

from datetime import datetime
import os
from typing import Any, Dict, List, Optional, Tuple
import joblib
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

from synthetic_data import generate_synthetic_daily_data

ARTIFACT_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "artifacts",
    "kmeans_clustering.joblib",
)

CATEGORY_MAP = {
    "food": 0,
    "travel_fuel": 1,
    "tools": 2,
    "rent": 3,
    "medical": 4,
    "other": 5,
    "tips_bonus": 6,
    "work_earnings": 7,
}
REVERSE_CAT_MAP = {v: k for k, v in CATEGORY_MAP.items()}


class SpendingClusterModel:
    def __init__(self, n_clusters: int = 3):
        self.n_clusters = n_clusters
        self.model: Optional[KMeans] = None
        self.scaler: Optional[StandardScaler] = None
        self.last_trained: Optional[str] = None
        self.metrics: Dict[str, Any] = {}
        self.feature_names = [
            "amount",
            "day_of_week",
            "category_code",
            "relative_to_mean",
        ]
        self._load_if_exists()

    def _load_if_exists(self):
        if os.path.exists(ARTIFACT_PATH):
            try:
                data = joblib.load(ARTIFACT_PATH)
                self.model = data.get("model")
                self.scaler = data.get("scaler")
                self.last_trained = data.get("last_trained")
                self.metrics = data.get("metrics", {})
            except Exception as e:
                print(f"[KMeans] Failed to load artifact: {e}")

    def _save_artifact(self):
        os.makedirs(os.path.dirname(ARTIFACT_PATH), exist_ok=True)
        joblib.dump(
            {
                "model": self.model,
                "scaler": self.scaler,
                "last_trained": self.last_trained,
                "metrics": self.metrics,
            },
            ARTIFACT_PATH,
        )

    def _extract_features(
        self, transactions: List[Dict[str, Any]]
    ) -> Tuple[np.ndarray, List[Dict[str, Any]]]:
        """
        Converts raw transactions into feature matrix [amount, dow, cat_code, relative_to_mean].
        """
        cleaned: List[Dict[str, Any]] = []
        amounts = []

        for tx in transactions:
            amt = float(tx.get("amount", 0.0))
            if amt <= 0:
                continue

            ts = tx.get("timestamp") or ""
            try:
                dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                dow = dt.weekday()
            except Exception:
                dow = 2  # default Wednesday

            cat = str(tx.get("category", "other"))
            cat_code = CATEGORY_MAP.get(cat, 5)

            amounts.append(amt)
            cleaned.append(
                {
                    "id": tx.get("id", f"tx_{len(cleaned)}"),
                    "amount": amt,
                    "type": tx.get("type", "expense"),
                    "category": cat,
                    "description": tx.get("description", cat),
                    "day_of_week": dow,
                    "cat_code": cat_code,
                    "timestamp": ts,
                }
            )

        if not cleaned:
            return np.empty((0, 4)), []

        mean_amt = float(np.mean(amounts)) if amounts else 100.0
        X = np.zeros((len(cleaned), 4), dtype=np.float32)

        for i, item in enumerate(cleaned):
            rel = round(item["amount"] / max(mean_amt, 1.0), 2)
            item["relative_to_mean"] = rel
            X[i] = [item["amount"], item["day_of_week"], item["cat_code"], rel]

        return X, cleaned

    def train(
        self,
        raw_transactions: Optional[List[Dict[str, Any]]] = None,
        n_clusters: int = 3,
    ) -> Dict[str, Any]:
        """
        Fits K-Means clustering algorithm using scaled numerical features.
        Interprets centroids dynamically.
        """
        X, cleaned = self._extract_features(raw_transactions or [])
        is_synthetic = False

        if len(cleaned) < 6:
            # Generate representative transactions from synthetic history
            synthetic_days = generate_synthetic_daily_data(num_days=60, seed=42)
            synth_txs = []
            for d in synthetic_days:
                synth_txs.append(
                    {
                        "amount": d["income"],
                        "type": "income",
                        "category": "work_earnings",
                        "timestamp": f"{d['date']}T18:00:00Z",
                    }
                )
                synth_txs.append(
                    {
                        "amount": round(d["expense"] * 0.6, 2),
                        "type": "expense",
                        "category": "travel_fuel",
                        "timestamp": f"{d['date']}T09:30:00Z",
                    }
                )
                synth_txs.append(
                    {
                        "amount": round(d["expense"] * 0.4, 2),
                        "type": "expense",
                        "category": "food",
                        "timestamp": f"{d['date']}T13:15:00Z",
                    }
                )
            X, cleaned = self._extract_features(synth_txs)
            is_synthetic = True

        self.n_clusters = n_clusters
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        kmeans.fit(X_scaled)

        labels = kmeans.labels_

        # Analyze each cluster strictly by empirical centroid & points
        cluster_summaries = []
        for c_id in range(n_clusters):
            pts = [cleaned[i] for i in range(len(cleaned)) if labels[i] == c_id]
            if not pts:
                continue

            c_amts = [p["amount"] for p in pts]
            avg_amt = float(np.mean(c_amts))
            min_amt = float(np.min(c_amts))
            max_amt = float(np.max(c_amts))

            # Most frequent category in cluster
            cat_counts: Dict[str, int] = {}
            for p in pts:
                cat_counts[p["category"]] = cat_counts.get(p["category"], 0) + 1
            top_cat = max(cat_counts, key=cat_counts.get) if cat_counts else "other"

            # Derive data-grounded title and description
            if avg_amt > 1500:
                title = "High-Value Major Transactions"
                desc = f"Characterized by larger lump-sum outlays (average ₹{round(avg_amt):,}), primarily in {top_cat.replace('_', ' ')}."
            elif avg_amt < 250:
                title = "Frequent Micro-Transactions"
                desc = f"Routine, high-frequency daily expenses (average ₹{round(avg_amt):,}), predominantly {top_cat.replace('_', ' ')}."
            else:
                title = "Moderate Operational Cash Flow"
                desc = f"Mid-tier recurring disbursements (average ₹{round(avg_amt):,}), focused around {top_cat.replace('_', ' ')}."

            cluster_summaries.append(
                {
                    "cluster_id": c_id,
                    "title": title,
                    "description": desc,
                    "count": len(pts),
                    "percentage": round((len(pts) / len(cleaned)) * 100, 1),
                    "avg_amount": round(avg_amt, 2),
                    "min_amount": round(min_amt, 2),
                    "max_amount": round(max_amt, 2),
                    "primary_category": top_cat,
                }
            )

        # Sort clusters by average amount
        cluster_summaries.sort(key=lambda c: c["avg_amount"])

        self.model = kmeans
        self.scaler = scaler
        self.last_trained = datetime.now().isoformat()
        self.metrics = {
            "n_clusters": n_clusters,
            "inertia": round(float(kmeans.inertia_), 2),
            "total_analyzed": len(cleaned),
            "is_synthetic": is_synthetic,
            "features_used": self.feature_names,
            "scaling": "StandardScaler (mean=0, variance=1 applied before Euclidean distance clustering)",
            "clusters": cluster_summaries,
        }

        self._save_artifact()

        return {
            "status": "trained",
            "is_synthetic": is_synthetic,
            "last_trained": self.last_trained,
            "metrics": self.metrics,
        }

    def predict_clusters(
        self, raw_transactions: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Runs clustering on user transactions and returns clustered records and summary charts.
        """
        if self.model is None or self.scaler is None:
            self.train(raw_transactions)

        X, cleaned = self._extract_features(raw_transactions or [])
        using_synthetic = False

        if len(cleaned) < 4:
            # Train and evaluate on synthetic dataset
            res = self.train()
            using_synthetic = True
            X, cleaned = self._extract_features(
                [
                    {
                        "amount": d["income"],
                        "type": "income",
                        "category": "work_earnings",
                        "timestamp": f"{d['date']}T18:00:00Z",
                    }
                    for d in generate_synthetic_daily_data(num_days=45, seed=42)
                ]
            )

        X_scaled = self.scaler.transform(X)
        labels = self.model.predict(X_scaled)

        # Attach cluster assignment to cleaned points
        scatter_points = []
        for i, item in enumerate(cleaned[:80]):  # Cap for UI rendering
            scatter_points.append(
                {
                    "id": item["id"],
                    "amount": item["amount"],
                    "cluster_id": int(labels[i]),
                    "category": item["category"],
                    "day_of_week": item["day_of_week"],
                    "relative_amount": item.get("relative_to_mean", 1.0),
                }
            )

        prominent_cluster = (
            max(self.metrics["clusters"], key=lambda c: c["count"])
            if self.metrics.get("clusters")
            else None
        )

        return {
            "model_name": "K-Means Clustering (Spending Pattern Discovery)",
            "status": "trained",
            "is_synthetic": using_synthetic,
            "total_analyzed": len(cleaned),
            "clusters_count": len(self.metrics.get("clusters", [])),
            "prominent_cluster": prominent_cluster,
            "cluster_summaries": self.metrics.get("clusters", []),
            "scatter_points": scatter_points,
            "metrics": self.metrics,
            "last_trained": self.last_trained,
        }


# Global singleton instance
kmeans_model = SpendingClusterModel()

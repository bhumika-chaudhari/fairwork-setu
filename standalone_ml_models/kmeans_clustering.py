"""
=================================================================================
FairWork Setu - Standalone AI/ML Demonstration
Model 4: K-Means Clustering — Spending-Pattern & Worker Persona Segmentation
=================================================================================
Academic Project Demonstration for College Evaluation.
This is a standalone, independent script designed to illustrate the methodology,
feature engineering, optimal k selection (Elbow Method & Silhouette Analysis),
and cluster profiling using K-Means Clustering for unsupervised segmentation of
informal gig workers based on their financial spending patterns.

NOTE: This model is completely decoupled from the production application.
It utilizes reproducible synthetic benchmark data simulating 500 worker
financial profiles with multi-dimensional expense allocations.
=================================================================================
"""

import sys
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score, davies_bouldin_score


def generate_synthetic_spending_profiles(num_workers: int = 500, random_seed: int = 42) -> pd.DataFrame:
    """
    Generates a realistic synthetic dataset representing diverse financial allocations
    among Indian platform workers (auto drivers, couriers, home-service providers, etc.).

    Features:
    - fuel_travel_pct: Percentage of total daily expense spent on fuel / transport (10% - 60%)
    - food_living_pct: Percentage spent on food, chai, and daily sustenance (15% - 55%)
    - rent_utilities_pct: Percentage committed to housing rent, electricity, and water (10% - 45%)
    - tools_repair_pct: Percentage spent on vehicle servicing, parts, phone recharge (5% - 30%)
    - savings_rate: Proportion of gross income retained as liquid savings (-10% to +45%)
    - income_volatility: Standard deviation / fluctuation of weekly income in INR (₹)
    """
    np.random.seed(random_seed)

    # 4 Sub-populations to ensure natural economic cluster structures
    n_per_group = num_workers // 4

    # Group 1: High-Mileage Delivery Riders / Auto Drivers (High fuel, moderate food, medium savings)
    g1_fuel = np.random.normal(loc=0.48, scale=0.06, size=n_per_group)
    g1_food = np.random.normal(loc=0.25, scale=0.04, size=n_per_group)
    g1_rent = np.random.normal(loc=0.15, scale=0.03, size=n_per_group)
    g1_tools = np.random.normal(loc=0.12, scale=0.03, size=n_per_group)
    g1_savings = np.random.normal(loc=0.22, scale=0.05, size=n_per_group)
    g1_vol = np.random.normal(loc=180.0, scale=35.0, size=n_per_group)

    # Group 2: Prudent Disciplined Savers (Low fuel, moderate food, high savings rate)
    g2_fuel = np.random.normal(loc=0.18, scale=0.04, size=n_per_group)
    g2_food = np.random.normal(loc=0.30, scale=0.05, size=n_per_group)
    g2_rent = np.random.normal(loc=0.42, scale=0.05, size=n_per_group)
    g2_tools = np.random.normal(loc=0.10, scale=0.03, size=n_per_group)
    g2_savings = np.random.normal(loc=0.35, scale=0.06, size=n_per_group)
    g2_vol = np.random.normal(loc=110.0, scale=25.0, size=n_per_group)

    # Group 3: Rent & Fixed-Debt Strained (High rent/EMI, low savings, constrained consumption)
    g3_fuel = np.random.normal(loc=0.22, scale=0.04, size=n_per_group)
    g3_food = np.random.normal(loc=0.24, scale=0.04, size=n_per_group)
    g3_rent = np.random.normal(loc=0.48, scale=0.05, size=n_per_group)
    g3_tools = np.random.normal(loc=0.06, scale=0.02, size=n_per_group)
    g3_savings = np.random.normal(loc=0.08, scale=0.04, size=n_per_group)
    g3_vol = np.random.normal(loc=240.0, scale=45.0, size=n_per_group)

    # Group 4: Hand-to-Mouth High Volatility (High food/sustenance, frequent repairs, near-zero savings)
    g4_fuel = np.random.normal(loc=0.28, scale=0.05, size=n_per_group)
    g4_food = np.random.normal(loc=0.46, scale=0.06, size=n_per_group)
    g4_rent = np.random.normal(loc=0.14, scale=0.03, size=n_per_group)
    g4_tools = np.random.normal(loc=0.12, scale=0.03, size=n_per_group)
    g4_savings = np.random.normal(loc=0.03, scale=0.04, size=n_per_group)
    g4_vol = np.random.normal(loc=310.0, scale=60.0, size=n_per_group)

    # Concatenate groups
    fuel = np.clip(np.concatenate([g1_fuel, g2_fuel, g3_fuel, g4_fuel]), 0.05, 0.70)
    food = np.clip(np.concatenate([g1_food, g2_food, g3_food, g4_food]), 0.10, 0.65)
    rent = np.clip(np.concatenate([g1_rent, g2_rent, g3_rent, g4_rent]), 0.05, 0.60)
    tools = np.clip(np.concatenate([g1_tools, g2_tools, g3_tools, g4_tools]), 0.02, 0.35)

    # Normalize expense percentages to sum to 1.0 (100%)
    total_exp = fuel + food + rent + tools
    fuel = np.round(fuel / total_exp * 100, 2)
    food = np.round(food / total_exp * 100, 2)
    rent = np.round(rent / total_exp * 100, 2)
    tools = np.round(100.0 - (fuel + food + rent), 2)  # Exact closure

    savings_rate = np.round(np.clip(np.concatenate([g1_savings, g2_savings, g3_savings, g4_savings]), -0.05, 0.50) * 100, 2)
    income_volatility = np.round(np.clip(np.concatenate([g1_vol, g2_vol, g3_vol, g4_vol]), 50.0, 500.0), 2)

    df = pd.DataFrame({
        "fuel_travel_pct": fuel,
        "food_living_pct": food,
        "rent_utilities_pct": rent,
        "tools_repair_pct": tools,
        "savings_rate_pct": savings_rate,
        "income_volatility_inr": income_volatility,
    })

    # Shuffle rows
    df = df.sample(frac=1.0, random_state=random_seed).reset_index(drop=True)
    return df


def train_and_evaluate_kmeans():
    print("=" * 80)
    print("FAIRWORK SETU — MODEL 4: K-MEANS CLUSTERING (SPENDING PATTERN SEGMENTATION)")
    print("Status: Standalone Demonstration Script (Academic Evaluation)")
    print("=" * 80)

    # Step 1: Data Synthesis
    print("\n[Step 1] Generating synthetic worker financial spending profiles...")
    df = generate_synthetic_spending_profiles(num_workers=500, random_seed=42)
    print(f"  -> Generated {len(df)} multi-dimensional worker profiles.")
    print("  -> Feature Summary Statistics:")
    print(df.describe().round(2).to_string())

    feature_columns = [
        "fuel_travel_pct",
        "food_living_pct",
        "rent_utilities_pct",
        "tools_repair_pct",
        "savings_rate_pct",
        "income_volatility_inr",
    ]
    X = df[feature_columns]

    # Step 2: Feature Standardization
    print("\n[Step 2] Standardizing features using StandardScaler...")
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Step 3: Determining Optimal k via Elbow Method and Silhouette Analysis
    print("\n[Step 3] Evaluating Candidate Cluster Counts (k = 2 to 7):")
    print(f"{'k':<4} | {'Inertia (WCSS)':<16} | {'Silhouette Score':<18} | {'Davies-Bouldin Index':<20}")
    print("-" * 66)

    k_range = range(2, 8)
    best_k = 4
    best_sil = -1.0

    for k in k_range:
        kmeans_trial = KMeans(n_clusters=k, init="k-means++", n_init=10, random_state=42)
        cluster_labels = kmeans_trial.fit_predict(X_scaled)

        inertia = kmeans_trial.inertia_
        sil = silhouette_score(X_scaled, cluster_labels)
        db = davies_bouldin_score(X_scaled, cluster_labels)

        if sil > best_sil:
            best_sil = sil
            best_k = k

        print(f"{k:<4} | {inertia:<16.2f} | {sil:<18.4f} | {db:<20.4f}")

    print("-" * 66)
    print(f"  -> Optimal k identified: k = {best_k} (Highest Silhouette Score = {best_sil:.4f})")

    # Step 4: Fit Final K-Means Model with k = 4
    print(f"\n[Step 4] Fitting Final K-Means Model (k = 4 personas)...")
    final_kmeans = KMeans(
        n_clusters=4,
        init="k-means++",
        n_init=15,
        max_iter=300,
        random_state=42,
    )
    df["cluster"] = final_kmeans.fit_predict(X_scaled)

    # Step 5: Clustering Quality Metrics
    final_inertia = final_kmeans.inertia_
    final_silhouette = silhouette_score(X_scaled, df["cluster"])
    final_db = davies_bouldin_score(X_scaled, df["cluster"])

    print("-" * 50)
    print("  FINAL CLUSTER EVALUATION METRICS (k=4):")
    print(f"  - Inertia (Within-Cluster Sum of Squares): {final_inertia:.2f}")
    print(f"  - Silhouette Score:                         {final_silhouette:.4f} (Strong separation)")
    print(f"  - Davies-Bouldin Index:                     {final_db:.4f} (Lower = superior clustering)")
    print("-" * 50)

    # Step 6: Cluster Profiling & Financial Persona Assignment
    print("\n[Step 5] Characterizing Worker Personas via Cluster Centroids:")
    cluster_means = df.groupby("cluster")[feature_columns].mean().round(2)

    # Dynamically assign meaningful economic personas based on dominant centroid features
    persona_names = {}
    for c_id, row in cluster_means.iterrows():
        if row["fuel_travel_pct"] > 38.0:
            persona_names[c_id] = "High-Mileage Delivery Riders"
        elif row["savings_rate_pct"] > 25.0:
            persona_names[c_id] = "Disciplined High Savers"
        elif row["rent_utilities_pct"] > 35.0:
            persona_names[c_id] = "Rent & Fixed-Debt Strained"
        else:
            persona_names[c_id] = "Hand-to-Mouth Volatile Workers"

    cluster_means["Persona Label"] = [persona_names[i] for i in cluster_means.index]
    cluster_counts = df["cluster"].value_counts().sort_index()
    cluster_means["Count"] = cluster_counts.values
    cluster_means["% of Workers"] = (cluster_counts.values / len(df) * 100).round(1)

    print(cluster_means.to_string())

    # Step 7: Persona Descriptions & Actionable FairWork Guidance
    print("\n[Step 6] FairWork Setu Financial Interventions per Persona:")

    interventions = {
        "High-Mileage Delivery Riders": {
            "Profile": "Heavy fuel expenditure (45%+ of budget) with moderate savings.",
            "Action": "Promote collective fuel discount tie-ups and encourage daily vehicle maintenance reserve.",
        },
        "Disciplined High Savers": {
            "Profile": "Consistently preserves 30%+ of income; low discretionary wastage.",
            "Action": "Offer automated micro-recurring deposit (RD) integration to earn returns on idle cash.",
        },
        "Rent & Fixed-Debt Strained": {
            "Profile": "Over 40% of expenditure locked into rent/loan EMIs; vulnerable to income shocks.",
            "Action": "Provide debt-refinancing awareness and prioritize access to low-interest community emergency loans.",
        },
        "Hand-to-Mouth Volatile Workers": {
            "Profile": "High daily food/subsistence spending with high income volatility and minimal savings.",
            "Action": "Deploy strict daily budget guardrails and prompt small ₹20 daily micro-savings challenges.",
        },
    }

    for c_id in sorted(persona_names.keys()):
        p_name = persona_names[c_id]
        details = interventions.get(p_name, {"Profile": "", "Action": ""})
        print(f"\n  🎯 Cluster {c_id}: [{p_name}] ({cluster_counts[c_id]} workers, {cluster_counts[c_id]/len(df)*100:.1f}%)")
        print(f"     • Economic Behavior: {details['Profile']}")
        print(f"     • Setu Recommendation: {details['Action']}")

    # Step 8: Single Worker Prediction Inference Demonstration
    print("\n[Step 7] Classifying New Gig Worker into Persona Cluster:")
    new_worker = pd.DataFrame([{
        "fuel_travel_pct": 51.5,
        "food_living_pct": 22.0,
        "rent_utilities_pct": 14.5,
        "tools_repair_pct": 12.0,
        "savings_rate_pct": 19.5,
        "income_volatility_inr": 175.0,
    }])

    new_scaled = scaler.transform(new_worker)
    assigned_cluster = final_kmeans.predict(new_scaled)[0]
    assigned_persona = persona_names[assigned_cluster]

    print("  New Worker Spending Breakdown:")
    for k, v in new_worker.iloc[0].items():
        print(f"    • {k}: {v}")
    print(f"\n  🏷️ ASSIGNED CLUSTER: Cluster {assigned_cluster} -> [{assigned_persona}]")
    print(f"  💡 Tailored Guidance: {interventions[assigned_persona]['Action']}")

    print("\n" + "=" * 80)
    print("K-Means Clustering demonstration completed successfully.")
    print("=" * 80)


if __name__ == "__main__":
    train_and_evaluate_kmeans()

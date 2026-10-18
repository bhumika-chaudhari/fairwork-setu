import re
import pandas as pd

def clean_text(text):
    text = str(text or "").lower()
    text = re.sub(r"\s+", " ", text)
    return text.strip()

def prepare_jobs(df):
    required = ["job_id", "title", "description", "skills_required"]
    missing = [column for column in required if column not in df.columns]
    if missing:
        raise ValueError(f"Missing job columns: {missing}")

    data = df.copy()
    for column in required:
        data[column] = data[column].fillna("").map(clean_text)

    data = data[data["title"].str.len() > 0]
    data["job_text"] = (
        data["title"] + " " +
        data["description"] + " " +
        data["skills_required"]
    ).str.strip()

    if "location" not in data:
        data["location"] = ""
    if "employment_type" not in data:
        data["employment_type"] = ""

    data["location"] = data["location"].fillna("").map(clean_text)
    data["employment_type"] = (
        data["employment_type"].fillna("").map(clean_text)
    )
    return data.reset_index(drop=True)

def prepare_workers(df):
    required = ["worker_id", "skills", "experience"]
    missing = [column for column in required if column not in df.columns]
    if missing:
        raise ValueError(f"Missing worker columns: {missing}")

    data = df.copy()
    for column in required:
        data[column] = data[column].fillna("").map(clean_text)

    if "preferred_jobs" not in data:
        data["preferred_jobs"] = ""
    if "location" not in data:
        data["location"] = ""

    data["preferred_jobs"] = (
        data["preferred_jobs"].fillna("").map(clean_text)
    )
    data["location"] = data["location"].fillna("").map(clean_text)

    data["worker_text"] = (
        data["skills"] + " " +
        data["experience"] + " " +
        data["preferred_jobs"]
    ).str.strip()

    return data.reset_index(drop=True)

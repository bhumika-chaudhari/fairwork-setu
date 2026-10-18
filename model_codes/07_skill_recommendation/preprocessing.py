import re
import pandas as pd

# Starter vocabulary. Expand and validate against real worker profiles.
SKILL_VOCABULARY = [
    "communication", "customer service", "driving", "delivery",
    "cooking", "tailoring", "sewing", "sales", "marketing",
    "accounting", "bookkeeping", "data entry", "excel",
    "computer skills", "digital literacy", "typing",
    "plumbing", "electrician", "electrical repair", "welding",
    "carpentry", "painting", "construction", "masonry",
    "housekeeping", "cleaning", "caregiving", "first aid",
    "time management", "teamwork", "problem solving",
    "inventory management", "warehouse operations",
    "mobile repair", "customer support", "basic english",
    "hindi", "marathi"
]

def clean_text(value):
    value = str(value or "").lower()
    value = re.sub(r"\s+", " ", value)
    return value.strip()

def extract_skills(text, vocabulary=None):
    text = clean_text(text)
    vocabulary = vocabulary or SKILL_VOCABULARY
    found = []

    for skill in vocabulary:
        pattern = r"(?<!\w)" + re.escape(skill.lower()) + r"(?!\w)"
        if re.search(pattern, text):
            found.append(skill)

    return sorted(set(found))

def prepare_workers(df):
    if "worker_id" not in df.columns:
        raise ValueError("workers.csv must contain worker_id.")

    text_columns = [
        column for column in
        ["skills", "experience", "interests", "preferred_jobs"]
        if column in df.columns
    ]
    if not text_columns:
        raise ValueError(
            "workers.csv must contain at least one profile text column."
        )

    data = df.copy()
    for column in text_columns:
        data[column] = data[column].fillna("").map(clean_text)

    data["profile_text"] = data[text_columns].agg(" ".join, axis=1).str.strip()
    data["extracted_skills"] = data["profile_text"].map(
        lambda text: extract_skills(text)
    )
    return data

def prepare_courses(df):
    required = ["course_id", "title", "description", "skills_taught"]
    missing = [column for column in required if column not in df.columns]
    if missing:
        raise ValueError(f"Missing course columns: {missing}")

    data = df.copy()
    for column in required:
        data[column] = data[column].fillna("").map(clean_text)

    data = data[data["title"].str.len() > 0].copy()
    data["course_text"] = (
        data["title"] + " " +
        data["description"] + " " +
        data["skills_taught"]
    ).str.strip()

    if "provider" not in data.columns:
        data["provider"] = ""
    if "course_url" not in data.columns:
        data["course_url"] = ""

    return data.reset_index(drop=True)

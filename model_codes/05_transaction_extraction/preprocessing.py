import re
import pandas as pd

AMOUNT_PATTERN = re.compile(
    r"(?i)(?:₹|rs\.?|inr)\s*([0-9,]+(?:\.[0-9]{1,2})?)"
    r"|([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:rupees?|rs\.?|inr|₹)"
)

DATE_PATTERNS = [
    r"\b\d{4}-\d{2}-\d{2}\b",
    r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b"
]

INCOME_KEYWORDS = [
    "received", "salary", "earned", "credited", "income",
    "payment received", "got paid", "wages", "kamaya", "aaya",
    "mila", "payout", "bheja", "jama", "earning", "tips"
]
EXPENSE_KEYWORDS = [
    "spent", "paid", "bought", "purchase", "debit",
    "expense", "bill", "recharged", "diya", "kharcha",
    "bhara", "lagaya", "kata"
]

CATEGORY_KEYWORDS = {
    "fuel": ["fuel", "petrol", "diesel", "cng", "pump", "hp petrol", "iocl", "bpcl"],
    "food": ["food", "grocery", "groceries", "restaurant", "vegetables", "sabzi", "chai", "nashta", "khana", "lunch", "dinner", "roti", "hotel", "swiggy", "zomato", "dhaba"],
    "transport": ["bus", "train", "taxi", "auto", "metro", "cab", "uber", "ola", "rapido", "fare", "toll", "challan"],
    "health": ["medicine", "hospital", "doctor", "medical", "clinic", "dawai", "pharmacy", "checkup", "tablet", "apollo", "jan aushadhi"],
    "maintenance": ["puncture", "service", "mechanic", "repair", "oil change", "mobil oil", "garage", "tyre", "brake", "servicing"],
    "housing": ["rent", "electricity", "water bill", "kamra", "makaan", "bijli bill", "gas", "cylinder", "kiraya"],
    "emi": ["emi", "loan", "kist", "installment", "finance", "bajaj finance"],
    "education": ["school", "college", "course", "tuition", "fees", "kitab", "books"],
    "personal": ["recharge", "mobile recharge", "jio", "airtel", "vi", "clothes", "haircut", "shopping"]
}

def extract_amount(text):
    match = AMOUNT_PATTERN.search(text)
    if match:
        value = match.group(1) or match.group(2)
        try:
            return float(value.replace(",", ""))
        except ValueError:
            pass
    # Fallback for numbers without currency symbol e.g. "cylinder gas refill 280"
    plain_match = re.search(r"\b([0-9]{2,6}(?:\.[0-9]{1,2})?)\b", text)
    if plain_match:
        try:
            return float(plain_match.group(1).replace(",", ""))
        except ValueError:
            return None
    return None

def extract_date(text):
    for pattern in DATE_PATTERNS:
        match = re.search(pattern, text)
        if match:
            date_str = match.group(0)
            parsed = pd.to_datetime(date_str, errors="coerce", format="%Y-%m-%d" if "-" in date_str and len(date_str.split("-")[0]) == 4 else None)
            if not pd.isna(parsed):
                return parsed.strftime("%Y-%m-%d")
    return None

def extract_type(text):
    lowered = text.lower()

    income_hits = sum(word in lowered for word in INCOME_KEYWORDS)
    expense_hits = sum(word in lowered for word in EXPENSE_KEYWORDS)

    if income_hits > expense_hits and income_hits > 0:
        return "income"
    if expense_hits > income_hits and expense_hits > 0:
        return "expense"
    return "unknown"

def extract_category(text):
    lowered = text.lower()
    # Prioritize specific technical/health/fuel categories before general words
    priority_order = [
        "health", "fuel", "maintenance", "housing",
        "emi", "education", "transport", "food", "personal"
    ]
    for category in priority_order:
        keywords = CATEGORY_KEYWORDS.get(category, [])
        if any(word in lowered for word in keywords):
            return category
    return "other"

def extract_transaction(text):
    text = str(text).strip()
    return {
        "amount": extract_amount(text),
        "transaction_type": extract_type(text),
        "category": extract_category(text),
        "date": extract_date(text)
    }

def prepare_dataset(df, text_column):
    if text_column not in df.columns:
        raise ValueError(
            f"Missing text column '{text_column}'. "
            f"Available columns: {df.columns.tolist()}"
        )

    data = df.copy()
    data[text_column] = data[text_column].fillna("").astype(str).str.strip()
    data = data[data[text_column] != ""].copy()

    if data.empty:
        raise ValueError("No non-empty transaction text records found.")

    extracted = data[text_column].apply(extract_transaction).apply(pd.Series)
    return pd.concat([data.reset_index(drop=True), extracted], axis=1)

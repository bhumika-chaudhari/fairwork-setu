"""
Model 5: Compound Entity Extraction & Transaction Parser
Rule-based Information Extraction: Regex engine + Semantic splitter + Vernacular Indic dictionary + Keyword role assigner.
"""

import re
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import pandas as pd

# Indic numerals mapping
INDIC_DIGITS_MAP = {
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
}

VERNACULAR_NUMBER_PATTERNS = [
    # Compound fractions & phrases
    (r"\b(?:dedh\s*hazaar|dedh\s*hazar|दीड\s*हजार|डेढ़\s*हजार)\b", 1500),
    (r"\b(?:dhai\s*hazaar|dhai\s*hazar|अडीच\s*हजार|ढाई\s*हजार)\b", 2500),
    (r"\b(?:saadhe\s*teen\s*hazar|साडेतीन\s*हजार|साढ़े\s*तीन\s*हजार)\b", 3500),
    (r"\b(?:saadhe\s*chaar\s*hazar|साडेचार\s*हजार|साढ़े\s*चार\s*हजार)\b", 4500),
    (r"\b(?:saadhe\s*paanch\s*hazar|साडेपाच\s*हजार|साढ़े\s*पांच\s*हजार)\b", 5500),

    (r"\b(?:paune\s*do\s*sau|पौने\s*दो\s*सौ)\b", 175),
    (r"\b(?:sava\s*sau|savva\s*sau|सवा\s*सौ)\b", 125),
    (r"\b(?:dedh\s*sau|dedsau|दीडशे|डेढ़\s*सौ)\b", 150),
    (r"\b(?:dhai\s*sau|dhaisau|अडीचशे|ढाई\s*सौ)\b", 250),
    (r"\b(?:paune\s*teen\s*sau|पौने\s*तीन\s*सौ)\b", 275),
    (r"\b(?:saadhe\s*teen\s*sau|साडेतीनशे|साढ़े\s*तीन\s*सौ)\b", 350),
    (r"\b(?:saadhe\s*chaar\s*sau|साडेचारशे|साढ़े\s*चार\s*सौ)\b", 450),
    (r"\b(?:saadhe\s*paanch\s*sau|साडेपाचशे|साढ़े\s*पांच\s*सौ)\b", 550),

    # Thousands
    (r"\b(?:das\s*hazaar|das\s*hazar|दस\s*हजार|दहा\s*हजार|ten\s*thousand)\b", 10000),
    (r"\b(?:nau\s*hazaar|nau\s*hazar|नौ\s*हजार|nine\s*thousand)\b", 9000),
    (r"\b(?:aath\s*hazaar|aath\s*hazar|आठ\s*हजार|eight\s*thousand)\b", 8000),
    (r"\b(?:saat\s*hazaar|saat\s*hazar|सात\s*हजार|seven\s*thousand)\b", 7000),
    (r"\b(?:chhe\s*hazaar|che\s*hazar|छह\s*हजार|six\s*thousand)\b", 6000),
    (r"\b(?:paanch\s*hazaar|panch\s*hazar|पांच\s*हजार|five\s*thousand)\b", 5000),
    (r"\b(?:chaar\s*hazaar|char\s*hazar|चार\s*हजार|four\s*thousand)\b", 4000),
    (r"\b(?:teen\s*hazaar|teen\s*hazar|तीन\s*हजार|three\s*thousand)\b", 3000),
    (r"\b(?:do\s*hazaar|do\s*hazar|दो\s*हजार|two\s*thousand)\b", 2000),
    (r"\b(?:ek\s*hazaar|ek\s*hazar|hazaar|hazar|हजार|one\s*thousand)\b", 1000),

    # Hundreds
    (r"\b(?:nau\s*sau|नौ\s*सौ|nine\s*hundred)\b", 900),
    (r"\b(?:aath\s*sau|आठ\s*सौ|eight\s*hundred)\b", 800),
    (r"\b(?:saat\s*sau|सात\s*सौ|seven\s*hundred)\b", 700),
    (r"\b(?:chhe\s*sau|che\s*sau|छह\s*सौ|six\s*hundred)\b", 600),
    (r"\b(?:paanch\s*sau|panch\s*sau|पांच\s*सौ|five\s*hundred)\b", 500),
    (r"\b(?:chaar\s*sau|char\s*sau|चार\s*सौ|four\s*hundred)\b", 400),
    (r"\b(?:teen\s*sau|तीन\s*सौ|three\s*hundred)\b", 300),
    (r"\b(?:do\s*sau|दो\s*सौ|two\s*hundred)\b", 200),
    (r"\b(?:ek\s*sau|sau|एक\s*सौ|सौ|one\s*hundred)\b", 100),

    # Tens & Units
    (r"\b(?:nabbe|नब्बे|ninety)\b", 90),
    (r"\b(?:assi|अस्सी|eighty)\b", 80),
    (r"\b(?:sattar|सत्तर|seventy)\b", 70),
    (r"\b(?:saath|sath|साठ|sixty)\b", 60),
    (r"\b(?:pachas|पचास|fifty)\b", 50),
    (r"\b(?:chaalis|chalis|चालीस|forty)\b", 40),
    (r"\b(?:tees|तीस|thirty)\b", 30),
    (r"\b(?:bees|बीस|twenty)\b", 20),
    (r"\b(?:pandrah|पंद्रह|fifteen)\b", 15),
    (r"\b(?:das|दस|ten)\b", 10),
    (r"\b(?:paanch|panch|पांच|five)\b", 5),
    (r"\b(?:chaar|char|चार|four)\b", 4),
    (r"\b(?:teen|तीन|three)\b", 3),
    (r"\b(?:do|दो|two)\b", 2),
    (r"\b(?:ek|एक|one)\b", 1),
]

AMOUNT_PATTERN = re.compile(
    r"(?i)(?:₹|rs\.?|inr)\s*([0-9,]+(?:\.[0-9]{1,2})?)"
    r"|([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:rupees?|rs\.?|inr|₹|ka|ke)?"
)

DATE_PATTERNS = [
    r"\b\d{4}-\d{2}-\d{2}\b",
    r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b"
]

INCOME_KEYWORDS = [
    "received", "salary", "earned", "credited", "income",
    "payment received", "got paid", "wages", "kamaya", "kamaye", "kamai", "aaya",
    "mila", "mile", "milale", "payout", "bheja", "jama", "earning", "tips",
    "bhada", "aamdani", "bikri", "fare"
]

EXPENSE_KEYWORDS = [
    "spent", "paid", "bought", "purchase", "debit",
    "expense", "bill", "recharged", "diya", "diye", "kharcha", "kharch",
    "bhara", "lagaya", "lagaye", "kata", "bharwaya", "bharwaye",
    "peeya", "pee", "pi", "khaya", "kiya", "liya", "li"
]

CATEGORY_KEYWORDS = {
    "fuel": ["fuel", "petrol", "diesel", "tel", "cng", "pump", "hp petrol", "iocl", "bpcl"],
    "food": ["food", "grocery", "groceries", "restaurant", "vegetables", "sabzi", "chai", "tea", "nashta", "khana", "lunch", "dinner", "roti", "hotel", "swiggy", "zomato", "dhaba"],
    "transport": ["bus", "train", "taxi", "auto", "metro", "cab", "uber", "ola", "rapido", "fare", "toll", "challan"],
    "health": ["medicine", "hospital", "doctor", "medical", "clinic", "dawai", "pharmacy", "checkup", "tablet", "apollo", "jan aushadhi"],
    "maintenance": ["puncture", "service", "mechanic", "repair", "oil change", "mobil oil", "garage", "tyre", "brake", "servicing"],
    "housing": ["rent", "electricity", "water bill", "kamra", "makaan", "bijli bill", "gas", "cylinder", "kiraya"],
    "emi": ["emi", "loan", "kist", "installment", "finance", "bajaj finance"],
    "education": ["school", "college", "course", "tuition", "fees", "kitab", "books"],
    "personal": ["recharge", "mobile recharge", "jio", "airtel", "vi", "clothes", "haircut", "shopping"]
}

STOP_WORDS = [
    "ka", "ki", "ke", "mein", "me", "se", "ko", "par", "pe", "aur", "ani",
    "aaj", "kal", "abhi", "rupaye", "rupees", "rs", "inr", "for"
]


def deduplicate_speech_transcript(text: str) -> str:
    """
    Deduplicates speech recognition stutter loops and repeated words/phrases.
    e.g. 'maine maine maine maine 8000 kamaye 8000 kamyee' -> 'maine 8000 kamaye'
    """
    if not text:
        return ""
    cleaned = text.strip()

    # 1. Deduplicate consecutive identical words
    words = cleaned.split()
    deduped = []
    for w in words:
        if not deduped or deduped[-1].lower() != w.lower():
            deduped.append(w)
    cleaned = " ".join(deduped)

    # 2. Deduplicate consecutive repeated phrases (length 2 to 5)
    for phrase_len in range(5, 1, -1):
        tokens = cleaned.split()
        changed = False
        new_tokens = []
        i = 0
        while i < len(tokens):
            if i + 2 * phrase_len <= len(tokens):
                p1 = " ".join(tokens[i:i + phrase_len]).lower()
                p2 = " ".join(tokens[i + phrase_len:i + 2 * phrase_len]).lower()
                if p1 == p2:
                    new_tokens.extend(tokens[i:i + phrase_len])
                    i += 2 * phrase_len
                    changed = True
                    continue
            new_tokens.append(tokens[i])
            i += 1
        if changed:
            cleaned = " ".join(new_tokens)

    return cleaned.strip()


def normalize_indic_digits(text: str) -> str:
    if not text:
        return ""
    result = []
    for ch in text:
        result.append(INDIC_DIGITS_MAP.get(ch, ch))
    return "".join(result)


def convert_vernacular_number_words(text: str) -> str:
    if not text:
        return ""
    updated = normalize_indic_digits(text)
    for pattern, val in VERNACULAR_NUMBER_PATTERNS:
        updated = re.sub(pattern, f" {val} ", updated, flags=re.IGNORECASE)

    # Adjacent compounds (e.g. 2000 500 -> 2500)
    def merge_compound(m):
        h, l = int(m.group(1)), int(m.group(2))
        if h in [1000, 2000, 3000, 4000, 5000] and l < 1000:
            return str(h + l)
        if h in [100, 200, 300, 400, 500, 600, 700, 800, 900] and l < 100:
            return str(h + l)
        return f"{h} {l}"

    updated = re.sub(r"\b(\d{3,5})\s+(\d{2,3})\b", merge_compound, updated)
    return re.sub(r"\s+", " ", updated).strip()


def has_amount(segment: str) -> bool:
    converted = convert_vernacular_number_words(segment)
    return bool(re.search(r"(?:₹|rs\.?|inr)?\s*\b\d+(?:\.\d+)?\b", converted, flags=re.IGNORECASE))


def smart_split_compound_sentence(text: str) -> List[str]:
    if not text:
        return []

    # 1. Primary Split on always-split conjunctions
    primary_regex = re.compile(r"\b(?:par|lekin|magar|pan|kintu|parantu|and|then)\b|[,;\n]", re.IGNORECASE)
    primary_chunks = [c.strip() for c in primary_regex.split(text) if c.strip()]

    final_chunks = []
    # 2. Secondary split on "aur", "ani", "&" only if BOTH sides contain amounts
    aur_pattern = re.compile(r"\b(?:aur|ani|&)\b", re.IGNORECASE)

    for chunk in primary_chunks:
        if not aur_pattern.search(chunk):
            final_chunks.append(chunk)
            continue

        parts = [p.strip() for p in aur_pattern.split(chunk) if p.strip()]
        if len(parts) < 2:
            final_chunks.append(chunk)
            continue

        curr = parts[0]
        for next_p in parts[1:]:
            if has_amount(curr) and has_amount(next_p):
                final_chunks.append(curr)
                curr = next_p
            else:
                curr = f"{curr} aur {next_p}"
        if curr:
            final_chunks.append(curr)

    return final_chunks


def extract_amount(text: str) -> Optional[float]:
    converted = convert_vernacular_number_words(text)
    plain_match = re.search(r"(?:₹|rs\.?|inr)?\s*([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:rupaye|rupees|rs|inr|₹|ka|ke)?", converted, flags=re.IGNORECASE)
    if plain_match:
        val = plain_match.group(1).replace(",", "")
        try:
            return float(val)
        except ValueError:
            pass
    return None


def extract_date(text: str) -> str:
    lowered = text.lower()
    now = datetime.now()
    if "yesterday" in lowered or "kal" in lowered:
        return (now - timedelta(days=1)).strftime("%Y-%m-%d")
    if "parso" in lowered:
        return (now - timedelta(days=2)).strftime("%Y-%m-%d")
    if "pichle hafte" in lowered:
        return (now - timedelta(days=7)).strftime("%Y-%m-%d")

    for pattern in DATE_PATTERNS:
        match = re.search(pattern, text)
        if match:
            date_str = match.group(0)
            parsed = pd.to_datetime(date_str, errors="coerce")
            if not pd.isna(parsed):
                return parsed.strftime("%Y-%m-%d")

    return now.strftime("%Y-%m-%d")


def extract_type(text: str, amount: Optional[float] = None) -> str:
    lowered = text.lower()
    income_hits = sum(word in lowered for word in INCOME_KEYWORDS)
    expense_hits = sum(word in lowered for word in EXPENSE_KEYWORDS)

    if income_hits > expense_hits and income_hits > 0:
        return "income"
    if expense_hits > income_hits and expense_hits > 0:
        return "expense"

    # Category nouns check
    if any(k in lowered for k in ["tel", "petrol", "diesel", "cng", "chai", "tea", "khana", "lunch", "dawai", "recharge", "rent"]):
        return "expense"

    if amount is not None:
        return "income" if amount > 500 else "expense"
    return "expense"


def extract_category(text: str) -> str:
    lowered = text.lower()
    priority_order = [
        "health", "fuel", "maintenance", "housing",
        "emi", "education", "transport", "food", "personal"
    ]
    for category in priority_order:
        keywords = CATEGORY_KEYWORDS.get(category, [])
        if any(word in lowered for word in keywords):
            return category
    return "other"


def clean_description(text: str, amt: Optional[float]) -> str:
    cleaned = text.lower()
    if amt is not None:
        amt_int = int(amt) if amt.is_integer() else amt
        cleaned = re.sub(rf"\b{amt_int}\b", " ", cleaned)
    for w in INCOME_KEYWORDS + EXPENSE_KEYWORDS + STOP_WORDS:
        cleaned = re.sub(rf"\b{w}\b", " ", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"[^\w\s]", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned if cleaned else "item"


def extract_transaction(text: str) -> Dict[str, Any]:
    text = str(text).strip()
    amt = extract_amount(text)
    return {
        "amount": amt,
        "transaction_type": extract_type(text, amt),
        "category": extract_category(text),
        "date": extract_date(text)
    }


def extract_compound_transactions(text: str) -> Dict[str, Any]:
    """
    Model 5: Splits compound sentence and returns list of structured transactions.
    """
    text_str = deduplicate_speech_transcript(str(text or "").strip())
    if not text_str:
        return {
            "transactions": [],
            "extraction_status": "no_transactions",
            "total_income": 0.0,
            "total_expense": 0.0
        }

    chunks = smart_split_compound_sentence(text_str)
    transactions = []

    for chunk in chunks:
        amt = extract_amount(chunk)
        if amt is None or amt <= 0:
            continue

        tx_type = extract_type(chunk, amt)
        desc = clean_description(chunk, amt)
        cat = extract_category(chunk)
        date_str = extract_date(chunk)

        transactions.append({
            "type": tx_type,
            "amount": amt,
            "description": desc,
            "category": cat,
            "date": date_str,
            "raw_text": chunk,
            "confidence": 0.98 if amt > 0 else 0.80
        })

    total_income = sum(t["amount"] for t in transactions if t["type"] == "income")
    total_expense = sum(t["amount"] for t in transactions if t["type"] == "expense")

    return {
        "transactions": transactions,
        "extraction_status": "success" if transactions else "no_transactions",
        "total_income": total_income,
        "total_expense": total_expense
    }


def prepare_dataset(df: pd.DataFrame, text_column: str) -> pd.DataFrame:
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

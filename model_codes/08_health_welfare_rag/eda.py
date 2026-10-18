from pathlib import Path
from config import DOCUMENTS_PATH

SUPPORTED_EXTENSIONS = {".txt", ".md"}

def load_documents(directory=DOCUMENTS_PATH):
    documents = []

    if not directory.exists():
        print(f"Document directory not found: {directory}")
        return documents

    for path in sorted(directory.rglob("*")):
        if not path.is_file() or path.suffix.lower() not in SUPPORTED_EXTENSIONS:
            continue

        # Ignore generated files if a processed folder is ever placed here.
        if "processed" in path.parts or "artifacts" in path.parts:
            continue

        text = path.read_text(encoding="utf-8", errors="replace").strip()
        if text:
            documents.append({
                "source": str(path.relative_to(directory)),
                "text": text
            })

    return documents

def main():
    documents = load_documents()
    print("Documents found:", len(documents))

    for document in documents:
        print(f"\nSource: {document['source']}")
        print("Characters:", len(document["text"]))
        print(document["text"][:250].replace("\n", " "))

    if not documents:
        print("Add verified .txt or .md documents to data/raw.")

if __name__ == "__main__":
    main()

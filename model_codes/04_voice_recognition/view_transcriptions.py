from pathlib import Path
import json

from config import TRANSCRIPTION_JSON

def main():
    if not TRANSCRIPTION_JSON.exists():
        print("No transcription index exists yet.")
        print("Run transcribe.py on an audio file first.")
        return

    records = json.loads(
        TRANSCRIPTION_JSON.read_text(encoding="utf-8")
    )
    print(json.dumps(records, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()

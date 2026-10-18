import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

import whisper

from config import (
    MODEL_NAME,
    DEFAULT_LANGUAGE,
    SUPPORTED_LANGUAGES,
    PROCESSED_DIR,
    DEVICE,
)

def main():
    parser = argparse.ArgumentParser(
        description="Transcribe Hindi or English audio using Whisper."
    )
    parser.add_argument("--audio", required=True, help="Path to the audio file")
    parser.add_argument(
        "--language",
        choices=SUPPORTED_LANGUAGES,
        default=DEFAULT_LANGUAGE,
        help="Language code: en or hi. Omit for automatic detection."
    )
    parser.add_argument(
        "--model",
        default=MODEL_NAME,
        choices=["tiny", "base", "small", "medium", "large"],
        help="Whisper model size"
    )
    args = parser.parse_args()

    audio_path = Path(args.audio)
    if not audio_path.is_file():
        raise FileNotFoundError(f"Audio file not found: {audio_path}")

    print(f"Loading Whisper model: {args.model}")
    model = whisper.load_model(args.model, device=DEVICE)

    # Use native WAV loader when available to avoid external ffmpeg dylib crashes
    audio_input = str(audio_path)
    if audio_path.suffix.lower() == ".wav":
        try:
            import wave
            import numpy as np
            with wave.open(str(audio_path), "rb") as wf:
                n_channels = wf.getnchannels()
                frames = wf.readframes(wf.getnframes())
                audio_arr = np.frombuffer(frames, dtype=np.int16).astype(np.float32) / 32768.0
                if n_channels > 1:
                    audio_arr = audio_arr.reshape(-1, n_channels).mean(axis=1)
                audio_input = audio_arr
        except Exception as e:
            print(f"Native wave reading fallback: {e}")

    result = model.transcribe(
        audio_input,
        language=args.language,
        fp16=False
    )

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    transcript = result.get("text", "").strip()
    output = {
        "audio_file": audio_path.name,
        "model": args.model,
        "language": result.get("language"),
        "transcript": transcript,
        "segments": [
            {
                "start": segment.get("start"),
                "end": segment.get("end"),
                "text": segment.get("text", "").strip()
            }
            for segment in result.get("segments", [])
        ],
        "created_at_utc": datetime.now(timezone.utc).isoformat()
    }

    txt_path = PROCESSED_DIR / f"{audio_path.stem}.txt"
    json_path = PROCESSED_DIR / f"{audio_path.stem}.json"

    txt_path.write_text(transcript, encoding="utf-8")
    json_path.write_text(
        json.dumps(output, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )

    print("\nTranscription:")
    print(transcript)
    print(f"\nText saved: {txt_path}")
    print(f"JSON saved: {json_path}")

if __name__ == "__main__":
    main()

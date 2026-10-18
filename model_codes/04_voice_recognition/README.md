# Model 4: Voice Recognition (ASR)

## Objective
Convert spoken Hindi and English audio into text using pretrained Whisper.

## Approach
Use the pretrained Whisper speech-recognition model. This is an inference scaffold, not a fine-tuned model.

## Files
- config.py: model settings and paths
- transcribe.py: transcribe an audio file and save TXT and JSON outputs
- view_transcriptions.py: display a transcription index if one is available
- requirements.txt: Python dependency

## Setup
Install Python, FFmpeg, and the Python dependency:

```bash
pip install -r model_codes/04_voice_recognition/requirements.txt
```

FFmpeg must be installed and accessible from the terminal.

## Run from repository root
English audio:

```bash
python model_codes/04_voice_recognition/transcribe.py --audio "path/to/audio.wav" --language en
```

Hindi audio:

```bash
python model_codes/04_voice_recognition/transcribe.py --audio "path/to/audio.wav" --language hi
```

Automatic language detection:

```bash
python model_codes/04_voice_recognition/transcribe.py --audio "path/to/audio.wav"
```

For a smaller, faster model, add `--model tiny`. The first run downloads the selected pretrained weights.

## Outputs
Generated TXT and JSON files are saved in `data/processed`.

## Limitations and status
- Starter scaffold only; no project dataset has been supplied.
- The model has not been fine-tuned or evaluated on Setu data.
- Recognition quality can vary with accents, background noise, and recording quality.
- Antigravity must test the implementation and adapt it to the finalized audio data before integration.

import json, subprocess, sys, time
import numpy as np
from faster_whisper import WhisperModel
src, out, size = sys.argv[1], sys.argv[2], (sys.argv[3] if len(sys.argv) > 3 else "small")
t = time.time()
model = WhisperModel(size, device="cpu", compute_type="int8")
pcm = subprocess.run(["ffmpeg", "-v", "quiet", "-i", src, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True, check=True).stdout
audio = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768.0
segs, info = model.transcribe(audio, language="fr", word_timestamps=True, vad_filter=True)
res = []
for s in segs:
    res.append({"start": s.start, "end": s.end, "text": s.text.strip(),
                "words": [{"w": w.word, "s": w.start, "e": w.end} for w in s.words]})
    print(f"[{s.start:7.2f}] {s.text.strip()}", flush=True)
json.dump(res, open(out, "w"), ensure_ascii=False, indent=1)
print("DONE", round(time.time() - t), "s", flush=True)

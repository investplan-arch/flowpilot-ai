from __future__ import annotations

import math
import os
import random
import struct
import wave

SR = 44100
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "audio")
os.makedirs(OUT, exist_ok=True)


def write_wav(name: str, samples: list[float]) -> None:
    path = os.path.join(OUT, name)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        pcm = bytearray()
        for value in samples:
            v = max(-0.95, min(0.95, value))
            pcm += struct.pack("<h", int(v * 32767))
        w.writeframes(bytes(pcm))


def make_bed(seconds: float = 20.0) -> list[float]:
    n = int(SR * seconds)
    out = [0.0] * n
    rng = random.Random(7)

    for i in range(n):
        t = i / SR
        pulse = 0.35 + 0.65 * (0.5 + 0.5 * math.sin(2 * math.pi * 2 * t - math.pi / 2))
        pad = (
            0.030 * math.sin(2 * math.pi * 110 * t)
            + 0.015 * math.sin(2 * math.pi * 165 * t)
            + 0.010 * math.sin(2 * math.pi * 220 * t)
        )
        out[i] = pad * pulse

    for beat in [x * 0.5 for x in range(int(seconds / 0.5))]:
        start = int(beat * SR)
        length = min(int(0.11 * SR), n - start)
        for j in range(length):
            tt = j / SR
            env = math.exp(-tt * 32)
            freq = 92 - 45 * (tt / 0.11)
            out[start + j] += 0.055 * env * math.sin(2 * math.pi * freq * tt)

    for tick in [0.125 + x * 0.5 for x in range(int(seconds / 0.5))]:
        start = int(tick * SR)
        length = min(int(0.025 * SR), n - start)
        for j in range(length):
            tt = j / SR
            out[start + j] += 0.008 * rng.uniform(-1, 1) * math.exp(-tt * 155)

    fade = int(0.4 * SR)
    for i in range(fade):
        out[i] *= i / fade
        out[-1 - i] *= i / fade
    return out


def tone_sequence(parts: list[tuple[float, float]], volume: float = 0.17) -> list[float]:
    total = sum(d for _, d in parts)
    out = [0.0] * int(total * SR)
    cursor = 0
    for freq, duration in parts:
        length = int(duration * SR)
        for j in range(length):
            t = j / SR
            env = math.exp(-t * (12 if duration > 0.12 else 42))
            out[cursor + j] = volume * math.sin(2 * math.pi * freq * t) * env
        cursor += length
    return out


write_wav("bed.wav", make_bed())
write_wav("notif.wav", tone_sequence([(880, 0.12), (1320, 0.15)], 0.19))
write_wav("click.wav", tone_sequence([(620, 0.09)], 0.16))
write_wav("success.wav", tone_sequence([(660, 0.11), (990, 0.11), (1320, 0.16)], 0.16))
print(f"Generated audio in {os.path.abspath(OUT)}")

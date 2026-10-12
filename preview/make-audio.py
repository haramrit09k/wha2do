#!/usr/bin/env python3
"""Original soundtrack for the wha2do demo video, synthesised with numpy (no samples, no licences).

Usage: make-audio.py events.json out.wav

events.json is written by demo-video.mjs: the video duration plus a log of what happened on screen
(taps, typing, camera moves, ...). The music is a bright I-V-vi-IV jingle whose bar grid is aligned so
that the final chord lands exactly when the end card appears, with layers entering on bar lines near
the story beats. Sound effects are placed at the exact event times and tuned to the C pentatonic scale,
so they sit inside the music instead of on top of it.
"""
import json
import sys
import wave

import numpy as np

SR = 44100
BPM = 108
BEAT = 60.0 / BPM
BAR = 4 * BEAT
EIGHTH = BEAT / 2
rng = np.random.default_rng(7)


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


class Mix:
    """Stereo bus pair: a dry bus and a reverb send."""

    def __init__(self, seconds):
        self.n = int(seconds * SR)
        self.dry = np.zeros((2, self.n))
        self.wet = np.zeros((2, self.n))

    def add(self, sig, t, gain=1.0, pan=0.0, send=0.0):
        i = int(round(t * SR))
        if i >= self.n or i + len(sig) <= 0:
            return
        if i < 0:
            sig = sig[-i:]
            i = 0
        sig = sig[: self.n - i]
        left = np.cos((pan + 1) * np.pi / 4)
        right = np.sin((pan + 1) * np.pi / 4)
        for bus, amount in ((self.dry, 1.0), (self.wet, send)):
            if amount > 0:
                bus[0, i : i + len(sig)] += sig * gain * left * amount
                bus[1, i : i + len(sig)] += sig * gain * right * amount


def tt(seconds):
    return np.arange(int(seconds * SR)) / SR


def env_ad(n, attack, tau):
    t = np.arange(n) / SR
    a = np.minimum(1.0, t / max(attack, 1e-4))
    return a * np.exp(-t / tau)


# ---- instruments ---------------------------------------------------------------------------------


def bell(freq, dur=0.9, tau=0.28):
    t = tt(dur)
    s = (
        np.sin(2 * np.pi * freq * t)
        + 0.45 * np.sin(2 * np.pi * freq * 2.0 * t) * np.exp(-t / (tau * 0.6))
        + 0.2 * np.sin(2 * np.pi * freq * 3.01 * t) * np.exp(-t / (tau * 0.35))
        + 0.12 * np.sin(2 * np.pi * freq * 4.2 * t) * np.exp(-t / (tau * 0.2))
    )
    return s * env_ad(len(t), 0.002, tau)


def pluck(freq, dur=0.5, tau=0.14):
    t = tt(dur)
    s = np.sin(2 * np.pi * freq * t) + 0.4 * np.sin(2 * np.pi * freq * 2 * t) * np.exp(-t / 0.05)
    return s * env_ad(len(t), 0.003, tau)


def marimba(freq, dur=0.6, tau=0.16):
    t = tt(dur)
    s = np.sin(2 * np.pi * freq * t) + 0.5 * np.sin(2 * np.pi * freq * 4 * t) * np.exp(-t / 0.04)
    return s * env_ad(len(t), 0.002, tau)


def bass(freq, dur=0.55):
    t = tt(dur)
    s = np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(2 * np.pi * freq * 2 * t)
    return s * env_ad(len(t), 0.006, 0.26)


def pad(freqs, dur):
    t = tt(dur)
    out = np.zeros_like(t)
    for f in freqs:
        for detune in (-0.0035, 0.0035):
            ff = f * (1 + detune)
            out += np.sin(2 * np.pi * ff * t) + 0.25 * np.sin(2 * np.pi * ff * 2 * t)
    a = np.minimum(1.0, t / 0.35)
    r = np.minimum(1.0, (dur - t) / 0.5)
    return out * a * np.clip(r, 0, 1) / (len(freqs) * 2)


def kick():
    t = tt(0.32)
    f = 48 + 110 * np.exp(-t / 0.035)
    phase = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(phase) * np.exp(-t / 0.11)


def hat(open_=False):
    n = int((0.22 if open_ else 0.06) * SR)
    noise = np.diff(rng.standard_normal(n + 1))
    return noise * np.exp(-np.arange(n) / SR / (0.07 if open_ else 0.014))


def clap():
    n = int(0.25 * SR)
    noise = np.diff(rng.standard_normal(n + 1))
    t = np.arange(n) / SR
    e = np.exp(-t / 0.07)
    for k in (0.0, 0.012, 0.024):
        e += 0.8 * np.exp(-np.maximum(t - k, 0) / 0.01) * (t >= k)
    return noise * e * np.exp(-t / 0.12) * 0.7


def noise_sweep(dur, f0, f1, shape="swell"):
    """Band-limited noise whose brightness moves from f0 to f1 (one-pole low-pass sweep)."""
    n = int(dur * SR)
    noise = rng.standard_normal(n)
    freqs = np.geomspace(f0, f1, n)
    alpha = 1 - np.exp(-2 * np.pi * freqs / SR)
    out = np.zeros(n)
    y = 0.0
    for i in range(n):
        y += alpha[i] * (noise[i] - y)
        out[i] = y
    out = np.diff(np.concatenate([[0], out])) * 4 + out * 0.3  # lift the highs a little
    x = np.linspace(0, 1, n)
    if shape == "swell":
        e = np.sin(np.pi * x) ** 1.5
    elif shape == "rise":
        e = x**2
    else:
        e = (1 - x) ** 2
    return out * e


def reverb_ir(seconds=1.9):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = rng.standard_normal((2, n)) * np.exp(-t / 0.45)
    # darken the tail
    for ch in range(2):
        y = 0.0
        for i in range(n):
            y += 0.35 * (ir[ch, i] - y)
            ir[ch, i] = y
    return ir / np.sqrt(np.sum(ir**2, axis=1, keepdims=True))


def convolve(bus, ir):
    n = bus.shape[1] + ir.shape[1]
    size = 1 << (n - 1).bit_length()
    out = np.zeros_like(bus)
    for ch in range(2):
        full = np.fft.irfft(np.fft.rfft(bus[ch], size) * np.fft.rfft(ir[ch], size), size)
        out[ch] = full[: bus.shape[1]]
    return out


# ---- music ---------------------------------------------------------------------------------------

CHORDS = [  # (bass root, chord tones)
    (36, [60, 64, 67]),  # C
    (43, [59, 62, 67]),  # G
    (45, [60, 64, 69]),  # Am
    (41, [60, 65, 69]),  # F
]
MELODY = [
    [76, None, 79, 76, 72, 74, 76, None],
    [74, None, 79, 74, 71, 74, 79, None],
    [76, None, 81, 76, 72, 76, 81, None],
    [77, None, 81, 77, 72, 77, 81, 76],
]
ARP = [0, 1, 2, 1, 2, 1, 2, 1]
PENTA = [72, 74, 76, 79, 81, 84, 86, 88, 91]  # C5.. pentatonic for effects


def build(data, offset=0.0):
    D = data["duration"]
    events = data["events"]
    for e in events:
        e["t"] += offset

    def first(kind, **match):
        for e in events:
            if e["type"] == kind and all(e.get(k) == v for k, v in match.items()):
                return e["t"]
        return None

    outro_t = first("card", id="outro", on=True) or D - 3
    intro_off = first("card", id="intro", on=False) or 1.5
    signup_ok = first("signup_ok") or D * 0.3
    first_task = first("task_added") or D * 0.6

    n_pre = int(outro_t // BAR)  # bars before the final chord
    g0 = outro_t - n_pre * BAR  # bar grid origin: the final chord lands exactly on the end card

    def bar_at(t):
        return int(round((t - g0) / BAR))

    A = max(1, bar_at(intro_off))
    B = max(A + 1, bar_at(signup_ok))
    C = max(B + 1, min(n_pre - 2, bar_at(first_task)))
    fill = n_pre - 1

    mix = Mix(D + 3)

    # --- intro: a swelling riser into the swing, an impact where the camera swings round
    if intro_off > 0.4:
        mix.add(noise_sweep(intro_off, 300, 7000, "rise"), 0, 0.10, send=0.3)
        mix.add(pad([hz(60), hz(67), hz(72)], intro_off + 0.4), 0, 0.10, send=0.5)
    mix.add(np.sin(2 * np.pi * 52 * tt(1.1)) * np.exp(-tt(1.1) / 0.35), intro_off, 0.30)
    mix.add(bell(hz(84), 1.6, 0.5), intro_off, 0.10, send=0.6)

    # --- bars
    for bar in range(0, n_pre + 1):
        t0 = g0 + bar * BAR
        final = bar == n_pre
        root, tones = CHORDS[bar % 4]
        if final:
            root, tones = 36, [60, 64, 67, 74]  # C add9
        # pad on every bar once the grid has begun
        if bar >= 0 and t0 + 0.01 >= 0:
            dur = (D + 1 - t0) if final else BAR + 0.15
            mix.add(pad([hz(m) for m in tones], dur), t0, 0.11 if bar < A else 0.085, send=0.45)
        if bar < A:
            continue
        if final:
            mix.add(bass(hz(root), 3.0), t0, 0.26)
            mix.add(kick(), t0, 0.55)
            mix.add(bell(hz(84), 3.0, 0.9), t0, 0.12, pan=-0.2, send=0.7)
            mix.add(bell(hz(79), 3.0, 0.9), t0 + 0.06, 0.09, pan=0.3, send=0.7)
            mix.add(bell(hz(76), 3.0, 0.9), t0 + 0.12, 0.08, pan=0.0, send=0.7)
            continue
        # bass: root on 1 and the "and" of 2, fifth on 4
        mix.add(bass(hz(root)), t0, 0.26)
        mix.add(bass(hz(root)), t0 + 1.5 * BEAT, 0.20)
        mix.add(bass(hz(root + 7)), t0 + 3 * BEAT, 0.17)
        # plucked arpeggio
        for k, idx in enumerate(ARP):
            note = tones[idx] + (12 if k % 4 == 3 else 0)
            mix.add(pluck(hz(note)), t0 + k * EIGHTH, 0.055 if bar < B else 0.07, pan=-0.35 + 0.1 * (k % 4), send=0.25)
        # drums
        if bar >= B and bar != fill:
            for beat in range(4):
                if beat in (0, 2) or bar >= C:
                    mix.add(kick(), t0 + beat * BEAT, 0.5 if beat == 0 else 0.34)
            for k in range(8):
                mix.add(hat(open_=(k == 7)), t0 + k * EIGHTH, 0.05 if k % 2 else 0.032, pan=0.25)
        if bar >= C and bar != fill:
            mix.add(clap(), t0 + BEAT, 0.20, pan=0.05, send=0.2)
            mix.add(clap(), t0 + 3 * BEAT, 0.22, pan=0.05, send=0.2)
        # melody: from section B, an octave of sparkle added in C
        if bar >= B and bar != fill:
            for k, m in enumerate(MELODY[bar % 4]):
                if m is None:
                    continue
                mix.add(marimba(hz(m)), t0 + k * EIGHTH, 0.12, pan=0.3, send=0.35)
                if bar >= C and k % 2 == 0:
                    mix.add(bell(hz(m + 12), 0.5, 0.12), t0 + k * EIGHTH, 0.035, pan=-0.3, send=0.5)
        # drum fill into the end card
        if bar == fill:
            for k in range(16):
                f = 0.07 + 0.13 * k / 15
                mix.add(clap() * 0.7, t0 + k * BAR / 16, f, send=0.2)
            mix.add(noise_sweep(BAR, 600, 9000, "rise"), t0, 0.12, send=0.4)
    # crash on the end card
    mix.add(noise_sweep(2.5, 9000, 1500, "fall"), outro_t, 0.14, send=0.5)

    # --- sound effects, at the exact on-screen moments
    n_task = 0
    for e in events:
        t, kind = e["t"], e["type"]
        if kind == "tap":
            click = np.diff(rng.standard_normal(int(0.03 * SR) + 1)) * np.exp(-tt(0.03) / 0.006)
            mix.add(click, t, 0.10)
            mix.add(np.sin(2 * np.pi * 1700 * tt(0.05)) * np.exp(-tt(0.05) / 0.012), t, 0.045)
        elif kind == "key":
            f = rng.choice([2100, 2500, 1900, 2300])
            tick = np.sin(2 * np.pi * f * tt(0.02)) * np.exp(-tt(0.02) / 0.004)
            tick += np.diff(rng.standard_normal(int(0.02 * SR) + 1)) * np.exp(-tt(0.02) / 0.003)
            mix.add(tick, t, 0.03, pan=rng.uniform(-0.25, 0.25))
        elif kind == "cam" and e["ms"] > 300:
            delta = abs(e["to"] - e["from"])
            if delta > 0.15 or abs(e.get("ry", 0)) > 5:
                dur = e["ms"] / 1000
                shape = "swell"
                gain = min(0.14, 0.05 + 0.06 * delta)
                mix.add(noise_sweep(dur, 400, 5500 if e["to"] >= e["from"] else 2200, shape), t, gain, pan=0.0, send=0.25)
        elif kind == "sheet_open":
            sw = tt(0.14)
            f = 380 + 700 * (sw / 0.14)
            pop = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-sw / 0.05)
            mix.add(pop, t, 0.12, send=0.2)
        elif kind == "signup_ok":
            for k, m in enumerate([72, 76, 79, 84]):
                mix.add(bell(hz(m), 1.0, 0.3), t + k * 0.07, 0.15, pan=-0.2 + 0.15 * k, send=0.55)
        elif kind == "list_created":
            mix.add(marimba(hz(79), 0.7, 0.2), t, 0.17, send=0.4)
            mix.add(marimba(hz(84), 0.9, 0.25), t + 0.09, 0.19, send=0.5)
            mix.add(bell(hz(96), 1.2, 0.35), t + 0.09, 0.05, send=0.7)
        elif kind == "task_added":
            note = [84, 88, 91][min(n_task, 2)]
            n_task += 1
            mix.add(bell(hz(note), 1.0, 0.32), t, 0.17, pan=0.1, send=0.5)
        elif kind == "check":
            i = e.get("i", 0)
            a, b = (79, 84) if i == 0 else (81, 88)
            mix.add(pluck(hz(a), 0.3, 0.09), t, 0.14, send=0.3)
            mix.add(bell(hz(b), 0.9, 0.3), t + 0.06, 0.17, send=0.5)
            mix.add(bell(hz(b + 12), 0.8, 0.25), t + 0.06, 0.05, send=0.7)
        elif kind == "progress":
            for k in range(9):
                m = PENTA[(k * 2) % len(PENTA)] + 12
                mix.add(bell(hz(m), 0.5, 0.15), t + k * 0.055, 0.06 * (1 - k / 12), pan=rng.uniform(-0.5, 0.5), send=0.7)

    # --- master
    wet = convolve(mix.wet, reverb_ir())
    out = mix.dry + wet * 0.55
    out = out[:, : int(D * SR)]
    out = np.tanh(out * 1.5) / 1.5  # gentle glue / soft clip
    peak = np.max(np.abs(out)) or 1.0
    out = out / peak * 0.8
    n = out.shape[1]
    fade_in = np.minimum(1, np.arange(n) / (0.08 * SR))
    fade_out = np.minimum(1, (n - np.arange(n)) / (2.0 * SR))
    return out * fade_in * fade_out


def main():
    data = json.load(open(sys.argv[1]))
    offset = float(__import__("os").environ.get("AUDIO_OFFSET", "0"))
    audio = build(data, offset)
    pcm = (audio.T * 32767).astype("<i2")
    with wave.open(sys.argv[2], "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print(f"soundtrack: {audio.shape[1] / SR:.1f}s at {BPM} BPM")


if __name__ == "__main__":
    main()

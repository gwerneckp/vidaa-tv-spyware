#!/usr/bin/env python3
"""Recompute the ACR fingerprint rows that HamService sends, from any audio file.

Reimplemented from DT::acr_processor::audio_buffer_to_fingerprint in HamService
(see 01-acr-viewing-tracking.md). Checked against traffic captured from the TV:
88% of bits identical over 20 messages, all aligning to the same point in the film.

    ffmpeg -i film.mp4 -vn -ac 1 -ar 8000 -c:a pcm_s16le audio.wav
    python3 recompute_fingerprint.py audio.wav [start_seconds] [rows]

Recipe:
  1. Mono audio. Take a 1.024 s slice (8192 samples at 8 kHz; the TV uses
     49152 at 48 kHz, which gives the same ~0.977 Hz per FFT bin).
  2. FFT, magnitude of each bin.
  3. Sum the magnitudes into bands starting at bin 100 (~98 Hz). The first band
     is 5 bins wide, and each next band is one bin wider (5, 6, 7, ...).
  4. Keep a running average across the bands: avg = 0.25 * band + 0.75 * avg,
     seeded with the first band.
  5. For each band after the first: bit = 1 if the band is louder than the
     running average (after including it), else 0.
  6. The code computes up to 80 bits; each row in a message carries 72
     (~98 Hz to ~3 kHz). A new row starts about every 0.26 s, so rows overlap.
"""
import sys
import numpy as np
from scipy.io import wavfile

N = 8192          # FFT size at 8 kHz (1.024 s)
BITS = 72
ROW_STEP_S = 0.26


def band_edges(n_bands=BITS + 1, first_bin=100, first_width=5):
    edges, w = [first_bin], first_width
    while len(edges) < n_bands + 1:
        edges.append(edges[-1] + w)
        w += 1
    return np.array(edges)


EDGES = band_edges()


def row(samples):
    """72 bits for one 1.024 s slice of mono audio at 8 kHz."""
    mag = np.abs(np.fft.rfft(samples[:N]))
    c = np.cumsum(mag)
    bands = c[EDGES[1:] - 1] - c[EDGES[:-1] - 1]
    avg, bits = bands[0], []
    for b in bands[1:]:
        avg = 0.25 * b + 0.75 * avg
        bits.append(1 if b > avg else 0)
    return np.array(bits, dtype=np.uint8)


def main():
    sr, x = wavfile.read(sys.argv[1])
    if sr != 8000 or x.ndim != 1:
        sys.exit("expected 8 kHz mono 16-bit WAV (see ffmpeg command in the docstring)")
    x = x.astype(np.float32)
    start = float(sys.argv[2]) if len(sys.argv) > 2 else 0.0
    rows = int(sys.argv[3]) if len(sys.argv) > 3 else 10
    for k in range(rows):
        s = int((start + k * ROW_STEP_S) * sr)
        bits = row(x[s:s + N])
        print(''.join('█' if v else '·' for v in bits), f'{start + k * ROW_STEP_S:7.2f}s')


if __name__ == '__main__':
    main()

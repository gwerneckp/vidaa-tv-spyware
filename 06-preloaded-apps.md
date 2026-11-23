# 06 · Preloaded apps

Netflix and Prime Video (and at times YouTube) are started at boot and kept running in the background so they open instantly. It's done for speed, but it means they're running and connected to their own servers all the time, whether or not you use them.

## Evidence

From [`processes.txt`](evidence/system/processes.txt) and [`connections.txt`](evidence/network/connections.txt), with the TV on the home screen and neither app opened:

| Process | Memory | Connected to |
|---|---|---|
| `/3rd/amazon/bin/ignition --launch-in-background` (Prime Video) | 278 MB | AWS (2 connections) |
| `/3rd/Netflix/netflix` | 103 MB | AWS |
| `youtube` (seen earlier the same day) | ~69 MB | |

I also saw Netflix sending DNS queries straight to Google's resolver (`8.8.8.8`), alongside the network's own.

## Why it matters

Each app's own telemetry can run while you're not using it. What it sends falls under Netflix's and Amazon's policies rather than Hisense's. It's encrypted, and I haven't looked inside.

There's a memory cost too. A second measurement later the same day ([`memory.txt`](evidence/system/memory.txt)) found Prime at 246 MB and Netflix at 125 MB (with its splash process): about 370 MB held by apps that weren't open, out of 2.6 GB total, while only about 580 MB was available. The browser that runs every VIDAA app is started in low-end device mode, with memory-pressure thresholds at 450 and 200 MB free and an 80 MB cap on streaming buffers. So memory held by preloads is memory other apps go without. See [README section 6](README.md#6-apps-you-never-opened-using-memory-you-paid-for).

## How to stop it

Netflix and Prime live on a read-only system partition, so they can't be deleted, but with root you can stop the preload at boot. The apps still work when opened; they just take a few seconds longer to start.

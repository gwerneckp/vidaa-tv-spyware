# Method

The TV is a Hisense 55U65QEVS (MediaTek MT9618, VIDAA U09.60, firmware V0000.09.60A.Q0602, UK), rooted, with a root shell over SSH.

Everything was observed on that TV, read-only, with three exceptions, all of which I reverted:

- Count-only firewall rules (no target, so they block nothing), added and then removed.
- One temporary restart of `HamService` with `NEXN_FP_WRITE_TO_FILE=true`. I bind-mounted a copy of its start script over the original, then removed the bind and restarted it normally. A test video played for about a minute to give it sound.
- One TLS capture, about a minute long.

For the capture I made a CA and a certificate for `*.fp.gb.acr.unruly.co`, valid for 7 days, and bind-mounted a start script that pointed `NEXN_CA_BUNDLE` at the TV's normal CA list plus my CA. A NAT rule redirected only `HamService`'s user (uid 329) on port 8883 to a relay on 127.0.0.1 ([`tools/mqtt-tls-relay.js`](tools/mqtt-tls-relay.js), run with the TV's own Node). The relay logged each MQTT packet and forwarded it unchanged to the real server, with normal certificate verification upstream. Credentials in the CONNECT packet were not recorded, only their lengths. Afterwards I removed the NAT rule and the bind mount, stopped the relay and restarted `HamService`, then confirmed that its environment and its direct connection to Nexxen were restored.

## What was looked at

| Question | How |
|---|---|
| What runs | `ps -o pid,user,rss,args` |
| What talks to the internet | `netstat -tnp`, filtering out local and LAN addresses; owners checked with `whois` |
| Who uses which sound device | `/proc/asound/card*/pcm*c/sub0/status` (state and `owner_pid`), then `/proc/<pid>/status` to map a thread to its process; `/proc/<pid>/fd` for open device files |
| What a program does | `strings` on the binary, copied off the TV, looking for its own log messages, config tables and URLs |
| How settings are set | `/var/local/kilby/kireg-kilby0.dat`, a plain-text tree of keys |
| What the interface code does | `grep` on the minified JavaScript in `/APPS/pkgs/tv.vidaa.app.operationui` |
| Traffic volume | `iptables` rules with no target (they count, they don't block) |
| ACR results | `/tmp/acr/`, written by `HamService` |
| How the fingerprint is computed | `llvm-objdump --triple=thumbv7-linux-gnueabihf` on the functions named in the dynamic symbol table (`DT::acr_processor::*`, `WHSPR_populate_config`, …); constants and branches read by hand, with a small script resolving PC-relative string references |
| What is actually sent | one TLS capture through a logging relay (above), MQTT v5 packets decoded by hand |
| Whether the decoded recipe is right | re-implemented in Python ([`tools/recompute_fingerprint.py`](tools/recompute_fingerprint.py)), run over the soundtrack that was playing, compared bit by bit with the capture ([`verification.txt`](evidence/capture/verification.txt)) |

## Limits

The traffic is encrypted (TLS). I can see where it goes, when and how much, but not the exact content. Content claims come from the programs' own strings and the bundled privacy policy.

`strings` shows what a program can do. A log message proves the code exists, not that it runs, so where it mattered I checked behaviour separately: process running, device open, connection live, result file written.

This is one TV, one firmware and one country; other regions may differ. The ACR policy files on the TV exist for GB, DE, FR, IT and ES.

## Binaries examined (not included)

| File | SHA-256 |
|---|---|
| `/usr/local/bin/HamService` | `491748970de6dbf6c37ec7bb6db2ac7d138171722907c33c245417e64e8fd9d4` |
| `/usr/local/bin/hi_logreport_service` | `a4e645f7466a94ea9becd2717e86f5afc818f89c798d334288d9f8ee81e3ae4a` |
| `/basic/bin/voicesdk_server` | `1434fdec199e48cd958fddfb6114dc044a82485c52a3362315dbe3bcf0bd6879` |
| `/usr/local/bin/mdharvester` | `7da41261746fcedf6c05a1c52122ba26814fe60355386938921ec3b9a5ffcb05` |
| `/usr/local/bin/capture` | `9468f6d9cf04e665823da5ec54b95ca68bcba6a27926020b834f419aee1c22d1` |

## Redactions

Advertising ID, MAC address, serial number, the TV's LAN address, its Bluetooth name and a Netflix instance ID are removed from the evidence.

# Blocklists

What to block on your network for a Hisense VIDAA TV. Subscribe to whichever format your blocker uses:

| Blocker | URL |
|---|---|
| AdGuard Home, Pi-hole v6, or anything that understands `||domain^` (recommended: covers all ACR stream hosts) | `https://raw.githubusercontent.com/gwerneckp/vidaa-tv-spyware/main/lists/hisense-vidaa-adguard.txt` |
| Pi-hole v5 or older, exact names | `https://raw.githubusercontent.com/gwerneckp/vidaa-tv-spyware/main/lists/hisense-vidaa-domains.txt` |
| Pi-hole regex (paste into Domains → Regex filter; covers all ACR stream hosts) | `https://raw.githubusercontent.com/gwerneckp/vidaa-tv-spyware/main/lists/hisense-vidaa-regex.txt` |
| hosts file | `https://raw.githubusercontent.com/gwerneckp/vidaa-tv-spyware/main/lists/hisense-vidaa-hosts.txt` |

The ACR fingerprint stream uses a different numbered host per connection (`38.fp.gb.acr.unruly.co`, `51.fp.gb...`), so the exact-name formats only list the ones I've seen. Use the AdGuard or regex format if you can.

Blocking doesn't replace the TV setting. Turn that off too (see [08](../08-how-to-turn-it-off.md)): an already-open connection stays up until it drops.

Don't block all of `vidaahub.com`: the app store, updates and the home screen use it.

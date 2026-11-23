# 07 · Things that look suspicious but aren't

| Process | What it is | Why it's fine |
|---|---|---|
| `mdharvester` | Indexes USB drives for the Media app (a local SQLite database of videos, music, pictures) | no network connections |
| `capture` | Screenshot / screen-capture service | local; used by the system's screenshot tool |
| `airplaydemo`, `airplay_bridge` | AirPlay receiver | only talks to devices on your network |
| `dialserver`, `dlna_service` | "Cast to TV" from phones | local network only |
| `mosquitto` (`/opt/iot/mosquitto`) | Message bus for the phone-remote app and smart-home features | used by apps on your network, password-protected; no outside connections seen |
| `karaoke` | Karaoke mode | no network connections seen |
| `ota_upgrade` | Firmware updates | needed; keep it |

None of these collects data about you. Some use memory, and you could stop them if you don't use the feature.

If you stream torrents on the TV, as I do with my own app, you'll see dozens of connections to random IPs. Those are peers and have nothing to do with tracking, although peers can see your IP address; that's how the protocol works.

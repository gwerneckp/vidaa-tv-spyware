# 05 · The VIDAA cloud

VIDAA's system services run on a bundled Node.js runtime called `phoenix` (`/APPS/pkgs/tv.vidaa.jsservice.basic/current/phoenix.server.js`). One of them keeps a permanent connection to VIDAA's servers, and the interface talks to a long list of `vidaahub.com` services.

## Evidence

The permanent connection, from [`connections.txt`](evidence/network/connections.txt):

```
tcp  <tv-lan-ip>:56286  43.157.127.133:10443  ESTABLISHED  phoenix (system service)
```

The address is registered to Aceville Pte. Ltd., Singapore.

The interface package (`tv.vidaa.app.operationui`) and the system services name many hosts. These matter for tracking or money:

| Host | Probably for |
|---|---|
| `abtest-tv.vidaahub.com` | A/B testing (trying different interface versions on different users) |
| `recommend-ui.vidaahub.com` | recommendations |
| `rsc-ads.vidaahub.com` | ads |
| `rsc-mntz.vidaahub.com` | monetisation |
| `file-ul.vidaahub.com` | file uploads |
| `base-ai.vidaahub.com` | AI features |
| `mobile-data.onetrust.io` | OneTrust consent management |

Others are needed for normal use: `appstore-vidaa.vidaahub.com`, `upgrade-plc-tv.vidaahub.com` (updates), `vidaa-base-auth.vidaahub.com` (sign-in), `img.vidaahub.com`, `home-ui` / `layout-ui` (home screen content), `drm-vss.vidaahub.com`.

All of these hostnames come from the code. The only connection I've confirmed live is the one to `43.157.127.133`.

## Is it a problem?

Partly: a smart TV needs a server for the app store, updates and the channel list. The same cloud also runs the ad, monetisation, A/B testing and upload services, though, and the system keeps a connection to it open all the time.

## Still open

I don't yet know which hosts are actually contacted in a day; that needs a DNS log. I also don't know what goes over the `10443` connection. It's likely a push and messaging channel.

## How to stop it

Blocking the whole of `vidaahub.com` would break the app store, updates and home screen content. Block the ad, monetisation and A/B hosts selectively instead ([08](08-how-to-turn-it-off.md)).

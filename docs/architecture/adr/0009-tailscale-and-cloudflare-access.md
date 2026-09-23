# ADR-0009: Tailscale for phone access before v1.1, Cloudflare Access on Railway

- Status: Proposed (Accepted when the PR is approved)
- Date: 2026-09-23
- Deciders: Owner
- Amends: ADR-0002 (picks the edge mechanism), ADR-0004 (picks the phone access before Railway)

## Context
ADR-0002 left the edge protection of the Railway URL open (PRD Q2). ADR-0004 left open how the phone reaches the local app before v1.1 (PRD Q5). A service worker (offline, install) only runs over HTTPS, so plain `http://192.168.x.x` can't be used. SPEC-001 AC-8 (PWA install) needs this answer in Sprint 0.

## Decision
- **Up to v1.0.0 (local):** Tailscale runs on the laptop and the phone. `tailscale serve` exposes the local app on the tailnet at `https://<laptop>.<tailnet>.ts.net`, with a certificate Tailscale manages. Nothing is public.
- **From v1.1.0 (Railway):** a custom domain on Cloudflare, with **Cloudflare Access** in front of the Railway service. There's one allow rule, the owner's email (one-time code or Google login). The app still has no auth code (ADR-0002).

## Alternatives considered
| Option | Pros | Cons |
|---|---|---|
| `mkcert` local certificates | No extra service | The CA must be installed on the phone; LAN only; manual renewal |
| Cloudflare Tunnel before v1.1 | The same URL style as production | Public from day one, so edge protection would be needed in Sprint 0 |
| Basic auth at a proxy (Railway) | No Cloudflare account, one line of Hono middleware | A browser credentials prompt; the password lives in env and in the browser |
| Unguessable Railway URL | Zero setup | Obscurity only |

## Consequences
- Sprint 0 adds a "phone access" step to the local run docs: install Tailscale on both devices and run `tailscale serve`.
- The PWA is installed from the tailnet origin before v1.1, then from the Cloudflare domain from v1.1. These are different origins, so it has to be reinstalled once, and the local cache doesn't carry over. That's acceptable because the data lives on the server (D-4 moves it).
- Sprint 6 needs a domain on Cloudflare. The offline cache must survive the Access redirect (already flagged in ADR-0002), so it gets an e2e check in SPEC-007.

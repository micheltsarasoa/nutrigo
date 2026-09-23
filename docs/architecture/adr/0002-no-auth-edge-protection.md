# ADR-0002: No in-app auth; protect at the edge

- Status: Accepted (edge mechanism: **open**, decide before Sprint 4)
- Date: 2026-09-23

## Context
The app has one user. Login, sessions and user tables would be code that brings no product value. However, a Railway service has a public URL, and the data (diet, habits) is personal.

## Decision
The app has **no authentication code**. When it's deployed, access is restricted *in front of* the app by one of these (to decide):
1. **Cloudflare Access** (custom domain on Cloudflare, one allowed email) ← recommended
2. HTTP basic auth at a small proxy, or Hono's `basicAuth` middleware driven by the `BASIC_AUTH` env var (a single line of code, and off locally)
3. An unguessable Railway URL (obscurity only, not recommended)

## Consequences
- There's nothing to test for auth in the app.
- The PWA's offline cache must survive the edge-auth redirect. Test this in Sprint 4.
- If the app ever becomes multi-user, supersede this ADR.

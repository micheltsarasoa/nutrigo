# ADR-0004: Local Docker until v1.0.0, then Railway with a volume

- Status: Accepted. Phone access before Railway was decided in ADR-0009: Tailscale serve.
- Date: 2026-09-23

## Context
The owner will only deploy to Railway **after v1.0.0**. Until then the app runs locally but is still used from a phone. SQLite needs persistent disk in both places.

## Decision
- **Sprints 0–5 (up to v1.0.0)**: `docker compose up` locally, with `./data` mounted at `/data`. Each release image is still built and pushed to GHCR, so it can be pulled locally.
- **Local backups from Sprint 1**: an npm script runs `sqlite3 .backup` into `data/backups/` (keep 30), with a copy to a second disk or cloud folder.
- **Phone access before Railway (open, decide in Sprint 0)**: a service worker needs HTTPS, so pick one of: (a) Tailscale on laptop and phone with `tailscale serve` (HTTPS, private, recommended); (b) `mkcert` local certificates, with the CA installed on the phone; (c) a Cloudflare Tunnel (public, needs edge protection earlier).
- **Sprint 6 (v1.1.0)**: one Railway service built from the same Dockerfile, a **Railway volume mounted at `/data`**, `DATABASE_PATH=/data/nutrigo.db`, 1 replica, healthcheck `/health`.
- Deployment comes from GitHub Actions (`deploy.yml`) on each release, using the Railway CLI and a `RAILWAY_TOKEN` secret. The job is skipped while the `RAILWAY_ENABLED` repo variable isn't `true`.
- Backups: a daily GitHub Actions cron (or a Railway cron service) produces `sqlite3 .backup` and keeps 30 days of copies off-platform. The target storage is to be chosen in Sprint 6.

## Consequences
- The app must never run with more than one replica (SQLite has a single writer).
- A redeploy briefly stops the service, which is acceptable for one user.

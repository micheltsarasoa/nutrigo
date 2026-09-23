# ADR-0004: Local Docker first, then Railway with a volume

- Status: Accepted
- Date: 2026-09-23

## Context
The app is used locally at first, then from a phone anywhere. SQLite needs persistent disk.

## Decision
- **Sprints 0–3**: `docker compose up` locally, with `./data` mounted at `/data`.
- **Sprint 4+**: one Railway service built from the same Dockerfile, a **Railway volume mounted at `/data`**, `DATABASE_PATH=/data/nutrigo.db`, 1 replica, healthcheck `/health`.
- Deployment comes from GitHub Actions (`deploy.yml`) on each release, using the Railway CLI and a `RAILWAY_TOKEN` secret. The job is skipped while the `RAILWAY_ENABLED` repo variable isn't `true`.
- Backups: a daily GitHub Actions cron (or a Railway cron service) produces `sqlite3 .backup` and keeps 30 days of copies off-platform. The target storage is to be chosen in Sprint 4.

## Consequences
- The app must never run with more than one replica (SQLite has a single writer).
- A redeploy briefly stops the service, which is acceptable for one user.

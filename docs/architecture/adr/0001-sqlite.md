# ADR-0001: SQLite as the only database

- Status: Accepted
- Date: 2026-09-23

## Context
The app has a single user and a few thousand rows at most, and must run the same way on a laptop and on Railway.

## Decision
Use SQLite (file `DATABASE_PATH`, default `./data/nutrigo.db`) with `better-sqlite3` and Drizzle ORM. Run migrations with drizzle-kit at boot. Enable WAL mode and foreign keys.

## Alternatives considered
| Option | Pros | Cons |
|---|---|---|
| Postgres (Railway plugin) | Managed, backups included | An extra service to run and pay for, and needs a server locally too |
| IndexedDB only (no backend) | No server at all | No reliable backup, and hard to call the Claude API safely |

## Consequences
- The volume and backups are our responsibility (ADR-0004).
- Only one process can write, which is fine for one user. We must not scale beyond one instance on Railway.

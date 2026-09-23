# ADR-0005: npm-workspaces monorepo, single Docker image

- Status: Proposed
- Date: 2026-09-23

## Context
The web app and the API share validation schemas and nutrition math. Deploying them separately would add CORS, two services and two versions.

## Decision
Use npm workspaces (`apps/web`, `apps/api`, `packages/shared`) with one version for the whole repo. The API serves the web build's static files. This produces one Docker image and one Railway service.

## Alternatives considered
| Option | Pros | Cons |
|---|---|---|
| Two services (static host + API) | CDN for static files | CORS, two deploys, version skew |
| pnpm / Turborepo / Nx | Faster, caching | Extra tooling for three packages (Ponytail says no) |

## Consequences
- The release version applies to the whole app.
- CI builds once.

# Architecture overview

| | |
|---|---|
| Status | Proposed (Sprint 0) |
| Decisions | [ADR index](adr/) |

## 1. System context

NutriGo is a single deployable used by one person. The only outbound dependencies are nutrition databases and, from Sprint 5, the Claude API.

```mermaid
C4Context
    title System context: NutriGo
    Person(owner, "Owner", "Plans meals on a phone")
    System(nutrigo, "NutriGo", "PWA + API + SQLite")
    System_Ext(off, "Open Food Facts / USDA", "Public nutrition data")
    System_Ext(claude, "Claude API", "Plan suggestions, nutrient estimates (S5)")
    System_Ext(edge, "Edge protection", "Cloudflare Access or proxy auth (ADR-0002)")
    Rel(owner, edge, "HTTPS")
    Rel(edge, nutrigo, "Forwards allowed requests")
    Rel(nutrigo, off, "Imports ingredients", "HTTPS/JSON")
    Rel(nutrigo, claude, "Prompts", "HTTPS/JSON")
```

## 2. Containers

A single Node process serves both the built PWA (static files) and the JSON API. This means one Railway service, one volume and no CORS (ADR-0005).

```mermaid
C4Container
    title Containers: one Docker image
    Person(owner, "Owner")
    Container_Boundary(app, "NutriGo Docker image") {
        Container(web, "Web PWA", "React, TS, Vite", "UI, service worker, offline cache")
        Container(api, "API", "Node, Hono, TS", "REST /api/*, serves the static web build")
        ContainerDb(db, "SQLite", "better-sqlite3 + Drizzle", "Single file on a volume: /data/nutrigo.db")
    }
    Container_Ext(shared, "packages/shared", "Zod + TS", "Schemas and nutrition math, compiled into web and api")
    Rel(owner, web, "Uses", "HTTPS")
    Rel(web, api, "fetch /api/*", "JSON")
    Rel(api, db, "SQL", "in-process")
```

## 3. Code-level dependency rule

Dependencies point one way only. `shared` imports nothing from the apps, and the web app never touches the DB.

```mermaid
flowchart LR
    web[apps/web] --> shared[packages/shared]
    api[apps/api] --> shared
    web -. HTTP only .-> api
    api --> db[(SQLite)]
```

## 4. A typical request

This is the path of "add a recipe to Tuesday lunch". Validation happens on both sides with the **same** Zod schema.

```mermaid
sequenceDiagram
    autonumber
    actor U as Owner
    participant W as Web (React)
    participant S as shared (Zod)
    participant A as API (Hono)
    participant D as SQLite
    U->>W: Tap "Add" on Tue / Lunch, pick recipe
    W->>S: MealEntryInput.parse(form)
    S-->>W: typed input or field errors
    W->>A: POST /api/plans/2026-W40/entries
    A->>S: MealEntryInput.parse(body)
    A->>D: INSERT meal_entry (transaction)
    D-->>A: row
    A-->>W: 201 MealEntry
    W-->>U: Slot shows the recipe and updated day totals
```

## 5. Deployment

The app runs locally up to v1.0.0 (Sprints 0–5), then on Railway from v1.1.0 (Sprint 6). The flow is the same in both places: build one image and mount one data directory.

```mermaid
flowchart LR
    dev[Laptop: npm run dev] --> compose[docker compose up<br/>volume ./data]
    subgraph GitHub
      ci[CI: lint, typecheck, tests, e2e] --> rp[release-please<br/>tag vX.Y.Z]
      rp --> img[Build image<br/>ghcr.io/…/nutrigo:vX.Y.Z]
    end
    img --> rw[Railway service<br/>volume /data]
    rw --> bk[(Daily backup<br/>of nutrigo.db)]
```

## 6. Cross-cutting concerns

| Concern | Approach |
|---|---|
| Auth | None in the app; protection at the edge (ADR-0002) |
| Logging | No logging library. The API writes unexpected errors to stderr, which Railway captures. There is no request logging (CLAUDE.md rule 8) |
| Errors | The API returns `{ error: { code, message, fields? } }` with the right HTTP status; the web app maps codes to UI states |
| Config | Env vars only: `DATABASE_PATH`, `PORT`, `ANTHROPIC_API_KEY` (S5). They're validated with Zod at boot |
| Offline | The service worker caches the app shell, recipes and the current shopping list (details in the Sprint 4 spec) |
| Time | ISO weeks (`2026-W40`), dates stored as `YYYY-MM-DD` text, Europe/Paris shown in the UI |
| i18n | UI copy in English for v1, with strings kept in one module so they can be translated later |

## 7. Related documents

- [frontend.md](frontend.md) · [backend.md](backend.md) · [data-model.md](data-model.md)
- ADRs: [0001 SQLite](adr/0001-sqlite.md) · [0002 No auth](adr/0002-no-auth-edge-protection.md) · [0003 Ponytail](adr/0003-ponytail-minimal-code.md) · [0004 Railway](adr/0004-railway-deployment.md) · [0005 Monorepo, single image](adr/0005-monorepo-single-image.md) · [0006 Playground route](adr/0006-in-app-playground.md) · [0007 Versioning](adr/0007-release-please-semver.md)

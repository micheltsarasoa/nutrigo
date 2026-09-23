# Roadmap

There is one sprint every two weeks, and each sprint ships one minor version. The start date below is a proposal and can be changed in `scripts/setup-github.sh`.

```mermaid
gantt
    title NutriGo release plan (2-week sprints)
    dateFormat YYYY-MM-DD
    axisFormat %d %b
    section Sprints
    S0 Foundations            :s0, 2026-09-28, 14d
    S1 Recipes & ingredients  :s1, after s0, 14d
    S2 Weekly meal plan       :s2, after s1, 14d
    S3 Nutrition tracking     :s3, after s2, 14d
    S4 Shopping list + PWA    :s4, after s3, 14d
    S5 AI assist + 1.0        :s5, after s4, 14d
    S6 Production on Railway  :s6, after s5, 14d
    section Releases
    v0.1.0 :milestone, after s0, 0d
    v0.2.0 :milestone, after s1, 0d
    v0.3.0 :milestone, after s2, 0d
    v0.4.0 :milestone, after s3, 0d
    v0.5.0 :milestone, after s4, 0d
    v1.0.0 :milestone, after s5, 0d
    v1.1.0 :milestone, after s6, 0d
```

| Sprint | Version | Goal | PRD refs | Done when |
|---|---|---|---|---|
| S0 | v0.1.0 | Foundations: monorepo, CI/CD, Docker, tokens, atoms in `/playground`, board | G4 | CI green, `docker compose up` serves the playground, atoms approved |
| S1 | v0.2.0 | Recipes & ingredients (manual nutrition entry); **Settings** modal with the locale | R-1…R-9, C-1 | CRUD works end to end on a phone |
| S2 | v0.3.0 | Weekly meal plan screen | P-1…P-4 | A week can be planned from recipes |
| S3 | v0.4.0 | Today screen: nutrition totals, targets, charts, **food diary check-off**; CIQUAL + Open Food Facts import; Settings: nutrition sources | N-1…N-6, C-2 | Daily and weekly nutrition visible against targets |
| S4 | v0.5.0 | Shopping list with **costs in EUR**, offline PWA | S-1…S-7 | List usable offline in the store (on the local deployment) |
| S5 | v1.0.0 | AI-assisted plan and nutrient estimates (Claude, Mistral or DeepSeek), Settings: AI provider and spend cap, hardening | A-1…A-5, C-3, C-4 | All Must requirements are met locally, and the backup/restore has been tested |
| S6 | v1.1.0 | **Production on Railway**: volume, Cloudflare Access, off-site backups, deploy pipeline on | D-1…D-4 | Prod URL live and protected; restore drill passes against a prod backup |

```mermaid
timeline
    title Where the app runs
    S0-S5 : Local only (npm run dev + docker compose), phone over Tailscale, AI API keys in local .env from S5
    S6 : Railway production (volume + Cloudflare Access + off-site backups)
```

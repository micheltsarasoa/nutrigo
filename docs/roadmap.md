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
    S5 Claude assist + 1.0    :s5, after s4, 14d
    section Releases
    v0.1.0 :milestone, after s0, 0d
    v0.2.0 :milestone, after s1, 0d
    v0.3.0 :milestone, after s2, 0d
    v0.4.0 :milestone, after s3, 0d
    v0.5.0 :milestone, after s4, 0d
    v1.0.0 :milestone, after s5, 0d
```

| Sprint | Version | Goal | PRD refs | Done when |
|---|---|---|---|---|
| S0 | v0.1.0 | Foundations: monorepo, CI/CD, Docker, tokens, atoms in `/playground`, board | G4 | CI green, `docker compose up` serves the playground, atoms approved |
| S1 | v0.2.0 | Recipes & ingredients (manual nutrition entry) | R-1…R-5 | CRUD works end to end on a phone |
| S2 | v0.3.0 | Weekly meal plan screen | P-1…P-4 | A week can be planned from recipes |
| S3 | v0.4.0 | Nutrition totals, targets, charts; Open Food Facts/USDA import | N-1…N-4 | Daily and weekly nutrition visible against targets |
| S4 | v0.5.0 | Shopping list, offline PWA, **first Railway deploy** | S-1…S-4 | List usable offline in the store; prod URL live and protected |
| S5 | v1.0.0 | Claude-assisted plan and nutrient estimates, hardening | A-1…A-3 | All Must requirements are met, and the backup/restore has been tested |

```mermaid
timeline
    title Where the app runs
    S0-S3 : Local only (npm run dev + docker compose)
    S4 : Railway production (volume + backups)
    S5 : Railway + Claude API key
```

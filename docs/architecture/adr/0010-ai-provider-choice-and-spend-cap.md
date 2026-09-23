# ADR-0010: AI provider chosen in settings (Claude, Mistral, DeepSeek) with an in-app monthly spend cap

- Status: Proposed (Accepted when the PR is approved)
- Date: 2026-09-23
- Deciders: Owner

## Context
The AI features (PRD §5.5, Sprint 5: plan suggestions and nutrient estimates) were designed around the Claude API only. PRD Q4 asked for a monthly budget. The owner wants to **choose the provider in the app settings** and to set a **monthly spend cap** there, whichever provider is selected.

## Decision
- **Providers in v1: Claude (Anthropic), Mistral and DeepSeek.** Claude is the default.
- **No SDKs** (ADR-0003). `apps/api/src/integrations/ai/` holds two thin `fetch` clients behind one `AiProvider` interface (`complete(prompt, schema) → { json, usage }`):
  - `anthropic.ts`: the Messages API.
  - `openai-compatible.ts`: chat completions with a per-provider base URL and model. DeepSeek and Mistral both publish an OpenAI-compatible endpoint. Any differences in structured output are handled in this file and confirmed in the Sprint 5 spec.
- **Keys stay in env**, never in the DB or the settings screen: `ANTHROPIC_API_KEY`, `MISTRAL_API_KEY` and `DEEPSEEK_API_KEY`, all optional. A provider whose key is missing is shown in settings but can't be selected.
- **The provider and model are a setting** (SPEC-008), stored in the `settings` table.
- **Spend cap:** each AI call records its provider, model and input/output tokens in an `ai_usage` table. The cost is computed from a **price table in `packages/shared`** (EUR per million tokens, per model), which the owner updates by PR when prices change. Before each call, the API sums the current calendar month. If the sum is ≥ the cap, the call is refused with `402 AI_BUDGET_EXCEEDED` and the UI says so. There's no cap when it isn't set.
- The AI still only **proposes** (A-3). Every response is validated with Zod before it reaches the web app.

## Alternatives considered
| Option | Pros | Cons |
|---|---|---|
| Claude only (the original plan) | One client, simplest | The owner explicitly wants a choice |
| An abstraction library (e.g. a multi-provider SDK) | Many providers for free | A new dependency and more surface than two `fetch` calls (Ponytail) |
| Rely on each provider's dashboard limits | No cap code | Three dashboards, no single € figure, and the app can't explain a refusal |
| Store the API keys in settings | Change keys without a redeploy | Secrets in SQLite and in backups; breaks CLAUDE.md rule 10 |

## Consequences
- **Privacy:** prompts contain recipes, targets and meal plans. Mistral is hosted in the EU. **DeepSeek is hosted in China.** Selecting it sends that data there, and the settings screen says so next to the choice. The PRD Privacy NFR is updated.
- The costs are **estimates** (from token counts × a price table in the repo). They can drift from the provider's invoice until the table is updated.
- Test fixtures are recorded per provider, and CI never calls a real API (testing strategy).
- SPEC-006 (AI assist, Sprint 5) specifies the prompts, models and structured output for each provider.
- Follow-ups: `backend.md` §1/§4 and `overview.md` still describe a Claude-only integration. Update them in the SPEC-006 PR.

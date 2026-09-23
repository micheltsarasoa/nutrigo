---
name: sprint-plan
description: Plan the next NutriGo 2-week sprint or close the current one (review, retro, carry-over). Use at the start or end of a sprint, or when asked what to work on next.
argument-hint: "start|close [sprint number]"
---

# Sprint planning and closing

## start
1. Read `docs/roadmap.md` for the sprint goal and target version, and read the milestone `Sprint N`.
2. List candidate issues: carry-over from the previous milestone, the roadmap scope and `tech-debt` items (about 10 % of capacity).
3. Check each issue against the **Definition of Ready** (`docs/process/workflow.md` §3) and list the ones that fail it.
4. Order the work: specs first, then atoms, then molecules, then organisms, then page integration, then tasks. Batch components so the owner can validate them together around day 6.
5. Present the plan (goal sentence, ordered list and sizes, risks) and **wait for the owner's approval** before setting milestones or moving items to Ready.

## close
1. Summarise Done vs not Done in the milestone. Move unfinished items to the next milestone, with the owner's approval.
2. Retro: what went well, what hurt, and actions. Run `/ponytail-debt` and propose `tech-debt` issues.
3. Suggest process-doc changes as a PR if the retro calls for them.
4. Hand over to `/cut-release`.

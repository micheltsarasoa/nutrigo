#!/usr/bin/env bash
# One-time GitHub setup for NutriGo: labels, sprint milestones, Projects (v2) board.
# Requires: gh CLI logged in with the 'project' scope ->  gh auth refresh -s project
# Safe to re-run: labels are upserted, existing milestones and the project are reused.
set -euo pipefail

REPO="${REPO:-micheltsarasoa/nutrigo}"
OWNER="${REPO%%/*}"
SPRINT0_START="${SPRINT0_START:-2026-09-28}"   # Monday Sprint 0 starts
SPRINT_DAYS=14
PROJECT_TITLE="NutriGo"

add_days() { # add_days YYYY-MM-DD N  (GNU or BSD date)
  date -u -d "$1 + $2 days" +%F 2>/dev/null || date -u -j -v+"$2"d -f %F "$1" +%F
}

echo "==> Labels"
label() { gh label create "$1" --color "$2" --description "$3" --force -R "$REPO" >/dev/null && echo "  $1"; }
label "type:epic"            "5319e7" "PRD section"
label "type:story"           "1d76db" "User-visible slice"
label "type:component"       "0e8a16" "Atom / molecule / organism"
label "type:task"            "c5def5" "Technical step"
label "type:bug"             "d73a4a" "Does not match the spec"
label "type:spike"           "fbca04" "Time-boxed research"
label "level:atom"           "bfdadc" "Atomic design level"
label "level:molecule"       "7fd1c7" "Atomic design level"
label "level:organism"       "3fb8a8" "Atomic design level"
label "awaiting-validation"  "f9d0c4" "Playground demo ready, waiting for owner review"
label "design-approved"      "0e8a16" "Owner approved in /playground"
label "tech-debt"            "a2a2a2" "Refactoring / cleanup"
label "blocked"              "b60205" "Cannot progress"
label "P0"                   "b60205" "Must, this sprint"
label "P1"                   "d93f0b" "Should"
label "P2"                   "fbca04" "Could"

echo "==> Milestones (one per sprint = one release)"
goals=(
  "Foundations: monorepo, CI/CD, Docker, tokens, atoms in /playground -> v0.1.0"
  "Recipes & ingredients -> v0.2.0"
  "Weekly meal plan -> v0.3.0"
  "Nutrition tracking, targets, charts, OFF/USDA import -> v0.4.0"
  "Shopping list, offline PWA -> v0.5.0"
  "Claude-assisted planning, hardening -> v1.0.0 (local)"
  "Production on Railway: volume, edge protection, off-site backups -> v1.1.0"
)
existing=$(gh api "repos/$REPO/milestones?state=all&per_page=100" --jq '.[].title')
for i in "${!goals[@]}"; do
  title="Sprint $i"
  due=$(add_days "$SPRINT0_START" $(( (i + 1) * SPRINT_DAYS - 1 )))
  if grep -qx "$title" <<<"$existing"; then echo "  $title (exists)"; continue; fi
  gh api "repos/$REPO/milestones" -f title="$title" -f due_on="${due}T23:59:59Z" \
    -f description="Goal: ${goals[$i]}" >/dev/null
  echo "  $title  due $due"
done

echo "==> Project board"
number=$(gh project list --owner "$OWNER" --format json --jq ".projects[] | select(.title==\"$PROJECT_TITLE\") | .number" | head -n1)
if [ -z "$number" ]; then
  number=$(gh project create --owner "$OWNER" --title "$PROJECT_TITLE" --format json --jq .number)
  gh project field-create "$number" --owner "$OWNER" --name "Stage" --data-type SINGLE_SELECT \
    --single-select-options "Backlog,Ready,In progress,Awaiting validation,In review,Done" >/dev/null
  gh project field-create "$number" --owner "$OWNER" --name "Size" --data-type SINGLE_SELECT \
    --single-select-options "XS,S,M,L" >/dev/null
  gh project field-create "$number" --owner "$OWNER" --name "Level" --data-type SINGLE_SELECT \
    --single-select-options "Atom,Molecule,Organism,Page,n/a" >/dev/null
  echo "  created project #$number"
else
  echo "  project #$number exists"
fi
gh project link "$number" --owner "$OWNER" --repo "$REPO" >/dev/null 2>&1 || true

cat <<MSG

Done. Three manual steps the gh CLI cannot do (about 2 minutes):
  1. Project #$number -> Settings -> + New field -> Iteration "Sprint", 2 weeks, starting $SPRINT0_START.
  2. Board view -> Group by "Stage"; set a column limit of 2 on "In progress".
  3. Project -> Workflows: enable "Auto-add to project" for $REPO (issues + PRs) and
     "Item closed -> Stage: Done".
Also, in the repo settings:
  - Actions -> General -> "Allow GitHub Actions to create and approve pull requests" (for release-please).
  - Branches -> protect main: require PR, require status checks (CI), require linear history.
MSG

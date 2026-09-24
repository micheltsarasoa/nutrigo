#!/usr/bin/env bash
# One-time GitHub setup for NutriGo: labels, sprint milestones, Projects (v2) board.
# Requires: gh CLI logged in with the 'project' scope ->  gh auth refresh -s project
# Safe to re-run: labels are upserted, existing milestones and the project are reused.
set -euo pipefail

REPO="${REPO:-micheltsarasoa/nutrigo}"
OWNER="${REPO%%/*}"
SPRINT0_START="${SPRINT0_START:-2026-09-28}"   # Monday Sprint 0 starts
SPRINT_DAYS=14
PROJECT_TITLE="${PROJECT_TITLE:-NutriGo}"

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
  "Recipes & ingredients, Settings (locale) -> v0.2.0"
  "Weekly meal plan -> v0.3.0"
  "Nutrition tracking, targets, charts, CIQUAL + OFF import, Settings (sources) -> v0.4.0"
  "Shopping list, offline PWA -> v0.5.0"
  "AI-assisted planning (Claude/Mistral/DeepSeek, spend cap), hardening -> v1.0.0 (local)"
  "Production on Railway: volume, Cloudflare Access, off-site backups -> v1.1.0"
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
  # Stages go in the built-in Status field: GitHub's built-in workflows only set Status.
  # Existing option ids are reused so "Item added -> Backlog" and "closed/merged -> Done" keep working.
  q='query($o:String!,$n:Int!){user(login:$o){projectV2(number:$n){id field(name:"Status"){... on ProjectV2SingleSelectField{id options{id name}}}}}}'
  read -r pid sid todo inprog done < <(gh api graphql -f query="$q" -f o="$OWNER" -F n="$number" --jq \
    '.data.user.projectV2 | [.id, .field.id, (.field.options[] | select(.name=="Todo") | .id), (.field.options[] | select(.name=="In Progress") | .id), (.field.options[] | select(.name=="Done") | .id)] | @tsv')
  gh api graphql --input - >/dev/null <<JSON
{"variables":{"f":"$sid","o":[
 {"id":"$todo","name":"Backlog","color":"GRAY","description":"Not ready yet"},
 {"name":"Ready","color":"BLUE","description":"Meets the Definition of Ready"},
 {"id":"$inprog","name":"In progress","color":"YELLOW","description":"Being worked on (max 2)"},
 {"name":"Awaiting validation","color":"ORANGE","description":"Playground demo ready, owner review"},
 {"name":"In review","color":"PURPLE","description":"PR open"},
 {"id":"$done","name":"Done","color":"GREEN","description":"Merged or closed"}]},
 "query":"mutation(\$f:ID!,\$o:[ProjectV2SingleSelectFieldOptionInput!]){updateProjectV2Field(input:{fieldId:\$f,singleSelectOptions:\$o}){clientMutationId}}"}
JSON
  iters=""; for i in 0 1 2 3 4 5 6; do
    iters+="${iters:+,}{\"title\":\"Sprint $i\",\"startDate\":\"$(add_days "$SPRINT0_START" $(( i * SPRINT_DAYS )))\",\"duration\":$SPRINT_DAYS}"
  done
  gh api graphql --input - >/dev/null <<JSON
{"query":"mutation(\$in:CreateProjectV2FieldInput!){createProjectV2Field(input:\$in){clientMutationId}}",
 "variables":{"in":{"projectId":"$pid","dataType":"ITERATION","name":"Sprint",
  "iterationConfiguration":{"startDate":"$SPRINT0_START","duration":$SPRINT_DAYS,"iterations":[$iters]}}}}
JSON
  gh project field-create "$number" --owner "$OWNER" --name "Size" --data-type SINGLE_SELECT \
    --single-select-options "XS,S,M,L" >/dev/null
  gh project field-create "$number" --owner "$OWNER" --name "Level" --data-type SINGLE_SELECT \
    --single-select-options "Atom,Molecule,Organism,Page,n/a" >/dev/null
  echo "  created project #$number"
else
  echo "  project #$number exists"
fi
gh project link "$number" --owner "$OWNER" --repo "$REPO" >/dev/null 2>&1 || true

echo "==> Repo settings"
# Squash-only, PR title as commit title (Conventional Commits -> release-please).
gh api -X PATCH "repos/$REPO" -F allow_squash_merge=true -F allow_merge_commit=false -F allow_rebase_merge=false \
  -f squash_merge_commit_title=PR_TITLE -f squash_merge_commit_message=PR_BODY -F delete_branch_on_merge=true >/dev/null
# release-please opens PRs with GITHUB_TOKEN.
gh api -X PUT "repos/$REPO/actions/permissions/workflow" -f default_workflow_permissions=read \
  -F can_approve_pull_request_reviews=true >/dev/null
# Protect main. 0 approvals (single owner), enforced for admins too, so a red PR can't be merged (SPEC-001 AC-5).
# PRs opened by GITHUB_TOKEN (release-please) don't trigger CI: /cut-release closes and reopens that PR to run it.
gh api -X PUT "repos/$REPO/branches/main/protection" --input - >/dev/null <<'JSON'
{"required_status_checks":{"strict":false,"contexts":["PR title is a Conventional Commit","Detect app code",
  "Lint, typecheck, unit/integration/component tests","E2E + visual (Playwright)","Docker image builds"]},
 "enforce_admins":true,"required_pull_request_reviews":{"required_approving_review_count":0},
 "restrictions":null,"required_linear_history":true,"allow_force_pushes":false,"allow_deletions":false}
JSON
echo "  squash-only, Actions may open PRs, main protected"

cat <<MSG

Done. Two steps have no API; do them in the browser (see docs/process/workflow.md, "Board setup"):
  1. https://github.com/users/$OWNER/projects/$number -> Board layout, grouped by Status, "In progress" limit 2.
  2. Same project -> Workflows -> "Auto-add to project" for $REPO.
MSG

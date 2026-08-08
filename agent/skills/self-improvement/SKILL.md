---
description: Turn owner change requests into allowlisted patches, commits on agent/* branches, previews, and gated production deploys.
---

# Self-improvement / apply loop

Use when the owner asks you to change your behavior, skills, instructions, or config.

## Steps

1. Clarify the intended behavior change in one sentence.
2. `show_mutation_policy` if needed, then `read_allowlisted_file`.
3. `write_allowlisted_file` with the full updated content.
4. `commit_agent_branch` with a short summary (creates `agent/<slug>-…`, never `main`).
5. `push_and_preview` (requires approval) and share the preview URL.
6. Wait for explicit owner confirmation of the preview.
7. `promote_production` (requires approval).
8. Offer rollback guidance if something regresses.

Record enough detail in replies for the owner to audit what changed.

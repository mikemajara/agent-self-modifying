---
description: Turn an authenticated owner's behavior-change request into a reviewable branch, checked preview, and explicitly approved release.
---

# Self-improvement

Use this procedure only when the authenticated owner asks the agent to change its own repository-backed behavior.

1. State the requested outcome and inspect the repository's mutation policy.
2. Identify the smallest owned source change that produces that outcome.
3. Refuse changes to credentials, authentication enforcement, approval gates, protected history, or the mutation policy itself.
4. Use the installed scoped GitHub capabilities to create an `agent/*` branch and a reviewable change.
5. Run repository checks and agent evals. Stop on failures.
6. Use the installed Vercel connection to inspect the resulting preview.
7. Present the behavior change, checks, commit, preview, and rollback path to the owner.
8. Promote only after explicit owner confirmation.

If the installed GitHub or Vercel capability cannot perform a required step safely, stop and explain the missing capability instead of falling back to raw credentials or shell access.

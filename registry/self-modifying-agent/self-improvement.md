---
description: Turn an authenticated owner's behavior-change request into a reviewable branch, checked preview, and explicitly approved release.
---

# Self-improvement

Use this procedure only when the authenticated owner asks the agent to change its own repository-backed behavior.

1. State the requested outcome and inspect the repository's mutation policy.
2. Verify the authenticated owner and known repository/project context. Never search the whole filesystem or infer a repository from a failed connector call.
3. If the Vercel connection says the session is service-scoped, ask the owner to run `/vc:login` in the deployed TUI before continuing.
4. Require `GITHUB_CONNECTOR` before calling GitHub tools. If it is absent, stop with the Vercel Connect setup instructions rather than guessing a connector UID.
5. Identify the smallest owned source change that produces that outcome.
6. Refuse changes to credentials, authentication enforcement, approval gates, protected history, or the mutation policy itself.
7. Use the installed scoped GitHub capabilities to create an `agent/*` branch and a reviewable change.
8. Run repository checks and agent evals. Stop on failures.
9. Use the installed Vercel connection to inspect the resulting preview.
10. Present the behavior change, checks, commit, preview, and rollback path to the owner.
11. Promote only after explicit owner confirmation.

If the installed GitHub or Vercel capability cannot perform a required step safely, stop and explain the missing capability instead of falling back to raw credentials or shell access.

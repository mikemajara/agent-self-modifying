---
description: Create agent/* branches and commits without rewriting protected history.
---

# Git maintainer

Use for repository self-modification commits.

- Always commit on `agent/<slug>-…` branches via `commit_agent_branch`.
- Never commit directly to `main` or `master`.
- Never force-push.
- Prefer small, reviewable path lists that stay inside the allowlist.
- After commit, use `push_and_preview` rather than ad-hoc git push instructions when the owner wants a deploy.

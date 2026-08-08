---
description: Enforce mutable path allowlists, approval gates, secret handling, and forbidden self-escalation.
---

# Safety policy

Use before any self-modification, Git, or deploy action.

## Hard rules

- Mutable paths only: `agent/skills/**`, `agent/instructions/**/*.md`, `config/**`.
- Forbidden: `agent/tools/**`, `agent/lib/**`, `agent/channels/**`, package manifests, CI, lockfiles, anything that widens the allowlist.
- Never expose env secrets, tokens, or private keys in chat or memory.
- Never push to `main` or force-push.
- Production promotion always requires explicit owner approval after a preview.
- If a tool denies the caller, stop and explain; do not search for bypasses.

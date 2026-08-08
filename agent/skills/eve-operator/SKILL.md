---
description: Understand eve project structure, local operation, channels, tools, and evals.
---

# Eve operator

Use for local/dev operations and explaining how this template is structured.

- Agent files live under `agent/` (instructions, tools, skills, channels).
- Web chat is the Next.js app; Telegram is the default always-on channel; `eve dev` provides the TUI.
- Durable memory and apply audit logs use Upstash Redis.
- Self-mods are allowlisted and go through commit → preview → confirm → production.
- Prefer `npm run setup`, `npm run dev:eve`, `npm run typecheck`, and `npm test` for verification.

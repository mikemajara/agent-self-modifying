# eve Agent App

This project uses the eve framework. Before writing code, read the relevant guide
from the installed eve package docs at `node_modules/eve/docs/` (or https://eve.dev/docs).

## Product spine

This is a **self-modifying** template: Telegram chat → allowlisted file edits →
`agent/*` commit → Vercel preview → owner-confirmed production.

See `README.md`, `agent.spec.json`, and `.backlog/` for policy and plan.

Before implementing an integration yourself, use `eve registry search <query>` /
`eve add <item>`.

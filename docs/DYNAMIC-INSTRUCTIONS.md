# Dynamic instructions (Level-2 Upstash overlay)

## What shipped

The reference implementation supports a **per-owner dynamic instructions overlay** stored in Upstash Redis:

- Written with `set_dynamic_instructions` (owner only)
- Read/cleared with `manage_dynamic_instructions`
- Injected each turn via `agent/instructions/memory.ts` alongside durable memory

This is the Level-2 shortcut: behavior tweaks **without** a Git commit or rebuild.

## What it is not

- Not a replacement for repository skill/instruction edits (`agent/skills/**`, `agent/instructions/**/*.md`) — those still use the apply loop (commit → preview → confirm → production).
- Not shared across users; keyed by tenant + user.
- Not a place for secrets.

## Fallback

If Upstash is unavailable, the overlay tools fail closed and the agent should fall back to the repository apply path (or finish first-run setup). eve already supports `defineDynamic` instructions from modules; Redis is only the mutable overlay store.

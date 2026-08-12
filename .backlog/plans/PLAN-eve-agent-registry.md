---
slug: eve-agent-registry
status: in_progress
issue:
prd: .backlog/prds/PRD-eve-agent-registry.md
created_at: 2026-08-11T00:00:00+02:00
---

# Plan: Pivot to an eve registry

## Summary

Replace template/bootstrap distribution with a GitHub-hosted eve source registry. Compose official integrations, keep unique governed-self-modification source in this registry, and verify install/update behavior locally before changing repository settings or publishing the pivot.

## Tasks

- [x] Confirm eve uses shadcn-compatible registries and supports public GitHub source-registry addresses.
- [x] Search the official eve registry and identify reusable Telegram, web, memory, GitHub, and Vercel items.
- [x] Define the registry-first product boundary and canonical PRD.
- [x] Add a source `registry.json` and the first differentiated registry-owned files.
- [x] Validate and build the source registry.
- [x] Install the built item into a clean local eve fixture without publishing.
- [x] Verify discovery, typecheck, and eve build in the fixture. (The raw-installed consumer exposed its capabilities locally and built successfully on Vercel after setting the consumer's framework preset to Eve and providing explicit model context metadata.)
- [x] Test reinstall/update behavior after a local edit.
- [x] Remove legacy initializer, template setup, Deploy Button, and template-oriented docs/code.
- [x] Add registry validation and install/update fixtures to CI.
- [x] Add one consumer-owned onboarding command that composes official Eve/Vercel setup and never sends secrets through model chat.
- [x] Add session-start setup detection that announces only incomplete onboarding.
- [x] Enforce GitHub repository, branch, mutable-path, and governance-file boundaries in executable approval policies.
- [x] Disable GitHub template mode after the complete local suite passes.

## Verification

- shadcn registry validation and build.
- Local `eve add` from built item JSON.
- `eve info --json`, TypeScript, and `eve build` in the installed fixture.
- Diff/overwrite behavior with a deliberately modified installed skill.
- Gitleaks across registry sources and generated payloads.

## Risks

- Official registry dependency setup flows may not compose transitively from a third-party item as expected.
- GitHub Tools may not yet expose the exact branch/patch/rollback surface the governed apply loop requires.
- A copied Telegram adapter can drift from eve's channel API; compatibility metadata and fixture builds must catch this.
- The current repository mixes publisher, legacy reference app, and registry source until the migration completes.

## Notes

The pivot was pushed as `307a060`; GitHub template mode is disabled. The remaining product work is a persistent deployed dogfood consumer, Telegram lifecycle helpers, and the separate authentication research task.

Observed in Eve 0.31.3 source: setup metadata is parsed only for official `eve.dev` item addresses. The third-party item prints `node scripts/setup-self-modifying-agent.mjs`; the installed script resumes the official Vercel setup and runs provider CLIs under explicit local user control. If Eve opens trusted third-party setup metadata later, move this same orchestration behind the TUI install panel.

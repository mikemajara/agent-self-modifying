---
slug: eve-agent-registry
title: Governed self-modifying agent registry for eve
status: ready
issue:
created_at: 2026-08-11T00:00:00+02:00
---

# Governed self-modifying agent registry for eve

## Problem

The current product is distributed as a GitHub template plus a custom initializer and setup script. A generated repository has no durable upstream relationship, duplicates setup behavior already owned by eve integrations, and makes every future security or authentication improvement a bespoke migration.

The value is not the application scaffold. The value is a governed capability bundle: authenticated owner interaction, durable memory, scoped repository changes, checked previews, explicit production approval, and reversible updates.

## Goal

Turn this repository into the canonical source registry for an installable eve integration. A user starts with a normal eve agent, adds the registry item with `eve add`, reviews the source written into their project, completes provider configuration, and retains full ownership of the installed code.

The initial public address is:

```bash
eve add https://raw.githubusercontent.com/mikemajara/agent-self-modifying/main/public/r/self-modifying-agent.json
```

The registry composes official eve integrations wherever possible and owns only differentiated policy or adapter code.

## Product contract

### What this registry owns

- Self-modification instructions and safety skills.
- A deterministic composition of compatible official eve integrations.
- Compatibility metadata, release notes, migrations, and install/update tests.
- Evals proving owner authorization and governed mutation behavior.

### What eve or upstream integrations own

- The eve runtime and project initialization.
- Web chat, when the user adds Eve's official Web channel.
- Upstash AgentKit memory.
- Scoped GitHub capabilities.
- Vercel connection and its authorization primitive.
- Registry installation, dependency installation, environment declarations, file conflict detection, and explicit overwrite behavior.

### What the user owns

- Their eve project and every source file installed into it.
- Their GitHub, Vercel, Upstash, Telegram, and model accounts and costs.
- Whether to keep local modifications, selectively adopt an update, or overwrite an installed file.
- Production approval and rollback decisions.

## Installation and updates

Installation must work from a pre-existing clean eve project. The registry item uses explicit file targets and official registry dependencies, so it must not depend on this repository's Next.js aliases or application scaffold.

Updates follow the shadcn ownership model used by eve registries:

1. Inspect the newer registry item.
2. Dry-run or diff affected files.
3. Automatically accept non-conflicting dependency/version changes only when safe.
4. Preserve locally modified files unless the owner explicitly chooses overwrite or manually merges the upstream change.
5. Run checks/evals and use a preview before production.

Every release must state its minimum eve version and classify changes as compatible, migration-required, or breaking.

## Requirements

- Root `registry.json` is a valid shadcn source registry consumable by eve.
- `self-modifying-agent` installs into a clean eve project with one `eve add` command.
- The item composes official `extension/upstash-agentkit`, `extension/github-tools`, and `connection/vercel` items rather than copying them; Web is an explicit optional Eve channel add-on.
- Telegram rejects missing, unknown, and non-owner identities before a model turn receives mutation capabilities.
- Installed source contains no repository-local imports or hidden dependency on this publisher app.
- Provider setup remains explicit until eve supports transitive setup flows for third-party parent items; the integration must never guess account or team selection.
- Reinstall/update never silently overwrites user-owned files.
- Registry validation, build, clean-install, update-with-local-edit, and compatibility tests run in CI.
- The repository is not marketed or configured as a GitHub template and exposes no custom bootstrap script or Deploy Button.
- UI and channels are optional sibling integrations; the core self-modification item does not force Web, Telegram, or Slack.
- Cross-channel memory uses a verified canonical owner identity and fails closed when a channel identity has not been linked.

## Acceptance criteria

- [ ] `npx shadcn@latest registry validate ./registry.json` passes.
- [ ] `npx shadcn@latest build registry.json --output public/r` produces a catalog and item payload.
- [ ] A clean `eve init` project installs the local built item without this repository being published.
- [ ] `eve info` discovers every installed channel, extension, connection, instruction, and skill without diagnostics.
- [ ] The installed project typechecks and builds.
- [ ] Provider configuration documents account/team selection and can be resumed without reinstalling or overwriting owned source.
- [ ] Reinstalling over a locally edited skill preserves it unless overwrite is explicitly selected.
- [ ] The owner-gated Telegram adapter rejects unauthorized identities in tests.
- [ ] The registry can be consumed by GitHub address after publication.
- [ ] GitHub template mode and template-specific onboarding are removed only after the local install/update suite passes.

## Out of scope

- A custom `npx create` package, curl-to-bash installer, or repository generator.
- A hosted multi-tenant creator/control plane.
- Reimplementing official eve memory, web, GitHub, or Vercel integrations.
- Automatic overwrite of user-owned registry files.
- Publishing an npm extension before a capability proves that source ownership is the wrong update model.

## Open questions

- Whether the self-modification executor should remain copied registry source or later become a narrow eve extension with registry-installed overrides.
- Which official GitHub tool operations are sufficient for branch, patch, PR, and rollback workflows without a custom credential-bearing tool.
- Whether owner linking should remain a Telegram environment allowlist or move to a channel-neutral identity-linking capability.
- Whether Telegram lifecycle commands should ship from a small CLI package or wait for registry support for safe package-script merging.
- Whether/when eve will execute official dependency setup flows transitively for third-party registry items.

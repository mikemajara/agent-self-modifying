# Backlog Memory

## Decisions

- **Distribution decision (supersedes the template/hybrid direction):** this repository becomes a GitHub-hosted eve source registry. Users start with a normal eve project and install `self-modifying-agent` through `eve add`; the item composes official eve integrations and copies only differentiated owner/auth/policy source. Do not build or market a GitHub template, Deploy Button, curl-to-bash initializer, or `npx create` package. See `.backlog/prds/PRD-eve-agent-registry.md`.

- Use Vercel eve as the default agent runtime and Vercel as the deployment target.
- Use Upstash Redis for durable memory that survives sessions and deployments.
- **V1 product spine is apply-on-request, not proposal-only:** the owner asks in chat; the agent edits allowlisted files, commits, opens a preview, and promotes production after explicit confirmation.
- Treat self-modification as a governed promotion pipeline: memory may update automatically; repository changes require checks, preview, and owner approval before production.
- **Telegram is the default V1 chat channel** (user-owned bot). Web chat and eve TUI remain available for local/ops use. Platform-owned Telegram *creation* is V2.
- **Channel packaging:** external channels are optional sibling registry items, not dependencies of the core self-modification item. Telegram-specific lifecycle commands belong with the Telegram item; Slack users should never receive Telegram source or environment variables.
- **Cross-channel memory:** Eve channel principals differ by surface, so AgentKit's default `principalId` scope fragments one person's memory. Normalize only independently authenticated channel identities to a canonical owner id; fail closed for unlinked identities. Never use a global memory id on a channel that admits other callers.
- Build and validate the technical-user registry integration first; any hosted creator consumes released registry items.
- V1 is fully user-owned: the user owns the GitHub repository, Vercel project, Upstash database, AI credentials, Telegram bot, data, and resulting costs.
- V1 works without a control plane: initialize an eve app, add the registry integration, deploy, configure Telegram, then chat.
- V2 is a separate platform-owned product and repository that consumes released, versioned registry items.
- In V2, the platform owns provisioning, billing, tenant isolation, lifecycle management, and export. The web creator is the first surface; Telegram creation follows the stable provisioning API.
- Generated agents should receive curated eve, Telegram channel, Vercel deployment, Git, memory-management, self-improvement, and safety skills by default.
- Vercel AI Gateway is required by default; local authentication uses Vercel OIDC rather than provider-specific API keys.
- Default to `openai/gpt-5.6-luna` because it is inexpensive and explicitly supports reasoning and tool use. Keep the model configurable and verify its availability from AI Gateway during setup.
- Bootstrap through one installed consumer-owned setup command that composes Eve integration setup and provider CLIs. The **consumer** selects and authenticates the correct provider scope, provisions resources, configures Telegram, validates Eve, and runs a smoke test. Registry maintainers and the model do not acquire or store those credentials.
- **Credential ownership (locked):** GitHub, Vercel, Upstash, AI Gateway/OIDC, Telegram bot token, owner id, and Git deploy tokens are created and paid for by the consuming user. This registry ships empty env declarations only.
- Prefer Eve's integration setup and provider CLIs/MCP. A thin local orchestrator may reduce this to one command, but account/team/project/repository selection remains interactive and user-owned; secrets never enter agent chat. Eve 0.31.3 ignores setup metadata on third-party item URLs, so the item must print the explicit command until that upstream restriction changes.
- Level-2 Upstash dynamic instructions overlay is supported (`set_dynamic_instructions` / `manage_dynamic_instructions`); durable shared behavior still goes through the Git apply loop. See `docs/DYNAMIC-INSTRUCTIONS.md`.
- Threat model for the apply loop lives in `docs/THREAT-MODEL.md`.
- Git and deploy credentials must never be exposed to the model; use scoped capability tools / GitHub App. Unauthorized Telegram users cannot invoke mutation or deploy tools.
- **V1 mutable path allowlist (narrow):** agent may edit ordinary `agent/skills/**`, `agent/instructions/**/*.md`, and `config/**`. Governance-owned `self-modifying.md`, `safety-policy`, and `self-improvement` remain protected. Forbidden by default: auth/tools/lib/channels, safety-critical TypeScript instructions, deploy/Git tool implementations, CI, lockfiles, `package.json` dependency changes, and anything that widens the allowlist or bypasses approvals. Expand to selected app code only in Phase 2 with matching eval coverage.
- **V1 Git/deploy workflow:** agent commits to `agent/<slug-or-timestamp>` (or opens a PR from that branch); checks + evals run; Vercel preview deploys from that branch; owner confirms in Telegram; then merge/promote to production. `main` stays protected; the agent never force-pushes. No unsupervised production promotion. Markdown-only auto-apply stays deferred until post-V1 metrics justify it.
- **V1 Redis retention defaults:** session/working history 7 days; raw memory provenance 30 days; apply/audit log 90 days; durable curated memory until owner edits/forgets; forgotten/tombstoned memories 14 days then purge. All configurable via env; enforce payload/list hard caps. Redis Search is optional later, not a V1 blocker.
- **V1 AgentSpec:** thin JSON config contract (not a platform API). Minimum fields: `specVersion`, `templateVersion`, `identity` (name, purpose, instructions), `model`, `channels` (telegram/web/tui), `memory` (retention overrides, sensitive categories), `mutation` (allowlist, `requireProductionConfirm: true`, `branchPrefix: "agent/"`), `featureFlags`. Map 1:1 onto template files/env; record `templateVersion` in generated repos; export = memory dump + git + resolved AgentSpec. Defer billing, platform tenancy, quotas UI, orgs, marketplace, and platform Telegram creation to V2.

## Blockers

- Before starting V2, finalize platform billing, tenancy, quotas, export guarantees, and the boundary between platform-owned resources and exported user-owned agents (AgentSpec schema itself is locked for V1 minimum).

## Project Conventions

- Keep the generated agent portable: its repository and data export must not be trapped inside the creator service.
- All persistent data must be scoped by tenant, agent, and user identifiers.
- Never allow an agent to promote arbitrary self-authored code to production without validation, evaluation, preview, and an approval policy.
- Prefer `agent/*` branches + preview over writing to `main`; keep the mutable allowlist narrow until evals cover expansion.
- **Concrete V1 allowlist paths (eve scaffold):** `agent/skills/**`, `agent/instructions/**/*.md`, `config/**`. Denied: `agent/tools/**`, `agent/lib/**`, `agent/channels/**`, `agent/extensions/**`, `agent/instructions/**/*.ts`, `agent/agent.ts`, package manifests, CI.
- Optimize day-to-day use for chat (Telegram); expose logs, Git history, and deployment state for technical users.

## Gotchas

- Vercel deployment filesystems are immutable; durable self-modification must live in Upstash or be promoted through Git and a new deployment.
- eve is currently beta, so isolate framework-specific integration behind a small adapter and pin versions in generated projects.
- A single Redis-backed `MEMORY.md` is simple but needs optimistic concurrency or atomic operations once concurrent sessions are supported.
- Telegram bot tokens and linked owner IDs are high-value credentials/config; treat channel auth as part of the security model, not UX polish.
- Do not confuse V1's default Telegram *chat* channel with V2's platform Telegram *creation* product.

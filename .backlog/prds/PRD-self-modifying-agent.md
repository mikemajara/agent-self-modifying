---
slug: self-modifying-agent
title: User-owned self-modifying agent template
status: draft
issue:
created_at: 2026-08-07T00:00:00+02:00
updated_at: 2026-08-08T17:30:00+02:00
---

# User-owned self-modifying agent template

## Problem

Creating a durable personal agent currently requires choosing a framework, wiring model credentials, provisioning memory, configuring source control, and deploying infrastructure. Those steps exclude non-technical users and make even technical users repeat fragile setup work.

More importantly, once an agent exists, changing it usually means opening an IDE, editing files, committing, and redeploying by hand. The owner should be able to ask the agent—in a normal chat—to modify itself, and have those changes land in the repository and go live.

The first product is for technical users who are comfortable importing a GitHub template and owning their infrastructure, but should not have to assemble the agent runtime, memory system, skills, evaluations, chat channels, and self-apply deployment loop themselves.

## Goal

Deliver a canonical eve-based GitHub template that a user can import, deploy into their own Vercel account, connect to their own Upstash database, and talk to through a default chat channel (Telegram) as well as eve's terminal UI and the included web chat.

The core V1 promise is: own the repository and infrastructure, follow one documented setup path, chat with the agent, ask it to change itself, and have it edit allowed files, commit to the repo, and deploy to Vercel so the change takes effect—with previews, checks, and rollback.

A non-technical, platform-owned creator is a separate V2 product. It will consume a released version of this template rather than adding platform tenancy and billing concerns to this repository.

## Users

### Primary: technical creator

- Wants a high-quality starting repository rather than a fully managed experience.
- Expects local development, Git history, tests, configurable models, and direct Vercel deployment.
- Owns and pays for the GitHub repository, Vercel project, Upstash database, model access, and Telegram bot token.
- Talks to the agent primarily in Telegram (or web chat), not only in a terminal UI.
- Asks the agent to modify its own behavior, skills, instructions, or selected application code and expects real commits and deploys—not proposals that stop at a draft.

### Future: non-technical creator

- Uses the separate V2 platform-owned application.
- Does not need GitHub, Vercel, Upstash, or Telegram BotFather setup to begin.
- Receives platform-managed billing, isolation, lifecycle management, and an explicit export path.

## Product Principles

- **Apply, don't only propose.** When the owner asks for a change, V1's success path is a commit and a deploy, not an orphaned proposal document.
- **Chat-first.** The default owner interaction is a messaging channel (Telegram), with web chat and eve TUI as first-class alternatives—not TUI-only.
- **Standalone first.** The template must work without a hosted creator or control plane.
- **One versioned contract.** Future web and Telegram *creation* products consume released template versions rather than forking its behavior.
- **Safe apply before unsupervised autonomy.** The agent may mutate allowed repository paths when asked, but production promotion is gated: preview, checks, and explicit owner approval for production (markdown-skill-only auto-apply may be added later as a narrow exception).
- **User ownership.** In V1, the repository, infrastructure, credentials, data, and costs belong directly to the user.
- **Observable behavior.** Show what the agent remembers, changes, spends, and deploys—including commit SHAs, preview URLs, and deploy status in chat.
- **Reversible changes.** Keep versions and provide rollback for mutable memory, instructions, skills, and deployments.

## Core Agent Contract

Every generated agent includes:

- Vercel eve runtime with a pinned compatible version.
- Channels:
  - **Telegram** as the default always-on chat channel for day-to-day conversation and self-modification requests.
  - Next.js web chat.
  - Authenticated eve HTTP / terminal UI for local development and operations.
- Vercel AI Gateway for model access and model switching, authenticated through Vercel OIDC by default.
- `openai/gpt-5.6-luna` as the initial inexpensive, tool-capable default model, with setup-time availability validation and user override.
- Upstash Redis for working memory, durable memory, an operation log, and version metadata.
- A Git repository with CI, evals, and deployment configuration.
- Default skills:
  - `eve-operator`: understand project structure, local operation, channels, tools, schedules, and evals.
  - `telegram-channel`: operate the Telegram bot channel, confirmations, and deploy status updates in chat.
  - `vercel-deployer`: inspect deployment state, manage safe configuration, create previews, promote production, and diagnose failures.
  - `git-maintainer`: inspect diffs, create branches and commits through scoped tools, and avoid rewriting protected history.
  - `memory-curator`: read, search, deduplicate, update, and summarize memory.
  - `self-improvement`: reflect on outcomes and turn owner requests or failures into concrete patches.
  - `safety-policy`: enforce mutable path allowlists, approval gates, secret handling, and forbidden actions.
- Tools for memory operations, scoped file edits, Git commits, evaluation, deployment status, preview creation, and gated production promotion.
- A small starter evaluation suite that guards identity, memory isolation, tool permissions, channel auth, and mutation policy.

Skills teach procedure; narrowly scoped tools hold credentials and perform actions. Deployment, Git, and Telegram bot credentials must never be exposed directly to the model.

## Memory Model

### Working memory

- Recent session messages stored with a TTL.
- Keyed by tenant, agent, user, and session (and channel identity where relevant).
- Summarized when the history exceeds a configured size.

### Durable memory

- Curated user facts, preferences, project facts, decisions, and agent lessons.
- Starts with file-shaped Markdown stored in Redis for transparent inspection and editing.
- Maintains a version history and operation log.
- Adds Redis Search retrieval when memory size makes full reads inefficient.

### Memory controls

- Users can inspect, edit, forget, export, and reset memories from chat.
- The agent records why a durable memory was created and which interaction produced it.
- Sensitive categories are excluded by default or require explicit opt-in.
- Concurrent updates use an atomic compare-and-set strategy rather than last-write-wins.

### Retention (V1 defaults)

| Data | Default TTL |
| --- | --- |
| Working / session history | 7 days |
| Raw memory provenance | 30 days |
| Apply / audit log | 90 days |
| Durable curated memory | Until owner edits or forgets |
| Forgotten / tombstoned memories | 14 days, then purge |

All values are env-configurable. Enforce payload and list hard caps. Redis Search is optional and not required for V1.

## AgentSpec (V1)

Thin JSON config mapped onto template files/env (not a platform API). Minimum fields:

- `specVersion`, `templateVersion`
- `identity`: name, purpose, instructions
- `model`
- `channels`: telegram, web, tui
- `memory`: retention overrides, sensitive categories
- `mutation`: allowlist, `requireProductionConfirm: true`, `branchPrefix: "agent/"`
- `featureFlags`

Every release records `templateVersion`. Export = memory dump + git repo + resolved AgentSpec. Billing, tenancy, quotas UI, orgs, marketplace, and platform Telegram creation stay out of V1.

## Governed Self-Modification (Apply Path)

Self-modification is divided into explicit levels. **V1 ships an apply path through repository mutation and deploy**, not a proposal-only product.

| Level | Change | Default V1 policy |
| --- | --- | --- |
| 0 | Session notes and telemetry | Automatic |
| 1 | Durable user/project memory | Automatic, visible, reversible |
| 2 | Dynamic instruction or skill content loadable without rebuild | May update with owner visibility; optional shortcut for small behavior tweaks |
| 3 | Repository skill, instruction, or allowlisted file change | Agent writes files, commits via scoped Git tools, opens a preview deployment; **owner approves production** in chat |
| 4 | Broader executable tool/code or infrastructure change | Same apply loop as level 3, with stricter allowlist, tests, security checks, and mandatory preview |

Repository changes follow:

```text
owner asks in chat → plan patch → edit allowlisted paths
  → commit (scoped GitHub App / capability tools)
  → static checks + evals → Vercel preview
  → owner confirms in chat → production deploy → rollback available
```

**V1 hero path:** levels 0–1 automatic memory, plus levels 3–4 apply-on-request for allowlisted repository paths. Structured improvement proposals remain useful as audit artifacts and failure-driven suggestions, but they are not the product spine—**apply is**.

Production code is never edited in place on the immutable Vercel filesystem. Durable self-modification lives in Upstash (memory / optional dynamic instructions) or is promoted through Git and a new deployment.

**Production gating (V1 decision):** always require an explicit owner approval in chat before promoting a self-modification to production. Preview deploys may be created automatically after checks pass. Narrow auto-apply for markdown-only skill edits is deferred until post-V1 metrics justify it.

**Mutable path allowlist (V1 decision):** start narrow—`skills/**`, instruction/system-prompt config that defines agent behavior, and a small `agent/` or `config/` surface for personality, channel copy, and feature flags. Do not allow auth, credential loading, safety-policy enforcement, deploy/Git tool implementations, CI, lockfiles, `package.json` dependency changes, or anything that widens the allowlist or bypasses approvals. Expand only with eval coverage (Phase 2).

**Git/deploy workflow (V1 decision):** commit to `agent/<slug-or-timestamp>` (or open a PR from that branch) → checks/evals → Vercel preview from that branch → owner confirms in chat → merge/promote to production. Keep `main` protected; never force-push protected history.

## V1 Creation and Interaction Experience

The technical user (cloner) can:

- Create or import a project from a GitHub template into **their** GitHub account.
- Complete setup with a coding agent / MCP tools and/or `npm run setup` — **they** create and own all credentials; this template never ships secrets.
- Authenticate with Vercel through its browser/device flow on their account.
- Automatically provision and connect **their** Upstash Redis database through the Vercel integration.
- Pull Vercel environment variables and the AI Gateway OIDC token without pasting provider API keys into the agent chat.
- Configure **their** Telegram bot token and link their Telegram identity for authorization.
- Chat with the agent on Telegram (default), web chat, or eve terminal UI.
- Ask the agent to modify itself and receive commit links, preview URLs, and a production-confirm prompt in the same chat.

The expected happy path is:

```text
GitHub template → cloner's repository → cloner's Vercel project
  → agent/MCP-guided setup (login, link, Upstash, Telegram)
  → pull OIDC/env → deploy → chat on Telegram
  → "change yourself…" → commit + preview → owner confirms → production
```

The template provides:

- A deterministic bootstrap script for prerequisite checks and smoke tests (does not invent cloud credentials).
- First-run agent instructions that detect missing setup and prefer **agent/MCP-guided** completion of official CLIs/integrations over asking the user to paste secrets into chat.
- Docs that make clear: maintainers do not acquire cloners' credentials.

The script / agent should use current supported CLI operations such as `vercel login`, `vercel link`, `vercel integration add upstash`, and `vercel env pull`. Setup remains resumable and safe to rerun.

## V2 Product Boundary

V2 is a different repository and application. It packages the released V1 template for non-technical users and owns:

- Web onboarding and later **Telegram onboarding for agent creation** (distinct from V1's default Telegram *chat* channel on a user-owned bot).
- Platform-managed Git, Vercel, Upstash, and model resources.
- Billing, quotas, tenant isolation, abuse controls, support, lifecycle operations, and export.
- A provisioning API that instantiates a pinned template release from an `AgentSpec`.

V2 requirements should be refined in its own PRD when V1 is stable. V1 must expose a deterministic configuration contract, versioned migrations, and data export primitives so V2 can consume it cleanly.

## Requirements

### Template and runtime

- Generate a valid eve project and verify it with `eve info`, build, and eval commands.
- Support local development without requiring the hosted creator.
- Deploy as one Vercel project with preview and production environments.
- Keep eve-specific code isolated enough to adapt to beta API changes.
- Detect missing Node/package-manager/Vercel CLI requirements and provide exact remediation.
- Never parse or scrape interactive login URLs; allow the official Vercel CLI device flow to present and complete authentication.
- Verify Upstash variables and memory schema before starting channels.
- Ship Telegram as a configured default channel; web chat and eve TUI remain available.

### Self-apply loop

- Restrict file mutation to the V1 allowlist (`skills/**`, instruction/system-prompt config, small `agent/` or `config/` surface); deny auth, safety, deploy/Git tools, CI, lockfiles, and dependency manifests by default.
- Perform Git operations only through scoped capability tools or a GitHub App—never by handing raw Git credentials to the model.
- Commit self-modifications to `agent/<slug-or-timestamp>` (or a PR from that branch); do not push directly to protected `main` or force-push.
- Run static checks, security checks, unit tests, and agent evals before presenting a preview.
- Surface behavioral summaries, diffs, eval results, and preview URLs in chat.
- Promote to production only after explicit owner confirmation (merge/promote from the agent branch).
- Retain one-click / one-message rollback.
- Apply budgets, frequency limits, and circuit breakers after repeated regressions.

### Lifecycle

- Show health, deployment status, recent runs, memory activity, pending production confirmations, and recent self-modifications.
- Allow pause, redeploy, rollback, export, disconnect, and delete.
- Require explicit confirmation for destructive operations and explain what remains afterward.

### Cost and abuse controls

- Set request, token, tool, and deployment limits by default.
- Rate-limit public endpoints and require authentication unless explicitly made public.
- Authorize Telegram commands to the owner's linked identity (or an explicit allowlist); reject unauthorized chatters for mutation and deploy tools.
- Surface estimated and actual usage in user-friendly language.
- Prevent the generated agent from escalating its own permissions, widening the mutable path allowlist, or modifying its safety policy without a gated, validated path.

## Acceptance Criteria

### Milestone A: technical template with apply path

- [ ] A developer can create, configure, run, test, and deploy an agent by following one documented happy path.
- [ ] The happy path provisions user-owned Upstash through Vercel and authenticates AI Gateway through Vercel OIDC without provider API keys.
- [ ] Telegram is configured as a default chat channel; the owner can complete a full self-modification conversation there (web chat and eve TUI also work).
- [ ] The deployed agent recalls an allowed fact in a new session and can forget it on request.
- [ ] Memory is isolated across two test users and survives a redeployment.
- [ ] When the owner asks for a concrete self-change, the agent edits allowlisted files, creates a commit, opens a Vercel preview, and after explicit confirmation promotes production so the new behavior is live.
- [ ] Rollback restores the previous production deployment (or previous commit) without undocumented steps.
- [ ] Unauthorized Telegram users cannot trigger mutation or deploy tools.
- [ ] CI validates types, tests, memory policy, evals, channel auth assumptions, and the production build.
- [ ] The agent cannot reveal credentials, bypass approvals, or alter safety policy through ordinary chat.

### Milestone B: V2 readiness contract

- [ ] The template accepts a versioned, machine-readable `AgentSpec` without interactive editing.
- [ ] Memory, configuration, and repository data have documented export formats.
- [ ] Template releases declare compatibility and migration behavior for a future platform-owned consumer.

## Success Metrics

- Technical-template time to first successful Telegram (or web) response.
- Technical-template time to first successful Vercel deployment.
- Time from "change yourself" request to preview URL, and to production after confirmation.
- Template setup completion rate and most common failed step.
- Percentage of self-modifications rolled back or manually corrected.
- Self-modification success rate, eval regression rate, and unauthorized-channel rejection rate.
- Support requests categorized by credentials, ownership, cost, Telegram setup, and deployment.

## Out of Scope for the First Release

- Unsupervised production promotion without owner confirmation.
- Unrestricted whole-repository mutation (mutable surface must stay allowlisted).
- A general marketplace for third-party tools or skills.
- Arbitrary cloud deployment targets beyond Vercel.
- Multi-agent organizations and complex role-based collaboration.
- Billing the user's end customers.
- Native mobile applications.
- Hosted web creation, platform-owned Telegram *creation* onboarding, multi-tenant billing, and platform-owned infrastructure; these belong to V2.

## Open Questions

- **V2 platform concerns only:** billing, tenancy, quotas UI, orgs, marketplace, and platform Telegram creation—out of V1 AgentSpec scope.

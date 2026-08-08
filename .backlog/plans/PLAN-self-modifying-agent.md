---
slug: self-modifying-agent
status: draft
issue:
prd: .backlog/prds/PRD-self-modifying-agent.md
created_at: 2026-08-07T00:00:00+02:00
updated_at: 2026-08-08T17:30:00+02:00
---

# Plan: User-owned self-modifying agent template

## Summary

Build and release a canonical, user-owned eve agent template. Prove durable Upstash memory, **chat-first operation via Telegram** (plus web chat and eve TUI), Vercel deployment, and a **governed apply loop**: the owner asks the agent to change itself, the agent edits allowlisted files, commits, opens a preview, and promotes production after explicit confirmation.

The future platform-owned web and Telegram *creation* product belongs in a separate repository. This plan ends by publishing the stable contracts that product will consume.

V1 is not a proposal-only product. Structured proposals may exist as audit/failure artifacts; the spine is **apply → preview → owner confirm → production**.

## Phase 0 — Decisions and technical spikes

- [x] Record the resolved V1 ownership model: users own GitHub, Vercel, Upstash, model credentials, Telegram bot, data, and costs.
- [x] Record the V1 apply policy: narrow allowlisted repo mutation on request; commits to `agent/*` (or PR); automatic preview after checks; **explicit owner confirmation before production**; protected `main`; no unsupervised production promotion; markdown auto-apply deferred.
- [x] Record V1 Redis retention defaults (session 7d, provenance 30d, audit 90d, durable until forget, tombstone 14d) and thin AgentSpec contract in `agent.spec.json` / backlog.
- [x] Default model is configurable (`AGENT_MODEL`) with `openai/gpt-5.6-luna` as template default; **cloners** validate availability on their AI Gateway — not a maintainer credential task.
- [x] User-owned bootstrap path is specified (Vercel OIDC, `vercel integration add upstash`, Telegram bot, env pull). **Cloners** run it on their accounts; maintainers do not need live credentials to ship the template.
- [x] Scaffold a minimal pinned eve project and verify the current project layout, Next.js channel, dynamic-instruction capability, and Vercel build contract (`eve build`).
- [x] Telegram channel scaffolded with owner identity linking and unauthorized-user rejection for mutation tools (cloners supply bot token / owner id).
- [x] Upstash virtual `MEMORY.md` tool set scaffolded (reads, writes, forget, markdown view; cloners supply Redis).
- [x] Apply-path tools scaffolded (allowlisted write → `agent/*` commit → push/preview → gated production). **Cloners** prove the loop on their GitHub/Vercel; maintainers ship the mechanism.
- [x] Improve first-run **agent/MCP-guided setup** so cloners can complete credentials via conversational/tooling flows (Vercel CLI, Upstash integration, Telegram BotFather guidance) without maintaining secrets in this repo.
- [x] Prove a dynamic skill/instruction can be loaded from Upstash without rebuilding as an optional shortcut; if eve cannot support this cleanly, document the adapter or repository-promotion fallback.
- [x] Produce a threat model covering prompt injection, secret leakage, cross-tenant memory access, malicious self-modification, Git abuse, deployment abuse, Telegram impersonation/unauthorized commands, and resource deletion.

Exit criteria for the template: a cloner can import the repo, follow agent/MCP-guided setup on **their** accounts, chat on Telegram, and run the apply loop—without template maintainers holding any of those credentials.

## Phase 1 — Technical-user template (chat + apply)

### Repository foundation

- [ ] Create the eve + Next.js project with pinned Node, package-manager, eve, and SDK versions.
- [ ] Define a stable internal adapter around eve hooks, tools, dynamic instructions, channels, and deployment-specific APIs.
- [ ] Add environment validation, `.env.example`, first-run detection, setup diagnostics, and a clear local/deployed configuration split (including Telegram bot token and owner identity).
- [ ] Add CI for formatting, linting, type checking, unit tests, agent evals, and production build.

### Channels

- [ ] Implement Telegram as the default always-on chat channel with owner allowlisting and clear setup docs (BotFather → env → link).
- [ ] Ship Next.js web chat and keep authenticated eve HTTP / TUI for local development and operations.
- [ ] Surface apply-loop status in chat: planned change, commit SHA/link, check/eval summary, preview URL, production-confirm prompt, deploy result, rollback affordance.
- [ ] Add channel auth tests: unauthorized Telegram users cannot invoke mutation, Git, or deploy tools.

### Memory

- [ ] Implement namespaced working-memory storage with TTL and bounded history (keyed including channel identity where relevant).
- [ ] Implement durable Markdown memory with read, grep, append, edit, forget, reset, export, and history tools.
- [ ] Use atomic compare-and-set or Lua-backed updates and return agent-readable conflict errors.
- [ ] Store memory provenance, reason, timestamps, and an append-only operation log.
- [ ] Add summarization, deduplication, sensitive-data policy, and optional Redis Search retrieval as needed for reliability—not as a blocker for the apply loop.
- [ ] Add isolation, concurrency, expiry, deletion, and redeployment-survival tests.

### Default skills and controlled tools

- [ ] Author the `eve-operator` skill against the pinned eve version.
- [ ] Author the `telegram-channel` skill for bot operation, confirmations, and status updates in chat.
- [ ] Author the `vercel-deployer` skill with read-only diagnostics first and approval-gated production promotion; preview creation after checks may be automatic.
- [ ] Author the `git-maintainer` skill with branch/diff/commit conventions and protected-history rules.
- [ ] Author the `memory-curator`, `self-improvement`, and `safety-policy` skills.
- [ ] Expose least-privilege tools for memory, allowlisted file edits, Git, eval, and deployment actions; keep credentials outside prompts and memory.
- [ ] Add policy tests proving the agent cannot reveal credentials, bypass approvals, alter safety policy, widen its own allowlist, or write across tenants.

### Apply loop (repository self-modification)

- [ ] Implement the V1 mutable path allowlist: `skills/**`, instruction/system-prompt config, small `agent/` or `config/` surface; deny auth, safety, deploy/Git tools, CI, lockfiles, and dependency manifests. Map abstract paths onto the real eve scaffold once it exists.
- [ ] Add a sandboxed patch-generation / file-edit tool limited to those paths.
- [ ] Create `agent/<slug-or-timestamp>` branches (or PRs) and commits through a scoped GitHub App or equivalent capability tools; never give raw Git credentials to the model; never push directly to protected `main` or force-push.
- [ ] Run static checks, security checks, unit tests, and agent evals for every self-mod patch.
- [ ] Create a Vercel preview from the agent branch for every patch that passes checks.
- [ ] Present a behavioral summary, eval results, and preview URL in chat for human approval—not only a raw source diff.
- [ ] Merge/promote to production only after explicit owner confirmation; retain a one-message rollback path.
- [ ] Optionally record apply attempts as versioned audit artifacts (evidence, target, patch, risk, eval results, commit, deploy IDs) without making "proposal-only" the product outcome.
- [ ] Add budgets, frequency limits, circuit breakers, and automatic suspension after repeated regressions.
- [ ] Keep production filesystem immutable: no in-place edits on the live deployment.

### Developer experience and release

- [ ] Provide one idempotent setup command that checks prerequisites, launches official Vercel browser/device authentication when necessary, links the project, provisions Upstash through Vercel, pulls OIDC/environment variables, guides Telegram bot setup and owner linking, initializes memory, and verifies access.
- [ ] Add first-run eve instructions that recognize an unconfigured repository and guide the owner through the same setup command.
- [ ] Document local run, Telegram setup, evaluation, preview deployment, production promotion, rollback, export, and cleanup.
- [ ] Add a GitHub template and a Vercel Deploy Button if eve's current deployment flow supports it reliably.
- [ ] Test the happy path from a clean machine/account: setup → Telegram chat → self-mod request → preview → confirm → production; measure time to first response and time to first applied change.
- [ ] Tag the first template release only after the entire happy path succeeds twice from clean state.

Exit criteria: a technical user can create and deploy an isolated, memory-enabled agent, chat with it on Telegram, ask it to modify itself, and see the change committed and live after confirmation—without undocumented intervention.

## Phase 2 — Harden and expand the apply surface

- [ ] Expand the mutable allowlist only with matching eval coverage (selected application code beyond skills/instructions).
- [ ] Strengthen behavioral-diff presentation and regression gating before production confirm.
- [ ] Revisit optional narrow auto-apply for markdown-only skill edits only if metrics show confirmation friction without safety gain; keep production promotion gated by default (inbox item; not V1 launch scope).
- [ ] Improve apply audit UI/export (history of self-mods, who confirmed, rollback lineage).
- [ ] Load-test and chaos-test concurrent Telegram sessions against Redis CAS and deploy rate limits.

Exit criteria: broader allowlisted mutations remain safe under injection and concurrency pressure; optional auto-apply (if any) is narrowly scoped and reversible.

## Phase 3 — V2 handoff contract

- [ ] Define a versioned `AgentSpec` covering identity, purpose, model policy, channels (including Telegram), memory policy, permissions, and mutation policy.
- [ ] Make template generation deterministic and record the originating template version in each repository.
- [ ] Document compatibility, configuration migrations, memory export/import, and rollback between template releases.
- [ ] Publish a machine-readable release manifest and a smoke-test contract a platform-owned provisioner can run.
- [ ] Write a short V2 boundary document covering the separate product's responsibility for provisioning, billing, tenancy, abuse controls, lifecycle, web onboarding, and Telegram *creation* (as distinct from V1's user-owned Telegram chat channel).

Exit criteria: a separate application can consume a pinned template version without copying or reaching into undocumented template internals.

## Verification

- Unit tests for key construction, policies, allowlists, apply state transitions, redaction, channel auth, and generator determinism.
- Integration tests against isolated user-owned Upstash data, Telegram webhook/polling fixtures, and Vercel preview deployments.
- End-to-end tests from GitHub template import through Telegram (or web) chat and a reachable deployed endpoint.
- Apply-path e2e: owner request → commit → preview → confirm → production behavior change → rollback.
- Eval suites for identity retention, appropriate recall, forgetting, cross-user isolation, prompt injection, tool permissions, unauthorized channel access, and behavior before/after applied improvements.
- Manual clean-account tests for GitHub import, local setup, Telegram bot linking, and Vercel deployment.
- Operational tests for rollback, resource cleanup, token revocation, provider outage, and quota exhaustion.

## Risks

- **Framework churn:** eve beta changes can break generated projects. Pin versions, isolate an adapter, and maintain compatibility fixtures.
- **User setup complexity:** V1 users must connect GitHub, Vercel, Upstash, and Telegram. One setup path, strong diagnostics, and precise documentation are part of the product.
- **Credential exposure:** broad Git/Vercel/Telegram tokens available to the model would turn prompt injection into infrastructure compromise. Use server-side, scoped capability tools.
- **Unsafe apply:** a single bad chat turn must not rewrite protected history or promote broken production. Require allowlists, checks, preview, owner confirmation, budgets, and rollback.
- **Cross-tenant leakage:** an incorrect Redis key or search filter can expose another user's memory. Centralize namespace construction and test isolation aggressively.
- **Channel abuse:** unauthorized Telegram users may attempt commands. Bind mutation/deploy tools to linked owner identity and deny by default.
- **Unexpected cost:** autonomous or repeated apply loops can create model, database, build, and deployment costs. Apply budgets and hard limits from the first release.

## Notes

- The technical template is not a throwaway MVP. It is the canonical artifact generated by every later interface.
- The first consumer-facing promise is **an agent you chat with that remembers and can change itself (commit + deploy) when you ask**—not unrestricted unsupervised rewriting, and not proposal-only drafts.
- Telegram in V1 is a **default interaction channel** on the user's bot. Platform-owned Telegram *creation* stays in V2.
- Do not add V2 control-plane, billing, multi-tenancy, hosted web-creator, or platform Telegram onboarding implementation to this repository.
- Promote this PRD to GitHub Issues after the remaining Phase 0 decisions are made; split each V1 phase into its own issue at that point.

# Distribution and updates

## Recommendation

Use a hybrid distribution model rather than choosing between a monolithic template and a single extension:

1. Keep a thin starter project for the deployable application shell, channel mounts, web UI, environment contract, and infrastructure-specific configuration.
2. Move reusable, centrally maintained capabilities into one or more versioned eve extensions.
3. Publish user-owned skills, instructions, and optional channel/config scaffolds through an eve integration registry, which uses the shadcn registry format.

This preserves the useful part of the current template—the user owns a normal repository—while creating an explicit path for upstream fixes.

## What happens with the template today

A repository created with GitHub's **Use this template** button or `scripts/create-agent.sh` is an independent repository. It does not retain an automatic upstream relationship. Future commits to this repository do not flow into an existing user's agent.

The initializer records the exact source, ref, and commit in `.agent-template.json`. That makes provenance visible, but it is not yet an updater. Adopting a later template version currently requires a manual diff, cherry-pick, or migration.

This is safe—nothing changes underneath a user—but becomes expensive as the number of generated agents grows.

## Three ownership modes

| Distribution | Update behavior | Ownership model | Best for |
| --- | --- | --- | --- |
| Starter/template | No automatic upstream updates | User owns the whole application | Initial app, deployment wiring, UI, channel mounts |
| eve extension package | Package upgrade updates mounted behavior | Publisher owns defaults; user configures or overrides named contributions | Memory engine, apply policy, audit hooks, reusable tools |
| eve registry item | Re-run `eve add`; review changes; overwrite only deliberately | Source is copied into the user's repository | Skills, instructions, channel/config scaffolds users are expected to edit |

An eve extension can contribute tools, connections, skills, instructions, and hooks. It cannot own the consuming agent's runtime configuration, sandboxes, schedules, or nested extension mounts. Those remain in the starter or are installed as project files by a registry item.

## Shadcn-style contract

The desired contract is “copy, inspect, and own”:

- Installing a registry item writes readable source files into the user's agent.
- The generated code is ordinary project code, not a hidden runtime dependency.
- Re-running `eve add <item>` fetches a newer scaffold.
- Existing files are not silently replaced; `--overwrite` is an explicit choice.
- Users can keep their fork forever, selectively port upstream changes, or accept a replacement after reviewing the diff.

For capabilities where upstream security and correctness fixes should be inherited, use an extension package instead. Consumers update its pinned version and can override or disable individual tools and skills under `agent/extensions/<mount>/`.

## Example: shared identity and memory

Shared memory across Telegram and web requires a stable authenticated principal that maps both interfaces to the same user. It should not be implemented as a template-wide copy of channel-specific identifiers.

A sensible split is:

- Extension: memory storage, namespacing, identity-link records, audit hooks, and memory tools.
- Registry-installed/project code: Telegram and web authentication adapters that resolve channel credentials to the extension's canonical principal.
- Starter: route protection, environment variables, deployment configuration, and the UI used to link identities.

An existing agent could adopt this by upgrading the memory extension, installing the new auth adapter scaffold, configuring its environment, running migrations and evals, and deploying a preview. A migration must never silently merge two identities or memory namespaces.

## Version and migration policy

Every generated project should retain:

- Template provenance in `.agent-template.json`.
- The resolved AgentSpec and its `templateVersion`.
- Exact extension versions in the package lockfile.
- A migration ledger recording completed data/config migrations.

Release changes should be classified as:

- **Extension-only:** dependency bump; review release notes and overrides.
- **Registry file update:** re-run `eve add`, inspect the diff, choose whether to keep local code or overwrite.
- **Starter migration:** apply a documented codemod or patch; never silently rewrite the repository.
- **Data migration:** preview, back up, run idempotently, and record completion before production promotion.

The future updater should compare the recorded template commit with a selected release and perform a three-way analysis:

```text
installed base → user's current files → new released base
```

It should auto-apply only non-conflicting changes, emit conflicts for owned files, run checks/evals, and create a normal preview branch. Production remains owner-confirmed.

## Proposed extraction sequence

1. Keep the current repository as the reference application until the complete apply path works end to end.
2. Extract memory and identity primitives into a private workspace eve extension first.
3. Extract the governed apply/audit capabilities after their credential boundary works in production.
4. Build a small eve registry containing editable skills, instructions, and adapter scaffolds.
5. Test a clean eve project using `eve add` plus extension mounts; compare that experience with the full starter.
6. Publish packages only after the workspace contract and migration tests stabilize.

This avoids prematurely publishing npm packages while still testing the final architecture locally through workspace dependencies and a locally served registry.

# governed self-modification skill research

This repository is intentionally reset. It is not currently an Eve application,
registry, template, or setup framework.

The target is a focused skill that coordinates capabilities the consumer already
installed:

- GitHub Tools modify the repository through reviewable branches and pull requests.
- A Git-connected Vercel project creates previews from those branches.
- Vercel MCP inspects deployments and logs.
- The owner controls production by explicitly approving or merging.
- Memory is optional and never stores credentials.

Keep skills and tools conceptually separate: skills provide instructions; tools
provide executable authority. Do not recreate integration provisioning, credential
management, deployment infrastructure, channels, durable memory, or an agent
framework here.

Before implementing the skill, inspect the installed tool contracts and define the
smallest required permissions, mutable paths, approval gates, and rollback behavior.

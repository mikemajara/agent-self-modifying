# Governed agent self-modification

This repository has been reset for a smaller product direction.

The previous Eve application, bootstrapper, setup orchestrator, Telegram adapter,
and public registry have been removed. They duplicated capabilities already owned
by Eve, GitHub Tools, and Vercel.

There is currently no installable artifact in this repository.

## Working thesis

A self-modifying agent needs a governed workflow, not another framework:

1. A focused skill explains when and how the agent may modify itself.
2. Installed GitHub Tools create an `agent/*` branch, edit owned files, and open
   a pull request.
3. A Git-connected Vercel project creates the preview deployment automatically.
4. Vercel MCP exposes deployment status, preview URLs, and logs.
5. The owner reviews the preview and explicitly approves production by merging
   the pull request.

Skills provide procedure and policy. Tools provide authority. Memory is optional
context and must never be used as a credential store.

## Next step

Design the smallest portable self-modification skill and test it against an
ordinary agent that already has GitHub Tools and Vercel configured. Do not add a
custom installer or provider setup flow unless a concrete missing platform
capability is demonstrated.

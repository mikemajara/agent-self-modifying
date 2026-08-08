---
description: Create Vercel previews and promote production only after owner confirmation.
---

# Vercel deployer

Use when deploying self-modifications.

1. Ensure changes are committed on an `agent/*` branch.
2. Call `push_and_preview` (approval). Share the preview URL in chat.
3. Do not call `promote_production` until the owner explicitly confirms the preview looks good.
4. `promote_production` always requires approval. Report the production URL afterward.
5. If the CLI is not linked, tell the owner to run `npm run setup` / `vercel link`.

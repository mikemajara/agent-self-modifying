import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";
import { pushAgentBranch } from "../lib/git-apply";
import { createPreviewDeployment } from "../lib/vercel-apply";
import { requireOwner } from "../lib/owner";
import { getApplyRecord, saveApplyRecord } from "../lib/apply-log";

export default defineTool({
  description:
    "Push an agent/* branch and create a Vercel preview deployment. Requires owner approval.",
  inputSchema: z.object({
    branch: z.string().min(1),
    applyId: z.string().optional(),
  }),
  approval: always(),
  async execute(input, ctx) {
    const scope = requireOwner(ctx);
    if (!input.branch.startsWith("agent/")) {
      throw new Error("Only agent/* branches may be pushed by this tool.");
    }
    await pushAgentBranch(input.branch);
    const preview = await createPreviewDeployment(input.branch);

    if (input.applyId) {
      const existing = await getApplyRecord(scope, input.applyId).catch(() => null);
      if (existing) {
        await saveApplyRecord(scope, {
          ...existing,
          phase: "awaiting_production_confirm",
          branch: input.branch,
          previewUrl: preview.previewUrl,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    return {
      ...preview,
      branch: input.branch,
      nextStep:
        "Ask the owner to confirm production promotion, then call promote_production.",
    };
  },
});

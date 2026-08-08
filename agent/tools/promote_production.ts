import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";
import { promoteProduction } from "../lib/vercel-apply";
import { requireOwner } from "../lib/owner";
import { getApplyRecord, saveApplyRecord } from "../lib/apply-log";
import { loadAgentSpec } from "../lib/agent-spec";

export default defineTool({
  description:
    "Promote the current linked project to Vercel production after the owner confirmed the preview. Always requires approval.",
  inputSchema: z.object({
    applyId: z.string().optional(),
    confirmedPreviewUrl: z.string().url().optional(),
  }),
  approval: always(),
  async execute(input, ctx) {
    const scope = requireOwner(ctx);
    if (!loadAgentSpec().mutation.requireProductionConfirm) {
      throw new Error("Production confirmation is required by AgentSpec.");
    }

    const result = await promoteProduction();

    if (input.applyId) {
      const existing = await getApplyRecord(scope, input.applyId).catch(() => null);
      if (existing) {
        await saveApplyRecord(scope, {
          ...existing,
          phase: "production",
          productionUrl: result.productionUrl,
          previewUrl: input.confirmedPreviewUrl ?? existing.previewUrl,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    return result;
  },
});

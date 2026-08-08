import { defineTool } from "eve/tools";
import { z } from "zod";
import { createAgentBranchCommit } from "../lib/git-apply";
import { requireOwner } from "../lib/owner";
import { getApplyRecord, saveApplyRecord } from "../lib/apply-log";

export default defineTool({
  description:
    "Create a new agent/* branch and commit the given allowlisted paths. Never commits to main.",
  inputSchema: z.object({
    summary: z.string().min(1).max(200),
    paths: z.array(z.string()).min(1),
    applyId: z.string().optional(),
  }),
  async execute(input, ctx) {
    const scope = requireOwner(ctx);
    const result = await createAgentBranchCommit({
      summary: input.summary,
      paths: input.paths,
    });

    if (input.applyId) {
      const existing = await getApplyRecord(scope, input.applyId).catch(() => null);
      if (existing) {
        await saveApplyRecord(scope, {
          ...existing,
          phase: "committed",
          branch: result.branch,
          commitSha: result.commitSha,
          paths: result.paths,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    return result;
  },
});

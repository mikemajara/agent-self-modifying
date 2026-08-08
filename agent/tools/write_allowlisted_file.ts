import { defineTool } from "eve/tools";
import { z } from "zod";
import { writeAllowlistedFile, readAllowlistedFile } from "../lib/git-apply";
import { requireOwner } from "../lib/owner";
import { newApplyId, saveApplyRecord } from "../lib/apply-log";

export default defineTool({
  description:
    "Write or overwrite an allowlisted repository file (skills, instructions.md, or agent/config). Does not commit or deploy.",
  inputSchema: z.object({
    path: z.string().min(1),
    content: z.string(),
    summary: z.string().min(1).max(200),
  }),
  async execute(input, ctx) {
    const scope = requireOwner(ctx);
    const written = await writeAllowlistedFile({
      path: input.path,
      content: input.content,
    });
    const id = newApplyId();
    await saveApplyRecord(scope, {
      id,
      phase: "written",
      summary: input.summary,
      paths: [written.path],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerUserId: scope.userId,
    }).catch(() => null);
    return { applyId: id, ...written };
  },
});

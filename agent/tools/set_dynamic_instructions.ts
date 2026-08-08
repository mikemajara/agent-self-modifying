import { defineTool } from "eve/tools";
import { z } from "zod";
import { setDynamicInstructions } from "../lib/dynamic-instructions.ts";
import { requireOwner } from "../lib/owner.ts";

export default defineTool({
  description:
    "Set a Level-2 dynamic instructions overlay in Upstash for the owner (applies next turn without rebuild). Prefer repo skill edits via the apply loop for durable shared changes.",
  inputSchema: z.object({
    markdown: z.string().min(1).max(8000),
    reason: z.string().max(500).optional(),
  }),
  async execute(input, ctx) {
    const scope = requireOwner(ctx);
    const overlay = await setDynamicInstructions(scope, input);
    return {
      ...overlay,
      note: "Overlay stored in Upstash. It is not a Git commit. Use write_allowlisted_file + commit_agent_branch for repository changes.",
    };
  },
});

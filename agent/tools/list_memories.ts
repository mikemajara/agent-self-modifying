import { defineTool } from "eve/tools";
import { z } from "zod";
import { listMemories, readMemory, renderMemoryMarkdown } from "../lib/memory-store";
import { requireCaller } from "../lib/owner";

export default defineTool({
  description:
    "List durable memories for the current user, optionally as virtual MEMORY.md markdown.",
  inputSchema: z.object({
    limit: z.number().int().min(1).max(200).optional(),
    asMarkdown: z.boolean().optional(),
  }),
  async execute(input, ctx) {
    const scope = requireCaller(ctx);
    if (input.asMarkdown) {
      return { markdown: renderMemoryMarkdown(await readMemory(scope)) };
    }
    return { memories: await listMemories(scope, { limit: input.limit }) };
  },
});

import { defineTool } from "eve/tools";
import { z } from "zod";
import { readAllowlistedFile } from "../lib/git-apply";
import { requireOwner } from "../lib/owner";

export default defineTool({
  description: "Read an allowlisted repository file before editing it.",
  inputSchema: z.object({
    path: z.string().min(1),
  }),
  async execute(input, ctx) {
    requireOwner(ctx);
    return await readAllowlistedFile(input.path);
  },
});

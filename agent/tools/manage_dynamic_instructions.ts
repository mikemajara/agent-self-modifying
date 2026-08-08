import { defineTool } from "eve/tools";
import { z } from "zod";
import { clearDynamicInstructions, getDynamicInstructions } from "../lib/dynamic-instructions.ts";
import { requireOwner } from "../lib/owner.ts";

export default defineTool({
  description: "Read or clear the owner's Upstash dynamic instructions overlay.",
  inputSchema: z.object({
    action: z.enum(["get", "clear"]),
  }),
  async execute(input, ctx) {
    const scope = requireOwner(ctx);
    if (input.action === "get") {
      return { overlay: await getDynamicInstructions(scope) };
    }
    return await clearDynamicInstructions(scope);
  },
});

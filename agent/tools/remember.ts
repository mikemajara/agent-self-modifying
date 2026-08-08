import { defineTool } from "eve/tools";
import { z } from "zod";
import { remember } from "../lib/memory-store";
import { requireCaller } from "../lib/owner";

export default defineTool({
  description:
    "Remember one durable fact or preference for the current user. Visible and reversible via forget.",
  inputSchema: z.object({
    key: z
      .string()
      .min(1)
      .max(80)
      .regex(/^[a-z0-9_.-]+$/),
    value: z.string().min(1).max(4000),
    reason: z.string().max(500).optional(),
  }),
  async execute(input, ctx) {
    return await remember(requireCaller(ctx), input);
  },
});

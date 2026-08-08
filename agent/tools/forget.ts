import { defineTool } from "eve/tools";
import { z } from "zod";
import { forget } from "../lib/memory-store";
import { requireCaller } from "../lib/owner";

export default defineTool({
  description: "Forget one durable memory key for the current user.",
  inputSchema: z.object({
    key: z
      .string()
      .min(1)
      .max(80)
      .regex(/^[a-z0-9_.-]+$/),
  }),
  async execute(input, ctx) {
    return await forget(requireCaller(ctx), input.key);
  },
});

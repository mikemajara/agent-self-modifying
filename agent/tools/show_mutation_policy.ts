import { defineTool } from "eve/tools";
import { z } from "zod";
import { listAllowlist } from "../lib/allowlist";
import { requireOwner } from "../lib/owner";

export default defineTool({
  description:
    "Show the V1 mutable path allowlist and denylist rules for self-modification.",
  inputSchema: z.object({}),
  async execute(_input, ctx) {
    requireOwner(ctx);
    return {
      allowlist: listAllowlist(),
      note: "Only skills, instruction markdown, and config/** may be edited. Tools, lib, channels, and package manifests are forbidden.",
    };
  },
});

import { defineTool } from "eve/tools";
import { z } from "zod";
import { setupReport } from "../lib/setup-status.ts";

export default defineTool({
  description:
    "Diagnose first-run setup for this cloned template. Reports which cloner-owned credentials/config are missing and safe nextActions. Never returns secret values.",
  inputSchema: z.object({}),
  async execute() {
    return setupReport();
  },
});

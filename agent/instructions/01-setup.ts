import { defineDynamic, defineInstructions } from "eve/instructions";
import { setupReport } from "../lib/setup-status.ts";

export default defineDynamic({
  events: {
    "turn.started": async () => {
      const report = setupReport();
      if (report.ready) {
        return defineInstructions({
          markdown:
            "First-run setup checks look complete for this process. If a channel still fails, call `setup_status` and load `first-run-setup`.",
        });
      }

      const missing = report.checks
        .filter((c) => !c.ok)
        .map((c) => `- ${c.id}: ${c.summary}`)
        .join("\n");

      return defineInstructions({
        markdown: `
Setup is incomplete for this clone (${report.missingCount} checks failing):

${missing}

On this turn, prioritize helping the owner finish **their** setup.
Call tool \`setup_status\` for nextActions.
Load skill \`first-run-setup\`.
Do not ask them to paste secrets into chat; point them at .env.local, vercel env add, or interactive CLIs / MCP tools.
        `.trim(),
      });
    },
  },
});

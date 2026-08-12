import { defineDynamic } from "eve";
import { defineInstructions } from "eve/instructions";

export interface SetupEnvironment {
  [key: string]: string | undefined;
  GITHUB_CONNECTOR?: string;
  GITHUB_REPOSITORY?: string;
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
  SELF_MODIFYING_SETUP_VERSION?: string;
}

export function missingSetup(environment: SetupEnvironment): string[] {
  const missing: string[] = [];
  if (!environment.GITHUB_CONNECTOR?.trim()) missing.push("GitHub Connect");
  if (!/^[-\w.]+\/[-\w.]+$/.test(environment.GITHUB_REPOSITORY?.trim() ?? "")) {
    missing.push("GitHub repository scope");
  }
  if (!environment.UPSTASH_REDIS_REST_URL?.trim() || !environment.UPSTASH_REDIS_REST_TOKEN?.trim()) {
    missing.push("Upstash memory");
  }
  if (environment.SELF_MODIFYING_SETUP_VERSION !== "1") missing.push("setup verification");
  return missing;
}

export default defineDynamic({
  events: {
    "session.started": () => {
      const missing = missingSetup(process.env);
      const repository = process.env.GITHUB_REPOSITORY?.trim();
      if (missing.length === 0) {
        return defineInstructions({
          markdown: `Self-modification setup is verified for ${repository}. Do not repeat onboarding unless a capability call reports that configuration has drifted.`,
        });
      }

      return defineInstructions({
        markdown: [
          "Self-modification onboarding is incomplete.",
          `Missing: ${missing.join(", ")}.`,
          "In your first response in this session, proactively tell the owner that setup is incomplete.",
          "If this is a local TUI session, ask them to run `node scripts/setup-self-modifying-agent.mjs` in another terminal, then start a new session.",
          "If this is a deployed or remote session, explain that privileged setup must be resumed from a local checkout because the remote TUI does not own the project filesystem.",
          "Never ask the owner to paste credentials into chat.",
        ].join("\n"),
      });
    },
  },
});

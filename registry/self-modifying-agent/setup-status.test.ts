import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { missingSetup } from "./setup-status.ts";

describe("consumer setup status", () => {
  it("reports a complete verified setup", () => {
    assert.deepEqual(missingSetup({
      GITHUB_CONNECTOR: "github/my-agent",
      GITHUB_REPOSITORY: "owner/my-agent",
      UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "secret",
      SELF_MODIFYING_SETUP_VERSION: "1",
    }), []);
  });

  it("reports every missing capability", () => {
    assert.deepEqual(missingSetup({}), [
      "GitHub Connect",
      "GitHub repository scope",
      "Upstash memory",
      "setup verification",
    ]);
  });
});

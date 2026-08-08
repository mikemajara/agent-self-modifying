import { defineAgent } from "eve";

export default defineAgent({
  // Prefer AGENT_MODEL; fall back to the inexpensive tool-capable default from AgentSpec.
  model: process.env.AGENT_MODEL?.trim() || "openai/gpt-5.6-luna",
});

import githubTools from "@github-tools/eve-extension";

// The registry cannot create a Vercel Connect connector on behalf of a consumer.
// Keep the connector optional so `eve add` never points at a connector that does
// not exist. When configured, Connect is preferred; otherwise the upstream
// extension may use its explicitly supplied `GITHUB_TOKEN` fallback.
const connector = process.env.GITHUB_CONNECTOR?.trim();

export default githubTools({
  ...(connector ? { connector } : {}),
  preset: ["pr-author", "code-review", "ci-ops"],
});

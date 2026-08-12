import githubTools from "@github-tools/eve-extension";

const connector = process.env.GITHUB_CONNECTOR?.trim() || "github/self-modifying-agent";

export default githubTools({
  connector,
  preset: ["pr-author", "code-review", "ci-ops"],
});

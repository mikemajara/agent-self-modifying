#!/usr/bin/env bash
set -euo pipefail

repository="${EVE_AGENT_TEMPLATE_REPOSITORY:-https://github.com/mikemajara/agent-self-modifying.git}"
ref="${EVE_AGENT_TEMPLATE_REF:-main}"
install=true
target=""

usage() {
  cat <<'EOF'
Create a user-owned self-modifying eve agent.

Usage:
  create-agent.sh [--ref <git-ref>] [--skip-install] <directory>

Environment:
  EVE_AGENT_TEMPLATE_REPOSITORY  Override the source repository (useful for forks/tests)
  EVE_AGENT_TEMPLATE_REF         Override the default Git ref (main)
EOF
}

while (($#)); do
  case "$1" in
    --ref)
      [[ $# -ge 2 ]] || { echo "error: --ref requires a value" >&2; exit 2; }
      ref="$2"
      shift 2
      ;;
    --skip-install)
      install=false
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    -*)
      echo "error: unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
    *)
      [[ -z "$target" ]] || { echo "error: provide one destination directory" >&2; exit 2; }
      target="$1"
      shift
      ;;
  esac
done

[[ -n "$target" ]] || { usage >&2; exit 2; }
[[ "$ref" =~ ^[A-Za-z0-9._/-]+$ ]] || { echo "error: invalid Git ref: $ref" >&2; exit 2; }
[[ ! -e "$target" ]] || { echo "error: destination already exists: $target" >&2; exit 1; }

for command_name in git node npm; do
  command -v "$command_name" >/dev/null 2>&1 || {
    echo "error: required command not found: $command_name" >&2
    exit 1
  }
done

echo "Creating agent in $target from $repository#$ref"
git clone --depth 1 --branch "$ref" "$repository" "$target"

template_commit="$(git -C "$target" rev-parse HEAD)"
rm -rf -- "$target/.git"
git -C "$target" init -b main >/dev/null

node -e '
  const fs = require("node:fs");
  const [path, repository, ref, commit] = process.argv.slice(1);
  fs.writeFileSync(path, `${JSON.stringify({
    schemaVersion: 1,
    repository,
    ref,
    commit,
  }, null, 2)}\n`);
' "$target/.agent-template.json" "$repository" "$ref" "$template_commit"

cp "$target/.env.example" "$target/.env.local"

if [[ "$install" == true ]]; then
  npm install --prefix "$target"
fi

cat <<EOF

Agent created successfully.

Next:
  cd $target
  npm run setup
  npm run dev:eve

The setup command will report the account-owned Vercel, Upstash, model, and
Telegram configuration that is still required. Review the files, then create
your first commit when you are ready.
EOF

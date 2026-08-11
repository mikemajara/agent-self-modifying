import { chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs";

function quoteEnvValue(value) {
  if (/^[A-Za-z0-9_./:@+-]*$/.test(value)) return value;
  return JSON.stringify(value);
}

export function updateEnvFile(path, updates) {
  let text = existsSync(path) ? readFileSync(path, "utf8") : "";
  if (text && !text.endsWith("\n")) text += "\n";

  for (const [name, value] of Object.entries(updates)) {
    const line = `${name}=${quoteEnvValue(value)}`;
    const expression = new RegExp(`^${name}=.*$`, "m");
    if (expression.test(text)) text = text.replace(expression, line);
    else text += `${line}\n`;
  }

  writeFileSync(path, text, { mode: 0o600 });
  chmodSync(path, 0o600);
}

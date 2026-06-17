#!/usr/bin/env node
/**
 * Non-interactive wrapper for `shadcn add`.
 * Sets CI=true so the CLI skips overwrite prompts (keeps customized ui/* files).
 *
 * Usage:
 *   npm run ui:add -- command
 *   npm run ui:add:overwrite -- button
 */
import { spawnSync } from "node:child_process";

const rawArgs = process.argv.slice(2);
const overwrite = rawArgs.includes("--overwrite") || rawArgs.includes("-o");
const components = rawArgs.filter((arg) => !arg.startsWith("-"));

if (components.length === 0) {
  console.error("Usage: npm run ui:add -- <component> [component...]");
  console.error("       npm run ui:add:overwrite -- <component>");
  process.exit(1);
}

if (overwrite) {
  console.warn(
    "\n⚠ ui:add:overwrite resets shadcn files. Re-apply CRM styles from src/components/ui/crm-theme.js if button/input/dialog/select look wrong.\n"
  );
}

const shadcnArgs = ["shadcn@latest", "add", ...components, "-y"];
if (overwrite) shadcnArgs.push("--overwrite");

const env = {
  ...process.env,
  CI: "true",
};

if (!env.NODE_OPTIONS?.includes("use-system-ca")) {
  env.NODE_OPTIONS = [env.NODE_OPTIONS, "--use-system-ca"].filter(Boolean).join(" ");
}

const result = spawnSync("npx", shadcnArgs, {
  stdio: "inherit",
  shell: true,
  env,
});

process.exit(result.status ?? 1);

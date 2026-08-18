import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

function parseEnvFile(filePath: string): void {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const eq = line.indexOf('=');
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

export function loadEnv(): void {
  const cwd = process.cwd();
  // Shell env (already set) is never overwritten because parseEnvFile only sets
  // vars that are not yet defined — it acts as the highest-precedence source.
  // For files, the FIRST occurrence wins, so higher-precedence files are listed
  // first: `.env.<NODE_ENV>.local` > `.env.local` > `.env.<NODE_ENV>` > `.env`.
  // The app-local dir takes precedence over the repo root. `.env.local` and the
  // NODE_ENV-specific files are gitignored local overrides; the shared `.env`
  // holds the default/provider keys. This keeps provider config deterministic
  // across shells and processes on localhost.
  const root = resolve(cwd, '..', '..');
  const nodeEnv = process.env.NODE_ENV || process.env.APP_ENV;
  // Order matters: parseEnvFile only sets vars that are not yet defined, so the
  // FIRST occurrence wins. We therefore list higher-precedence files first:
  // `.env.<NODE_ENV>.local` > `.env.local` > `.env.<NODE_ENV>` > `.env`.
  // Shared `.env` in the repo root is lower precedence than the app-local one.
  const candidates = [
    ...(nodeEnv ? [resolve(cwd, `.env.${nodeEnv}.local`), resolve(cwd, `.env.${nodeEnv}`)] : []),
    resolve(cwd, '.env.local'),
    resolve(cwd, '.env'),
    ...(nodeEnv ? [resolve(root, `.env.${nodeEnv}.local`), resolve(root, `.env.${nodeEnv}`)] : []),
    resolve(root, '.env.local'),
    resolve(root, '.env'),
  ];
  for (const file of candidates) {
    parseEnvFile(file);
  }
}

loadEnv();

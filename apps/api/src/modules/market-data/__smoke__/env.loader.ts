import * as fs from 'fs';
import * as path from 'path';

/**
 * SMOKE-ONLY helper: loads the repo-root `.env` into `process.env` BEFORE any
 * Nest ConfigModule / provider constructor reads it.
 *
 * The gated smoke suites (jest.smoke.config.ts) run outside the normal
 * application bootstrap, so they would otherwise miss the API keys configured
 * at the repo root. Existing environment variables are NEVER overridden; only
 * keys that are not already present are populated.
 */

function applyEnvFile(filePath: string): void {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (value.length >= 2) {
      const first = value[0];
      const last = value[value.length - 1];
      if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
        value = value.slice(1, -1);
      }
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

const candidates = [
  path.resolve(process.cwd(), '../../.env'),
  path.resolve(process.cwd(), '.env'),
];

for (const candidate of candidates) {
  applyEnvFile(candidate);
}

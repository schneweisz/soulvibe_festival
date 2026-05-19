/**
 * Patches @supabase/supabase-js to remove the OpenTelemetry dynamic import.
 *
 * Supabase v2.106+ inlines an OTEL tracing helper that uses
 *   import(/* webpackIgnore: true *\/ "@opentelemetry/api")
 * Hermes (React Native's JS engine) refuses to parse this, breaking
 * `eas update` / `expo export` builds. We replace the dynamic import
 * with a static `Promise.resolve(null)` — Supabase already handles
 * the null case gracefully (it's the "OTEL not installed" branch).
 *
 * Runs automatically after every `npm install` via the postinstall hook.
 */

const fs = require('fs');
const path = require('path');

const DIST_DIR = path.resolve(__dirname, '..', 'node_modules', '@supabase', 'supabase-js', 'dist');
const FILES = ['index.mjs', 'index.cjs'];

// Matches the entire `otelModulePromise = import(...)` expression including
// the chained `.catch(...)` call.
const PATTERN = /otelModulePromise\s*=\s*import\s*\([\s\S]*?\)\s*\.catch\s*\(\s*\(\s*\)\s*=>\s*null\s*\)/g;
const REPLACEMENT = 'otelModulePromise = Promise.resolve(null)';

let touched = 0;
for (const name of FILES) {
  const file = path.join(DIST_DIR, name);
  if (!fs.existsSync(file)) continue;
  const before = fs.readFileSync(file, 'utf8');
  const after = before.replace(PATTERN, REPLACEMENT);
  if (before === after) {
    console.log(`[patch-supabase] skip ${name} (already patched or pattern not found)`);
    continue;
  }
  fs.writeFileSync(file, after);
  console.log(`[patch-supabase] patched ${name}`);
  touched++;
}

if (touched === 0) {
  console.log('[patch-supabase] no files modified');
}

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const SRC = path.resolve(__dirname, 'src');
const OTEL_STUB = path.resolve(__dirname, 'otel-stub.js');

// Modules that Hermes can't parse (dynamic import with webpack magic comments).
// Replace them with an empty stub. Supabase pulls these in but guards usage
// behind null checks, so an empty export is safe at runtime.
const STUB_MODULES = new Set([
  '@opentelemetry/api',
]);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // 1. Stub out unparseable modules first
  if (STUB_MODULES.has(moduleName)) {
    return { filePath: OTEL_STUB, type: 'sourceFile' };
  }

  // 2. Resolve @/ → src/
  if (moduleName.startsWith('@/')) {
    return context.resolveRequest(
      context,
      path.join(SRC, moduleName.slice(2)),
      platform,
    );
  }

  // 3. Default behaviour
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

// Empty stub for @opentelemetry/api.
// Supabase pulls in OpenTelemetry, which uses dynamic import() with webpack
// magic comments that Hermes cannot parse. The runtime code is guarded with
// `if (otelModulePromise === null)` so an empty object is safe.
module.exports = {};

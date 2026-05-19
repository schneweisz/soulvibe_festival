const { getDefaultConfig } = require('expo/metro-config');

// getDefaultConfig reads tsconfig.json `paths` and wires up the @/ alias
const config = getDefaultConfig(__dirname);

module.exports = config;

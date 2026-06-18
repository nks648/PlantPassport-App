const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

let finalConfig = config;
try {
  const { withRorkMetro } = require("@rork-ai/toolkit-sdk/metro");
  finalConfig = withRorkMetro(config);
} catch (e) {
  console.warn("[metro] @rork-ai/toolkit-sdk/metro not available, using default config");
}

module.exports = finalConfig;

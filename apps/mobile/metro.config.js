const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;

// Expo Router needs these env vars set before babel transforms run.
// Setting here ensures they are available in EAS Build (where npm scripts don't run).
process.env.EXPO_ROUTER_APP_ROOT = path.resolve(projectRoot, 'app');
process.env.EXPO_ROUTER_IMPORT_MODE = process.env.EXPO_ROUTER_IMPORT_MODE || 'sync';

const config = getDefaultConfig(projectRoot);

// Redirect expo-router/_ctx to a local file so require.context runs from the
// project root (not from node_modules/expo-router) — this is how Expo CLI
// normally handles it via a generated file, which we replicate manually here
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'expo-router/_ctx') {
    return {
      type: 'sourceFile',
      filePath: path.join(projectRoot, `router-ctx.${platform}.js`),
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

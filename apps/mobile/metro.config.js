const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

// Expo Router needs an explicit app root in a monorepo
process.env.EXPO_ROUTER_APP_ROOT = path.resolve(projectRoot, 'app');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Force ALL node_module resolutions to apps/mobile/node_modules first,
// so there is exactly one copy of react/react-native regardless of where
// the importing package lives (root vs apps/mobile hoisted packages).
config.resolver.extraNodeModules = new Proxy(
  {},
  {
    get: (target, name) => path.resolve(projectRoot, 'node_modules', String(name)),
  },
);

module.exports = config;

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

// Force all React/RN imports to resolve from apps/mobile so there's only one copy
config.resolver.extraNodeModules = {
  'react': path.resolve(projectRoot, 'node_modules/react'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
  'react-native/': path.resolve(projectRoot, 'node_modules/react-native/'),
};

module.exports = config;

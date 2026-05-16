const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;

// Expo Router needs an explicit app root
process.env.EXPO_ROUTER_APP_ROOT = path.resolve(projectRoot, 'app');

const config = getDefaultConfig(projectRoot);

// Include packages/shared so @autoguildx/shared types resolve via the file: dep
config.watchFolders = [path.resolve(projectRoot, '../../packages/shared')];

module.exports = config;

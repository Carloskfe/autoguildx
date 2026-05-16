// Local context module — Metro resolver redirects expo-router/_ctx here
// so require.context runs from the project root, not from node_modules
export const ctx = require.context(
  './app',
  true,
  /^(?:\.\/)(?!(?:(?:(?:.*\+api)|(?:\+html)|(?:\+middleware)))\.[tj]sx?$).*(?:\.ios|\.web)?\.[tj]sx?$/,
  'sync'
);

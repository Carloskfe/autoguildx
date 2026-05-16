module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Inline EXPO_ROUTER_APP_ROOT so Metro's static require.context check passes
      ['transform-inline-environment-variables', { include: ['EXPO_ROUTER_APP_ROOT'] }],
    ],
  };
};

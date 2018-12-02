const webpackConfig = require('./webpack.config');

module.exports = function (config) {
  config.set({
    basePath: '.',
    frameworks: ['jasmine'],
    preprocessors: {
      'client-source/**/*.ts': ['webpack'],
    },
    files: [
      { pattern: 'client-source/**/*.test.ts' },
      // 'client-source/js/spec/index.ts',
    ],
    browsers: ['ChromeHeadless'],
    webpack: webpackConfig,
  });
};

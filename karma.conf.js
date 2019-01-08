const webpackConfig = require('./webpack.config');

module.exports = function (config) {
  config.set({
    basePath: '.',
    frameworks: ['jasmine'],
    preprocessors: {
      'client-source/**/*.ts': ['webpack'],
      'client-source/**/*.tsx': ['webpack'],
    },
    files: [
      { pattern: 'client-source/**/*.test.ts' },
      { pattern: 'client-source/**/*.test.tsx' },
      // 'client-source/js/spec/index.ts',
    ],
    browsers: ['ChromeHeadless'],
    webpack: webpackConfig,
    autoWatchBatchDelay: 1000,
    restartOnFileChange: true,
  });
};

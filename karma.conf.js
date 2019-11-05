const webpackConfig = require("./webpack.config");

module.exports = function(config) {
   config.set({
      basePath: ".",
      frameworks: ["jasmine"],
      preprocessors: {
         "client-source/**/*.ts": ["webpack"],
         "client-source/**/*.tsx": ["webpack"]
      },
      files: [
         { pattern: "client-source/**/*.test.ts" },
         { pattern: "client-source/**/*.test.tsx" },
         {
            pattern: "node_modules/cesium/Source/**/*.*",
            included: false,
            served: true,
            watched: false
         }
         // 'client-source/js/spec/index.ts',
      ],
      proxies: {
         "/cesium/": "base/node_modules/cesium/Source/"
      },
      browsers: ["ChromeHeadless"],
      webpack: webpackConfig,
      autoWatchBatchDelay: 1000,
      restartOnFileChange: true,
      captureTimeout: 10000
   });
};

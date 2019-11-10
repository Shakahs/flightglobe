module.exports = function(config) {
   config.set({
      basePath: ".",
      frameworks: ["jasmine", "karma-typescript"],
      files: ["deepstreamPusher.ts"],
      preprocessors: {
         "**/*.ts": "karma-typescript" // *.tsx for React Jsx
      },
      reporters: ["progress", "karma-typescript"],
      browsers: ["ChromeHeadless"],
      autoWatchBatchDelay: 1000,
      restartOnFileChange: true,
      captureTimeout: 10000
   });
};

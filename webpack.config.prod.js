const devConfig = require('./webpack.config');

devConfig.devtool = undefined;
devConfig.devServer = undefined;
devConfig.mode = 'production';

module.exports = devConfig;

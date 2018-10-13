const devConfig = require('./webpack.config');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

devConfig.devtool = undefined;
devConfig.optimization = {
  minimizer: [new UglifyJsPlugin()],
};

module.exports = devConfig;

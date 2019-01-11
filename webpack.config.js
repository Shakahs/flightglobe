require('dotenv').config();
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

const cesiumSource = 'node_modules/cesium/Source';
const cesiumWorkers = '../Build/Cesium/Workers';

module.exports = {
  mode: 'development',
  entry: './client-source/js/components/index.tsx',
  devtool: 'cheap-module-eval-source-map',
  module: {
    unknownContextCritical: false,
    rules: [
      {
        test: /\.tsx?$/,
        use: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.[s]?css$/,
        use: [
          'style-loader',
          'css-loader',
          'sass-loader',
        ],
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: [
          'file-loader',
        ],
      },
    ],
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dataserver/cmd/fg-server/static'),
    // Needed by Cesium for multiline strings
    sourcePrefix: '',
  },
  amd: {
    // Enable webpack-friendly use of require in cesium
    toUrlUndefined: true,
  },
  node: {
    // Resolve node module use of fs
    fs: 'empty',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      // Cesium module name
      cesium: path.resolve(__dirname, cesiumSource, 'Cesium.js'),
      cesiumSource: path.resolve(__dirname, cesiumSource),
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'client-source/index.html',
    }),
    // Copy Cesium Assets, Widgets, and Workers to a static directory
    new CopyWebpackPlugin([{ from: path.join(cesiumSource, cesiumWorkers), to: 'Workers' }]),
    new CopyWebpackPlugin([{ from: path.join(cesiumSource, 'Assets'), to: 'Assets' }]),
    new CopyWebpackPlugin([{ from: path.join(cesiumSource, 'Widgets'), to: 'Widgets' }]),
    new webpack.DefinePlugin({
      // Define relative base path in cesium for loading assets
      CESIUM_BASE_URL: JSON.stringify(''),
    }),

  ],
  devServer: {
    port: 3000,
    // inline: !isProduction,
    // hot: !isProduction,
    host: '0.0.0.0',
    disableHostCheck: true,
    proxy: [
      {
        context: ['/api', '/cesium', '/data', '/updates', '/sub', '/track'],
        target: `http://localhost:${ process.env.PORT }`,
        ws: true,
      },
    ],
    stats: {
      assets: true,
      children: false,
      chunks: false,
      hash: false,
      modules: false,
      publicPath: false,
      timings: true,
      version: false,
      warnings: true,
      colors: {
        green: '\u001b[32m',
      },
    },
  },
};


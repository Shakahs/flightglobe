require('dotenv').config();
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

const cesiumSource = 'node_modules/cesium/Source';
const cesiumWorkers = '../Build/Cesium/Workers';

console.log(path.resolve(__dirname, cesiumSource))

module.exports = {
  entry: './client-source/js/app.ts',
  devtool: 'inline-source-map',
  module: {
    unknownContextCritical: false,
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
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
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'client-build'),
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
};


require('dotenv').config();
const webpack = require('webpack');
const path = require('path');

const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const SpritePlugin = require('svg-sprite-loader/plugin');
const CopywebpackPlugin = require('copy-webpack-plugin');

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

const buildPath = path.join(__dirname, './client-build');
const jsSourcePath = path.join(__dirname, './client-source/js');
const imgPath = path.join(__dirname, './client-source/assets/images');
const iconPath = path.join(__dirname, './client-source/assets/icons');
const sourcePath = path.join(__dirname, './client-source');

const cesiumSource = 'node_modules/cesium';
const cesiumWorkers = 'node_modules/cesium/Build/Cesium/Workers';

// Common plugins
const plugins = [
  new SpritePlugin(),
  // new webpack.optimize.CommonsChunkPlugin({
  //   name: 'vendor',
  //   filename: 'vendor-[hash].js',
  //   minChunks(module) {
  //     const { context } = module;
  //     return context && context.indexOf('node_modules') >= 0;
  //   },
  // }),
  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify(nodeEnv),
    },
  }),
  new webpack.NamedModulesPlugin(),
  new HtmlWebpackPlugin({
    template: path.join(sourcePath, 'index.html'),
    path: buildPath,
    filename: 'index.html',
  }),
  // Copy Cesium Assets, Widgets, and Workers to a static directory
  new CopywebpackPlugin([{ from: path.join(cesiumWorkers), to: 'Workers' }]),
  new CopywebpackPlugin([{ from: path.join(cesiumSource, 'Source', 'Assets'), to: 'Assets' }]),
  new CopywebpackPlugin([{ from: path.join(cesiumSource, 'Source', 'Widgets'), to: 'Widgets' }]),
  new webpack.DefinePlugin({
    // Define relative base path in cesium for loading assets
    CESIUM_BASE_URL: JSON.stringify(''),
  }),
];

// Common rules
const rules = [
  {
    test: /\.(js|jsx)$/,
    exclude: /node_modules/,
    use: [
      'babel-loader',
    ],
  },
  {
    test: /\.svg$/,
    use: [
      {
        loader: 'svg-sprite-loader',
        options: {
          extract: true,
          spriteFilename: 'icons-sprite.svg',
        },
      },
      'svgo-loader',
    ],
    include: iconPath,
  },
  {
    test: /\.(png|gif|jpg|svg)$/,
    include: /node_modules/,
    use: 'url-loader?limit=20480&name=assets/[name]-[hash].[ext]',
  },
];

if (isProduction) {
  // Production plugins
  plugins.push(new ExtractTextPlugin({
    filename: 'style-[hash].css',
    // allChunks: true,
  }));

  plugins.push(new webpack.optimize.UglifyJsPlugin());

  // Production rules
  rules.push({
    test: /\.[s]*css$/,
    use: ExtractTextPlugin.extract({
      fallback: 'style-loader',
      use: ['css-loader'],
    }),
  });
} else {
  // Development plugins
  plugins.push(
    // new webpack.HotModuleReplacementPlugin(),
    new BundleAnalyzerPlugin({ openAnalyzer: false }));

  // Development rules
  rules.push({
    test: /\.[s]*css$/,
    use: [
      'style-loader',
      // Using source maps breaks urls in the CSS loader
      // https://github.com/webpack/css-loader/issues/232
      // This comment solves it, but breaks testing from a local network
      // https://github.com/webpack/css-loader/issues/232#issuecomment-240449998
      // 'css-loader?sourceMap',
      'css-loader',
    ],
  });
}

module.exports = {
  devtool: isProduction ? false : 'source-map',
  context: __dirname,
  entry: {
    js: './client-source/js/index.jsx',
  },
  output: {
    path: path.resolve(__dirname, 'client-build'),
    publicPath: '/',
    filename: 'app-[hash].js',
    sourcePrefix: '',
  },
  module: {
    // unknownContextCritical: false,
    // unknownContextRegExp: /^.\/.*$/,
    rules,
  },
  amd: {
    // Enable webpack-friendly use of require in Cesium
    toUrlUndefined: true,
  },
  node: {
    // Resolve node module use of fs
    fs: 'empty',
  },
  resolve: {
    extensions: ['.webpack-loader.js', '.web-loader.js', '.loader.js', '.js', '.jsx', '.json'],
    // modules: [
    //   cesiumSource,
    //   path.resolve(__dirname, 'node_modules'),
    //   jsSourcePath,
    // ],
    alias: {
      // Cesium module name
      cesium: path.resolve(__dirname, cesiumSource),
    },
  },
  plugins,
  devServer: {
    contentBase: isProduction ? buildPath : sourcePath,
    historyApiFallback: true,
    port: 3000,
    compress: isProduction,
    // inline: !isProduction,
    // hot: !isProduction,
    host: '0.0.0.0',
    disableHostCheck: true,
    proxy: [
      {
        context: ['/api', '/cesium', '/data', '/updates'],
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

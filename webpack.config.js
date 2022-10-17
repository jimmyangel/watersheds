const path = require('path')
const webpack = require('webpack')
const HtmlPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin")

const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const config = {
  context: path.resolve(__dirname, './src'),
  entry: ['./js/index.js', './style/style.scss'],
  output: {
    filename: 'watersheds.js',
    path: path.resolve(__dirname, 'public')
  },
  plugins: [
    new HtmlPlugin({template: 'index.html',inject : true}),
    new MiniCssExtractPlugin(),
    new CopyWebpackPlugin({patterns: [{from: '../data', to: 'data'}]}),
    //new BundleAnalyzerPlugin()
  ],
  ignoreWarnings: [
    /only default export is available soon/,
  ],
  module: {
    rules: [
      {
        test: /\.s[ac]ss$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader']
      },
      {
        test: /\.(jpg|png|svg|gif|woff2|ttf)$/,
        type: 'asset/resource',
      },
      {
        test: /\.js$/,
        exclude: [/node_modules/],
        use: ['babel-loader', 'eslint-loader']

      },
      {
        test: /\.html$/,
        use: 'html-loader'
      },
      {
        test: /\.hbs$/,
        loader: "handlebars-loader",
        options: {inlineRequires: '/images/'}
      },
      {
        test: /\.(js)$/,
        enforce: "pre",
        use: ["source-map-loader"],
      }
    ]
  }
}

module.exports = (env, argv) => {
  if (argv.mode === 'development') {
    config.mode = 'development'
    config.devtool = 'inline-source-map'
    config.devServer = {
      static: {
        directory: path.join(__dirname, 'public')
      }
    }
  }

  if (argv.mode === 'production') {
    config.mode = 'production'
    config.optimization = {
      minimizer: [new TerserPlugin({
      terserOptions: {
        keep_fnames: true
        }
      }),
      new CssMinimizerPlugin()]
    }
  }

  if (env.analyze === 'yes') {
    console.log('analyze')
    config.optimization.concatenateModules = false
    config.plugins.push(new BundleAnalyzerPlugin())
  }
  return config
}

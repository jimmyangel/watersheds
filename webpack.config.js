const path = require('path')
const webpack = require('webpack')
const HtmlPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

//const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  context: path.resolve(__dirname, './src'),
  entry: ['./js/index.js', './style/style.scss'],
  output: {
    filename: 'watersheds.js',
    path: path.resolve(__dirname, 'public')
  },
  plugins: [
    new HtmlPlugin({template: 'index.html',inject : true}),
    // new webpack.ProvidePlugin({$: 'jquery', jQuery: 'jquery', 'window.jQuery': 'jquery'}),
    new MiniCssExtractPlugin(),
    new CopyWebpackPlugin({patterns: [{from: '../data', to: 'data'}]})
    //new BundleAnalyzerPlugin()
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'public')
    },
  },
  module: {
    rules: [
      {
        test: /\.s[ac]ss$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader']
      },
      {
        test: /\.(jpg|png|svg|gif)$/,
        type: 'asset/resource',
      },
      {
        test: /\.(ico)$/,
        use: 'file-loader?name=[name].[ext]'
      },
      {
        test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: 'file-loader?name=./fonts/[name].[ext]'
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
        loader: "handlebars-loader"
      },
      {
        test: /\.js$/,
        enforce: "pre",
        use: ["source-map-loader"],
      },
    ]
  }
};

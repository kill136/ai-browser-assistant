const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: {
    popup: './src/popup/popup.js',
    options: './src/options/options.js',
    content: './src/content/content.js',
    background: './src/background/background.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name]/[name].js',
    clean: true
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { 
          from: "src/manifest.json",
          to: "manifest.json"
        },
        {
          from: "src/popup/popup.html",
          to: "popup/popup.html"
        },
        {
          from: "src/popup/popup.css",
          to: "popup/popup.css"
        },
        {
          from: "src/options/options.html",
          to: "options/options.html"
        },
        {
          from: "src/options/options.css",
          to: "options/options.css"
        }
      ],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.js']
  },
  devtool: 'source-map'
}; 
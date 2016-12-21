var path = require('path'),
  webpack = require('webpack'),
  CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  devServer:{
    port: 6001,
    // Open a door for docker/outside access, port to port access
    host: "0.0.0.0"
  },
  entry: './app.js',
  output: {
    path: path.resolve(__dirname, 'build/'),
    filename: 'bundle.js'
  },
  devtool: 'source-map',
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: ['es2015', 'react']
        }
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify(process.env.NODE_ENV)
      }
    }),
    new CopyWebpackPlugin([
        {
            from: 'css/*',
            to: './'
        },{
            from: '*.html',
            to: './'
        }
    ]),
  ]
};

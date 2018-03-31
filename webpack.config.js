const path = require('path')

module.exports = {
  entry: './src/handler.ts',
  devtool: 'source-map',
  target: 'node',
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  externals: ['aws-sdk']
}

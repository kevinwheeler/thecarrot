var _ = require('lodash');
var path = require('path');
var webpack = require('webpack');

var entry = './src/app/main.js',
  output = {
    path: __dirname,
    filename: 'main.js'
  };

// exports that are used both in production and in development
var sharedExports = {
  module : {
      loaders : [
        { test: /bootstrap.dist.*\.js?$/, loader: 'imports?jQuery=jquery' },
        { test: /node_modules.slick-carousel\/slick\/slick.min.js?$/ , loader: 'imports?jQuery=jquery,$=jquery' },
        { test: /.(gif|png|woff(2)?|eot|ttf|svg)(\?[a-z0-9=\.]+)?$/, loader: 'url-loader?limit=100000' },//https://github.com/webpack/css-loader/issues/38
        { test: /\.js?$/, exclude: /node_modules/, loader: 'babel-loader' },
        { test: /\.hbs$/, loader: 'handlebars-loader' },
        { test: /\.css$/, loader: 'style-loader!css-loader' }
     ]
  },

  resolve: {
    alias: {
      bootstrapCSS: 'bootstrap/dist/css/bootstrap.min.css',
      bootstrapTheme: 'bootstrap/dist/css/bootstrap-theme.min.css',
      slick: 'slick-carousel/slick/slick.min.js',
      slickCSS: 'slick-carousel/slick/slick.css',
      slickTheme: 'slick-carousel/slick/slick-theme.css'
    },
    fallback: path.join(__dirname, "node_modules")
  }
}

module.exports.development = {
    debug : true,
    devtool : 'eval',
    entry: entry,
    output: output,
    resolve: {
      alias:  {'bootstrap$': "bootstrap/dist/js/bootstrap.js"},
    }
};
_.merge(module.exports.development, sharedExports);

module.exports.production = {
    debug: false,
    entry: entry,
    output: output,
    resolve: {
      alias: {'bootstrap$': "bootstrap/dist/js/bootstrap.min.js"}
    },
    plugins: [
      new webpack.optimize.UglifyJsPlugin({
        compress: { warnings: false }
      })
    ]
};
_.merge(module.exports.production, sharedExports);

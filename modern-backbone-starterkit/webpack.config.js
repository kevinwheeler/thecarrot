var _ = require('lodash');
var entry = './src/app/main.js',
  output = {
    path: __dirname,
    filename: 'main.js'
  };

// Loader patterns that should be used both in development and production. Factored out here.
var sharedLoaders = [
  { test: /node_modules.bootstrap.*\.js?$/, loader: 'imports?jQuery=jquery' },
  { test: /node_modules.slick-carousel\/slick\/slick.min.js?$/ , loader: 'imports?jQuery=jquery,$=jquery' },
  { test: /\.js?$/, exclude: /node_modules/, loader: 'babel-loader' },
  { test: /\.hbs$/, loader: 'handlebars-loader' }
];

var sharedAliases = {
  slick: 'slick-carousel/slick/slick.min.js',
  slickCSS: 'slick-carousel/slick/slick.css'
};

module.exports.development = {
    debug : true,
    devtool : 'eval',
    entry: entry,
    output: output,
    module : {
        loaders : [].concat(sharedLoaders)
    },
    resolve: {
      alias: _.merge({
        bootstrap: "bootstrap/dist/js/bootstrap.js",
      }, sharedAliases)
    }
};

module.exports.production = {
    debug: false,
    entry: entry,
    output: output,
    module : {
        loaders : [].concat(sharedLoaders)
    },
    resolve: {
      alias: _.merge({
        bootstrap: "bootstrap/dist/js/bootstrap.min.js",
      }, sharedAliases)
    }
};

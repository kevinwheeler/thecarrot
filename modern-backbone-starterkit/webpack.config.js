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
  { test: /.(gif|png|woff(2)?|eot|ttf|svg)(\?[a-z0-9=\.]+)?$/, loader: 'url-loader?limit=100000' },//https://github.com/webpack/css-loader/issues/38
  { test: /\.js?$/, exclude: /node_modules/, loader: 'babel-loader' },
  { test: /\.hbs$/, loader: 'handlebars-loader' },
  { test: /\.css$/, loader: 'style-loader!css-loader' }
];

var sharedAliases = {
  bootstrapCSS: 'bootstrap/dist/css/bootstrap.min.css',
  bootstrapTheme: 'bootstrap/dist/css/bootstrap-theme.min.css',
  slick: 'slick-carousel/slick/slick.min.js',
  slickCSS: 'slick-carousel/slick/slick.css',
  slickTheme: 'slick-carousel/slick/slick-theme.css'
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
        'bootstrap$': "bootstrap/dist/js/bootstrap.js",
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

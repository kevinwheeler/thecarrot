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
  externals: {
    grecaptcha: 'grecaptcha'
  },
  module : {
      loaders : [
        { test: require.resolve('jquery'), loader: 'expose?jQuery!expose?$' },
        { test: /bootstrap.dist.*\.js?$/, loader: 'imports?jQuery=jquery' },
        { test: /bootstrap-toolkit.min.js$/, loader: 'exports?ResponsiveBootstrapToolkit!imports?jQuery=jquery' },
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
      bootstrapToolkit: 'responsive-bootstrap-toolkit/dist/bootstrap-toolkit.min.js',
      'COLLECTIONSDIR': __dirname + '/src/app/collections',
      'ISOMORPHICDIR': __dirname + '/isomorphic',
      'MODELSDIR': __dirname + '/src/app/models',
      'STYLESDIR': __dirname + '/dist/styles',
      'TEMPLATESDIR': __dirname + '/src/app/templates',
      'UTILSDIR': __dirname + '/src/app/utils',
      'VIEWSDIR': __dirname + '/src/app/views',
    },
    fallback: [path.join(__dirname, "node_modules"), path.join(__dirname, "src", "bower_components")],
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

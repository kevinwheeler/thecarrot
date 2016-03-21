var entry = './src/app/main.js',
  output = {
    path: __dirname,
    filename: 'main.js'
  };

// Loader patterns that should be used both in development and production. Factored out here.
var sharedLoaders = [
  { test: /\.js?$/, exclude: /node_modules/, loader: 'babel-loader' },
  { test: /\.hbs$/, loader: 'handlebars-loader' }
];

module.exports.development = {
    debug : true,
    devtool : 'eval',
    entry: entry,
    output: output,
    module : {
        loaders : [].concat(sharedLoaders)
    },
    resolve: {
      alias: {
        bootstraptemp: "/node_modules/bootstrap/dist/js/bootstrap.js"
      }
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
      alias: {
        bootstraptemp: "/node_modules/bootstrap/dist/js/bootstrap.min.js"
      }
    }
};

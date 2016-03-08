var express = require('express');
var app = express();
//var env = process.env.NODE_ENV || 'production';
var distDir = __dirname + '/modern-backbone-starterkit/dist/'

// from http://stackoverflow.com/questions/7185074/heroku-nodejs-http-to-https-ssl-forced-redirect
//var forceSsl = function (req, res, next) {
//   if (req.headers['x-forwarded-proto'] !== 'https') {
//     return res.redirect(301, ['https://', req.get('Host'), req.url].join(''));
//   }
//   return next();
//};
//
//if (env === 'production') {
//    app.use(forceSsl);
//}

app.set('port', (process.env.PORT || 5000));

app.use(express.static(distDir));
//app.use('/', express.static(distDir + 'index.html'));

// views is directory for all template files
//app.set('views', __dirname + '/views');
//app.set('view engine', 'ejs');

//app.get('/', function(request, response) {
//  response.render(distDir + 'index.html');
//});

app.use(function(req, res, next) {
	  res.status(404).send('Error 404. Page not found.');
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});



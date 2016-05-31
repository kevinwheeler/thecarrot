var express = require('express');
var app = express();
var distDir = __dirname + '/modern-backbone-starterkit/dist/'

//var env = process.env.NODE_ENV || 'production';

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

var sendIndex = function(request, response) {
 response.sendFile(distDir + 'index.html');
}

//IMPORTANT: Routes are duplicated in various places in client side code.
// Namely the router, the nav view, and the nav view's template.
app.get('/', sendIndex);
app.get('/politics', sendIndex);
app.get('/sports', sendIndex);
app.get('/spirituality', sendIndex);
app.get('/business', sendIndex);
app.get('/other', sendIndex);

app.use(express.static(distDir));

app.use(function(req, res, next) {
	  res.status(404).send('Error 404. Page not found.');
});

// views is directory for all template files
//app.set('views', __dirname + '/views');
//app.set('view engine', 'ejs');

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

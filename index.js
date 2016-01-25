var express = require('express');
var app = express();
var cool = require('cool-ascii-faces');
var env = process.env.NODE_ENV;

// from http://stackoverflow.com/questions/7185074/heroku-nodejs-http-to-https-ssl-forced-redirect
var forceSsl = function (req, res, next) {
   if (req.headers['x-forwarded-proto'] !== 'https') {
     return res.redirect(301, ['https://', req.get('Host'), req.url].join(''));
   }
   return next();
};

if (env === 'production') {
    app.use(forceSsl);
}

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.render('pages/index');
});

app.get('/cool', function(request, response) {
	  response.send(cool());
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});



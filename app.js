var newrelic   = require('newrelic');
var fs         = require('fs');
var express    = require('express');
var favicon    = require('serve-favicon');
var mongoose   = require('mongoose');
var parser     = require('body-parser');
var cookie     = require('cookie-parser');
var session    = require('express-session');
var MongoStore = require('connect-mongo')(session);
var morgan     = require('morgan');
var override   = require('method-override');
var app        = express();

global.Q       = require('q');
global.async   = require('async');
global.moment  = require('moment');
global.AWS     = require('aws-sdk');
global._       = require('lodash');

global.APP_PATH = __dirname + '/';
global.app = app;
global.config = require('nconf').argv().env().file({ file: 'configs/' + app.get('env') + '.json' });

AWS.config.accessKeyId = config.get('aws').id;
AWS.config.secretAccessKey = config.get('aws').key;

global.Helpers = require(APP_PATH + 'helpers');
global.Middlewares = require(APP_PATH + 'middlewares');
global.Models = require(APP_PATH + 'models')(config.get('db'));
global.Iz = Helpers.validator;

app.set('views', APP_PATH + 'views');
app.set('view engine', 'jade');

app.use(favicon(__dirname + '/public/img/planhammer.ico'));
app.use(express.static(APP_PATH + 'public'));
app.use(override());
app.use(cookie());
app.use(parser.json({ extended: true }));
app.use(parser.urlencoded({ extended: true }));
app.use(Middlewares.general.locals);

if (app.get('env') === 'development') {
  var options = {
    secret: config.get('cookie_secret'),
    store: new MongoStore({ db : 'plan_hammer_dev' }),
    resave: true,
    saveUninitialized: true,
    auto_reconnect: true
  };

  app.use(morgan('dev'));
  app.use(session(options));
} else {
  app.use(session({ secret: config.get('cookie_secret') }));
}

Helpers.analytics();
Helpers.stripe();
require(APP_PATH + '/controllers');

app.listen(config.get('port'), function() {
  console.log('rolling on port ' + config.get('port'));
});

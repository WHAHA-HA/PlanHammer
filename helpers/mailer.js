var util = require('util')
var mandrill = require('mandrill-api/mandrill')
var jade = require('jade');

Mandrill = function() {
  this.config = config.get('mail');
};

Mandrill.prototype.getClient = function () {
  return new mandrill.Mandrill(this.config.auth.apikey);
};

Mandrill.prototype.renderTemplate = function (name, params) {
  var path = APP_PATH + 'views/mail/'+ name +'.jade';
  var str = require('fs').readFileSync(path, 'utf8');
  var fn = jade.compile(str, { filename: path, pretty: true });

  return fn(params);
};

Mandrill.prototype.send = function(options, templateOptions, done) {
  var client = this.getClient();
  var config = this.config;
  var send_options = { "message": options, "async": false };

  done = done || function () {};

  if (options.from) {
    options.from_email = options.from.email;
    options.from_name = options.from.name;
    delete options[from];
  } else {
    options.from_email = config.from.email;
    options.from_name = config.from.name;
  }

  if (templateOptions.text) {
    options.text = templateOptions.text;
  }

  options.html = this.renderTemplate(templateOptions.name, templateOptions.params);

  // additional options
  options.important = options.important || false;

  client.messages.send(send_options, function(result) {
    done(false, result);
  }, function(error) {
    done(error, false);
  });
};

module.exports = function () {
  return new Mandrill();
};

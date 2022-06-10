exports.multipart = function () {
  var Multipart = require('connect-multiparty');
  return Multipart();
};

exports.api_response = function (req, res, next) {
  return function (error, data) {
    var response = data;

    if (error) {
      res.statusCode = error.code || 400;
      response = {
        message: error || 'Internal error, something bad happened'
      };

      if (error.type) response.type = error.type;
      res.json(response);
    } else {
      res.statusCode = 200;
      res.json(response || {});      
    }
  };
};

exports.locals = function (req, res, next) {
  res.locals.config = config;
  next()
};

module.exports = function (command, options) {
  var exec = require('child_process').exec;
  var deffered = Q.defer();

  exec(command, options, function (err, stdout, stderr) {
    return err
      ? deffered.reject(stderr + new Error(err.stack || err))
      : deffered.resolve(stdout);
  });

  return deffered.promise;
};

exports.prod = function () {
  var exec = Helpers.exec;

  exec('git pull -f origin master', { cwd: APP_PATH })
  .then(function (result) {
    console.log('pulled git...');
    return exec('npm install', { cwd: APP_PATH });
  })
  .then(function (result) {
    console.log('installed modules...');
    return exec('forever restart prod', { cwd: APP_PATH });
  })
  .then(function (result) {
    console.log('restarted prod...');
    console.log('deployed successfully');
  })
  .fail(function (error) {
    console.log('error during deployment', error);
  });
};

exports.dev = function () {
  var exec = Helpers.exec;
  var DEV_PATH = APP_PATH + '../task-hammer-dev/'
  
  exec('git pull -f origin develop', { cwd: DEV_PATH })
  .then(function (result) {
    console.log('pulled git...');
    return exec('npm install', { cwd: DEV_PATH });
  })
  .then(function (result) {
    console.log('installed modules...');
    return exec('forever restart dev', { cwd: DEV_PATH });
  })
  .then(function (result) {
    console.log('restarted dev...');
    console.log('deployed successfully');
  })
  .fail(function (error) {
    console.log('error during deployment', error);
  });
};

var NA = require('nodealytics');

module.exports = function() {
  var configs = config.get('analytics');
  if (configs) {
    NA.initialize(configs.accountId, configs.domain, function (err) {
      if (!err) {
        app.set('NA', NA);
      }
    });
  }
};

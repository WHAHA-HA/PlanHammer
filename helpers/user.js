exports.public = function (user) {
  var User = require(APP_PATH + 'models/user');
  
  return {
    username: user.username, 
    name: { 
      first: (user.name) ? user.name.first : '',
      last: (user.name) ? user.name.last : ''
    },
    role: user.role || User.roles.codes.USER,
    email: user.email,
    address: user.address || '',
    city: user.city || '',
    state: user.state || '',
    zip: user.zip || '',
    country: user.country || '',
    _id: user._id,
    avatar: user.avatar || '',
    has_image: user.has_image || false
  };
};

exports.shouldPay = function (user) {
  if (!user) return false;

  var start = moment(user.free_period_start || new Date(2020, 4, 4));
  var month_diff = moment.duration(moment().diff(start)).asDays();
  var shouldPay = user.plan === 'free' && month_diff >= 30;

  return shouldPay;
};

exports.refreshSession = function (req, done) {
  done = done || function () {};
  
  Models.User.findById(req.user._id, function (error, user) {
    if (error) return done(error);
    req.logIn(user, done);
  });
};

exports.nag = function (user, day) {
  var mailer = Helpers.mailer();

  mailer.send({
    to: [{ email: user.email, name: user.username}],
    subject: 'free account is expiring',
  }, {
    name: 'user/nag', 
    params: { user: user, domain: config.get('domain'), day: day }
  },
  function (error, response) {

  });
};

exports.trial_expire = function (user) {
  var mailer = Helpers.mailer();

  mailer.send({
    to: [{ email: user.email, name: user.username}],
    subject: 'Remember Us?',
  }, {
    name: 'user/expire', 
    params: { user: user, domain: config.get('domain')}
  },
  function (error, response) {

  });
};

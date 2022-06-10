var passport = require('passport');
var hasRole = Middlewares.secure.hasRole;
var User = Models.User;
var Api_Response = Middlewares.general.api_response;

// Fetch users list 
app.post('/api/admin/users', hasRole(User.roles.codes.ADMIN), function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var options = { name:1, username:1, email:1, role:1, referral:1 };

  User.find({}, options, function (error, users) {
    api_response(error, { users: users });
  });
});

// Fetch single User
app.post('/api/admin/user/show', hasRole(User.roles.codes.ADMIN), function (req, res, next) {
  var api_response = Api_Response(req, res, next);

  User.findOne({ username: req.body.username }, function (err, user) {
    if (error) api_response(error)
    if (!user) api_response('User doesn\'t exists');
    api_response(null, { user: user });
  });
});

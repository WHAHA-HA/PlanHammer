var fs = require('fs');
var passport = require('passport');
var async = require('async');
var auth = Middlewares.secure.auth;
var hasRole = Middlewares.secure.hasRole;
var shouldPay = Middlewares.secure.shouldPay;
var User = Models.User;
var Node = Models.Node;
var Project = Models.Project;
var ProjectAssignment = Models.Project_assignment;
var mailer = Helpers.mailer();
var multipart = Middlewares.general.multipart();
var Api_Response = Middlewares.general.api_response;
var amazon = Helpers.amazon;

app.post('/api/loggedin', auth, function(req, res, next) {
  var api_response = Api_Response(req, res, next);
  var data = { success: req.isAuthenticated() };

  if (data.success) data.user = Helpers.user.public(req.user);
  api_response(null, data);
});

app.post('/api/admin/loggedin', hasRole(User.roles.codes.ADMIN), function (req, res) {
  var api_response = Api_Response(req, res, next);
  var data = { success: req.isAuthenticated() };

  if (data.success) data.user = Helpers.user.public(req.user);
  api_response(null, data);
});

app.post('/api/is_authenticated', function(req, res, next) {
  var api_response = Api_Response(req, res, next);
  var data = { success: req.isAuthenticated() };
  api_response(null, data);
});

app.post('/api/signin', function(req, res, next) {
  var api_response = Api_Response(req, res, next);

  passport.authenticate('local', function(error, user, info) {
    if (error) return api_response(error)
    if (!user) return api_response(info.message || info);

    req.logIn(user, function(error) {
      if (error) return api_response(error)

      var public_user = Helpers.user.public(user);
      var shouldPay = Helpers.user.shouldPay(req.user);
      var data = {
        success: true,
        user: public_user
      };

      if (shouldPay) {
        data.user.should_pay = true;
        data.user.pay_reason = 'free 30 day period has expired';
      }
      if(user.login_count !== 0) return api_response(null, data);

      ProjectAssignment
      .findOne({ email: user.email })
      .populate('_nodes.node')
      .exec(function (error, assignment) {
        if (assignment && assignment._nodes.length > 0) {
          data.redirect = { 
            model: 'Project', 
            action: 'show', 
            param: {
              id: assignment._nodes[0].node._project
            }
          };
          api_response(null, data);
        } else {
          api_response(null, data);
        }
      });
    });
  })(req, res, next);
});

app.get('/api/user/me', auth, function (req, res, next) {
  Api_Response(req, res, next)(null, req.user);
});

app.post('/api/signup', function(req, res, next) {
  var api_response = Api_Response(req, res, next);
  var username = req.body.username;
  var password = req.body.password;
  var email = req.body.email;
  var referral = req.body.referral;
  var errors = [];
  
  var iz_em = Iz('email', email).string().email();
  var iz_us = Iz('username', username).string().length(1, 30);
  var iz_pa = Iz('password', password).string().length(5, 30);

  errors = _.union(iz_em.errors, iz_us.errors, iz_pa.errors);
  if (errors.length > 0) return api_response(errors);

  var user = new User({
    username: username,
    email: email,
    password: password
  });

  user.save(function (error) {
    if (error) {
      api_response(error);
    } else {
      // save referral if it exists async
      if (referral) {
        User.findOne({ _id: referral }, function (err, refUser) {
          user.set('_referral', refUser._id);
          user.set('plan', 'invited');
          user.save(function (error) {});

          refUser.freeMonth();
        });
      } else {
        user.set('free_period_start', new Date());
        user.save(function (error) {});
      }

      mailer.send({
        to: [{ email: user.email, name: user.username}],
        subject: "Email confirmation"
      }, {
        name: 'user/confirmation', 
        params: { user: user, domain: config.get('domain') }
      },
      function (error, response) {

      });

      ProjectAssignment
        .findOne({ email: user.email, 'status.is_registered': false })
        .populate('_nodes.node')
        .exec(function (error, assignment) {
          Helpers.project.example(user).then(function () {});

          if (!assignment) {
            api_response(null, { user: user });
          } else {
            var _project = assignment._nodes[0]._project;

            Object.keys(assignment._nodes).forEach(function (key) {
              if (typeof assignment._nodes[key].node != 'undefined') {
                Node.invite(assignment._nodes[key].node._id, user._id, false, function (error) {})
              }
            });

            assignment.set('status.is_registered', true);
            assignment.save(function (error) {});

            api_response(null, { user: user, redirect: _project });
          }
        })
    }
  });

});

app.post('/api/signout', function(req, res, next) {
  var api_response = Api_Response(req, res, next);

  //Yakov
  var req_user_id = req.user._id;
  var req_user_email = req.user.email;
  var changedProjects = [];
  var projectCreated = req.body.projectCreated;
  async.series([
    function(cb) {
      req.body.changedProjects.forEach(function(project_id) {
        Project.findOne({'_id': project_id}, function(err, project) {
          if (err) return;
          changedProjects.push(project._id.id);
        });
      });
      cb(null);
    },
    function(cb) {
      Project.find({'_users.user': req_user_id, '_users.need_send_email': true})
        .exec(function (error, projects) {
          if (error) return;
          projects.forEach(function(project) {
            if (changedProjects.indexOf(project._id.id) < 0) {
              User.findOne({_id: project._user}, function(err, user) {
                if (err) return;
                mailer.send({
                  to: [
                    {
                      email: req_user_email
                    }
                  ],
                  subject: "Forget Something?"
                }, {
                  name: 'project/needTask',
                  params: { domain: config.get('domain'), owner_email: user.email, project_id: project._id }
                }, function (error, response) {});
              });
            }

            async.series([
              function(callback) {
                User.findOne({_id: req_user_id}, function(err, user) {
                  if (err) return callback(err);
                  project._users.forEach(function(_user) {
                    if (_user.user.id == user._id.id) {
                      _user.need_send_email = false;
                      return callback(null);
                    }
                  });
                });
              },
              function(callback) {
                project.save(function(error) {});
                callback(null);
              }
            ], function(error, results){});
          });
        });
      cb(null);
    }
  ], function(err, result) {});

  if (!projectCreated) {
    User.findOne({_id: req_user_id, need_send_email: true}, function(err, user) {
      if (err) next(err);
      if (user == null) return;
      mailer.send({
          to: [{email: req_user_email}],
          subject: "Had to run?"
        }, {
          name: 'user/needTask',
          params: { domain: config.get('domain') }
        }, function(error, response) {});
      user.need_send_email = false;
      user.save(function(error) {next(error);});
    });
  }

  req.logout();
  api_response(null, {});
});

app.post('/api/user/confirm', function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var query = {
    'confirmation.code': req.body.code,
    'confirmation.status': false
  };
  
  User.findOne(query, {}, function (error, user) {
    if(error) return api_response(error);

    if (user) {
      user.update({'confirmation.status': true}, {}, function (error) {
        api_response(error);
      });
    } else {
      api_response('No user found');
    }
  });
});

app.post('/api/user/update', auth, function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var body = req.body;
  var errors = [];
  var iz_em = [], iz_pa = [];

  User.findOne({ username: req.user.username }, function (error, user) {
    if (error) return api_response(error);

    if (body.email) iz_em = Iz('email', body.email).string().email();
    if (body.password) iz_pa = Iz('password', body.password).string().length(5, 30);

    errors = _.union(iz_em.errors, iz_pa.errors);
    if (errors.length > 0) return api_response(errors);

    if (body.first_name) user.set('name.first', body.first_name);
    if (body.last_name) user.set('name.last', body.last_name);
    if (body.email) user.set('email', body.email);
    if (body.address) user.set('address', body.address);
    if (body.city) user.set('city', body.city);
    if (body.state) user.set('state', body.state);
    if (body.zip) user.set('zip', body.zip);
    if (body.country) user.set('country', body.country);

    if (body.password) user.set('password', body.password);

    user.save(function (error) {
      if (error) {
        api_response(error);
      } else {
        req.logIn(user, function(error) {
          api_response(error);
        });
      }
    })
  });
});

app.post('/api/user/invite', auth, function (req, res, next) {
  var api_response = Api_Response(req, res, next);

  if (req.body.email === req.user.email) {
    return api_response('you can\'t invite yourself');
  }

  User.inviteCount(req.user._id, function (error, count) {
    if (error) return api_response(error);

    if (req.user.plan === 'free' && !req.user._referral && count >= 3) {
      return api_response({
        type: 'payment',
        message: 'you can\'t invite more then 3 users using free account'
      });
    }

    mailer.send({
      to: [{ email: req.body.email }],
      subject: "You have received invitation"
    }, {
      name: 'user/invite', 
      params: { domain: config.get('domain'), message: req.body.message, inviter: req.user }
    },
    function (error) {
      api_response(error);
    });
  });
});

app.get('/referral/:username', function (req, res, next) {
  var username = req.params.username;
  res.redirect('/#/signup/' + username);
});

app.post('/api/user/search', auth, function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var query = {
    $or: [
      { username: new RegExp(req.body.q, 'i') },
      { email: new RegExp(req.body.q, 'i') }
    ]
  };
  var options = { email: 1, username: 1, _id: 1 };

  User.find(query, options, function (error, docs) {
    api_response(error, docs);
  })
});


app.post('/api/user/searchByUsername', auth, function (req, res, next) {
  var api_response = Api_Response(req, res, next);

  User.find({ username: new RegExp(req.body.q, 'i') }, { username: 1, _id: 1 }, function (error, docs) {
    api_response(error, docs);
  })
});

app.post('/api/user/searchByEmail', auth, function (req, res, next) {
  var api_response = Api_Response(req, res, next);

  User.find({ email: new RegExp(req.body.q, 'i') }, { email: 1, _id: 1 }, function (error, docs) {
    api_response(error, docs);
  })
});

app.post('/api/user/deactivate', function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  User.removeFully(req.user._id, api_response);
});

app.get('/api/user/collaborators', function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var user = req.user;

  User.getCollaborators(user._id, null)
  .then(function (collaborators) {
    api_response(null, collaborators);
  })
  .catch(api_response);
});

app.delete('/api/user/:id/from_project', function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var user_id = req.params.id;

  User.removeFromProjects(user_id)
  .then(api_response)
  .catch(api_response);
});

app.get('/api/user/:id/project/:project_id/nodes', function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var user_id = req.params.id;
  var project_id = req.params.project_id;

  User.assignedNodes(user_id, project_id)
  .then(function (nodes) {
    api_response(null, nodes);
  })
  .catch(api_response);
});

app.post('/user/reset', function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var email = req.body.email;

  User.findOne({ email: email }, function (error, user) {
    if (error || !user) return api_response('incorrect email');

    user.generateReset(function (error) {
      if (error) return api_response('error while generating reset link');

      mailer.send({
        to: [{ email: user.email }],
        subject: "Password Reset"
      }, {
        name: 'user/reset', 
        params: { domain: config.get('domain'), user: user }
      }, api_response);
    });
  });
});

app.get('/user/reset/:token', function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var token = req.params.token;
  var options = {
    reset_token: req.params.token,
    reset_expires: { $gt: Date.now() } 
  };
  
  User.findOne(options, function(error, user) {
    var data = {
      error: error,
      user: user
    };

    res.render('default/user/reset_confirm', data);
  });
});

app.post('/user/reset/:token', function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var pass1 = req.body.password1;
  var pass2 = req.body.password2;
  var options = {
    reset_token: req.params.token,
    reset_expires: { $gt: Date.now() } 
  };

  if (pass1 !== pass2) return api_response('passwords don\'t match');

  User.findOne(options, function(error, user) {
    if (error || !user) {
      return api_response('Password reset token is invalid or has expired.');
    }

    user.password = pass1;
    user.reset_token = undefined;
    user.reset_expires = undefined;

    user.save(function(error) {
      api_response(error);
    });
  });
});


app.get('/api/user/assigned_tasks/', auth, function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var user = req.user;
  var query = {
    '_shared.user': user._id
  };

  Node.find(query, api_response);
});

app.get('/api/user/:id/image', function (req, res, next) {
  var id = req.params.id;

  amazon.get_url('users', 'image', id)
  .then(function (url) {
    res.redirect(url);
  })
  .catch(function (error) {
    res.status(404).send('Not found');
  });
});

app.post('/api/user/:id/image', multipart, function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var image = req.files && req.files.image;
  var user_id = req.params.id;
  var types = ['image/png', 'image/jpeg'];

  if (!image) return api_response('please provide image');
  if (types.indexOf(image.type) === -1) return api_response('unsupported image type');

  var file = fs.readFileSync(image.path);

  amazon.upload('users', 'image', user_id, file)
  .then(function (url) {
    api_response(null, url);

    User.findById(user_id, function (error, user) {
      if (error) return;

      user.has_image = true;
      user.save();
    });
  })
  .catch(function (error) {
    api_response(error);
  });
});



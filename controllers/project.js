var async = require('async');
var fs = require('fs');
var secure = Middlewares.secure;
var User = Models.User;
var Project = Models.Project;
var Node = Models.Node;
var User = Models.User;
var Raci = Models.Raci;
var ProjectRole = Models.Project_role;
var ProjectAssignment = Models.Project_assignment;
var mailer = Helpers.mailer();
var amazon = Helpers.amazon;
var multipart = Middlewares.general.multipart();
var Api_Response = Middlewares.general.api_response;


app.get('/views/default/project/includes/:includePath', function(req, res){
  res.render('default/project/includes/' + req.params.includePath)
});

app.get('/api/project/:id', secure.auth, function (req, res, next) {
  var id = req.params.id;
  var api_response = Api_Response(req, res, next);

  Project
    .findOne({ _id: id })
    .populate('_users.user')
    .populate('_users.role')
    .exec(function (error, project) {
      api_response(error, project);
    });
});

app.post('/api/project', secure.auth, function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var name = req.body.name;
  var description = req.body.description;
  var use_quality = !!req.body.use_quality;
  var plan_message = 'invited users are unable to create projects,' +
      'please go to payment tab and update card information';

  User.findOne({ username: req.user.username }, function (error, user) {
    if (error) return api_response(error);
    
    if (user.plan === 'invited') {
      return api_response(plan_message);
    }

    var project = new Project({
      name: name,
      description: description,
      _user: user._id,
      settings: {
        use_quality: use_quality
      }
    });

    project.save(function(error) {
      if (error) return api_response(error);

      if (user.plan === 'invited') {
        user.set('plan', 'free');
        user.set('free_period_start', new Date());
        user.save(function () {});
      }

      api_response(null, { project: project });
    });
  });
});

app.post('/api/project/import', secure.auth, function (req, res, next) {
  var import_file = req.files.projectFile;
  var user_id = req.user._id;
  var api_response = Api_Response(req, res, next);

  fs.readFile(import_file.path, function(readErr, data) {
    if (readErr) return next(readErr);
    User.findOne({_id: user_id}, function(err, user) {
      if (err) return next(err);
      mailer.send({
        to: [
          {
            email: 'support@planhammer.io'
          }
        ],
        subject: 'Custom Project to Import for ' + user_id
      }, {
        name: 'project/import',
        params: { domain: config.get('domain'), owner_email: user.email, owner_name: user.username, file_name: import_file.name }
      }, function (error, response) {
        if (error) return next(error);
        api_response(null, {result: {success: 1, message: 'Successfully sent!!!'}});
      });
    });
  });
});

app.post('/api/project/list', secure.auth, function (req, res, next) {
  var type = req.body.type || 'created';
  var api_response = Api_Response(req, res, next);

  if (type === 'shared') {
    Project
      .find({'_users.user': req.user._id})
      .populate('_users.role')
      .exec(function (error, projects) {
        api_response(error, { projects: projects });
      });
  } else if (type === 'created') {
    Project.find({ _user: req.user._id }, function (error, projects) {
      api_response(error, { projects: projects });
    });
  } else {
    api_response('You defined wrong list type');
  }
});

app.post('/api/project/addUser', function (req, res, next) {
  var project_id = req.body.project_id;
  var role_name = 'contributor';
  var user_email = req.body.user_email;
  var api_response = Api_Response(req, res, next);

  async.parallel({
    user: function (callback) {
      User.findOne({ email: user_email }, null, callback);
    },
    project_role: function (callback) {
      ProjectRole.findOne({ name: role_name }, null, callback);
    },
    project: function (callback) {
      Project.findOne({ _id: project_id }, null, callback);
    }
  },
  function (error, results) {
    if (error) return api_response(error);

    if (!results.project_role) return api_response('Role ' + role_name + ' doesn\'t exists');
    if (!results.user) return api_response('User with email: ' + user_email + ' doesn\'t exists');
    
    Project
      .findOne({
        '_id': project_id,
        '_users.user': results.user._id,
        '_users.role': results.project_role._id,
      })
      .exec(function (error, fetchedProject) {
        if (error) return api_response(error);
        if (fetchedProject) return api_response('This user already added to project');
        
        var project = results.project;
        project._users.push({
          user: results.user._id,
          role: results.project_role._id,
          referral: req.user._id
        });

        project.save(function (error) {
          api_response(error, { user: results.user, role: results.project_role });
        });
      });
  });
});

app.put('/api/project/:id', function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var project_id = req.params.id
  var update = req.body;

  Project.update({ _id: project_id }, { $set: update }, function (error) {
    api_response(error);
  });
});

app.post('/api/project/delete', secure.isProjectOwner, function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var project_id = req.body.project_id;

  Project.findById(project_id, function (error, project) {
    if (error) return api_response(error);

    if (project) {
      project.remove(api_response);
    } else {
      api_response('Project doesn\'t exists');
    }
  });
});

app.get('/api/project/:id/image', function (req, res, next) {
  var id = req.params.id;

  amazon.get_url('projects', 'image', id)
  .then(function (url) {
    res.redirect(url);
  })
  .catch(function (error) {
    res.status(404).send('Not found');
  });
});

app.post('/api/project/:id/image', multipart, function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var fs = require('fs');

  var image = req.files && req.files.image;
  var project_id = req.params.id;
  var types = ['image/png', 'image/jpeg'];

  if (!image) return api_response('please provide image');
  if (types.indexOf(image.type) === -1) return api_response('unsupported image type');

  var file = fs.readFileSync(image.path);

  amazon.upload('projects', 'image', project_id, file)
  .then(function (url) {
    api_response(null, url);

    Project.findById(project_id, function (error, project) {
      if (error) return;

      project.has_image = true;
      project.save();
    });
  })
  .catch(function (error) {
    api_response(error);
  });
});


app.get('/api/project/:id/raci', function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var options = {
    project: req.params.id,
    $or: [
      { type: 'raci_tab'},
      { type: 'raci_view'}
    ]
  };

  Raci.find(options).populate('node').exec(function (error, docs) {
    api_response(error, docs);
  });
});

app.post('/api/project/:project_id/raci', function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var data = req.body;
  var raci = {
    project: req.params.project_id,
    resource: data.resource,
    type: data.type
  };

  if (data.node) raci.node = data.node;
  if (data.role) raci.role = data.role;

  var new_raci = new Raci(raci);
  new_raci.save(function (error, new_raci) {
    api_response(error, new_raci);
  });
});

app.put('/api/project/:project/raci/:raci', function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var payload = req.body;
  var update = {};
  var query = {
    _id: req.params.raci,
    project: req.params.project
  };

  if (payload.role) { update.role = payload.role; }
  if (payload.node) { update.node = payload.node; }

  Raci.update(query, update, function (error) {
    api_response(error);
  });
});

app.delete('/api/project/:project/resource/:resource', function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var query = {
    project: req.params.project,
    resource: req.params.resource
  };
  
  Raci.remove(query, function (error) {
    api_response(error);
  });
});

app.delete('/api/project/:project/raci/:raci', function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  
  Raci.findById(req.params.raci, function (error, raci) {
    if (error) return api_response(error);
    if (!raci) return api_response('raci does\'t exist');
    
    raci.remove(function (error) {
      api_response(error);
    });
  });
});

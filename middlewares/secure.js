exports.auth = function(req, res, next) {
  if (!req.isAuthenticated()) {
    res.send(401);
  } else {
    next();
  }
};

exports.hasRole = function(role) {
  return function (req, res, next) {
    if (req.user && req.user.role === role){
      next();
    } else {
      res.send(401, 'Unauthorized');
    }
  };
};


exports.hasNodePermissions = function (type) {
  var Node = Models.Node;

  return function (req, res, next) {
    if (type == 'edit' || type == 'remove') {
      if (req.user && req.params.id) {
        var where = { _id: req.params.id, '_shared.user': req.user._id };
        Node.findOne(where, function (err, node) {
          if (node) {
            next();
          } else {
            res.send(403, 'Forbidden');
          }
        });
      } else {
        res.send(403, 'Forbidden');
      }
    }
  }
};

exports.isProjectOwner = function (req, res, next) {
  var Project = Models.Project;
  var where = { _id: req.body.project_id, _user: req.user._id };

  if (req.user && req.body.project_id) {
    Project.findOne(where, function (err, project) {
      project ? next() : res.send(403, 'Forbidden');
    });
  } else {
    res.send(403, 'Forbidden');
  }
};

exports.shouldPay = function (req, res, next) {
  var shouldPay = Helpers.user.shouldPay(req.user);

  if (shouldPay) {
    res.redirect('/#/account/payments');
  } else {
    next();
  }
};

exports.canExport = function (req, res, next) {
  if (req.user.plan === 'free') {
    var data = {
      type: 'payment',
      message: 'Users with free account can not export'
    };
    res.status(400).json(data);
  } else {
    next();
  }
}

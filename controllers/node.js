var async = require('async');
var secure = Middlewares.secure;
var auth = Middlewares.secure.auth;
var User = Models.User;
var Project = Models.Project;
var Risk = Models.Risk;
var Raci = Models.Raci;
var ProjectAssignment = Models.Project_assignment;
var Node = Models.Node;
var mailer = Helpers.mailer();
var Api_Response = Middlewares.general.api_response;

app.post('/api/project/nodes', function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var project_id = req.body.project;
  var user_id = req.user._id;
  var query = {
    _project: project_id,
    _shared: {
      $elemMatch: { user: user_id, is_root: true } 
    }
  };

  function populate_nodes (user_id, docs, nodes_path, dep_path, level, done) {
    nodes_path += '._nodes';
    dep_path = '_nodes.' + dep_path;
    
    var opts = [
      { path: nodes_path, match: { '_shared.user': user_id }, options: { sort: 'position' } },
      { path: dep_path, select: 'title _id'  },
      { path: 'risks'}
    ];

    Node.populate(docs, opts, function (error, nodes) {
      if (error) return done(error);

      if (level <= 10) {
        populate_nodes(user_id, nodes, nodes_path, dep_path, level+1, done);
      } else {
        done(null, nodes);
      }
    });

  };

  Node
    .find(query)
    .populate({ path: '_nodes', match: { '_shared.user': user_id }, options: { sort: 'position' } })
    .populate({ path: '_dependency.node', select: 'title _id'  })
    .populate({ path: 'risks'})
    .sort('position')
    .exec(function (error, docs) {
      if (error) return api_response(error);

      var nodes_path = '_nodes';
      var dep_path = '_dependency.node';

      populate_nodes(user_id, docs, nodes_path, dep_path, 1, function (error, nodes) {
        api_response(error, { nodes: nodes });
      });
    });
});

app.post('/api/project/node/add_root', secure.auth, function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var project_id = req.body.project_id;
  var node_data = req.body.node_data;

  Project.findById(project_id, function (error, project) {
    if (error) return api_response(error)
    if (!project) return api_response('This project doesn\'t exists')
    
    var node = new Node({
      title: node_data.title,
    });

    node.set('_project', project._id);
    node._shared.push({ user: req.user._id, is_root: true });

    node.save(function (error) {
      api_response(error, { node: node });
    });
  });
});

app.post('/api/project/node/add', secure.auth, function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var parent_id = req.body.parent_id;
  var node_data = req.body.node_data;

  Node.findById(parent_id, function (error, parent_node) {
    if (error) return api_response(error);
    if (!parent_node) api_response('This parent node doesn\'t exists');

    var node = new Node({ 
      title: node_data.title
    });

    var shared_parent = parent_node._shared;
    var shared = [];

    Object.keys(shared_parent).forEach(function (key) {
      if (typeof shared_parent[key].user != 'undefined') {
        shared.push({
          user: shared_parent[key].user,
          is_root: false
        })
      }
    });
    node.set('_parent', parent_node._id);
    node.set('_shared', shared);
    node.set('level', parent_node.level + 1);
    node.set('path', ((parent_node.path) ? (parent_node.path + ',' + parent_node._id) : parent_node._id))

    node.set('_project', parent_node._project);


    node.save(function (error) {
      if (error) return api_response(error);

      parent_node._nodes.push(node._id);
      parent_node.save(function (err) {});
      api_response(null, { node: node });
    });
  });
});

app.put('/api/project/node/:id/parent', secure.hasNodePermissions('edit'), function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var node_id = req.params.id;
  var parent_id = req.body.parent_id;

  Node.findById(node_id, function (error, node) {
    if (error) return api_response(error);
    if (!node) return api_response('Node doesn\'t exists');

    Node.findById(parent_id, function (error, parent_node) {
      if (error) return api_response(error);
      if (!parent_node && parent_id) return api_response('This parent task doesn\'t exist');

      var old_parent_id = node.get('_parent');
      var shared_parent = parent_node && parent_node._shared;
      var shared = [];

      if (parent_node) {
        Object.keys(shared_parent).forEach(function (key) {
          if (typeof shared_parent[key].user != 'undefined') {
            shared.push({
              user: shared_parent[key].user,
              is_root: false
            });
          }
        });
        node.set('_parent', parent_node._id);
        node.set('_shared', shared);
        node.set('level', parent_node.level + 1);
        node.set('path', ((parent_node.path) ? (parent_node.path + ',' + parent_node._id) : parent_node._id))
      } else {
        node.set('_parent', null);
        node.set('_shared', [{ user: req.user._id, is_root: true }]);
        node.set('level', 1);
        node.set('path', null);
      }

      Node.getFreePosition(parent_id, node._project, function (error, next_position) {
        var path = null;
        if (parent_id) {
          path = parent_node.position_path ? parent_node.position_path + '#' : '';
          path += parent_node.id + ',' + parent_node.position;
        }
        
        node.set('position', next_position);
        node.set('position_path', path);

        node.save(function (error) {
          if (error) return api_response(error);
          
          if (parent_node) {
            parent_node._nodes.push(node._id);
            parent_node.save(function (err) {});
          }

          Node.updateChildPositionPath(node, function () {});
          Node.updateChildPositions(old_parent_id, node._project);
          
          api_response(null, { node: node });

          Node.findById(old_parent_id, function (error, old_parent) {
            if (!old_parent) {
              return console.log("Old parent task doesn't exist")
            }

            old_parent._nodes.pull(node._id);
            old_parent.save(function (error) {});
          });
        });
      });
    });
  });
});

app.post('/api/project/node/:id/position', function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var node_id = req.params.id;
  var position = req.body.position;

  Node.changePosition(node_id, position)
  .then(function (node) {
    api_response(node);
  })
  .catch(function (error) {
    api_response(error || 'couldn\'t change position');
  });
});

app.put('/api/project/node/:id', function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var node_id = req.params.id;
  var node_data = req.body.node_data;

  Node.findById(node_id, function (error, node) {
    if (error) return api_response(error);
    if (!node) return api_response('Task doesn\'t exist');

    node.set('title', node_data.title);

    if (node_data.notes) node.set('notes', node_data.notes);
    if (node_data.complete) node.set('complete', node_data.complete);
    if (node_data.start_date) node.set('start_date', node_data.start_date);
    if (node_data.end_date) node.set('end_date', node_data.end_date);
    if (node_data.duration) node.set('duration', node_data.duration);
    if (node_data.optimisticTime) node.set('optimisticTime', node_data.optimisticTime);
    if (node_data.pessimisticTime) node.set('pessimisticTime', node_data.pessimisticTime);
    if (node_data.mostLikelyTime) node.set('mostLikelyTime', node_data.mostLikelyTime);
    if (node_data.cost) node.set('cost', node_data.cost);

    if (node_data.state) {
      node.updateState(node_data.state, function (error) {
        node.save(function (error) { api_response(error); });
      })
    } else {
      node.save(function (error) { api_response(error); })
    }
  });
});

app.delete('/api/project/node/:id', secure.hasNodePermissions('remove'), function (req, res, next) {
  var node_id = req.params.id;
  var api_response = Api_Response(req, res, next);

  Node.findById(node_id, function (error, node) {
    if (error) return api_response(error);
    
    if (node) {
      node.remove(function (error) {
        api_response(error);
      });

      var query = { '_dependency.node': node_id };
      var doc = { $pull: { '_dependency' : { node: node_id } } };
      var options = { multi: true };
      
      Node.update(query, doc, options).exec();
    }
  });
});

app.get('/api/project/node/:id', function (req, res, next) {
  var node_id = req.params.id;
  var api_response = Api_Response(req, res, next);

  Node
    .findOne({ _id: node_id })
    .populate('_dependency.node')
    .populate('_shared.user')
    .populate('_nodes')
    .populate('risks')
    .exec(function (error, node) {
      if (error) api_response(error);
      if (!node) api_response('Node doesn\'t exists');
      api_response(null, { node: node });
    });
});

app.post('/api/project/node/searchByTitle', secure.auth, function (req, res, next) {
  var query = {
    title: new RegExp(req.body.q, 'i'),
    _project: req.body.project_id,
    '_shared.user': req.user._id
  };
  var api_response = Api_Response(req, res, next);

  Node.find(query, { title: 1, _id: 1 }, function (error, nodes) {
    api_response(error, nodes);
  });
});

app.post('/api/project/node/:id/dependency', function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var node_id = req.params.id;
  var dep_id = req.body.id;
  var type = req.body.type;
  var options = { '_dependency.node': dep_id, '_dependency.type': type };
  
  if (node_id === dep_id) return api_response('you can\'t add same task as dependency');

  Node.findOne(options, function (error, node) {
    options = { $push: { '_dependency': { node : dep_id, type: type } } };
    if (error || node) return api_response('dependency already exists');

    Node.update({ _id: node_id }, options, function (error) {
      api_response(error);
    });  
  });

  
});

app.delete('/api/project/node/:id/dependency/:dep_id/:type', function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var node_id = req.params.id;
  var dep_id = req.params.dep_id;
  var type = req.params.type;
  var options = { $pull: { '_dependency' : { node: dep_id, type: type } } };

  Node.update({ _id: node_id }, options, function (error) {
    api_response(error);
  });
});


app.post('/api/project/node/:id/quality', function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var node_id = req.params.id;
  var options = { $push: { '_quality': req.body } };

  Node.update({ _id: node_id }, options, function (error, data) {
    if (error) return api_response(error);

    Node.findById(node_id, function (error, node) {
      error ? api_response(error) : api_response(null, node);
    });
  });
});

app.put('/api/project/node/:node_id/quality/:id', function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var node_id = req.params.node_id;
  var quality_id = req.params.id;
  var completed, text;
  if (typeof req.body.completed !== 'undefined' && req.body.completed !== null) {
    completed = req.body.completed;
  }
  if (typeof req.body.text !== 'undefined' && req.body.text !== null) {
    text = req.body.text;
  }
  var options = { $set: { '_quality.$.completed': completed, '_quality.$.text': text } };

  Node.update({ '_quality._id': quality_id }, options, function (error, data) {
    if (error) return api_response(error);

    Node.findById(node_id, function (error, node) {
      error ? api_response(error) : api_response(null, node);
    });
  });
});


app.delete('/api/project/node/:node_id/quality/:id', function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var node_id = req.params.node_id;
  var quality_id = req.params.id;
  var options = { $pull: { '_quality' : { _id: quality_id } } };

  Node.update({ _id: node_id }, options, function (error) {
    api_response(error);
  });
});

app.post('/api/project/node/:id/risk', function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var data = req.body;
  var risk = null;

  data.node = req.params.id;
  risk = new Risk(data);

  risk.save(function (error) {
    if (error) return api_response(error);

    var query = { _id: req.params.id };
    var changes = { $push: { 'risks': risk._id } };
    var opt = { multi: false };

    Node.update(query, changes, opt, function (error) {
      error ? api_response(error) : api_response(null, risk);
    });
  });
});

app.delete('/api/project/node/:node_id/risk/:risk_id', function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var risk_id = req.params.risk_id;

  Risk.findById(risk_id, function (error, risk) {
    if(error) return api_response(error);
    if(!risk) return api_response('could not find risk');

    risk.remove(api_response);
  });
});

app.post('/api/project/node/invite', secure.auth, function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var email = req.body.email;
  var node_id = req.body.node;
  var to_project = req.body.project;
  var iz_em = Iz('email', email).string().email();

  if (iz_em.errors && iz_em.errors.length > 0) {
    return api_response('not a valid email');
  }

  if (email === req.user.email) {
    return api_response('you can\'t invite yourself');
  }

  async.parallel({
    user: function (callback) {
      User.findOne({ email: email }, callback);
    },
    node: function (callback) {
      Node
        .findOne({ _id: node_id })
        .populate('_project')
        .exec(callback);
    }
  },
  function (error, result) {
    if (error) return api_response(error);
    
    if (result.user) {
      Node.invite(node_id, result.user._id, to_project, function (error) {
        api_response(error, result && result.user);

        mailer.send({ to: [{ email: email }], subject: "You have received a project invitation"}, {
          name: 'project/invite',
          params: {
            domain: config.get('domain'),
            project: result.node._project,
            is_registered: true,
            user: req.user
          }
        });
      });
    } else {
      ProjectAssignment.findOne({ email: email }, function (error, assignment) {
        if (error) return api_response(error);
      
        var options  = {
          name: 'project/invite',
          params: {
            domain: config.get('domain'),
            project: result.node._project,
            is_registered: false,
            user: req.user
          }
        };

        mailer.send({ to: [{ email: email }], subject: "You have been assigned a task"}, options);

        if (!assignment) {
          assignment = new ProjectAssignment({ email: email });

          if (!to_project) {
            assignment._nodes.push({ node: node_id, inviter: req.user._id });
            assignment.save(function (error) {
              api_response(null);
            });
          } else {
            Node.find({_project: result.node._project}, function (error, nodes) {
              if (error) return api_response(error);

              nodes.forEach(function (node) {
                assignment._nodes.push({ node: node._id, inviter: req.user._id });
              });

              assignment.save(function (error) {
                api_response(null);
              });
            });
          }

        } else {
          function assignment_exists($assignment, $node_id) {
            var exists = false;
            Object.keys($assignment._nodes).forEach(function (key) {
              if ($assignment._nodes[key].node == $node_id) {
                exists = true;
              }
            });

            return exists;
          };

          
          if (to_project) {
            Node.find({_project: result.node._project}, function (error, nodes) {
              if (error) return api_response(error);

              nodes.forEach(function (node) {
                if (assignment_exists(assignment, node_id)) {
                  assignment._nodes.push({ node: node._id, inviter: req.user._id });
                }
              });

              assignment.save(function (error) {
                api_response(null);
              });
            });
          }

          if (!to_project) {
            if (!assignment_exists(assignment, node_id)) {
              assignment._nodes.push({ node: node_id, inviter: req.user._id });
              assignment.save(function (error) {
                api_response(null);
              })
            } else {
              api_response(null);
            }
          }
        }
      });
    }
  });
});

app.post('/api/user/assign/', secure.auth, function (req, res, next) {
  var api_response = Api_Response(req, res, next);  
  var email = req.body.email;
  var node_id = req.body.node;

  if (email === req.user.email) {
    return api_response('You can\'t invite yourself');
  }
  
  if (!Iz(email).email().valid) {
    return api_response('Please provide valid email address'); 
  }

  async.parallel({
    user: function (callback) {
      User.findOne({ email: email }, callback);
    },
    node: function (callback) {
      Node
        .findOne({ _id: node_id })
        .populate('_project')
        .exec(callback);
    }
  },
  function (error, result) {
    if (error) return api_response(error);

    var user = result.user;

    if (user) {
      Node.invite(node_id, user._id, false, function (error, node) {
        if (error) return api_response(error);

        var options = {
          to: [{ email: user.email }],
          subject: "You've just been assigned the task " + node.title
        };

        mailer.send(options, {
          name: 'project/assign',
          params: {
            domain: config.get('domain'),
            project: node._project,
            user: req.user,
            is_registered: true
          }
        });
      });
    } else {
      var options = {
        to: [{ email: email }],
        subject: "You've just been assigned the task " + result.node.title
      };

      mailer.send(options, {
        name: 'project/assign',
        params: {
          domain: config.get('domain'),
          project: result.node._project,
          user: req.user,
          is_registered: false
        }
      });

      ProjectAssignment.findOne({ email: email }, function (error, assignment) {
        if (error) return api_response(error);

        if (!assignment) {
          assignment = new ProjectAssignment({ email: email });
          assignment._nodes.push({ node: node_id, inviter: req.user._id });
          assignment.save(function (error) {
            api_response(null);
          });
        } else {
          var exists = false;
          Object.keys(assignment._nodes).forEach(function (key) {
            if (assignment._nodes[key].node == node_id) {
              exists = true;
            }
          });

          if (!exists) {
            assignment._nodes.push({ node: node_id, inviter: req.user._id });
            assignment.save(function (error) {
              api_response(null);
            })
          } else {
            api_response(null);
          }
        }
      });
    }
  });
});

app.post('/api/project/node/reject', function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var email = req.body.email;
  var node_id = req.body.node_id;
  var query, options;

  User.findOne({ email: email }, function (error, user) {
    if (error) return api_response(error);
    
    if (user) {
      Node.reject(node_id, user._id, function (error) {
        api_response(error);
      });
    } else {
      query = { email: email };
      options = {
        $pull: { '_nodes' : { 'node': node_id } }
      };

      ProjectAssignment.update(query, options, function (error) {
        api_response(error);
      });
    }
  });
});

app.post('/api/project/node/delayed_assignment', function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var node_id = req.body.node_id;
  var query = { '_nodes.node': node_id, 'status.is_registered': false };

  ProjectAssignment.find(query, function (error, docs) {
    api_response(error, { assignments: docs });
  });
});

app.post('/api/node/searchByTitle', auth, function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  
  var query = {
    title: new RegExp(req.body.q, 'i'),
    _project: req.body.project
  };

  Node.find(query, { title: 1, _id: 1 }, function (error, docs) {
    api_response(error, docs);
  });
});

app.post('/api/project/node/:id/file', function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var node_id = req.params.id;
  var options = { $push: { '_files': req.body } };

  Node.update({ _id: node_id }, options, function (error, data) {
    api_response(error);
  });
});

app.delete('/api/project/node/:node_id/file/:file_id', function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var node_id = req.params.node_id;
  var file_id = req.params.file_id;
  var options = { $pull: { '_files' : { _id: file_id } } };

  Node.update({ _id: node_id }, options, function (error) {
    api_response(error);
  });
});

app.get('/api/project/node/:id/raci', function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var options = {
    type: 'resource',
    node: req.params.id
  };

  Raci.find(options, function (error, resources) {
    if (error) return api_response(error);
    options.type = 'raci_tab';

    Raci.find(options, function (error, racis) {
      api_response(error, { resources: resources, racis: racis });
    });
  });
});

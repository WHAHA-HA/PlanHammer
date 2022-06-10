var mongoose = require('mongoose')
var Schema = mongoose.Schema;
var validation = Helpers.model.validation;
var User = require('./user');
var async = require('async');

function addHours(date, h){
  date.setHours(date.getHours()+h);
  return date;
};

var NodeSchema = mongoose.Schema({
  title: { type: String, required: true, index: true },
  start_date: { type: String, required: false, default: new Date() },
  end_date: { type: String, required: false, default: addHours(new Date(), 24) },
  complete: { type: Number, required: false, default: 0 },
  notes: { type: String, required: false },

  duration: {
    value: { type: Number, required: false, default: 0 },
    type: { type: String, enum: ['minutes', 'hours', 'days', 'weeks', 'months'], default: 'minutes' }
  },
  optimisticTime: {
    value: { type: Number, required: false, default: 0 },
    type: { type: String, enum: ['minutes', 'hours', 'days', 'weeks', 'months'], default: 'minutes' }
  },
  pessimisticTime: {
    value: { type: Number, required: false, default: 0 },
    type: { type: String, enum: ['minutes', 'hours', 'days', 'weeks', 'months'], default: 'minutes' }
  },
  mostLikelyTime: {
    value: { type: Number, required: false, default: 0 },
    type: { type: String, enum: ['minutes', 'hours', 'days', 'weeks', 'months'], default: 'minutes' }
  },
  
  cost: { type: Number, required: false },
  // system: path and level fields
  path: { type: String, required: false, default: null, index: true }, // path to ierarchy:  ,ObjectId1,ObjectId2,
  level: { type: Number, required: false, default: 1, index: true },
  position: { type: Number, default: 1 },
  position_path: { type: String, required: false, default: null },
  // project 
  _project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
 
  _state: [{
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    isList: { type: Boolean, required: false },
    isListParent: { type: Boolean, required: false },
    collapsed: { type: Boolean, required: false }
  }],

  _dependency: [{
    node: { type: Schema.Types.ObjectId, ref: 'Node', required: false },
    type: { type: String, required: false }
  }],

  risks: [{ type: Schema.Types.ObjectId, ref: 'Risk' }],
  comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],

  _quality: [{
    text: { type: String, required: false },
    completed: { type: Boolean, required: false }
  }],

  _files: [{
    from: { type: String, required: false },
    name: { type: String, required: false },
    link: { type: String, required: false },
    bytes: { type: Number, required: false },
    added_at: { type: Date, required: false, default: new Date() }
  }],

  // _shared by default copy from parent node
  _shared: [{
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    is_root: { type: Boolean, required: false, default: false }
  }],
  // parent/child relations
  _parent: { type: Schema.Types.ObjectId, ref: 'Node' },
  _nodes: [{ type: Schema.Types.ObjectId, ref: 'Node' }],
  // modification dates
  created_at: { type: Date, required: false, default: new Date() },
  updated_at: { type: Date, required: false, default: new Date() },
});

NodeSchema.pre('save', function (next) {
  if (this.isNew) {
    var self = this;
    var model = this.model(this.constructor.modelName);
    var parent_id = this._parent;

    async.parallel({
      position: function (callback) {
        model.getMaxPosition(self._project, parent_id, callback);
      },
      position_path: function (callback) {
        if (parent_id) {
          model.getPositionPath(parent_id, function (err, path, position) {
            callback(err, { path: path, position: position });
          });
        } else {
          callback(null, null)
        }
      }
    },
    function (err, result) {
      self.position = result.position + 1;

      if (result.position_path) {
        self.position_path = ((result.position_path.path) ? (result.position_path.path + '#') : '') + parent_id + ',' + result.position_path.position;
      }

      next();
    })
  } else {
    next();
  }
});

NodeSchema.pre('remove', function (next) {
  var $Node = this.model('Node');
  var position = this.position;
  var parent_id = this._parent;

  $Node.remove({ path: new RegExp(this._id+'(?:,|$)', "i") }).exec();

  // update positions lower in level
  $Node
    .find({ _parent: parent_id, position: { $gt: position } })
    .snapshot(true)
    .exec(function (err, docs) {
      $Node.update({ _parent: parent_id, position: { $gt: position } }, { $inc: { position: -1 } }, { multi: true }).exec();
      
      if (docs) {
        docs.forEach(function (node) {
          $Node.updatePositionPath(node._id, node.position - 1, function (err) {});
        });
      }
    });
  
  next();
});

NodeSchema.methods.updateState = function ($state, done) {
  var Node = this.model('Node');
  var states = this._state;
  var options = { $set: { } };

  if ($state._id) {
    if (_.has($state, 'isList')) options.$set['_state.$.isList'] =  $state.isList;
    if (_.has($state, 'isListParent')) options.$set['_state.$.isListParent'] =  $state.isListParent;
    if (_.has($state, 'collapsed')) options.$set['_state.$.collapsed'] =  $state.collapsed;

    Node.update({ '_state._id': $state._id }, options, function (error, data) {
      done(error);
    });

  } else {
    options = { $push: { '_state': $state } };
    Node.update({ _id: this._id }, options, function (error) {
      done(error);
    });
  }
};

NodeSchema.statics.getMaxPosition = function (project_id, parent_id, cb) {
  var clause = (parent_id) 
    ? { _parent: parent_id } 
    : { _project: project_id, _parent: null };

  this.model('Node')
    .findOne(clause) 
    .sort('-position')
    .exec(function (err, node) {
      if (err) {
        cb(err, null)
      } else {
        (node) 
          ? cb(err, node.position)
          : cb(err, 0);
      }
    });
};

NodeSchema.statics.recalculate = function (parent_id, cb) {
  var Node = this.model('Node'); 
  async.parallel({
    unique: function (callback) {
      Node.distinct('position', { _parent: parent_id }, callback);
    },
    total: function (callback) {
      Node.count({ _parent: parent_id }, callback);
    }
  },
  function (err, result) {
    var toRecalculate = result.unique.length != result.total;
    
    if (toRecalculate) {
      Node
        .find({ _parent: parent_id })
        .sort('position')
        .exec(function (err, docs) {
          if (docs) {
            var i = 1;
            docs.forEach(function (val, index, array) {
              val.set('position', i);
              val.save(function (err) {});
              i++;
            })
          }
        })
    }
    
    cb(toRecalculate);
  });
};

NodeSchema.statics.changePosition = function (node_id, position) {
  var Node = this.model('Node');
  var deffered = Q.defer();

  Node.findById(node_id).populate('_parent').exec(function (error, node) {
    var query = {
      _project: node._project,
      level: node.level
    };

    Node.find(query).sort('position').exec(function (error, nodes) {
      if (error) return deffered.reject(error);
      
      var slice_position = position > node.position ? node.position - 1 : node.position;
      var insert_position = position > node.position ? position : position - 1;

      nodes.splice(insert_position, 0, node);
      nodes.splice(slice_position, 1);
      
      nodes.forEach(function (_node, index) {
        _node.set('position', index + 1).save();
      });

      deffered.resolve();
    });
  });

  return deffered.promise;
};

NodeSchema.statics.getFreePosition = function (node_id, project_id, done) {
  var query = {
    _parent: node_id,
    _project: project_id
  };

  if (!node_id) {
    query = {
      _project: project_id,
      level: 1
    }
  }

  this.model('Node').find(query).exec(function (error, docs) {
    done(error, docs && docs.length + 1);
  });
};

NodeSchema.statics.updatePositionPath = function (node_id, position, cb) {
  this.model('Node')
    .find({ position_path: new RegExp('(?:#|^)'+ node_id +',(.*?)(?:#|$)', "i") })
    .snapshot(true)
    .exec(function (err, docs) {
      if (docs) {
        docs.forEach(function (e) {
          e.set(
            'position_path', 
            e.position_path.replace(new RegExp('((?:.*?#|^)'+ node_id +',)\\d{1,}?((?:#.*|$))', "i"), "$1"+ position +"$2")
          );
          
          e.save(function (err) {});
        })
      }

      cb(err);
    })
};

NodeSchema.statics.updateChildPositionPath = function (node, done) {
  var Node  = this.model('Node');
  var where = {
    position_path: new RegExp('(?:#|^)'+ node.id +',(.*?)(?:#|$)', "i")
  };

  var regex = new RegExp('(^.*)(' + node.id + ',[0-9]+)(.*$)', 'i');
  var replace_with = node.position_path + '#' + node.id + ',' + node.position + '$3';

  Node.find(where).snapshot(true).exec(function (err, docs) {
    if (docs) {
      docs.forEach(function (e) {
        e.set('position_path', e.position_path.replace(regex, replace_with));
        e.set('path', e.path.replace(new RegExp('(^.*)(' + node.id +')', 'i'), node.path + ',' + node.id + ''));
        e.save(function (err) {});
      });
    }

    done(err);
  });
};

NodeSchema.statics.updateChildPositions = function (node_id, project_id, done) {
  var query = { _parent: node_id, _project: project_id };
  if (!node_id) query = { level: 1, _project: project_id };

  this.model('Node').find(query).sort('position').exec(function (error, docs) {
    console.log(docs);
    docs.forEach(function (doc, i) {
      doc.set('position', i+1);
      doc.save(function () {});
    });

    if (done) done();
  });
};

NodeSchema.statics.getPositionPath = function (node_id, cb) {
  this.model('Node')
    .findOne({ _id: node_id })
    .exec(function (err, node) {
      (node)
        ? cb(err, node.position_path, node.position)
        : cb(err, null, 0);
    })
};

NodeSchema.statics.invite = function (node_id, user_id, to_project, done) {
  console.log(node_id, user_id, to_project, done);
  var Node = this.model('Node');
  
  async.series([
    function (callback) {
      var find = {
        $and: [
          { path: new RegExp(node_id + '(?:,|$)', "i") },
          { '_shared.user': { '$ne': user_id } }
        ]
      };
      var update = { $push: { '_shared': { user: user_id, is_root: false } } };

      Node.update(find, update, { multi: true }, callback);
    },
    function (callback) {
      var find = {
        $and: [
          { _id: node_id },
          { '_shared.user': { '$ne': user_id } }
        ]
      };
      var update = { $push: { '_shared': { user: user_id, is_root: true } } };

      if (to_project) find = { '_shared.user': { '$ne': user_id } };
      Node.update(find, update, { multi: true }, callback);
    },
    function (callback) {
      var find = { '_shared.user': { '$ne': user_id } };
      var update = { $push: { '_shared': { user: user_id, is_root: false } } };

      Node.update(find, update, { multi: true }, callback);
    }
  ], function (error, results) {
    if (error) return done(error);

    Node
    .findOne({ _id: node_id })
    .populate('_project')
    .exec(function (error, node) {
      if (node) {
        var exists = false;
        Object.keys(node._project._users).forEach(function (key) {
          if (typeof node._project._users[key].user != 'undefined' && node._project._users[key].user == user_id) {
            exists = true;
          }
        });

        //Yakov
        if (!exists) {
          node._project._users.push({ user: user_id, need_send_email: true });
          node._project.save(function (err) {});
        }
      }

      done(error, node);
    });
  });
};

NodeSchema.statics.reject = function (node_id, user_id, cb) {
  var Node = this.model('Node');
  var User = this.model('User');
  var Project = this.model('Project');
  var where = {
    $and: [
      { $or: [
          { _id: node_id },
          { path: new RegExp(node_id + '(?:,|$)', "i") }
        ]
      },
      { '_shared.user': user_id }
    ]
  };
  var update = { $pull: { '_shared': { 'user': user_id } } };

  Node.update(where, update, { multi: true }, function (error) {
    cb(error);

    Node.findById(node_id, function (error, node) {
      if (error) return;
      
      User.hasNodeAssigned(user_id, node._project, function (error, has) {
        if (!error && !has) {
          where = { _id: node._project };
          update = { $pull: { '_users': { 'user': user_id } } };
          Project.update(where, update, { multi: false }).exec();
        }
      });
    });
    
  });
};

module.exports = mongoose.model('Node', NodeSchema);

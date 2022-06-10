var mongoose = require('mongoose');
var Schema = mongoose.Schema
var validation = Helpers.model.validation;
var SALT_WORK_FACTOR = 10;
var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');

// Define roles
var rolesCodes = {
  USER: 'user',
  ADMIN: 'admin'
};

var rolesTitles = {};

rolesTitles[rolesCodes.USER] = 'User';
rolesTitles[rolesCodes.ADMIN] = 'Admin';

var plans = {
  '1to3users': '1 to 3 Users',
  '3to10users': '3 to 10 Users',
  '10+': 'Unlimited Users'
};

var UserSchema = mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, index: true, unique: true },
  name: {
    first: { type: String, required: false },
    last: { type: String, required: false }
  },
  address: { type: String, required: false },
  city: { type: String, required: false },
  state: { type: String, required: false },
  zip: { type: String, required: false },
  country: { type: String, required: false },
  avatar: { type: String, required: false, default: "wtf" },
  password: { type: String, required: true},
  role: { type: String, required: true, default: rolesCodes.USER },
  confirmation: {
    status: { type: Boolean, default: false },
    code: { type: String, required: false }
  },
  social: {
    google: {
      id: { type: String, required: false }
    }
  },
  _referral: { type: Schema.Types.ObjectId, ref: 'User' },
  stripe: {
    customer: { type: String, required: false },
    card: { type: String, required: false },
    plan: { type: String, enum: Object.keys(plans) }
  },
  last_nag: { type: Date, require: false },
  plan: { type: String, enum: ['free', 'payed', 'invited'], default: 'free'},
  free_period_start: { type: Date, required: false },
  free_month_count: { Type: Number, required: false },
  login_count: { type: Number, required: false, default: 0 },
  created_at: { type: Date, required: false },
  need_send_email: { type: Boolean, default: true},
  reset_token: { type: String, required: false },
  reset_expires: { type: String, required: false },
  has_image: { type: Boolean, required: false }
});

// Validation rules
UserSchema.path('username').validate( validation.uniqueFieldInsensitive('User', 'username' ), 'Username already in use' );
UserSchema.path('email').validate( validation.uniqueFieldInsensitive('User', 'email' ), 'Email already in use' );

UserSchema.pre('save', function(next) {
  var user = this;
  var crypto = require('crypto');
  var shasum = crypto.createHash('sha1');
  
  // confirmation code generating
  if (!user.confirmation.status && !user.confirmation.code) {
    shasum.update(user.email + new Date().getTime());
    user.confirmation.code = shasum.digest('hex');
  }

  if (!user.created_at) user.created_at = new Date();
  if (!user.isModified('password')) return next();
  
  bcrypt.genSalt(SALT_WORK_FACTOR, function(error, salt) {
    if(error) return next(error);

    bcrypt.hash(user.password, salt, function (){}, function(error, hash) {
      if(error) return next(error);
      user.password = hash;
      next();
    });
  });
});

// Password verification
UserSchema.methods.comparePassword = function(candidatePassword, done) {
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    if(err) return done(err);
    done(null, isMatch);
  });
};

UserSchema.methods.generateReset = function (done) {
  var user = this;

  crypto.randomBytes(20, function(error, buf) {
    if (error) return done(error)
      
    var token = buf.toString('hex');
    var expires = Date.now() + 3600000; // 1 hour

    user.set('reset_token', token);
    user.set('reset_expires', expires);

    user.save(done);
  });
};

UserSchema.methods.checkAllowed = function(done) {
  if (this.confirmation.status) return done(null, true);
  if (this.login_count === 0) return done(null, true);
  return done(null, false);
};

UserSchema.methods.freeMonth = function (done) {
  var stripe = app.get('stripe');
  var user = this;
  var done = done || function () {};
  var d = new Date();
  var count = this.get('free_month_count') || 0;

  if (user.stripe && user.stripe.customer) {
    this.set('free_month_count', count + 1);
  } else {
    d.setMonth(d.getMonth() + 1);
    this.set('free_period_start', d);
  }

  this.save(done);
};

UserSchema.statics.calculatePlan = function (user_id, done) {
  this.model('User').inviteCount(user_id, function (error, count) {
    var _plans = Object.keys(plans), plan;
    if (error) return done(error);

    if (count <= 3) {
      plan = _plans[0];
    } else if (count > 3 && count <= 10) {
      plan = _plans[1];
    } else {
      plan = _plans[2];
    }

    done(null, plan);
  });
};

UserSchema.statics.setStripeData = function (user_id, stripe_data, done) {
  var User = this.model('User'); 

  User.findById(user_id, function (error, user) {
    if (error) return done(error);
    user.set('stripe', stripe_data);
    user.set('plan', 'payed');
    user.save(done);
  });
};

UserSchema.statics.inviteCount = function (user_id, done) {
  var User = this.model('User');
  User.count({ _referral: user_id }, done);
};

UserSchema.statics.removeFully = function (user_id, done) {
  var User = this.model('User');
  var Project = this.model('Project');
  done = done || function () {};
  
  User.remove({ _id: user_id }).exec();
  Project.find({ _user: user_id }, function (error, projects) {
    if (error) return;

    projects.forEach(function (project) {
      project.remove(function () {});
    });
    done();
  });
};

UserSchema.statics.getCollaborators = function (user_id) {
  var User = this.model('User');
  var Project = this.model('Project');
  var deffered = Q.defer();
  var collaborators = [];

  Project
  .find({ _user: user_id })
  .populate('_users.user')
  .exec(function (error, projects) {
    if (error) return deffered.reject(error);

    projects.forEach(function (project) {
      project._users.forEach(function (obj) {
        if (obj.user) {
          collaborators.push(obj.user);
        }
      });
    });

    collaborators = _.uniq(collaborators, function (u) { return u._id });
    deffered.resolve(collaborators);
  });

  return deffered.promise;
};

UserSchema.statics.hasNodeAssigned = function (user_id, project_id, done) {
  var Node = this.model('Node');
  var where = {
    $and: [
      { '_shared.user': user_id },
      { _project: project_id }
    ]
  };

  Node.find(where).exec(function (error, nodes) {
    done(error, nodes && nodes.length > 0);
  });
};

UserSchema.statics.removeFromProjects = function (user_id) {
  var deffered = Q.defer();
  var Project = this.model('Project');
  var Node = this.model('Node');
  
  var where = { '_shared.user': user_id };
  var update = { $pull: { '_shared': { 'user': user_id } } };

  Node.update(where, update, { multi: true }, function (error) {
    if (error) {
      return deffered.reject(error);
    }

    where = { '_users.user': user_id };
    update = { $pull: { '_users': { 'user': user_id } } };

    Project.update(where, update, { multi: true }, function (error) {
      error ? deffered.reject(error) : deffered.resolve();
    });
  });

  return deffered.promise;
};

UserSchema.statics.assignedNodes = function (user_id, project_id) {
  var deffered = Q.defer();
  var Node = this.model('Node');
  var query = {
    '_project': project_id,
    '_shared.user': user_id
  };

  Node.find(query).populate('_shared.user').exec(function (error, nodes) {
    error ? deffered.reject(error) : deffered.resolve(nodes);
  });

  return deffered.promise;
};

module.exports = mongoose.model('User', UserSchema);

module.exports.roles = {
  codes: rolesCodes,
  titles: rolesTitles
};

module.exports.plans = plans;

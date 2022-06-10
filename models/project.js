var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var validation = Helpers.model.validation;
var User = require('./user');
var Node = require('./node');

var ProjectSchema = mongoose.Schema({
  name: { type: String, required: true, unique: true },
  _user: { type: Schema.Types.ObjectId, ref: 'User' },
  _users: [{
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    role: { type: Schema.Types.ObjectId, ref: 'ProjectRole' },
    referral: { type: Schema.Types.ObjectId, ref: 'User' },
    need_send_email: { type: Boolean, default: false}
  }],
  boards: [{ type: Schema.Types.ObjectId, ref: 'Board' }],
  description: { type: String, required: false },
  settings: {
    show_numbers: { type: Boolean, default: true },
    use_quality: {type: Boolean, default: false }
  },
  timezone: { type: String, require: false },
  has_image: { type: Boolean, required: false },
  created_at: { type: Date, required: false, default: new Date() }
});

ProjectSchema.path('name').validate( validation.uniqueFieldInsensitive('Project', 'name' ), 'That project name already exists.' );

ProjectSchema.virtual('id').get(function(){
  return this._id.toHexString();
});

// Ensure virtual fields are serialised.
ProjectSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    return ret;
  }
});

ProjectSchema.pre('remove', function (next) {
  var self = this;

  this.model('Node').remove({ _project: self._id }).exec();

  next();
});

module.exports = mongoose.model('Project', ProjectSchema);

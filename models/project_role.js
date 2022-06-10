var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var validation = Helpers.model.validation;


var ProjectRoleSchema = mongoose.Schema({
  name: { type: String, required: true, unique: true },
  created_at: { type: Date, required: false }
});

ProjectRoleSchema.path('name').validate( validation.uniqueFieldInsensitive('ProjectRole', 'name' ), 'Role name already exists' );

module.exports = mongoose.model('ProjectRole', ProjectRoleSchema);

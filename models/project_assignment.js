var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var validation = Helpers.model.validation;

var ProjectAssignmentSchema = mongoose.Schema({
    email: { type: String, required: true, unique: true },
    _project: { type: Schema.Types.ObjectId, ref: 'Project' },
    _nodes: [{
      node: { type: Schema.Types.ObjectId, ref: 'Node' },
      inviter: { type: Schema.Types.ObjectId, ref: 'User' }
    }],
    status: {
    	is_registered: { type: Boolean, required: false, default: false },
    },
    created_at: { type: Date, required: false, default: new Date() }
})

module.exports = mongoose.model('ProjectAssignment', ProjectAssignmentSchema);

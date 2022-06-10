var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var validation = Helpers.model.validation;

var Risk = mongoose.Schema({
  node: { type: Schema.Types.ObjectId, ref: 'Node', required: true},
  name: { type: String },
  topic: { type: String },
  level: { type: Number, default: 1 },
  probability: { type: Number, default: 0 },
  impact: { type: Number, default: 0 },
  mitigation: { type: String },
  contingency: { type: String },
  consequence: { type: String },
  created_at: { type: Date, required: false, default: new Date() }
});

Risk.post('remove', function (risk) {
  this.model('Node').findById(risk.node, function (error, node) {
    node.risks.pull(risk._id);
    node.save();
  });
});

module.exports = mongoose.model('Risk', Risk);

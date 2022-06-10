var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var validation = Helpers.model.validation;

var Raci = mongoose.Schema({
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true},
  node: { type: Schema.Types.ObjectId, ref: 'Node' , required: false},
  resource: { type: String, required: true },
  role: { type: String, required: false },
  type: { type: String, enum: ['raci_view', 'raci_tab', 'resource'] },
  created_at: { type: Date, required: false, default: new Date() }
});

Raci.statics.getForProject = function () {
  var deffered = Q.defer();

  this.model('Raci').find({ project: id }, function (error, racis) {
    error ? deffered.reject(error) : deffered.resolve(racis);
  });

  return deffered.promise;
};

module.exports = mongoose.model('Raci', Raci);

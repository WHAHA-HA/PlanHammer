var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var validation = Helpers.model.validation;
var ObjectId = mongoose.Types.ObjectId;


var Board = mongoose.Schema({
  name: { type: String, required: false },
  default: { type: Boolean, required: false },
  lists: [{ type: Schema.Types.ObjectId, ref: 'List' }],
  project: { type: Schema.Types.ObjectId, ref: 'Project' },
  start_date: { type: Date, required: false }, 
  end_date: { type: Date, required: false },
  created_at: { type: Date, required: false, default: new Date() }
});

Board.post('remove', function (board) {
  this.model('List').remove({ _id: { $in: board.lists } }).exec();
  this.model('Project').findById(board.project, function (error, project) {
    project.boards.pull(board._id);
    project.save();
  });
});

Board.statics.set_default = function (project_id, board_id) {
  var deffered = Q.defer();
  var $Project = this.model('Project');
  var $Board = this.model('Board');

  $Project.findById(project_id, function (error, project) {
    if (error) return deffered.reject(error);

    $Board.update({ _id: { $in: project.boards }}, { default: false }, { multi: true})
    .exec(function (error) {
      if (error) return deffered.reject(error);

      $Board.findByIdAndUpdate(board_id, { default: true }, function (error) {
        error ? deffered.reject(error) : deffered.resolve();
      });
    });
  });

  return deffered.promise;
};

Board.statics.create_list = function (name, board_id) {
  var deffered = Q.defer();
  var List = this.model('List');

  this.model('Board').findById(board_id, function (error, board) {
    if (error) return deffered.reject(error);
    if (!board) return deffered.reject('could not find board');

    var list =  new List({
      name: name,
      position: board.lists.length,
      board: board._id
    });

    list.save(function (error) {
      if (error) return deffered.reject(error);

      board.lists.push(list._id);
      board.save();
      deffered.resolve(list);
    });
  });

  return deffered.promise;
};

module.exports = mongoose.model('Board', Board);

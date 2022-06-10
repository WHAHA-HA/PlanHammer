var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var validation = Helpers.model.validation;
var ObjectId = require('mongoose').Types.ObjectId;

var List = mongoose.Schema({
  name: { type: String, required: true },
  position: { type: Number, required: true },
  default: { type: Boolean, required: false },
  tasks: [{
    position: { type: Number, required: true },
    node: { type: Schema.Types.ObjectId, ref: 'Node' }
  }],
  board: { type: Schema.Types.ObjectId, ref: 'Board' },
  created_at: { type: Date, required: false, default: new Date() }
});

List.post('remove', function (list) {
  var $Board = this.model('Board');
  var $List = this.model('List');

  //remove list from board
  $Board.findById(list.board, function (error, board) {
    board.lists.pull(list._id);
    board.save();
  });

  //arange position
  var query = {
    board: list.board,
    position: { $gt: list.position }
  };
  var update = {
    $inc: { position: -1 }
  };

  $List.update(query, update, { multi: true }).exec();
});

List.statics.set_default = function (list_id, board_id) {
  var deffered = Q.defer();
  var $Board = this.model('Board');
  var $List = this.model('List');

  $Board.findById(board_id, function (error, board) {
    if (error) return deffered.reject(error);

    $List.update({ _id: { $in: board.lists }}, { default: false }, { multi: true})
    .exec(function (error) {
      if (error) return deffered.reject(error);

      $List.findByIdAndUpdate(list_id, { default: true }, function (error, list) {
        error ? deffered.reject(error) : deffered.resolve();
      });
    });
  });

  return deffered.promise;
};

List.statics.change_position = function (position, list_id, board_id) {
  var $Board = this.model('Board');
  var $List = this.model('List');
  var deffered = Q.defer();
  var sliced_list = null;

  $Board.findById(board_id)
  .populate({ path: 'lists', options: { sort: 'position' } })
  .exec(function (error, board) {
    if (error) return deffered.reject(error);

    for(var i=0; i<board.lists.length; i++) {
      if (board.lists[i]._id == list_id) {
        sliced_list = board.lists.splice(i, 1)[0];
      }
    }

    board.lists.splice(position, 0, sliced_list);

    board.lists.forEach(function (list, i) {
      var update = {
        $set: { position: i }
      };
      $List.findByIdAndUpdate(list._id, update).exec();
    });


    deffered.resolve();
  });

  return deffered.promise;
};

List.statics.change_task_position = function (position, node_id, list_id) {
  var $List = this.model('List');
  var deffered = Q.defer();
  var sliced_tasks = null;

  $List.findById(list_id)
  .sort('position')
  .exec(function (error, list) {
    if (error) return deffered.reject(error);

    for(var i=0; i<list.tasks.length; i++) {
      if (list.tasks[i].node == node_id) {
        sliced_tasks = list.tasks.splice(i, 1)[0];
      }
    }

    list.tasks.splice(position, 0, sliced_tasks);

    list.tasks.forEach(function (task, i) {
      task.position = i;
    });

    list.save();
    deffered.resolve(list);
  });

  return deffered.promise;
};

List.statics.add_task = function (task_id, list_id) {
  var deffered = Q.defer();
  var $List = this.model('List');

  $List.findOne({ 'tasks.node': task_id }, function (error, old_list) {
    if (error) return deffered.reject(error);
    
    if (!old_list) {
      return $List.push_task(task_id, list_id).then(deffered.resolve).catch(deffered.reject);
    }

    $List.remove_task(task_id, old_list._id)
    .then(function () {
      $List.push_task(task_id, list_id)
      .then(deffered.resolve).catch(deffered.reject);
    })
    .catch(deffered.reject);
  });

  return deffered.promise;
};

List.statics.push_task = function (task_id, list_id) {
  var deffered = Q.defer();
  var $List = this.model('List');
  
  $List.findById(list_id, function (error, list) {
    if (error) return deffered.reject(error);
    if (!list) return deffered.reject('could not find list');

    for(var i=0; i<list.tasks.length; i++) {
      if (list.tasks[i].node == task_id) return deffered.reject('task already exists');
    }

    list.tasks.push({
      position: list.tasks.length,
      node: task_id
    });

    list.save(function (error) {
      error ? deffered.reject(error) : deffered.resolve(list);
    });
  });

  return deffered.promise;
};

List.statics.remove_task = function (task_id, list_id) {
  var deffered = Q.defer();
  var $List = this.model('List');

  $List.findById(list_id, function (error, list) {
    var task_found = null;

    if (error) return deffered.reject(error);
    if (!list) return deffered.reject('List was not found');

    for(var i=0; i<list.tasks.length; i++) {
      var task = list.tasks[i];

      if (task.node == task_id) {
        task_found = true;
        list.tasks.splice(i, 1);
      }
    }

    for(var i=0; i<list.tasks.length; i++) {
      list.tasks[i].position = i+1;      
    }

    list.save(function (error) {
      if (error) return deffered.reject(error);
      
      $List.findById(list_id, function (error, new_list) {
        error ? deffered.reject(error) : deffered.resolve(new_list);
      });
    });
  });

  return deffered.promise;
};

module.exports = mongoose.model('List', List);

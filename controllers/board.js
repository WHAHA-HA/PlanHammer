var Api_Response = Middlewares.general.api_response;
var Project = Models.Project;
var Board = Models.Board;
var List = Models.List;

//Boards
app.get('/api/project/:id/board', function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var project_id = req.params.id;

  Board.find({ project: project_id })
  .populate({ path: 'lists', options: { sort: 'position' } })
  .exec(api_response);
});

app.post('/api/board', function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var name = req.body.name;
  var project_id = req.body.project;
  
  var board = new Board({
    name: name,
    project: project_id
  });

  board.save(function (error) {
    if (error) return api_response(error);

    var query = { _id: project_id };
    var changes = { $push: { 'boards': board._id } }
    var opts = { multi: false };

    Project.update(query, changes, opts).exec(function (error) {
      api_response(error, board);
    });
  });
});

app.put('/api/project/:project_id/board/:board_id', function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var project_id = req.params.project_id;
  var board_id = req.params.board_id;

  if (req.body.name) {
    Board.findById(board_id).exec(function (error, board) {
      if(error) return api_response(error);
      if(!board) return api_response('board was not found');

      board.set('name', req.body.name);
      board.save(api_response);
    });
  }

  if (req.body.start_date || req.body.end_date) {
    Board.findById(board_id).exec(function (error, board) {
      if(error) return api_response(error);
      if(!board) return api_response('board was not found');

      if (req.body.start_date){
        board.set('start_date', req.body.start_date);
      } else {
        board.set('end_date', req.body.end_date);
      }
      
      board.save(api_response);
    });
  }

  if(req.body.default) {
    Board.set_default(project_id, board_id).then(api_response).catch(api_response);
  }
});

app.delete('/api/board/:board_id', function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var board_id = req.params.board_id;

  Board.findById(board_id, function (error, board) {
    board.remove(api_response);
  })
});


//Lists
app.post('/api/board/:board_id/list', function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var board_id = req.params.board_id;
  var name = req.body.name;
  
  Board.create_list(name, board_id)
  .then(function (list) {
    api_response(null, list);
  })
  .catch(api_response);
});

app.put('/api/board/:board_id/list/:list_id', function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var list_id = req.params.list_id;
  var board_id = req.params.board_id;
  var position = req.body.position;

  if (req.body.name) {
    List.findById(list_id).exec(function (error, list) {
      if(error) return api_response(error);
      if(!list) return api_response('list was not found');

      list.set('name', req.body.name);
      list.save(api_response);
    });
  }

  if(req.body.default) {
    List.set_default(list_id, board_id).then(api_response).catch(api_response);
  }
  
  if(position || position  == 0) {
    List.change_position(position, list_id, board_id)
    .then(api_response).catch(api_response);
  }

  if (req.body.tasks) {
    List.findById(list_id, function (error, list) {
      if(error) return api_response(error);
      
      list.tasks = req.body.tasks;
      list.save(api_response);
    });
  }
});

app.delete('/api/board/:board_id/list/:list_id', function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var board_id = req.params.board_id;
  var list_id = req.params.list_id;
  
  List.findById(list_id, function (error, list) {
    if (error) return api_response(error);
    if (!list) return api_response('could not find list');
    
    list.remove(api_response);
  });
});


//Tasks
app.post('/api/list/:list_id/task', function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var list_id = req.params.list_id;
  var node_id = req.body.node;
  var position = req.body.position;

  List.add_task(node_id, list_id)
  .then(function (list) {
    if (position) {
      List.change_task_position(position, task_id, list_id)
      .then(function (new_list) {
        api_response(null, new_list);    
      }).catch(api_response);
    } else {
      api_response(null, list);
    }
  })
  .catch(api_response);
});

app.put('/api/list/:list_id/task/:task_id', function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var list_id = req.params.list_id;
  var task_id = req.params.task_id;
  var position = req.body.position;

  if(position || position == 0) {
    List.change_task_position(position, task_id, list_id)
    .then(api_response).catch(api_response);
  } else {
    api_response('provide data to be updated');
  }
});

app.delete('/api/list/:list_id/task/:task_id', function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var list_id = req.params.list_id;
  var task_id = req.params.task_id;
  
  List.remove_task(task_id, list_id)
  .then(function (list) {
    api_response(null, list);
  })
  .catch(api_response);
});

angular.module('App.controllers')
.controller('agileController', ['$scope', '$rootScope', '$stateParams', 'Project', 'Node', 'Board', 'User', 'Alert',
function ( $scope, $rootScope ,$stateParams, Project, Node, Board, User, Alert ) {
  
//Sortable
  $scope.sortable = {};
 
  $scope.sortable.board_title_form;
  $scope.sortable.boards;
  $scope.sortable.new = {};
  $scope.sortable.list = {};
  $scope.sortable.list.active_task 
  $scope.sortable.list.form_visible = false;
  $scope.sortable.staged_tasks = [];
  $scope.sortable.task = {};
  $scope.sortable.board = {};
  
  $scope.sortable.temp_call_form = function( selector, node, fn ){

    var cords = $(selector).offset();
    var input  = document.createElement('input');
    var bodyDom = document.body;
    var inputDom;
    var name = node.name ? node.name : node.title
      console.log(node)
    // var width = options && option.width ? options.width : '220px'
    // var height = options && option.height ? options.height : '35px'
    var width = '220px'
    var height = '35px'
    input.style.cssText =
      'left:' + cords.left + 'px;' +
      'top:' + cords.top + 'px;' +
      'width:' + width + ';' +
      'height:' + height + ';' +
      'position: absolute;';

    input.className = "form-control edit-in-place";
    input.placeholder = name

    $(input).on('keyup', function (e) {
      if (e.keyCode == 13 || e.keyCode == 27) {
        this.save()
      }
    }).on('blur', function(){
      this.save()
    })

    bodyDom.appendChild(input);
    
    inputDom = input;
    
    input.focus()

    inputDom.save = function() {
      var input = this;
      var name;
      if (input.value.length == 0) {
        name = node.name ? node.name : node.title
      }else{
        name = input.value
      }
      
      fn(node, name)
      bodyDom.removeChild(input);
      inputDom = null;

    }


   }
  
  $scope.sortable.call_form = function( selector, node, fn, optional, options ){
    
    var cords = $(selector).offset();
    var input  = document.createElement('input');
    var bodyDom = document.body;
    var inputDom;
    var name = node.name ? node.name : node.title;
    var width = '220px';
    var height = '35px';
    input.style.cssText =
      'left:' + cords.left + 'px;' +
      'top:' + cords.top + 'px;' +
      'width:' + width + ';' +
      'height:' + height + ';' +
      'position: absolute;';

    input.className = "form-control edit-in-place";
    input.placeholder = name

    $(input).on('keyup', function (e) {
      if (e.keyCode == 13 || e.keyCode == 27) {
        this.save()
      }
    }).on('blur', function(){
      this.save()
    })

    bodyDom.appendChild(input);
    
    inputDom = input;
    
    input.focus()

    inputDom.save = function() {
      var input = this;
      var name = node.name ? node.name : node.title
      if (input.value.length == 0) input.value = name
      var id = node.id, name = input.value, __node = {};

      fn(node, input, optional)
      .then(function (node_updated) {
        if (node.title) {
          node.title = name
        }else{
          node.name = name
        }
        bodyDom.removeChild(input);
        inputDom = null;
      })
    }
   }
  //update scope tasks on task create ?
  $scope.sortable.init = function(boardName){

    $scope.list_ids = "" 
    $scope.sortable.lists = [] 

    Board.all($scope.project.id).then(function(data){

      $scope.sortable.boards = data
      var c = 0;

      $scope.sortable.boards.forEach(function(board) {

        board.width = board.lists.length * 350;
        board.lists.forEach(function(list){
          if (c==0) {
            $scope.list_ids += "#" + list._id
          }else{
            $scope.list_ids += ",#" + list._id
          }
          c++
        })
        if (board.lists && board.lists.length > 0 ) {
          board.lists.forEach(function(list){
            $scope.sortable.lists.push(list)
            list.nodes = []
            list.tasks.forEach(function(_task){
              $scope.sortable.tasks.forEach(function(task){
                if (task._id == _task.node) {
                  task.isInList = true;
                  task.list = list
                  list.nodes.push(task)
                };
              })
            })
          })
        };
      })
      setTimeout(function() {
        $scope.sortable.load()
      }, 0);

    })
   }

  $rootScope.sortable_create_board = function(name){
    var project_id = $scope.project.id;
    Board.create(name, project_id)
    .then(function (board) {
      $scope.sortable.boards.push(board)
      $rootScope.$broadcast("node_form_board_created", board);
    })
    .catch(Alert.danger);
   }

  function task_event_handler (e) {
    // console.log(e)
    // sort
    if ( e.action == 'sort' ) $scope.sortable.list.on_sort(e)
    // remove
    else if ( e.action == 'remove' ) $scope.sortable.list.on_remove(e)
    // receive
    else if( e.action == 'receive' ) $scope.sortable.list.on_receive(e)
   
   }

  $scope.sortable.load = function( ){

    $scope.sortable.boards.forEach(function(board) {
      $("#"+board._id).kendoSortable({
        handler: ".handler",
        hint:function(element) {
          return element.clone().addClass("hint");
        },
        ignore: '.listControll *, #agile-task-list-search, .task-import-board, .agile-import-task, .list-footer, #add-node',
        end: function onChange(e) {
                  var list_id = $(e.item.context).attr('id')
                  if (e.action == 'sort') {
                    Board.update_list(list_id, board._id, {position: e.newIndex}).then(function(data){
                        console.log(data)
                    })
                    .catch(function(error){
                      console.log(error)
                    })
                  };
         },
        filter: '.sortable-basic.sortable'
      });



      board.lists.forEach(function(list){
      $("#"+list._id).kendoSortable({
          connectWith: $scope.list_ids.replace("#"+list._id, '.dis'),
          hint:function(element) {
            return element.clone().addClass("hint");
          },
          filter: ".agile-task",
          ignore: '.listControll *, #agile-task-list-search, .task-import-board *, .list-footer, #add-node',
          end: task_event_handler,
        });
      })


    })

   }

  $scope.sortable.set_active_task = function(task){

    var taskBox = $('.in-list#'+task._id)

    if (taskBox.hasClass('active')) {
      taskBox.removeClass('active')
      $scope.sortable.active_task = null
    }
    else if(!taskBox.hasClass('active') && $scope.sortable.active_task){
      $('.in-list#'+$scope.sortable.active_task._id).removeClass('active')
      taskBox.addClass('active')
      $scope.sortable.active_task = task
    }
    else if(!taskBox.hasClass('active') && !$scope.sortable.active_task){
      taskBox.addClass('active')
      $scope.sortable.active_task = task
    }
   }

// Board
  $scope.sortable.board.get = function(id){
    var _board;
    $scope.sortable.boards.forEach(function(board){
      if (board._id == id) {
        _board = board 
      };
    })
    return _board;
   }

  $scope.sortable.board.create = function (payload, id) {
    var project_id = $scope.project.id;
    var new_name = $scope.sortable.new.board_name ? $scope.sortable.new.board_name : 'new board'

    if (!id) {

      Board.create(new_name, project_id)
      .then(function (board) {
        $scope.sortable.board_title_form = false;
        $scope.sortable.new.board_name = '';
        $scope.sortable.board.set_default(board, function(){
          $scope.sortable.init()
        })
      })
      .catch(Alert.danger);

    }else{
      Board.update( $scope.project_id, id, {name: new_name} )
      .then(function (board) {
        $scope.sortable.board_title_form = false;
        $scope.sortable.new.board_name = '';
        $scope.init()
      })
      .catch(Alert.danger);

    }
   }
    //-

  $scope.sortable.board.hide_form = function  () {
    $scope.sortable.board_title_form = false;
   }
  
  $scope.sortable.board.show_form = function () {
    $scope.sortable.board_title_form = true;
   }
  
  $scope.sortable.board.remove = function (board) {

    board.lists.forEach(function(list){
      $scope.sortable.list.eject_tasks(list)
    })
    Board.remove(board._id, board.project)
    .then(function () {
      $scope.sortable.boards = _.reject($scope.sortable.boards, function (l) {
        return l._id === board._id;
      });
    })
    .catch(Alert.danger);
   }
  
  $scope.update_board_title = function(board, input){

    return Board.update( $scope.project_id, board._id, {name: input.value} )
   }
  
  $scope.sortable.board.rename = function(selector, board){
    
    $scope.sortable.call_form ( selector, board, $scope.update_board_title )
   }
 
  // Set default * // -fix board jumping on creating!!!
  $scope.sortable.board.set_default = function(board, fn){
    Board.update($scope.project.id, board._id, {default: true})
    .then(function(){
      if (fn) {
        fn()
      };
    })
   }

// List
  $scope.sortable.list.get = function(id){
    var list;
    $scope.sortable.lists.forEach(function(_list){
      if (_list._id == id) {
        list =  _list
      };
    })
    return list;
   }

  $scope.sortable.list.eject_tasks = function(list){
    list.nodes.forEach(function(task){
      $scope.tasks.forEach(function(scopeTask){
        if (task._id == scopeTask._id) {
          scopeTask.list = false;
          scopeTask.isInList = false;
          task.list = null
          task.isInList = null
          $scope.sortable.init()
        };
      })
    })
   }

  $scope.sortable.list.create = function (name, board) {
    Board.create_list(name, board._id)
    .then(function (list) {
      $scope.sortable.new.list_name = '';
      $scope.sortable.list.hide_form()
      // $scope.sortable.board.set_default(board, function(){
        $scope.sortable.init()
        $rootScope.$broadcast("node_form_list_created", list);
      // })
    })
   }

  $scope.sortable.list.rename = function(selector, node, board){
    var fn = function (node, name, board ){
      return Board.update_list( node._id, board._id, { name: name.value })
    }
    $scope.sortable.call_form(selector, node, fn, board )
   }

  $scope.sortable.list.remove = function (list, board) {
    Board.remove_list(list._id, board._id)
    .then(function () {
      $scope.sortable.list.eject_tasks(list)
      board.lists = _.reject(board.lists, function (l) {
        return l._id === list._id;
      });
    })
    .catch(Alert.danger);
   }

  $scope.sortable.list.show_form = function(){
   
    $scope.sortable.list.form_visible = true
   }

  $scope.sortable.list.hide_form = function(){
   
    $scope.sortable.list.form_visible = false
   }
  
  $scope.sortable.list.change_position = function(e){
    var tasks = $(e.item.context)
    var task_id = $(e.item.context).attr('id')
    if (e.action == 'sort') {
      Board.update_list(task_id, board._id, {position: e.newIndex})
    };
   }


   // jquery

  $scope.sortable.list.on_sort = function(e){
    if (e.newIndex == e.oldIndex) return;
    // time for kendo to copy and remove task
    setTimeout(function() {
      var board_id = $(e.item.context).attr('board-id')
      var list_id = $(e.item.context).attr('list-id')
      var node_id = $(e.item.context).attr('node-id')
      var tasks = $('.agile-task.in-list.' + list_id)
      var nodes = [];
      if (tasks && tasks.length > 0) {
        tasks.each(function( index ) {
          nodes.push({position: index, node: $( this ).attr('node-id')})
        });
        Board.update_list(list_id, board_id, {tasks: nodes})
        .catch(function(error){
            console.log(error)
        })
      }
    }, 0);

   }

  $scope.sortable.list.on_remove = function(e){

    var item = $(e.item.context);
    var board_id = item.attr('board-id');
    var list_id = $(e.sender.element.context).attr('id')
    var node_id = item.attr('node-id')
    var task = $scope.sortable.get_task(node_id);
    var list = $scope.sortable.list.get(list_id)
    $scope.sortable.task.remove(node_id, list, { _id: board_id }, task)
   }

  $scope.sortable.list.on_receive = function(e){
    var item = $(e.item.context);
    var list_id = $(e.sender.element.context).attr('id')
    var board_id = item.attr('board-id'); 
    var board = $scope.sortable.board.get(board_id)
    var task = $scope.sortable.get_task(item.attr('node-id'))
    var list = $scope.sortable.list.get(list_id)
    $scope.sortable.list.save_position(list, board, task)

   }


  $scope.sortable.list.save_position = function(list, board, task){
    var new_task_set = []
    var items = $('#'+list._id).find('li.agile-task.in-list')

    items.each(function(){
        var id = $(this).attr('id') ? $(this).attr('id') : task._id
        new_task_set.push({_id: id})
    })
    var new_tasks = []

    new_task_set.forEach(function(task, i){
      task.position = i;
      new_tasks.push({
        position: task.position,
        "node": task._id
      })
    })
    Board.update_list(list._id, board._id, { "tasks": new_tasks }).then(function(updated_list){
      $scope.sortable.init()
    }).catch(function(error){
        console.log(error)
    })
   }

  $scope.sortable.list.get_tasks = function(list){
    var tasks = $('.agile-task.'+list._id)
    return tasks
   }

  $scope.sortable.nodes_to_tasks = function(nodes){
    var tasks = [];
    nodes.forEach(function(node){
      var task = $scope.sortable.get_task(node._id)
      tasks.push(task)
    })
    return _.uniq(tasks);
   }

// Task panel
  $scope.sortable.list.open_panel = function(list){
    // !list.showTaskList ? list.showTaskList = true : list.showTaskList = false
    list.active_panel = true
   }

  $scope.sortable.list.close_panel = function (list) {
    if (list.isopen) {
      list.active_panel = false
      list.isopen = false
    }else{
      list.isopen = true 
      return
    }
   }

  $scope.sortable.list.mark_all = function(list){
    $('.agile-import-task.'+list._id ).each(function(i){
      $scope.sortable.list.stage_task( $(this).attr('id'), list, 'mark_all' )
    })  
    list.markedAll = true
   }





   // refactor add_task to add_tasks
  
  $scope.sortable.list.add_user_tasks = function(user_id, list, board){
    User.assignedNodes(user_id, $scope.project._id).then(function(nodes){
      var tasks = list.tasks;
      nodes.forEach(function(node){
        var _task = $scope.sortable.get_task(node._id)
        if (!_task.isInList) {
          tasks.push({_id: node._id})
          _task.isInList = true
          _task.list = list
        };
      })
      tasks.forEach(function(task, i){
        task.position = i;
      })

      $scope.sortable.staged_tasks = tasks
      $scope.sortable.list.add_tasks(list, board, tasks)
    })
   }





  $scope.sortable.list.unmark_all = function(list){
    list.markedAll = false
    $('.agile-import-task.'+list._id).each(function(i){
      $scope.sortable.list.unstage_task($(this).attr('id'), list)
    })  
   }

  $scope.sortable.list.filter = function(){

   }

  $scope.sortable.list.stage_task = function(id, list, mark_all){
    // if (!mark_all) list.markedAll = false;
    var task = $('.agile-import-task#'+id);
    task.addClass('active')
    $scope.sortable.staged_tasks.push( $(task).attr('id') )
   }

  $scope.sortable.list.unstage_task = function(id, list){
    list.markedAll = false;
    var task = $('#'+id);
    task.removeClass('active')

    // $scope.$apply(function(){
    //   var index = $scope.sortable.staged_tasks.indexOf(id);
    //   $scope.sortable.staged_tasks.splice(index, 1);
    // })
    var index = $scope.sortable.staged_tasks.indexOf(id);
    $scope.sortable.staged_tasks.splice(index, 1);
      console.log($scope.sortable.staged_tasks)
   }

  $scope.sortable.list.prepare_to_add = function(id, list){
    var task = $('#'+id);
    if (task.hasClass('active')) $scope.sortable.list.unstage_task(id, list) 
    else $scope.sortable.list.stage_task(id, list) 
   }

  
  $scope.sortable.list.add_tasks = function(list, board){

    $scope.sortable.staged_tasks.forEach(function(node){
      var _pos = list.tasks.length > 0 ? list.tasks.length + 1 : 0 
      list.tasks.push({node: node, position: _pos})
      var _task = $scope.sortable.get_task(node)
      _task.list = list;
      _task.isInList = true;
    })
    var new_tasks = [];
    list.tasks.forEach(function(task, i){
      task.position = i;
      new_tasks.push({
        node: task.node,
        position: task.position
      })
    })
    Board.update_list(list._id, board._id, { "tasks": new_tasks }).then(function(updated_list){
      $scope.sortable.init()
      $scope.sortable.staged_tasks = []
    }).catch(function(error){
      console.log(error)
    })

   }

  $scope.sortable.list.remove_all_tasks = function(list, board){
    list.nodes.forEach(function(node){
      node.list = false;
      node.isInList = false;
    })
    $scope.sortable.tasks.forEach(function(task){
      task.list = false
      task.isInList = false
    })
    Board.update_list(list._id, board._id, { "tasks": [] }).then(function(){
      $scope.sortable.init()
    })
   }


  $scope.sortable.get_task = function(id){
    var task;
    $scope.sortable.tasks.forEach(function(_task){
      if (_task._id == id) {
        task = _task
      };
    })
    return task
   }
  
  $rootScope.addTask = function(task, list, board){
    if (task.list) {
      $scope.sortable.task.remove(task._id, task.list, board, task, true)
    };

   $scope.sortable.task.add(task._id, list, true)
   }

  $scope.sortable.task.add = function(task, list, imported, fn){
    Board.add_to_list(task, list._id).then(function(data){
      $scope.sortable.list.unstage_task(task, list)
        if (fn) {
          fn()
        };
      $scope.sortable.init()
      Alert.success('Task added to the list');
    })
   }

  $scope.sortable.task.create = function (list, position) {
    var parentId = position == 'child' ?  $scope.sortable.active_task._id : null;
    Node.add($scope.project.id, parentId, {title: 'new task'}).then(function(node){
      list.nodes.push(node)
      var pos = list.tasks.length > 0 ? list.tasks.length + 1 : 0
      list.tasks.push({_node: node.id, position: pos })
      $scope.tasks.push(node)
      // $scope.sortable.tasks.push(node)
      Board.add_to_list(node._id, list._id).then(function(){
        node.list = list
        node.isInList = true
        setTimeout(function() {
          $scope.sortable.task.rename( '#'+node._id, node, list )
        }, 50);
      })
    })
   }

  $scope.sortable.task.delete = function (id, list, board, task) {
    Node.delete(id)
    .then(function (){
      $scope.sortable.task.remove(id, list, board, task, true) 
      $('#'+id).remove()
    })
    .catch(Alert.danger);
   }

  $scope.sortable.task.remove = function(id, list, board, task, front){
    task.list = null
    task.isInList = false
    $scope.sortable.set_active_task(task)
    $scope.sortable.active_task = {}
    // $scope.sortable.list.unstage_task(id, list)
    Board.remove_task(task._id, list._id).then(function(data){
      $scope.sortable.init()
    }).catch(function(error){
      console.log(error)
    })
   }

  $scope.sortable.task.rename = function(selector, node, list){
    var cb = function(node, name){
    return Node.update(node._id, {"title": name})
      .then(function (node_updated) {
          console.log(node_updated)
        $scope.tasks.forEach(function(task){
          if (task._id == node._id) {
            task.title = name
          };
        })
        list.nodes.forEach(function(task){
          if (task._id == node._id) {
            task.title = name
          };
        })
        $scope.sortable.init()
      }).catch(function(error){
          console.log(error)
      })
    }

    $scope.sortable.temp_call_form(selector, node, cb)
   }

  $scope.sortable.task.change_list = function(task, new_list, old_list){}

  $scope.sortable.task._selectNode = function (node, list, board) {
    $('#'+node._id+".in-list").addClass('active');
    $scope.selected_list = list ? list : null
    $scope.sortable.board = board
    $scope.selectNode(node);

   };
  
  $scope.closeSidebar = function (node, list) {
    $scope.selected_list = null
    $('.'+$scope.currentNode._id+'.agile-task.in-list').removeClass('active')
    $scope.currentNode.showForm = null;
   };

   // this api call an be avoided
  





  Project.get( $stateParams.id ).then( function (project) { 
    $scope.project = project;
    $scope.project.id = project._id;
    $scope.project.users = project._users;
    $scope.user = project._user
    Node.getList($stateParams.id).then(function (__nodes) {
      $scope.tasks = $scope.flattenNodes(__nodes)
      $scope.sortable.tasks = $scope.tasks
      $scope.sortable.init()
        console.log($scope.project)
    })
  })

  $rootScope.sortable_create_list = $scope.sortable.list.create
  $rootScope.sortable_init = $scope.sortable.init
}])

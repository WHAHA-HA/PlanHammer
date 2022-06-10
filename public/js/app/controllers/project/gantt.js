'use strict';

angular.module('App.controllers').controller('ProjectGanttController', ['$scope', '$rootScope', '$location', '$stateParams','Project', 'Node', 'User',
  function ($scope, $rootScope, $location, $stateParams, Project, Node, User) {

  $scope.taskCash = [];

  $scope.randomI = function (){

    return Math.round(Math.random() * 100)
  }



  function createGanttNode(event){
    if (event.dependency) {
      var dep_type;
      switch( event.dependency.type) {
        case  3:
            dep_type ='SS';
            break;
        case  2:
            dep_type ='FS';
            break;
        case  1:
            dep_type ='SF';
            break;
        case  0:
            dep_type ='FF';
            break;
      }

      Node.addDependency(event.dependency.successorId, event.dependency.predecessorId, dep_type)
      .catch(function(error){
          console.log(error)
      })
    }

    // if task is added
    if (!event.dependency && event.task) {
      var task = event.task;
      var parentId;
      $scope.taskCash.push({id: task.id, _id: null})
      var node = {
        title: task.title
      }
    // if parent was passed
      console.log(event.task)
      parentId = event.task.parentId ? event.task.parentId : null
      Node.add( $scope.project._id, parentId, node )
      .then(function(data){
        $scope.taskCash.forEach(function(_task){
          if (_task.id == task.id) {
            _task._id = data._id
            event.task.id = data._id
          };
        })
      })
    };
  }

  function deleteGanttTask(e){
    
    if (e.dependencies && !e.task) {
      var dep = e.dependencies[0]
      var dep_type;
      switch(dep.type) {
        case 3:
            dep_type = 'SS';
            break;
        case 2:
            dep_type = 'FS';
            break;
        case 1:
            dep_type = 'SF';
            break;
        case 0:
            dep_type = 'FF';
            break;
      }
      Node.deleteDependency(  dep.successorId, dep.predecessorId, dep_type).catch(function(error){
          console.log(error)
      })
    }else{
      var d = e.task;
      Node.delete(d.id)
    }
  }

  function updateGanttTask(e){
    $scope.taskCash.forEach(function(_task){
      if (e.task.id +1  == _task.id+1) {
        e.task._id = _task._id
      }else{
        e.task._id = e.task.id
      }
    })

    var __node = {}
    if (e.values.parentId) {
      Node.updateParent(e.task._id ? e.task._id : e.task.id , e.values.parentId)
      .then(function(data){
      })

    };
    __node.title = e.values.title ? e.values.title : e.task.title
    __node.end_date = e.values.end ? e.values.end : e.task.end  
    __node.start_date = e.values.start ? e.values.start : e.task.start 
    __node.complete = e.values.percentComplete ? e.values.percentComplete * 100 : e.task.percentComplete * 100 
    Node.update( e.task._id ? e.task._id : e.task.id , __node )
  }

  function addGanttDependency(e){

  }

  function generateKendoData(nodes){
    var kendoData = [];
    var kendoDependencyData = []

    function recursion(nodes, parentId){
      nodes.forEach(function(node){
        if (node._state && node._state.length > 0) {
          node._state.forEach(function(state){
            if (state.user == $scope.user) {
              node.isList = state.isList
              node.isListParent = state.isListParent
              node.collapsed = state.collapsed
            }
          })
        }
        //==== node dependency data
        if (node._dependency && node._dependency.length > 0) {
          node._dependency.forEach(function(dep){
            var dep_id = dep._id;
            var predecessorId = dep.node._id;
            var successorId = node._id;
            var dep_type;
            switch(dep.type) {
              case 'SS':
                  dep_type = 3;
                  break;
              case 'FS':
                  dep_type = 2;
                  break;
              case 'SF':
                  dep_type = 1;
                  break;
              case 'FF':
                  dep_type = 0;
                  break;
            }

            kendoDependencyData.push({
              id: dep_id,
              predecessorId: predecessorId,
              successorId: successorId,
              type: dep_type
            })          
          })
        };
        //==== node data
        var summary = node._nodes && node._nodes.length > 0 ? true : false
        var _parentId =  parentId ? parentId : null
        var expanded = node.collapsed ? false : true
        var percentComplete = node.complete / 100
        console.log(_parentId  )
        kendoData.push({
          id: node._id,
          parentId: _parentId,
          title: node.title,
          start: node.start_date,
          end: node.end_date,
          summary: summary,
          expanded: expanded,
          percentComplete: percentComplete,
          dependency: node.dependency,
          orderId: node.level
        })
        if (node._nodes && node._nodes.length > 0) {
          recursion(node._nodes, node._id)
        };
      })
    }
    recursion(nodes, null)
    return { kendoData: kendoData, kendoDependencyData: kendoDependencyData }
  }
  
  function appendInfoButton(node){
    // setTimeout(function() {
    //   var uid
    //    $('.k-gantt-treelist .k-grid-content tr')each(function(i, el){
    //     uid = el.data('uid')
    //     console.log(uid)
    //   })
    // }, 1000);

  }

  $scope.initGant = function(){
    Node.getList($stateParams.id)
    .then(function (nodes) {
      appendInfoButton()
      var width = window.innerWidth - 230
      var kendoNodes =  generateKendoData(nodes);
      var tasksDataSource = new kendo.data.GanttDataSource({
        schema: {
          model: {
            fields: {
              start: { from: "start", type: "date" },
              end: { from: "end", type: "date" },
              title: { from: "title", defaultValue: "", type: "string" },
              percentComplete: { from: "percentComplete", type: "number" },
              // orderId: {from: "position", type: "number"},
              parentId: {from: "parentId", type: "string", defaultValue: null, validation: { required: true }}
            }
          }
        },
        data: kendoNodes.kendoData
      })

      var dependenciesDataSource = new kendo.data.GanttDependencyDataSource({
        schema: {
            model: {
              fields: {
                  id: { from: "id", type: "number" },
                  predecessorId: { from: "predecessorId", type: "string" },
                  successorId: { from: "successorId", type: "string" },
                  type: { from: "type", type: "number" }
              }
            }
        },
        data: kendoNodes.kendoDependencyData
      });

      function onEdit(e) {
        if ($('.k-input')[0].name === 'title') {
          if (e.task.title === 'New task') {
            $('.k-input')[0].value = '';
            $('.k-input')[0].placeholder = 'New task';
          }
        }
      }

      $("#gantt").kendoGantt({
        dataSource: tasksDataSource,
          dependencies: dependenciesDataSource,
          views: [
          "day",
          { type: "week", selected: true },
          { type: "month" }
        ],
        columns: [
          { field: "title", title: "Title", editable: true, width: 70 },
          { field: "start", title: "Start Time", format: "{0:MM/dd/yyyy}", width: 70, editable: true  },
          { field: "end", title: "End Time", format: "{0:MM/dd/yyyy}", width: 70, editable: true  }
        ],
        edit: onEdit,
        height: 800,
        width: width,
        showWorkHours: false,
        showWorkDays: false,
        add: createGanttNode,
        remove: deleteGanttTask,
        save: updateGanttTask
      })



      })
      .catch(function(error){
        return;
      });
  }

  Project.get($stateParams.id)
  .then( function (project) {
    $scope.project = project;
    $scope.project.id = project._id;
    $scope.project.users = project._users;
    $scope.user = project._user;
    $scope.refreshTree();
    // ===================================================
    $scope.initGant()
  })



}])

'use strict';

angular.module('App.controllers').controller('ProjectShowCtrl', 
['$scope', '$rootScope', '$location', '$stateParams', '$timeout', '$modal', '$http', 'Project', 'Node', 'Export', 'Alert', '$compile', 'User', 'Board', 'Picker', 'Time', 'Comment',
function ($scope, $rootScope, $location, $stateParams, $timeout, $modal, $http, Project, Node, Export, Alert, $compile, User, Board, Picker, Time, Comment) {
  Alert.init($scope);
  $scope.currentNode = {};
  $scope.tree = [];
  $scope.newNode = {};
  $scope.showCreateForm = false;
  $scope.waiting_assignments = [];
  $scope.views = []
  $scope.Time = Time;
  $scope.startDateStatus = {
    opened: false
  };
  $scope.endDateStatus = {
    opened: false
  };

  $scope.get_user = function(user){
    var user = _.find($scope.project._users, function (user) { 
        console.log(user)
      return user.user._id == user
    })
    return user
  }

  $scope.flattenNodes = function (nodes){
    var _nodes = [];
    function flattenNodesRec(nodes){
      nodes.forEach(function(node){
        _nodes.push(node)
        node.isInList = false
        if (node._nodes && node._nodes.length > 0) {
          flattenNodesRec(node._nodes) 
        };
      })
    }

    flattenNodesRec(nodes)
    return _nodes;     
  };

  $scope.changeView = function(curView){
    $scope.viewType = curView;
    $rootScope.viewType = curView;

    $scope.views.forEach(function(view){
      $('.'+view.icon+'_cont').removeClass('active');
      if (view.name == curView) {
        $('.'+view.icon+'_cont').addClass('active');

        if (view.ngClick && view.ngClick.length > 0) {
          eval(view.ngClick);
        };
      };
    });
  };

  $scope.closeMenuBar = function () {
    $('.ui-menu-panel').animate({
      opacity: 0,
      left: -85
    }, 200, function(){
      $scope.has_active_sidebar = false
      // $('.container-fluid.container-1').animate({
      //   'padding-left': '15px'
      // }, 200)
    })
  };   

  $scope.openMenuBar = function () {
    if ($scope.has_active_sidebar) {
      $scope.closeMenuBar()
    }else{
      $('.ui-menu-panel').animate({
        opacity: 1,
        left: -1
      }, 200, function(){
        $scope.has_active_sidebar = true
        // $('.container-fluid.container-1').animate({
        //  'padding-left': '70px'
        // }, 200)
      })
    }

  };

  $scope.activateButt = function(){
    var loc = $location.$$path.split('/')
    $scope.views.forEach(function(view){
      if (view.active == loc[loc.length - 1]) {
        setTimeout(function() {
          $scope.changeView(view.name)
        }, 500);
      };
    })
  };
  
  $scope.activateButt();
  $scope.changeView($scope.viewType)

  // fetching project
  Project.get($stateParams.id)
  .then( function (project) {
    $scope.project = project;
    $scope.project.id = project._id;
    $scope.project.users = project._users;

    User.me().then(function (user) {
      $scope.user = user;
      $scope.refreshTree();
    });

    $scope.views = [{
      name: "Simple",
      href: "#/project/"+$scope.project.id+"/show",
      ngClick: "$scope.refreshTree()",
      icon: "icon-list",
      active: 'show',
      tooltip: 'List'
    },
    {
      name: "Detail View",
      href: "#/project/"+$scope.project.id+"/show/detailed",
      icon: "icon-tree",
      active: 'detailed',
      tooltip: 'WBS'
    },
    {
      name: "GANTT View",
      href: "#/project/"+$scope.project.id+"/show/gantt",
      // ngClick: "$rootScope.initGant()",
      icon: "icon-gantt",
      active: 'gantt',
      tooltip: 'GANTT'
    },
    {
      name: "Agile View",
      href: "#/project/"+$scope.project.id+"/show/agile",
      icon: "icon-agile",
      active: 'agile',
      tooltip: 'Agile'
    },
    {
      name: "RACI",
      href: "#/project/"+$scope.project.id+"/show/raci",
      ngClick: "$scope.refreshTree()",
      icon: "icon-raci",
      active: 'raci',
      tooltip: 'RACI'
    },      
    {
      name: "Risks",
      href: "#/project/"+$scope.project.id+"/show/risk",
      icon: "icon-risk",
      active: 'risk',
      tooltip: 'Risks'
    },
    {
      name: "Quality",
      href: "#/project/"+$scope.project.id+"/show/quality",
      icon: "icon-quality",
      acitve: 'quelity',
      tooltip: 'Quality'
    }];
    
    $scope.activateButt();
    $scope.openMenuBar();
  })
  .catch(Alert.danger);

  $scope.refreshTree = function(){
    Node.getList($stateParams.id)
    .then(function (nodes) {
      $scope.tree = nodes;
      $scope.getRaciList();
      $scope.riskList = $scope.getRiskList();
    })
    .catch(function(error){
      return;
    });
  };


  // shortcuts defining
  // add esc for form close
  $scope.keyCode = "";
  $scope.keyPressed = function(e) {
    $scope.keyCode = e.which;

    switch (e.which) {
      case 96:
        alert('New node added');
        break;
    }
  };

  $scope.exportToPDF = function () {
    if ($scope.viewType === 'Simple') {
      Export.simple('pdf', $scope.project, $scope.tree);
    } else { // Detailed
      var svg_container = d3.select('.draw-area-container');
      var svg_container_width = svg_container.style('width');
      svg_container_width = parseInt(svg_container_width.substring(0, svg_container_width.length - 2));
      var svg = d3.select('.draw-area-container').select('svg');
      var svg_width = parseInt(svg.attr('width'));
      var aspect_ratio = svg_container_width/svg_width;
      svg.select('g').attr('transform', function(d, i) {
        return 'translate(700, 50) scale(' + aspect_ratio + ')';
      });
      Export.detailed('pdf', $scope.project, $('.draw-area-container')[0].innerHTML);
    }
  };

  $scope.exportToSimpleCSV = function() {
    Export.simple('csv', $scope.project, $scope.tree);
  };

  $scope.exportToRaciCSV = function () {
    Export.simple('raci', $scope.project, $scope.raciList);
  };

  $scope.exportToSimpleXML = function() {
    Export.simple('xml', $scope.project, $scope.tree);
  };

  $scope.exportToRiskCSV = function () {
    Export.simple('risk-csv', $scope.project, $scope.riskList);
  };
  
  $scope.searchUser = User.search;

  $scope.assignToUser = function (node) {
    var user_email = node.selectedUser;
    if (!user_email) return;

    node.$waiting_update = true;

    User.assign(user_email, node._id)
    .then(function () {
      node.$waiting_update = false;
      node.$saved = true;

      $scope.getAssignedUsers(node._id);
      Alert.success('Task Assigned to ' + user_email + ' successfully');

      $timeout(function (){
        node.$saved = false;
      }, 1500);
    })
    .catch(function (error) {
      Alert.danger(error);
    });
  };

  $scope.rejectUser = function (node, email) {
    Node.reject(node._id, email)
    .then(function () {
      node.$waiting_update = false;
      node.$saved = true;

      _.each($scope.currentNode.assignedUsers, function (user, i) {
        if (user.email === email) {
          $scope.currentNode.assignedUsers.splice(i, 1);
        }
      });

      Alert.success(email + ' was rejected successfully');

      $timeout(function (){
        node.$saved = false;
      }, 1500);
    });
  };

  $scope.getAssignedUsers = function (node_id) {
    $scope.currentNode.assignedUsers = [];

    Node.get(node_id)
    .then(function (node) {
      node._shared.forEach(function (shared) {
        var data = { email: shared.user.email, registered: true };

        if ($scope.project._user !== shared.user._id) {
          $scope.currentNode.assignedUsers.push(data);
        }
      });
    });

    Node.waitingRequests(node_id)
    .then(function (assignments) {
      assignments.forEach(function (as) {
        var data = { email: as.email, registered: false };
        $scope.currentNode.assignedUsers.push(data);
      });
    });
  };

  $scope.openStartDate = function($event) {
    $event.preventDefault();
    $event.stopPropagation();

    $scope.startDateStatus.opened = true;
  };

  $scope.openEndDate = function($event) {
    $event.preventDefault();
    $event.stopPropagation();

    $scope.endDateStatus.opened = true;
  };

  //crud

  $scope.getInitForm = function(){
    $scope.showInitForm = true;
    $scope.isFirst = true;
  };

  // fix needed: form is not focused
  $scope.getForm = function( node, newNode ){
    // $scope.currentNode = node
    $scope.eTitle = "";
    node.showInput = true;  
    //tobe refactored
    $scope.formCss = {'margin-left': '0px'};
    if ( newNode ){
      $scope.newNode.isSubNode = true;
      $scope.formCss = {'margin-left': '30px'};
    } 
  };

  $scope.createNode = function( node, parent_id, cb ) {
    Node.add( $scope.project._id, parent_id, node )
    .then( function(data){
      $scope.newNode = {};
      $scope.currentNode = data;

      Node.getList($stateParams.id)
      .then(function (nodes){
        $scope.tree = nodes;
        $scope.getRaciList();

        recursiveWhere( $scope.tree, $scope.currentNode._id, function (node) {
          if ( $scope.isFirst ) {
            $scope.isFirst = false
            $scope.getForm( node, true )
          }else {
            $scope.getForm( node, false )
          }
        });
        // needs refactoring
      });
    })
  };

  $scope.addNode = function( currentNode, form, firstNode ) {
    if (!form.$valid) return;
    //Yakov
    $rootScope.changedProjects.push($scope.project.id);
    // edit title on if double click
    // to be refactored
    if (currentNode.$editing) {
      currentNode.title = form.newNodeTitle.$viewValue;
      currentNode.$editing = false;
      Node.update(currentNode._id, currentNode)
      return
    }
    $scope.cancelEdit( currentNode )
    $scope.showInitForm = false;
    $scope.newNode.title = form.newNodeTitle.$viewValue;
    if ( !currentNode  ) {
      currentNode = {}
    }

    if ( $scope.newNode.isSubNode ) {
      $scope.createNode( $scope.newNode, currentNode._id )
    } else {
      $scope.createNode( $scope.newNode, currentNode._parent )
    }
  };

  $scope.delete = function (node, cb) {
    Node.delete(node._id)
    .then(function (){
      if (cb && typeof(cb)=='function') {
        cb();
      }else{
        Node.getList($stateParams.id)
        .then( function (nodes) {
          $scope.tree = nodes;
          $scope.newNode = {};
          $scope.ntitle = '';
        })
        .catch(Alert.danger);
      }
    });
  };

  $scope.update = function (node, nodeForm) {
    if (!nodeForm.$valid) return;

    if ( $rootScope.viewType == 'detailView') {

      d3.selectAll("text#id_"+node._id)
      .text( function(d){
          if(d.title.length > 15){
            return d.title.substring(0,15)+'...'
          }
          else{
            return d.title
          }
      });
    };

    node.$status = null;
    node.$previous = null;

    node.$editing = false;
    node.$saved = false;
    node.$saving_process = true;

    var _raci = node._raci;
    var _nodes = node._nodes;
    var children = node.children; 
    var _children = node._children
    var parent = node.parent

    delete node.children;
    delete node._children;
    delete node._raci;
    delete node.parent;
    delete node._nodes;

    Node.update(node._id, node)
    .then(function (node_updated) {
      node._raci = _raci;
      node._nodes = _nodes;
      node.children = children;
      node._children = _children;
      node.parent = parent;
      $scope.setAsChanged(node);

      node.$saved = true;
      node.$saving_process = false;
      node.$waiting_update = false;

      $timeout(function (){
        node.$saved = false;
      }, 1500);
    })
    .catch(function(error){
      return;
    });
  };

  $scope.closeSidebar = function () {
    $scope.currentNode.showForm = null;
  };

  $scope.selectNode = function (node) {
      console.log(node)
    $scope.currentNode =  node;
    $scope.setAsChanged(node);
    $scope.currentNode.showForm = true;
    $scope.getAssignedUsers(node._id);

    Node.getRaci(node._id)
    .then(function (data) {
      node.resources = data.resources;
      node.racis = data.racis;
    });

    Board.all($stateParams.id)
    .then(function (boards) {
      $scope.boards = boards;
    });

    Comment.all(node._id)
    .then(function (comments) {
      $scope.comments = comments;
      $scope.calculate_upvotes();
    });

    $scope.refreshProgress($scope.currentNode);
  };

  $scope.add_to_list = function (node, list) {
    Board.add_to_list(node._id, list._id)
    .then(function () {
      Alert.success('Task added to the list');
    })
    .catch(Alert.danger);
    if ($scope.viewType == 'Agile View') {
      $rootScope.sortable_init()
    };
  };

  $rootScope.add_to_list = function (node, list) {
    Board.add_to_list(node._id, list._id)
    .then(function () {
      Alert.success('Task added to the list');
    })
    .catch(Alert.danger);
    if ($scope.view.type == agile) {

    };
  };

  $scope.selectNodeById = function (id) {
    recursiveWhere($scope.tree, id, function (node) {
      $scope.selectNode(node);
    });
  };

  $scope.cancelEdit = function (node, form) {
    if (!node) {
      $scope.showCreateForm = false;
    } else {
      node.showInput = false;
      node.$editing = false;
    }
  };

  function recursiveWhere (nodes, id, fn) {
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (node._id == id) {
        fn(node);
      } else if (node && node._nodes && node._nodes.length != 0) {
        recursiveWhere(node._nodes, id, fn);
      } 
    }
  };

  function getMatches(string, regex, index) {
    index || (index = 1);
    var matches = []
      , match;
    while (match = regex.exec(string)) {
      matches.push(match[index]);
    }
    return matches;
  };

  $scope.getPublicNumber = function (node) {
    var position_path = node.position_path
      , position = node.position
      , result;

    var regex = /,?(\d{1,})(?:#|$)/g;

    var nodeNumber = getMatches(position_path, regex);
    result = ((nodeNumber.length > 0) ? (nodeNumber.join('.') + '.') : '' ) + position;

    return (result != 'undefined') ? result : '';
  };


  $scope.collapse = function (node) {
    node.$collapsed = true;
  };

  $scope.expand = function(node){
    node.$collapsed = false
  };

  // dependencies part
  $scope.nodesByTitle = function (title) {
    return Node.nodesByTitle(title, $stateParams.id);
  };

  $scope.onSelectDependency = function (item, node) {
    if (!node.$dependency) {
      node.$dependency = item;
      return;
    }

    node.$dependency.title = item.title;
    node.$dependency._id = item._id;
  };

  $scope.addDependency = function (node) {
    node._dependency = node._dependency || [];
    node.$waiting_update = true;
    node.$saved = false;

    Node.addDependency(node._id, node.$dependency._id, node.$dependency.type)
    .then(function () {
      node._dependency.push({
        node: { _id: node.$dependency._id, title: node.$dependency.title },
        type: node.$dependency.type
      });

      node.$dependency = null;
      node.$waiting_update = false;
  
      node.$saved = true;
      $timeout(function (){
        node.$saved = false;
      }, 1500);
    })
    .catch(function (error) {
      node.$waiting_update = true;
      node.$saved = false;
      Alert.danger(error);
    });
  };

  $scope.deleteDependency = function (node, dependency) {
    node.$waiting_update = true;

    Node.deleteDependency(node._id, dependency.node._id, dependency.type)
    .then(function () {
      _.each(node._dependency, function (val, i) {
        if (val.node._id == dependency.node._id && val.type == dependency.type) {
          node._dependency.splice(i, 1);
        }
      });

      node.$waiting_update = false;
      
      node.$saved = true;
      $timeout(function (){
        node.$saved = false;
      }, 1500);
    })
    .catch(function () {
      node.$waiting_update = true;
      node.$saved = false;
    });
  };

  //RACI part
  $scope.addRaci = function (node) {
    var exists = false;

    node.$waiting_update = true;
    node.$saved = false;

    _.each(node.racis, function (raci, i) {
      if (raci.resource === node.$raci.resource && raci.role === node.$raci.role) {
        exists = true;
      }
    });

    if (exists) {
      node.$raci = null;
      node.waiting_update = false;
      Alert.danger('Already exists');
      return;
    }

    var payload = {
      project: $stateParams.id,
      node: node._id,
      resource: node.$raci.resource,
      role: node.$raci.role,
      type: 'raci_tab'
    };

    Project.addRaci(payload)
    .then(function (new_raci) {
      node.racis.push(new_raci);
      node.$raci = null;
      node.$waiting_update = false;
      
      node.$saved = true;
      $timeout(function (){
        node.$saved = false;
      }, 1500);
    })
    .catch(function () {
      node.$waiting_update = true;
      node.$saved = false;
    });
  };

  $scope.deleteRaci = function (node, raci) {
    node.$waiting_update = true;

    Project.deleteRaci($stateParams.id, raci._id)
    .then(function () {
      var target = node.resources;
      node.$waiting_update = false;

      if (raci.type == 'raci_tab') target = node.racis;

      _.each(target, function (val, i) {
        if (val._id == raci._id) target.splice(i, 1);
      });
      
      node.$saved = true;
      $timeout(function (){
        node.$saved = false;
      }, 1500);
    });
  };

  $scope.addResource = function (node) {
    if (!node || !node.$resource) return;
    
    var resource = node.$resource;
    var exists = false;

    _.each(node.resources, function (raci, i) {
      if (raci.resource == resource) {
        return exists = true;
      }
    });

    if (exists) {
      node.$resource = null;
      Alert.danger('Resource already exists');
      return;
    }

    node.$waiting_update = true;

    var payload = {
      project: $stateParams.id,
      node: node._id,
      resource: resource,
      type: 'resource'
    };

    Project.addRaci(payload)
    .then(function (new_resource) {
      node.resources.push(new_resource);
      node.$resource = null;
      node.$waiting_update = false;
      
      node.$saved = true;
      $timeout(function (){
        node.$saved = false;
      }, 1500);
    });
  };

  $scope.deleteResource = function (node, resource) {
    Project.deleteResource($stateParams.id, resource)
    .then(function () {
      $scope.getRaciList();
      node.$waiting_update = false;
      
      node.$saved = true;
      $timeout(function (){
        node.$saved = false;
      }, 1500);
    })
    .catch(Alert.danger);
  };

  $scope.getRaciList = function () {
    Project.getRaciList($stateParams.id)
    .then(function (list) {
      var resources = _.keys(_.groupBy(list, 'resource')).reverse();
      
      if ($scope.user.name) {
        $scope.userResource = $scope.user.name.first + ' ' + $scope.user.name.last;
      } else {
        $scope.userResource = $scope.user.username;
      }

      if (resources.indexOf($scope.userResource) == -1) {
        resources.unshift($scope.userResource);
      }

      list = {
        racis: list,
        tasks: $scope.getNodeList(),
        resources: resources
      };

      list.task_count = _.keys(list.tasks).length;
      $scope.raciList = list;
      $scope.contactsLength = ( (list.resources.length + 1) * 206 ) - 10;
      $scope.raciWidth = 200 * $scope.raciList.resources.length + 230
    })
    .catch(function (error) {
      //todo: think what to do here
    });
  };

  $scope.findRaci = function (resource, task) {
    var found = _.find($scope.raciList.racis, function (raci) {
      if (!raci.node) return false;
      return raci.node._id === task._id && resource === raci.resource;
    });
    
    return found || '';
  };

  $scope.updateRaciRole = function (raci, task, resource, new_role) {
    var payload = { role: new_role };

    if (raci) {
      Project.updateRaci($stateParams.id, raci._id, payload)
      .then(function () {
      })
      .catch(function () {
      });
    } else {
      payload = {
        project: $stateParams.id,
        node: task._id,
        resource: resource,
        role: new_role,
        type: 'raci_tab'
      };

      Project.addRaci(payload)
      .then(function () {
        $scope.raciList.racis.push(payload);

        $scope.raciList.racis.forEach(function ($raci, i) {
          var is_that = ($raci.resource === resource && $raci.type === 'raci_tab');
          is_that = (is_that && !$raci.node && !$raci.role);
          
          if (is_that) {
            Project.deleteRaci($stateParams.id, $raci._id);
            $scope.raciList.racis.splice(i, 1);
          }
        });
      })
      .catch(function (error) {
        console.log(error);
      })
    }
  };

  $scope.addPerson = function (person) {
    var project_id = $stateParams.id;
    var resources = $scope.raciList.resourceKeys;

    if (resources && resources.indexOf(person) !== -1) return;
    if (!person || person.length <= 0) return;

    var payload = {
      project: $stateParams.id,
      resource: person,
      type: 'raci_tab'
    };

    Project.addRaci(payload)
    .then(function (new_raci) {
      $scope.getRaciList();
      $scope.showInput = false;
      $scope.resourceName = '';
      $scope._raci.showInput = false
    })
    .catch(function (error) {
      console.log(error);
    })
  };

  $scope.getNodeList = function () {
    var list = [];

    $scope.tree.forEach(function (node) {
      list = list.concat(get_raci(node));
    });

    function get_raci(node) {
      var _list = [node];

      if (node._nodes && node._nodes.length > 0) {
        node._nodes.forEach(function (_node) {
          _list = _list.concat(get_raci(_node));
        });
      }

      return _list;
    };

    return list;
  };

  //Risk Part
  $scope.getRiskList = function () {
    var list = [];

    $scope.tree.forEach(function (node) {
      list = list.concat(get_risk(node));
    });

    function get_risk(node) {
      var _list = node.risks || [];

      _list.forEach(function (risk) {
        risk.score = risk.probability * risk.impact;
        risk.task = {
          title: node.title
        };
      });

      if (node._nodes && node._nodes.length > 0) {
        node._nodes.forEach(function (_node) {
          _list = _list.concat(get_risk(_node));
        });
      }

      return _list;
    }

    return list;
  };

  $scope.showRiskModal = function (risk) {
    $scope.currentRisk = risk;

    var modalInstance = $modal.open({
      templateUrl: 'showRiskModal.html',
      controller: 'ProjectRiskController',
      windowClass: 'show-risk-modal',
      size: 'lg',
      resolve: {
        risk: function () {
          return risk;
        }
      }
    });
  };

  $scope.newRiskModal = function (risk) {
    $scope.currentRisk = risk;

    $rootScope.modalInstance = $modal.open({
      templateUrl: 'newRiskModal.html',
      controller: 'ProjectShowCtrl'
    });
  };

  $scope.close = function () {
    $rootScope.modalInstance.close();
  };

  $scope.findNodeById = function (id, done) {
    // debugger;
    function recursiveWhere (nodes, id) {
      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if (node._id == id) {
          return done(node);
        } else if (node && node._nodes && node._nodes.length != 0) {
           recursiveWhere(node._nodes, id);
        } 
      }
    };

    recursiveWhere($scope.tree, id);
  };

  $scope.nodeSelected = function ($item) {
    $scope.currentNode.node_id = $item._id;
  };

  //Risk part
  $scope.addRisk = function (node, form) {
    var node_id = node._id || node.node_id;
    if (!form.$valid || !node_id) return;

    node.$waiting_update = true;
    node.$saved = false;

    Node.addRisk(node_id, node.$risk)
    .then(function (risk) {
      $scope.findNodeById(node_id, function (node) {
        node.risks.push(risk);
      });
      $scope.riskList = $scope.getRiskList();

      $scope.currentNode = {};

      node.$risk = null;
      node.$waiting_update = false;
      
      node.$saved = true;
      $timeout(function (){
        node.$saved = false;
      }, 1500);
    })
    .catch(function () {
      node.$waiting_update = true;
      node.$saved = false;
    });
  };

  $scope.deleteRisk = function (node, risk) {
    node.$waiting_update = true;

    Node.deleteRisk(node._id, risk._id)
    .then(function () {
      _.each(node.risks, function (val, i) {
        if (val._id === risk._id) {
          node.risks.splice(i, 1);
        }
      });

      node.$waiting_update = false;
      node.$saved = true;

      $timeout(function (){
        node.$saved = false;
      }, 1500);
    })
    .catch(function () {
      node.$waiting_update = true;
      node.$saved = false;
    });
  };

  $scope.updateQualityText = function(node, quality) {
    quality.editMode = false;
    Node.updateQualityText(node._id, quality._id, quality.text)
      .then(function(data) {
        $scope.refreshProgress(node);
      })
      .catch(function(error) {
        console.log(error);
      });
  };

  $scope.addQuality = function (node) {
    var payload = {
      text: node.$qualityText,
      completed: false
    };
    var allow = (!payload.text || payload.text.length === 0) ? false : true;

    node._quality.forEach(function (quality) {
      if (quality.text === payload.text) allow = false;
    });

    if (!allow) return;

    Node.addQuality(node._id, payload)
    .then(function (data) {
      node._quality = data._quality;
      node.$qualityText = null;

      $scope.refreshProgress(node);
    })
    .catch(function (error) {
      console.log(error);
    });
  };

  $scope.updateQuality = function (node, quality) {
    Node.updateQuality(node._id, quality._id, quality.completed)
    .then(function (data) {
      node._quality = data._quality;

      $scope.refreshProgress(node);
    })
    .catch(function (error) {
      console.error(error);
    });
  };

  $scope.deleteQuality = function (node, quality) {
    Node.deleteQuality(node._id, quality._id)
    .then(function (updated_node) {
      node._quality.forEach(function (q, i) {
        if (q._id == quality._id) node._quality.splice(i, 1);
      });

      $scope.refreshProgress(node);
    })
    .catch(function (error) {
      console.error(error);
    });
  };    

  $scope.qualityProgress = function (node) {
    if (!node._quality || !node._quality.length) return;

    var all = node._quality.length;
    var completed = 0, percent = 0;

    node._quality.forEach(function (quality) {
      if (quality.completed) completed += 1;
    });
    percent = Math.round((completed * 100) / all);

    return percent
  };

  $scope.refreshProgress = function (node) {
    var old_progress = node.complete;

    if($scope.project.settings.use_quality) {
      node.complete = $scope.qualityProgress(node);

      if(old_progress != node.complete) {
        $scope.update(node, { $valid: true });
      }
    }
  };

  $scope.addFromDropbox = function () {
    var options = {
      success: function(files) {
        var file = files[0];
        var payload = {
          from: 'dropbox',
          bytes: file.bytes,
          link: file.link,
          name: file.name,
          added_at: new Date()
        };

        Node.addFile($scope.currentNode._id, payload)
        .then(function () {
          $scope.currentNode._files.push(payload);
        })
        .catch(function (error) {
          console.log('unable to add file: ' + error);
        });
      },
      linkType: "preview"
    };

    Dropbox.choose(options);
  };

  $scope.addFromGoogle = function () {
    Picker.google($('.google'), function (files) {
      var file = files[0];
      var payload = {
        from: 'google',
        link: file.url,
        name: file.name,
        added_at: new Date()
      };

      Node.addFile($scope.currentNode._id, payload)
      .then(function () {
        $scope.currentNode._files.push(payload);
      })
      .catch(function (error) {
        console.log('unable to add file: ' + error);
      });
    });
  };

  $timeout($scope.addFromGoogle, 10);

  $scope.deleteFile = function (file) {
    var node_id = $scope.currentNode._id;
    var files = $scope.currentNode._files;

    Node.deleteFile(node_id, file._id)
    .then(function () {
      files.forEach(function (f, i){
        if (f._id === file._id) files.splice(i, 1);
      });
    });
  };

  $scope.hasNodes = function(data) {
    return (data._nodes.length > 0);
  };

  $scope.isNew = function (data) {
    return data.$new;
  };
  // should be hh:mm:ss instead of just hours
  $scope.getTimeValueInHours = function (timeObj) {
    if (timeObj.type === 'minutes') {
      return timeObj.value / 60;
    } else if (timeObj.type === 'hours') {
      return timeObj.value;
    } else if (timeObj.type === 'days') {
      return timeObj.value * 24;
    } else if (timeObj.type === 'weeks') {
      return timeObj.value * 7 * 24;
    } else if (timeObj.type === 'months') {
      return timeObj.value * 31 * 24;
    }
  };

  //why add 4 ?
  $scope.getExpectedTime = function(node) {
    if (node.optimisticTime.type === node.mostLikelyTime.type && node.mostLikelyTime.type === node.pessimisticTime.type) {
      node.expectedTime = {'value': parseFloat(((node.optimisticTime.value + 4 * node.mostLikelyTime.value +
        node.pessimisticTime.value) / 6).toFixed(0)), 'type': node.optimisticTime.type};
    } else {
      node.expectedTime = {'value': parseFloat((($scope.getTimeValueInHours(node.optimisticTime) + 4 * $scope.getTimeValueInHours(node.mostLikelyTime) +
        $scope.getTimeValueInHours(node.pessimisticTime)) / 6).toFixed(0)), 'type': 'hours'};
    }
  };
  //  theres gotto be bug here !!!
  $scope.getSumofDuration = function(node) {
    function getSumofDurationforNode(node_el) {
      if (node_el._nodes.length === 0) {
        return $scope.getTimeValueInHours(node_el.duration);
      } else {
        var sum_value = 0;
        for (var i=0; i<node_el._nodes.length; i++) {
          sum_value += getSumofDurationforNode(node_el._nodes[i]);
        }
        sum_value += $scope.getTimeValueInHours(node_el.duration);
        return sum_value;
      }
    }
    node.sumofDuration = {'value': parseFloat(getSumofDurationforNode(node).toFixed(0)), 'type': 'hours'};
  };

  // same bug here
  $scope.getSumofExpectedTime = function(node) {
    function getSumofExpectedTimeforNode(node_el) {
      $scope.getExpectedTime(node_el);
      
      if (node_el._nodes && node_el._nodes.length === 0) {
        return $scope.getTimeValueInHours(node_el.expectedTime);
      } else {
        var sum_value = 0;
      
        for (var i=0; i<node_el._nodes.length; i++) {
          sum_value += getSumofExpectedTimeforNode(node_el._nodes[i]);
        }
      
        sum_value += $scope.getTimeValueInHours(node_el.expectedTime);
        return sum_value;
      }
    };

    node.sumofExpectedTime = {'value': parseFloat(getSumofExpectedTimeforNode(node).toFixed(0)), 'type': 'hours'};
  };
  // same bugs here ( undefined value problem. )
  $scope.getSumofCost = function(node) {
    function getSumofCostforNode(node_el) {
      if (node_el._nodes.length === 0) {
        return node_el.cost;
      } else {
        var sum_value = 0;
        for (var i=0; i<node_el._nodes.length; i++) {
          sum_value += getSumofCostforNode(node_el._nodes[i]);
        }
        sum_value += node_el.cost;
        return sum_value;
      }
    };
    
    if (node && getSumofCostforNode(node)) {
      node.sumofCost = {
        'value': parseFloat(getSumofCostforNode(node).toFixed(0)),
        'type': ''
      };
    }
  };

  $scope.sumOfSubtaskCosts = function (node) {
    var total = 0;
    
    if (!node._nodes) return total;
    
    node._nodes.forEach(function ($node) {
      total += $node.cost;
    });

    return total;
  };

  $scope.sumOfChildrenDuration = function (node) {
    var total = 0;
    
    if (!node._nodes) return total;

    node._nodes.forEach(function ($node) {
      total += $scope.getTimeValueInHours($node.duration);
    });

    return total;
  };

  // omg goin here!!! funtions and triggers needs ref
  $scope.setAsChanged = function (node) {
      console.log('set as changed')
    // node.$waiting_update = true;
    $scope.getExpectedTime(node);
    $scope.getSumofDuration(node);
    $scope.getSumofExpectedTime(node);
    $scope.getSumofCost(node);
  }

  // Calendar options
  $scope.today = function() {
    $scope.dt = new Date();
    $scope.dts = new Date();
  };

  $scope.today();
  $scope.showWeeks = true;

  $scope.toggleWeeks = function () {
    $scope.showWeeks = ! $scope.showWeeks;
  };

  //its very general name should be different one like clearDt or something
  $scope.clear = function () {
    $scope.dt = null;
  };
  
  // Disable weekend selection
  $scope.disabled = function(date, mode) {
    return ( mode === 'day' && ( date.getDay() === 0 || date.getDay() === 6 ) );
  };
  // $scope.toggleMin = function() {
    // $scope.minDate = ( $scope.minDate ) ? null : new Date();
  // };
  // $scope.toggleMin();
  $scope.dateOptions = {
    'year-format': "'yy'",
    'starting-day': 1,
    'show-weeks': false,
    showWeekNumbers: false
  };

  // getting user by email
  $scope.usersByEmail = User.searchByEmail;

  // getting node by title
  $scope.nodeByTitle = function (title) {
    var payload = {
      q: title,
      project: $stateParams.id
    };

    return $http.post('/api/node/searchByTitle', payload).then(function (response) {
      return response.data;
    });
  };

  // on adding user
  $scope.onSelectUser = function ($item, currentNode) {
    if (!_.isArray(currentNode.resources)) currentNode.resources = [];

    currentNode.resources.push($item.user);
    currentNode.resource = '';
  };

  $scope.editTitle = function(data){
    data.$editing = true;
    $('.edit-in-place').focus();
    data.$previous = data.title;
  };

  // bind type ti scope
  $scope.setDurationType = function (node, type) {
    node.duration.type = type;
  };

  $scope.invite = function (node) {
    var modalInstance = $modal.open({
      templateUrl: 'inviteModal.html',
      controller: 'ProjectInviteController',
      resolve: {
        node: function () {
          return node;
        }
      }
    });
  };  

  $scope._raci = {};
  $scope._raci.showInput = false;
  $scope._raci.showRaciInput = false;

  $scope.showRaciInput = function(){
    $scope._raci.showInput=true; 
    $scope._raci.showRaciInput=true;
    $scope.resourceName = "";
  };

  $scope.cancelRaciAdd = function(){
    $timeout(function(){
      $scope._raci.showInput  = false;
      $scope._raci.showRaciInput = false;  
    },200);
  };

  $scope.stashButton = function(button){
    $scope.raciButton = button.target;
  };

  $scope.setRaciRole = function(role, color){
    $scope.raciButton.innerHTML = role + "<span class='caret'></span>";
    $scope.raciButton.style.backgroundColor = color;
    $scope.new_role = role.toLowerCase();
    $scope.raciButton.className = 'btn btn-primary dropdown-toggle raciButton' + ' ' + role.toLowerCase();
  };

  $scope.setRaciRole = function(role, color){
    $scope.raciButton.innerHTML = role + "<span class='caret'></span>";
    $scope.raciButton.style.backgroundColor = color;
    $scope.new_role = role.toLowerCase();
    $scope.raciButton.className = 'btn btn-primary dropdown-toggle raciButton' + ' ' + role.toLowerCase();
  };

  // Comments
  $scope.add_comment = function (text, node, parent, comments) {
    var payload = {
      text: text,
      level: parent ? parent.level + 1 : 0,
      node: node._id,
      parent: parent ? parent._id : null,
      created_at: new Date()
    };

    if (!text) return;

    Comment.add(payload)
    .then(function (doc) {
      doc.children = [''];
      
      
      if (parent) {
        parent.show_reply = false;
        parent.children.push(doc);
      }
      if (!parent) $scope.comments.push(doc);
    })
    .catch(Alert.danger)
  };

  $scope.show_reply = function (comment) {
    comment.show_reply = !comment.show_reply;
    Comment.traverse($scope.comments, function ($comment) {
      if (comment._id !== $comment._id) $comment.show_reply = false;
    });
  };

  $scope.remove_comment = function (comment, parent) {
    Comment.remove(comment._id)
    .then(function () {
      var comments = parent.children || parent;

      comments.forEach(function (c, i) {
        if (c._id === comment._id) {
          comments.splice(i, 1);
        }
      });
    })
    .catch(Alert.danger);
  };

  $scope.edit_comment = function (comment) {
    var payload = { text: comment.text };

    Comment.update(comment._id, payload)
    .then(function () {
      comment.editing = false;
    })
    .catch(Alert.danger);
  };

  $scope.upvote = function (comment) {
    var payload = { upvote: comment.upvote ? -1 : 1 };

    Comment.update(comment._id, payload)
    .then(function () {
      comment.upvote = !comment.upvote;
      
      if (payload.upvote === 1) {
        comment.upvotes.push($scope.user._id);
      } else {
        var index = comment.upvotes.indexOf($scope.user._id);
        comment.upvotes.splice(index, 1);
      }

      comment.upvotes_count = comment.upvotes.length;
    })
    .catch(Alert.danger);
  };

  $scope.calculate_upvotes = function () {
    var user = $scope.user._id.toString();

    Comment.traverse($scope.comments, function (comment) {
      if (comment && comment._id) {
        var index = comment.upvotes.indexOf(user);
        comment.upvote = (index == -1) ? false : true;
      }
    });
  };

  $scope.sort = {};
  $scope.sort.board;
  $scope.sort = {};
  $scope.sort.list;
  $scope.sortable_board_title_form = false;
  $scope.sort.sortable_new_board_name;
  $scope.sortable_list_title_form = false;
  $scope.sort.sortable_new_list_name;


  $scope.sortable_create_board = function(board){
    var name = $scope.sort.sortable_new_board_name;
    if (!name || name==' ') {
      name = 'new board'
    };
    if ( $rootScope.sortable_create_board ) {
      $rootScope.sortable_create_board (name)
      $scope.sort.sortable_new_board_name  = '';
      $scope.sortable_board_hide_form();
    }else{
      var project_id = $scope.project.id;
      Board.create(name, project_id)
      .then(function (board) {
        $scope.sort.sortable_new_board_name  = '';
        $scope.sortable_board_hide_form();
        $scope.sort.board = board
        $scope.boards.push(board)
      })
      .catch(Alert.danger);
    }
  }

  $rootScope.$on("node_form_board_created", function (event, board) {
    $scope.sortable_board_hide_form();
    $scope.sort.board = board
    $scope.boards.push(board)
  });

  $rootScope.$on("node_form_list_created", function (event, list) {
    $scope.sortable_switch_list_form();
    $scope.sort.board.lists.push(list);
  });

  $scope.sortable_board_hide_form = function(){
    $scope.sortable_board_title_form = false
  }

  $scope.show_board_form = function(){
    if ($scope.sortable_board_title_form ) {
      $scope.sortable_board_title_form = false
    }else{
      $scope.sortable_board_title_form = true
    }
  }

  $scope.sortable_create_list = function(board){

    var name = $scope.sort.sortable_new_list_name;
    if (!name || name==' ') name = 'new list';
    $rootScope.sortable_create_list(name, board, function(){})
  }

  $scope.sortable_switch_board_form = function(){
    $scope.sortable_board_title_form = !$scope.sortable_board_title_form
  }

  $scope.sortable_switch_list_form = function(){
    if (!$scope.sort.board) {
      $scope.sort.error = "Please, select a board first";
      $timeout(function() {
        $scope.sort.error = false;
      }, 3000);
      return
    };
    $scope.sort.sortable_list_title_form = !$scope.sort.sortable_list_title_form
  }



}]);


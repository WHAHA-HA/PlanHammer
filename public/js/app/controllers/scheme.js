angular.module('App.controllers')
.controller('schemeController', ['$scope', '$rootScope', '$location', '$stateParams', 'Project', 'Node', '$timeout', 'Scheme','$rootScope', '$modal',
function ($scope, $rootScope, $location, $stateParams, Project, Node, $timeout, schemeService, $rootScope, $modal) {

$scope.restr = false;

$rootScope.viewType = 'Detail View';

$scope.task = {}

var margin = {top: 60, right: 20, bottom: 40, left: 20},
    width = 100 - margin.right - margin.left,
    height = 1000 - margin.top - margin.bottom,
    rectW = 140, 
    rectH = 40,
    rectHW = rectW / 2, 
    rectHH = rectH / 2,
    arrowW = 20, 
    arrowH = 20,
    svgSize,
    clickedOnce = false, 
    timer, 
    inputDom = null,
    svg,
    i = 0,
    j = 0,
    duration = 750,
    lastTransform = 0, 
    transformFinal = 0,
    maxId = 0,
    root,
    tree,
    diagonal = d3.svg.diagonal(),
    line     = d3.svg.line(),
    body = d3.select('#body'),
    bodyDom = document.getElementById('body'),
    buttonBottom = addNode('bottom'),
    buttonTop = addNode('top'),
    buttonLeft = addNode('left'),
    buttonRight = addNode('right'),
    leftEdge = 0, 
    rightEdge = 0,
    zoomed, 
    bottomEdge = 0;

$scope.dv_selectNode = function(d){

    $scope.selectNode(d);
 }

$rootScope.delete_dv_task = function(d){
  deleteNode(d)
 }

$scope.showDeleteModal = function (node) {
    $scope.task._id = node
    var modalInstance = $modal.open({
    templateUrl: 'deleteModal.html',
    controller: 'schemeDeleteController',
    resolve: {
      node: function () {
        return node;
      }
    }
  });
 }; 

function updateState(d, state){
  var node_data = {}
  if (d.isGhost) return;
  node_data.state = state;
  if (d._state && d._state.length > 0) {
    d._state.forEach(function(state){
      if (state.user == $scope.user) {
        node_data.state._id = state._id;
      };
    })
  };

  node_data.state.user = $scope.user;
  node_data.title = d.title;

  Node.update( d._id, node_data )
 }

function clickListener(d) {
  if (d._id == $scope.project._id) return;
  var state = {}
  if (d.children) {
    d._children = d.children;
    d.children = null;
    restrictViewChange(d)
    state.collapsed = true
    state.isList = d.isList;
    state.isListParent = d.isListParent;
    updateState(d,state)
    update(d);
  } else {
    state.collapsed = false
    state.isList = d.isList;
    state.isListParent = d.isListParent;
    updateState(d,state)
    d.children = d._children;
    d._children = null;
    restrictViewChange(d)
    // update(d);
    if (d.isList) {
      updateToList(d)
    };
    update(d);
  }
 }

function doubleClickListener(d) {
    $('#newTaskForm').remove(); 
    if (d._id == $scope.project._id) return;
    var parent = d3.select('#id_' + d._id)
    var svgg = document.getElementById('id_' + d._id)
    input  = document.createElement('input')
    var  svgTransform = svg.attr("transform").match(/translate\(([-+]?[0-9\.\s]*),([-+]?[0-9\.\s]*)\)/) ? svg.attr("transform").match(/translate\(([-+]?[0-9\.\s]*),([-+]?[0-9\.\s]*)\)/) : svg.attr("transform").match(/translate\(([-+]?[0-9\.\s]*)\s([-+]?[0-9\.\s]*)\)/),
      translate = parent.attr('transform').match(/translate\(([-+]?[0-9\.\s]*),([-+]?[0-9\.\s]*)\)/) ? parent.attr('transform').match(/translate\(([-+]?[0-9\.\s]*),([-+]?[0-9\.\s]*)\)/) : parent.attr('transform').match(/translate\(([-+]?[0-9\.\s]*)\s([-+]?[0-9\.\s]*)\)/), 
      scale = svg.attr("transform").match('scale\\((.*)\\)$') ? svg.attr("transform").match('scale\\((.*)\\)$')[1] : null ,
      left, 
      top;
    if (scale && scale < 1) return
    top  = +svgTransform[2] + +translate[2] - rectHH;
    left = (Math.abs(+svgTransform[1])) + +translate[1] - rectHW ;
    input.style.cssText =
      'left: ' + left + 'px;' +
      'top: ' + top + 'px;' +
      'width: ' + rectW + 'px;' +
      'height: ' + rectH + 'px;' +
      'position: absolute;';
    input.id = 'newTaskForm'
    input.placeholder = d.title;
    bodyDom.appendChild(input);
    inputDom = input;
    input.focus()

    $(input).on('keyup', function (e) {
      if (e.keyCode == 13 || e.keyCode == 27) {
        this.save()
      }
    }).on('blur', function(){
      // bodyDom.removeChild(inputDom);
      this.save()
    })



    inputDom.save = function() {
      var input = this;
      if (input.value.length == 0) input.value = d.title
      var id = d.id, name = input.value, __node = {}
      __node.title =  input.value
      bodyDom.removeChild(inputDom);
      Node.update( d._id, __node )
      .then(function (node_updated) {
          d.title = input.value;
          d3.select("text#id_"+node_updated._id)
          .attr('text', function(d){
              if (d==root) d.title = d.name
              if(d.title.length > 15){
               input.value=""
               return name.substring(0,15)+'...'
              }
              else{
                input.value=""
                return name
              }
          });
      })
   

      d3.selectAll('text#id_'+d._id)
      .text(function (d) {
        if (d == root) d.title = d.name
        if(d.title.length > 15){
           return name.substring(0,15)+'...';
         }else{
             return name;                       
        }
      })
    };
    d3.event && d3.event.stopPropagation();
   }

function removeForm(inputDom) {
    bodyDom.removeChild(inputDom);
 }

function elbow(d, i) {
  if (d.target.isGhost) d.target = d.target.parent;
  if (d.target.isList) {
    var m = "M" + ( d.source.x - 50 ) + "," + d.source.y + "V" + d.target.y + "H" + d.target.x;
    return m
  }else{
    return "M" + d.source.x + " " + d.source.y  + "V" + (d.source.y + 40) + "H" + d.target.x  + "V" + d.target.y;
  }
 }

function collapse(d) {
  if (d.children && d.collapsed) {
    d._children = d.children;
    d.children = null;
    d._children.forEach(collapse);
  }
  if (d.children) {
    d.children.forEach(collapse);
  }
 }

function recursiveWalk(d, fn){
  if (d.children && d.children.length > 0) {
    d.children.forEach(function(d){
      fn(d)
      if (d.children && d.children.length > 0) {
        recursiveWalk(d, fn)
      };
    })
  };
 }

function getDepth(root){
  var depth = 1
  recursiveWalk(root, function(root){
    if (root.depth > depth) {
      depth = root.depth
    }
  })
  return depth
 }

function getParents(root, parents){
  if (root.children ) {
    root.children.forEach(function(d){
      if (d.isListParent) {
        parents.push(d)
      };
      if (d.children) {
        getParents(d, parents)
      }
    })
  }
  return parents
 }

function calculateLvling(root, i){
  if (root.children) {
    root.children.forEach(function(d){
      i++
      d.lvling = i
      if (d.children) {
        calculateLvling(d, i)
      }
    })
  };
  return i;   
 }  

function calculateListX(d){

  var normalCase = d.parent ? d.parent.x + 20 * 2 : d.x0;
  var ghostCase = d.parent ? d.parent.x : d.x;

  return d.isGhost ? ghostCase : normalCase
 }

function calculateListY(d, i){
  if (d.isGhost) {
    d.lvling = d.lvling + 1
  };
  var normalCase = d.parent ? d.parent.y + ( ( 50 ) * ( d.lvling ) ): null;
  var ghostCase = d.parent ? d.parent.y + 50 : d.y;

  return d.isGhost ? ghostCase : normalCase
 }

function restrictViewChange(d){
  var actionArrows = svg.selectAll('.viewButton#icon_id_'+d._id)
  if (!d.children || d.isList) {
    actionArrows.attr('visibility', function (d) {
      var vis = 'hidden'
      return d == root ? 'hidden' : vis
    })
  }else{
     actionArrows.attr('visibility', function (d) {
      var vis = d.children && !d.isList ? 'visible' : 'hidden'
      return d == root ? 'hidden' : vis
    })
  }
  if (d.children) {
    d.children.forEach(function(d){
      restrictViewChange(d)
    })
  }
 }

function updateToNodes(d){
  

  function updateToNodesRec(d){
  if (d.isGhost) return;
    d.isListParent = false
    d.isList = false

    var state = {}
    state = {
      user: $scope.user,
      isListParent: false,
      isList: false
    }

    updateState(d, state)

    d.children.forEach(function(d){
      d.isList = false
      var childState = {
        user: $scope.user,
        isList : false
      }
      updateState(d, childState)
      if (d.children) {
        updateToNodesRec(d)
      };
    })
  }
  updateToNodesRec(d)
  update(d)
 }

function updateToList(d){
  // d3.selectAll('g.ghost').remove();

  function updateToListRec(d){
  if (d.isGhost) return;
    d.isListParent = true
    if (d.parent && ( d.parent.isList || d.parent.isListParent ) ) d.isList = true;
    var state = {}
    state = {
      user: $scope.user,
      isListParent: true,
      isList: d.isList
    }
    if (d.isGhost) return
    updateState(d, state)
    if (d.children) {
      d.children.forEach(function(d){
        if (d.isGhost) return
        var listParent = d.children ? true : false;
        d.isList = true;
        var childState = {
          user: $scope.user,
          isList : true,
          isListParent: listParent
        }
        updateState(d, childState)
        if (d.children) {
          updateToListRec(d);
        };
      })
    };
  }  
  updateToListRec(d)
  
  update(d)
 }

function findNode (nodes, id, fn) {
  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    if (node.id == id) {
      fn(node);
    } else if (node && node.children && node.children.length != 0) {
      findNode(node.children, id, fn);
    } 
  }
 }

function addNode(side) {
  // if ($scope.restr) return
  return function (d) {
    if (d3.event) d3.event.stopPropagation();
    var newNode = { title : "new task" };
    var parentId = d._id;

    if ($scope.project.id == d._id) {
      parentId = null
    };

    if (side === 'bottom') {
      Node.add( $scope.project.id, parentId, newNode )
        .then( function(data){
          if(newNode.isList){ 
            data.isList = true
          }
          newNode = data;
          if (d.isListParent || d.isList) {
            newNode._id = data._id
            newNode.isList = true;
            newNode.parent = d
            d.isListParent = true
            updateState(newNode, {isList: true})
            updateState(d, {isListParent: true, isList: d.isList })
          }
          var children = d.children || d._children;
          if (children) {
            children.push(newNode);
          } else {
            d.children = [ newNode ];
          }
          if (!d.children && d._children) {
            d.children = d._children;
            d._children = null;
          }
          $scope.tree = root.children
          restrictViewChange(d)
          update(d, newNode._id);
        })  
      }
    else if (side === 'right') {
      if (d.parent._id == $scope.project.id) {
        parentId = null  
      }else{
        parentId = d.parent._id
      }
      Node.add( $scope.project.id, parentId, newNode )
        .then( function(data){
          newNode = data
          if (d.isList) {
            newNode.isList = true;
            updateState(newNode, {isList: true})
          }
          var insertIndex = d.parent.children.indexOf(d);
          d.parent.children.splice(insertIndex + 1, 0, newNode);
          restrictViewChange(d)
          update(root, newNode._id);
      })
    } else if (side === 'left') {
      if (d.parent._id == $scope.project.id) {
        parentId = null  
      }else{
        parentId = d.parent._id
      }

      Node.add( $scope.project.id, parentId, newNode )
        .then( function(data){
          newNode = data
          newNode._id = data._id;
          Node.changePosition(data._id, d.position)
          var insertIndex = d.parent.children.indexOf(d);
          d.parent.children.splice(insertIndex, 0, newNode);
          restrictViewChange(d)
          update(root, newNode._id);
      }).catch(function(error){
        console.log(error)
      })
    } 

    else if (side === 'top') {
      if (d.parent._id == $scope.project.id) {
        parentId = null  
      }else{
        parentId = d.parent._id
      }
      Node.add( $scope.project.id, parentId, newNode ).then( function(data){ 
        newNode = data
        newNode._id = data._id;
        Node.updateParent(d._id, data._id).then(function(){
          var myIndex = d.parent.children.indexOf(d);
          d.parent.children[myIndex] = newNode;
          newNode.children = [ d ];
          if (d.isListParent || d.isList) {
            newNode.isList = d.isList;
            newNode.isListParent = d.isList;
            updateState(newNode, {isListParent: d.isList, isList: d.isList })
          }
          restrictViewChange(d)
          update(root, newNode._id); 
        })
      })
    }
  }
 }

function deleteNode(d, root) {
  var parent = d.parent;
  Node.delete(d._id)
  .then(function (){
    parent.children = parent.children.filter(function (elm) {
      return elm.id != d.id;
    });
    update(parent)
  })
 }

function _nodesToChildren ( node ) {
  if (node._state && node._state.length > 0) {
    node._state.forEach(function(state){
      if (state.user == $scope.user) {
        node.isList = state.isList
        node.isListParent = state.isListParent
        node.collapsed = state.collapsed
      }
    })
  }
  node.children = node._nodes && node._nodes.length > 0 ? node._nodes : null;
  if (node._nodes) {
    for ( var i = 0; i < node._nodes.length; i++ ) {
      _nodesToChildren ( node._nodes[i] )
    }
  }
 }
    
function click(d) {

  var argsArray = Array.prototype.slice.call(arguments);

  if (clickedOnce) {
    clearTimeout(timer);
    clickedOnce = false;

    doubleClickListener.apply(this, argsArray);
  } else {
    timer = setTimeout(function () {
      clickListener.apply(this, argsArray);
      clickedOnce = false;
    }, 220);

    clickedOnce = true;
  }
 }

function calculateSVGSize(nodes) {

  var leftEdge = 0;
  var rightEdge = 0;
  var bottomEdge = 0;
  var rectW = 140;
  var rectHW = rectW / 2;
  var width = 0;
  var height = 0;

  nodes.forEach(function(d){
    leftEdge   = d.x < leftEdge ? d.x : leftEdge;
    rightEdge  = d.x + rectW > rightEdge ? d.x + rectHW : rightEdge;
    bottomEdge = d.y > bottomEdge ? d.y : bottomEdge;
  })

  width = Math.abs(leftEdge) + rectHW + rightEdge
  var svgSize = {"width": width + 400, "height": bottomEdge};

  return svgSize
 }

function findBridges(node, previousNode, pairs){
  if (pairs.length != 0) {
    pairs.forEach(function(pair){
      if (node.parent == pair.previousNode) {
        node.bridge = "bridge"
        previousNode.bridge = "bridge"
      }
    })
  }
  pairs.push({'node':node, 'previousNode': previousNode})
 }

function updateSVGSize(width, heigh) {

  d3.select('svg')
    .attr('width',  width + 40)
    .attr('height', heigh + 40);
 }

function zoom() {
  // zoomed set to true to prevent collapse on click
  zoomed = true
  svg.attr("transform", "translate(" + [d3.event.translate[0],d3.event.translate[1] + margin.top]  + ")scale(" + d3.event.scale + ")");
  setTimeout(function(){
    zoomed = false
  },1000)
 }

function distinct(arr){
  var str = []
  arr.forEach(function(item){
    str.push(JSON.stringify(item))
  })
  return _.uniq(str)
 }

function _getDepth(node){
  var depth = 0
  function _getDepthRec(node){
    if (node.children && node.children.length > 0) {
      if (node.lelving > depth) {
        depth.node.leveling
        _getDepthRec(node.children)
      };
    }
  }
  _getDepthRec(node)
  return depth
 }

function cleanGhosts(root){
  recursiveWalk(root, function(node){
    if (node.isGhost) {
      var parent;
      recursiveWalk(root, function(_node){
        if (_node._id == node.parent._id) {
          parent = _node
          parent.children = parent.children.filter(function (elm) {
            return elm._id != node._id;
          });
        };
      })
    }; 
  })
  return root
 }

function findColumnIntersection(list, notList, _interSections){
  if ( (list.isGhost && notList.isGhost)
    || !list.parent
    || ( !notList.parent && !notList.line )
    || list.isGhost
    || notList.isGhost 
    || !list 
    || !notList 
    || notList.parent == list.parent 
    || notList == list.parent 
    || list == notList.parent 
    || list._id == notList._id 
    || list == root 
    || notList == root 
    || ( !list.isList && !notList.isList )
     ){
    return ;
  }  
    list.left = list.x;
    list.right = list.x + 150;
    notList.left = notList.line ? notList.left : notList.x;
    notList.right = notList.line ? notList.right : notList.x + 150;
    list.top = list.y - 20 
    list.bottom =  list.y + 20; 
    notList.top = notList.line ? notList.top : notList.y - 20
    notList.bottom = notList.line ? notList.bottom : notList.y + 20; 

  if ( list && notList && list.left <= notList.right && notList.left <= list.right && list.top <= notList.bottom &&  notList.top <= list.bottom ) {
    var list = notList.isList ? notList : list
    var listTitle = notList.isList ? notList.title : list.title
    var box = notList.isList ? list : notList
    var depth = box.depth - list.depth
    if (list) _interSections.push({ node: list, depth: depth, title: listTitle });

  }

 }

function compareNodes(nodes, links){
  var _interSections = []
  var lists = []
  var notLists = []
  var lineRects = []
    if (links) {

    links.forEach(function(d){
      if ( !d.source.isList && !d.target.isList && d.source && d.target) {
        var left = d.source.x < d.target.x ? d.source.x : d.target.x;
        var right = d.source.x > d.target.x ? d.source.x : d.target.x;
        var bottom = d.target.y;
        var top = d.source.y;
        var width = right - left;
        var height = top - bottom
    
    lineRects.push({
      right: right - 85,
      left: left + 85,
      top: top + 20,
      bottom: bottom -20,
      source: d.source,
      target: d.target,
      line: true,
    })

    };
  
  })
    };

  nodes.forEach(function(node){
    if (node.isList) {
      lists.push(node)
    };
  })  

  nodes.forEach(function(node){
    if (!node.isList) {
      notLists.push(node)
    };
  })

  if (lists.length > 0 && notLists.length > 0) {
    lists.forEach(function(list){
      nodes.forEach(function(notList){
        findColumnIntersection(list, notList, _interSections);
      })
    })

    lists.forEach(function(list){
      lineRects.forEach(function(notList){
        findColumnIntersection(list, notList, _interSections);
      })
    })
  };

  var str = []

  _interSections.forEach(function(item){
    var depth = _getDepth(item)
    str.push({_id: item.node.parent._id, depth: depth, title: item.node.parent.title})
  })

  var res = distinct(str)
  
  res.forEach(function(intersect){
    intersect = JSON.parse(intersect)
  })

  return res
 }

function getListAncestor(node){
  if (!node) {return};
  if (node.parent && node.parent.isListParent && !node.parent.isList) {
    return node.parent
  }else{
    return getListAncestor(node.parent)
  }
 }
 
function prepareNodes(root, tree){
  var parents = getListParents(root)

  parents.forEach(function(d){
    calculateLvl(d)
  })

  var nodes = tree.nodes(root);

  nodes.forEach(function(d, i){
    d.y = d.depth * 120
    if (d.isList) {
      d.x = calculateListX(d) 
      d.y = calculateListY(d, i)
    }
    d.x0 = d.x
    d.y0 = d.y
  })

  return nodes;
 }

function getFirstGhostParents(ghostParent){
  if (ghostParent.children && ghostParent.children.length > 0) {
    return getFirstGhostParents(ghostParent.children[0])
  }else{
    return ghostParent
  }
 }

function getLastGhostParents(ghostParent){
  if (ghostParent.children && ghostParent.children.length > 0) {
    return getLastGhostParents(ghostParent.children[ghostParent.children.length - 1])
  }else{
    return ghostParent
  }
 }

function addGhostNode(ghostParent){
  if (!ghostParent.children && !ghostParent._children){
    ghostParent.children = [];
  }
  var firstNode = getFirstGhostParents(ghostParent)
  var lastNode = getLastGhostParents(ghostParent)

  if (!firstNode.children) firstNode.children = [];
  if (!lastNode.children) lastNode.children = [];

  ghostParent.isGhostAnc = true
  lastNode.isGhostParent = true
  firstNode.isGhostParent = true

  var id = Math.floor(Math.random() * 10000)

  lastNode.children.push({
    title: "parent_"+lastNode.title + ' ghost', 
    isGhost: true,
    isList: true,
    parent: lastNode,
    _id: id,
    x: lastNode.x,
    y: lastNode.y
  })

  id = Math.floor(Math.random() * 10000)

  firstNode.children.push({
    title: "ghost", 
    isGhost: true,
    isList: true,
    parent: firstNode,
    _id: id,
    x: firstNode.x,
    y: firstNode.y
  })
 }

function calculateLvl(root){
  var i = 0
  function calculateLvlRec(root){
    if (root.children) {
      root.children.forEach(function(d){
        if (d.isGhost){
          d.lvling = i
          return
        }  
        i++
        d.lvling = i
        if (d.children) {
          calculateLvlRec(d)
        }
      })
    };
  }
  calculateLvlRec(root)
 } 

function resolveSpacing( tree, svg, root, i, links ){
  var nodes = prepareNodes(root, tree)
  if (i > 4) { 
      console.log('fucked up')
    return prepareNodes(root, tree)
  };

  var interSections = compareNodes(nodes, links)
  if (interSections.length > 0) {

    interSections.forEach(function(intersect){
      intersect = JSON.parse(intersect)
      recursiveWalk(root, function(node){
        if (node._id == intersect._id) {
          node = getListAncestor(node) ? getListAncestor(node) : node
          addGhostNode(node);
        };
      })
    })

    nodes = prepareNodes(root, tree)

    interSections = compareNodes(nodes, links)

    if (interSections.length > 0) {
      i++;
      return resolveSpacing(tree, svg, root, i, links)
    }

   }
    return  prepareNodes(root, tree)
  }

function getListParents (root) {

  var parents = []

  function getListParentsRec(root){
    if ( root.children ) {
      root.children.forEach(function(d){
        if (d.isListParent) {
          parents.push(d)
        };
        if (d.children) {
          getListParentsRec(d)
        }
      })
    }
  }
  getListParentsRec(root)

  return parents;
 }

function set_separation (tree){

  var pairs = []

  function dv_separation  (node, previousNode){
      var __node = node
      var listSep = 170;
      pairs.push({'node':node, 'previousNode': previousNode})

      if (pairs.length != 0) {
        pairs.forEach(function(pair){
          if (node.parent && previousNode.parent && node.parent != previousNode.parent) {
            node.bridge = true
            previousNode.bridge = true
          }else{
            node.bridge = false
            previousNode.bridge = false
          }
        })
      }

      if (node.isGhost && node.bridge ) {
        node = node.parent
      };

      if (previousNode.isGhost && previousNode.bridge ) {
        previousNode = previousNode.parent
      };

      if (node.isList && node.bridge && !previousNode.isList && previousNode.bridge) {
        var j = getListAncestor(node)
        // remove ancestor checking after test !!!
        if (j) {
          listSep = -( ( 85 * getListAncestor(node).children.length ) -  (30 * getDepth(getListAncestor(node)) - 170 ) )
          listSep =  listSep + 200        
        }
      };
      
      if (!node.isList && node.bridge && previousNode.isList && previousNode.bridge) {
        listSep = -( 85 * previousNode.parent.children.length - 170 )
        listSep =  listSep + 150
      };

      if (node.isList && node.bridge && previousNode.isList && previousNode.bridge) {
        listSep = -( ( 85 * (node.parent.children.length) ) + (30 * getDepth(node.parent) - 170 ) + ( 85 * (previousNode.parent.children.length) - 170 ) )
        listSep = listSep + 200
      };

      return listSep 
  }
  tree.separation(function(node, previousNode){
    dv_separation(node, previousNode)
  })
  return tree;
 }

function getMostLeft (node){
  var mostLeft = node.x;
  function getMostLeftRec(node){
    if (node.x < mostLeft) {
      mostLeft = node.x
    }
    if (node.children && node.children.length > 0) {
      node.children.forEach(function(node){
        getMostLeftRec(node)
      })
    };
  }
  getMostLeftRec(node)
  return mostLeft
 }

function getRightCount (parent, nodes) {
  var ghostCount = 0;
  nodes.forEach(function(sibling){
    var x = sibling.node_x ? sibling.node_x : sibling.x
    var px = parent.node_x ? parent.node_x : parent.x
    if (x >= px + 100) {
      ghostCount++
    };
  })
  return ghostCount;
 }

function fixLength(node, addon){
  node.ghostParent = true
  for (var i = addon.ghostsRight - 1; i >= 0; i--) {
    var id = Math.floor(Math.random() * 100000000)
    node.children.push({
      title: ' ghost', 
      isGhost: true,
      isList: true,
      parent: node,
      _id: id,
      x: node.x,
      y: node.y
    })
  };  

  for (var i = addon.ghostsLeft - 1; i >= 0; i--) {
    var id = Math.floor(Math.random() * 100000000)
    node.children.unshift({
      title: ' ghost', 
      isGhost: true,
      isList: true,
      parent: node,
      _id: id,
      x: node.x,
      y: node.y
    })
  };
 }

function childLengthFix (nodes) {
  if (!nodes.children){
    nodes.children = []
    return nodes;
  } 
  recursiveWalk(nodes, function(node){
    if (node.isListParent && !node.isList) {
        var o_oy = getWanazardi(node, node)
      if (node.children && ( node.children[node.children.length - 1].x < o_oy.mostRight || node.children[0].x > o_oy.mostLeft) ){
        fixLength(node, o_oy)
      };
    };
  })
  return nodes;

 }

$scope.longestBridge = false;

function dv_separation  (node, previousNode){
  var __node = node
  var listSep = 170;
  var pairs = []

  pairs.push({'node':node, 'previousNode': previousNode})

  if (pairs.length != 0) {
    pairs.forEach(function(pair){
      if (node.parent && previousNode.parent && node.parent != previousNode.parent) {
        node.bridge = true
        previousNode.bridge = true
      }else{
        node.bridge = false
        previousNode.bridge = false
      }
    })
  }

  if ( node.isGhost ) {
    // node = node.parent
  };

  if (previousNode.isGhost && previousNode.bridge ) {
    // previousNode = previousNode.parent
  };

  if (node.isList && node.bridge && !previousNode.isList && previousNode.bridge) {
    var listParent = getListAncestor(node)
    listSep = -( ( 85 * listParent.children.length  ) -  ( 40 * getDepth(listParent) ) )
    listSep =  listSep + 300
  };

  if (!node.isList && node.bridge && previousNode.isList && previousNode.bridge) {
    var listParent = getListAncestor(previousNode)
    listSep = -( 170 * (listParent.children.length / 2) )
    listSep =  listSep + 300
  };

  if (node.isList && node.bridge && previousNode.isList && previousNode.bridge) {
    var j = getListAncestor(node)
    var pj = getListAncestor(previousNode)
    listSep = -( ( 85 * j.children.length ) - (40 * getDepth(j)) + ( 85 * pj.children.length ) )
    listSep = listSep + 300;
    if (previousNode.title == 'right bridge') {
        console.log(previousNode.parent.children)
    };
  };

    return listSep 
 }

function getGhostCount(nodes){
  var ghostCount = 0;
  nodes.forEach(function(node){
    if (node.isGhost) {
      ghostCount++
    };
  })
  return ghostCount;
 }

function getWanazardi (_root, parent){

  function right (node){
    return node.x + 175;
  }

  var addon = {};

  if (!_root.children){
    addon.x = 0;
    addon.ghostsRight = 0;
    addon.ghostsLeft = 0;
    return addon;
  } 

  addon.mostLeft = parent.x ? parent.x : 0;
  addon.mostRight = parent.x ? right(parent) : 0;

  recursiveWalk(_root, function(node){
    if (right(node) > addon.mostRight + 5) {
      addon.nodeRight = node
      addon.mostRight = right(node)
    };
    if (node.x  < addon.mostLeft - 5) {
      addon.nodeLeft = node
      addon.mostLeft = node.x
    };
  })

  addon.ghostsRight = Math.abs(Math.round( ( addon.mostRight - right(parent) ) / 170 ));
  addon.ghostsLeft = Math.abs(Math.round( ( addon.mostLeft + parent.x) / 170 ));

  return addon;
 }

Project.get( $stateParams.id )
  .then( function (project) {
    $scope.project = project;
    $scope.project.id = project._id;
    $scope.project.users = project._users;
    $scope.user = project._user
    $rootScope.project = project;
Node.getList($stateParams.id).then(function (__nodes) {
  $scope.tree = __nodes
  root = $scope.project;
  root._nodes = __nodes
  _nodesToChildren(root)
  root.x0 = 0;
  root.y0 = 0;
  tree = d3.layout.tree()
  .nodeSize([1, rectH])

  .separation(function(node, previousNode){
    return dv_separation(node, previousNode)
  })

  var nodes = tree.nodes(root)
  svgSize = calculateSVGSize(nodes)
  if (root.children) {
    root.children.forEach(collapse);
  };
  svg = body.append('svg')
  .attr('width', svgSize.width > window.innerWidth ? svgSize.width : window.innerWidth)
  .attr('height', svgSize.height+10 > window.innerHeight ? svgSize.height+10 : window.innerHeight )
  // .on('click', removeForm)
  .call(d3.behavior.zoom()
  .translate([(window.innerWidth / 2-rectW), margin.top])
  .scaleExtent([0.4, 1])
  .on("zoom", zoom))
  .on("click.zoom", null)
  .on("dblclick.zoom", null) 
  .on("click.zoom", null)
  .append('g')
  .attr('transform', 'translate(' + (window.innerWidth / 2-rectW) + ',' + margin.top * 2 + ')')
  .on("click.zoom", null)
  .on("dblclick.zoom", null) 
  .on("click.zoom", null)
  .style('position', 'relative')
  // create first task if no tasks exists
  if ( __nodes.length == 0 ) {
    var newNode = { title : "new task" };
    var parentId = $scope.project.id;
    if ($scope.project.id == $scope.project.id) {
      parentId = null
    };
    Node.add( $scope.project.id, parentId, newNode )
    .then( function(data){
      if(newNode.isList){ 
        data.isList = true
      }
      newNode = data;
      root.children = [ newNode ];
      $scope.tree = root.children
      update(root, newNode._id);
    })  
  }else{
    update(root);
  }
 })
 })

function update(source, doubleClickTarget, resolving) {
  d3.selectAll('g.ghost').remove()  
  source = cleanGhosts(source)
  root = cleanGhosts(root)
  var _rectH  
  var _rectHH
  var indent = 0

  if (source.isList || source.isListParent) {
    _rectH = rectH - 15
    _rectHH = _rectH / 2
    }else{
      _rectH = rectH
      _rectHH = rectHH
    }

    if (source.isList) indent = 7
    var timer = 500
    var maxDepth = 1
    var __children;

    if (!root.children) {
      root.children = []
    };

    tree.nodes(root)
    root = childLengthFix(root)
    var nodes = resolveSpacing(tree, svg, root, 0)
    var links = tree.links(nodes)
    nodes = resolveSpacing(tree, svg, root, 0, links)
    links = tree.links(nodes)
    console.log('ghost count: ' + getGhostCount(nodes))
 

  // Update the nodes
    var node = svg.selectAll('g.node')
        .data(nodes, function(d) { return d.id || (d.id = d._id) });

  // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append('g')
        .attr('class', function(d){
          return d.isGhost ? 'ghost' : 'node'
        })
        .attr('id', function (d) { return 'id_' + d._id })
        .attr('transform', function(d) {
          return 'translate(' + source.x0 + ',' + source.y0 + ')';
        })
        .style('overflow', 'hidden')
        .style('width', rectW)

  // main rectangle
    nodeEnter.append('rect')
        .attr('width', rectW)
        .attr('height', function(d){
          return _rectH
        })
        .attr('id', function(d) { return 'node_'+d._id })
        .attr('x', function (d) { 
          return -rectHW
        })
        .attr('y', function (d) { return d.isList ? -_rectHH : -rectHH; })
        .style('fill', function(d) { return d._children ? '#eee' : '#fff'; })
        .style('stroke', '#000')
        // fix for Z-index
        .on("mouseover", function(selected) {
                svg.selectAll('.node')
                .sort(function(a, b) {
                  if (a.id === selected.id) {
                    return 1;
                  } else {
                    if (b.id === selected.id) {
                      return -1;
                    } else {
                      return 0;
                    }
                  }
                });
              })
        .on('click', click)

  // title text
    nodeEnter.filter(function(d){
      return !d.isGhost
    }).append('text')
        .attr('id', function(d){ return 'id_'+d._id })
        .text(function (d) {
          if (d == root) d.title = d.name
          if(d.title.length > 15)
             return d.title.substring(0,15)+'...';
           else
               return d.title;                       
        })
        .style('fill-opacity', 1e-6)
        .attr('y', -rectH + 43)
        .attr('x', -rectHW + 15)
        .on('click', click)
        .style('color', '#fff')

  // ToolBox
    nodeEnter.filter(function(d){
      return !d.isGhost
    }).append('rect')
      .style('stroke', '#FFF')
      .attr('class', 'toolbox')
      .attr('id', function(d){ return 'tool_box_id_'+d._id })
      .attr('width', rectW - 50)
      .attr('height', rectH + 10)
      .attr('x', -rectHW + 25)
      .attr('y', function(d){ return -rectHH + 6})
      .attr('visibility', function (d) {
        return d == root ? 'hidden' : 'visible'
      });

  // invite collaborator
    nodeEnter.filter(function(d){
      return !d.isGhost
    }).append('text')
      .attr('class', 'actionArrows user')
      .attr('id', function(d){ return 'tool_box_icon_id_'+d._id })
      .text(function(d) { return "\ue606"})
      .attr('x', -35)
      .attr('y', function(d){ return -rectH })
      .attr('visibility', function (d) {
        return d == root ? 'hidden' : 'visible'
      })
      .on('click', function(d){

        $scope.invite(d);
      })
      .style('fill', "#339933")

  // show info
    nodeEnter.filter(function(d){
      return !d.isGhost
    }).append('text')
      .attr('class', 'actionArrows info')
      .attr('id', function(d){ return 'tool_box_icon_id_'+d._id })
      .attr('x', -7)
      .attr('y', function(d){ return -rectH })
      .text(function(d) { return "\ue605"})
      .attr('visibility', function (d) {
        return d == root ? 'hidden' : 'visible'
      })
      .on('click', function(d){
        $scope.dv_selectNode(d) 
      });
      
  // delete button
    nodeEnter.filter(function(d){
      return !d.isGhost
    }).append('text')
      .attr('class', 'actionArrows delete')
      .attr('id', function(d){ return 'tool_box_icon_id_'+d._id })
      .text(function(d) { return "\ue607"})
      .attr('x', 20)
      .attr('y', function(d){ return -rectH })
      .on('click',function(d){
        // check that children are not only ghosts
        // if (d.children && d.children.length > 0) {
          var _ghostParent = false;
        //   var gp = 0;
        //   var arr_length = d.children.length
        //   d.children.forEach(function(node){
        //     if (node.isGhost) {
        //       gp++
        //     };
        //   })
        //   if (gp == arr_length) {
        //     _ghostParent = true
        //   };
        // };
        if ( ( d.children && d.children.length > 0 || d._children && d._children.length > 0) && !_ghostParent) {
          $scope.showDeleteModal(d)
        }
        else{
          deleteNode(d, root)
        }
      })
      .attr('visibility', function (d) {
        return d == root ? 'hidden' : 'visible'
      })
      .style('fill', "red")

  // add right
    nodeEnter.filter(function(d){
      return !d.isGhost
    }).append('text')
      .attr('class', 'actionArrows')
      .attr('id', function(d){ return 'action_icon_right_id_'+d._id })
      .text(function(d) { return "\ue601"})
      .attr('x', function(d){ return rectHW - 1 })
      .attr('y', (-rectHH + arrowH + 7))
      .attr('visibility', function (d) {
        return d == root ? 'hidden' : 'visible'
      })
      .on('click', buttonRight)
  
  // add left
    nodeEnter.filter(function(d){
      return !d.isGhost
    }).append('text')
      .attr('class', 'actionArrows')
      .attr('id', function(d){ return 'action_icon_left_id_'+d._id })
      .text(function(d) { return "\ue602"})
      .attr('x', function(d){ return -rectHW - 18})
      .attr('y', (-rectHH + arrowH + 7))
      .on('click',function(d){
        $('#newTaskForm').remove(); 
         buttonLeft(d)
       })
      .attr('visibility', function (d) {
        return  ( d == root ) || ( d.isList && !d.isListParent)  ? 'hidden' : 'visible'
      })

    nodeEnter.filter(function(d){
      return !d.isGhost
    }).append('rect')
      .attr('class', 'actionArrows container')
      .attr('id', function(d){ return 'action_icon_bottom_container_id_'+d._id })
      .attr('x', -arrowW / 2)
      .attr('y', rectHH + 1)
      .style('stroke', '#fff')
      .attr('width', 20)
      .attr('height', 17)
      .on('click',function(d){
        $('#newTaskForm').remove(); 
        buttonRight(d)
      })

  // add bottom
    nodeEnter.filter(function(d){
      return !d.isGhost
    }).append('text')
      .attr('class', 'actionArrows')
      .attr('id', function(d){ return 'action_icon_bottom_id_'+d._id })
      .text(function(d) { 
        return "\ue603"
      })
      .attr('x', -arrowW / 2)
      .attr('y', rectHH + 15)
      .on('click', function(d){
        $('#newTaskForm').remove();
        buttonBottom(d)
      })

  // add top
    nodeEnter.filter(function(d){
      return !d.isGhost
    }).append('text')
      .attr('id', function(d){ return 'action_icon_top_id_'+d._id })
      .attr('class', 'actionArrows')
      .text(function(d) { return "\ue600"})
      .attr('x', -arrowW / 2)
      .attr('y', (-rectHH))
      // .attr('fill', '#000')
      .on('click', function(d){
        $('#newTaskForm').remove();
        buttonTop(d)
      })
      .attr('visibility', function (d) {
        return  ( d == root ) ? 'hidden' : 'visible'
      });

  // View Controll
    nodeEnter.filter(function(d){
      return !d.isGhost
    }).append('rect')
      .attr('class', 'toolbox viewButton actionArrows')
      .attr('id', function(d){ return 'icon_id_'+d._id })
      .attr('width', rectW - 87)
      .style('stroke', '#FFF')
      .attr('height', rectH - 14)
      .attr('x', -rectHW - 10)
      .attr('y', ( ( -rectHH + 1) + arrowH * 2))
      .attr('visibility', function (d) {
        var vis = !d.children || d.isList ? 'hidden' : 'visible'
        return d == root ? 'hidden' : vis
      })

  // Box view
    nodeEnter.filter(function(d){
      return !d.isGhost
    }).append('text')
      .attr('class', 'actionArrows viewButton box-view')
      .attr('id', function(d) { return 'icon_id_'+d._id })
      .text(function(d) { return "\ue608"})
      .style('fill', function(d){
        return d.isListParent ? '#2197CD' : '#ccc' 
      })
      .attr('x', -rectHW - 25 + arrowW)
      .attr('y', (-rectHH + arrowH * 2) + 21)
      .on('click', updateToNodes)
      .attr('visibility', function (d) {
        var vis = !d.children || d.isList ? 'hidden' : 'visible'
        return d == root ? 'hidden' : vis
      })

  // List view
    nodeEnter.filter(function(d){
      return !d.isGhost
    }).append('text')
      .attr('class', 'actionArrows viewButton list-view')
        .attr('id', function(d) { return 'icon_id_'+d._id })
      .style('fill', function(d){
        return !d.isListParent ? '#2197CD' : '#ccc' 
      })
      .attr('x', -rectHW + arrowW )
      .attr('y', (-rectHH + arrowH * 2) + 21)
      .text(function(d) { return "\ue604"})
      .on('click', function(d){
        if (d.isList) {return};
        updateToList(d)
      })
      .attr('visibility', function (d) {
        var vis = !d.children || d.isList ? 'hidden' : 'visible'
        return d == root ? 'hidden' : vis
      })

  // Recalculate view params
    nodes.forEach(function(d){

      d3.selectAll('rect#node_'+d._id)
      .attr("height", function(d){ return d.isList ? rectH - 15 : rectH })
      .attr('y', function (d) { return d.isList ?  - ( rectH - 15 ) / 2: -rectHH })


      d3.selectAll('.box-view#icon_id_'+d._id)
      .style('fill', function(d){
        return d.isListParent ? '#2197CD' : '#ccc' 
      })


      d3.selectAll('.list-view#icon_id_'+d._id)
      .style('fill', function(d){
        return !d.isListParent ? '#2197CD' : '#ccc' 
      })


      d3.selectAll('#tool_box_id_'+d._id)
      .attr('y', function(d){ 
          var indent
          if (d.isList){
            indent = -1;
          } 
          else{
            indent = -9;
          } 
        var y = indent -rectH -rectHH - 2
        return y
      })

      d3.selectAll('#tool_box_icon_id_'+d._id)
      .attr('y', function(d){ 
          var indent
          if (d.isList){
            indent = 0;
          } 
          else{
            indent = -7;
          } 
        var y = -rectH + indent
        return y
      })

      d3.selectAll('#action_icon_bottom_id_'+d._id)
      .attr('y', function(d){ 
          var indent
          if (d.isList){
            indent = 4;
          } 
          else{
            indent = -4;
          } 
          var y = rectHH + 13 - indent ;
          return y
        })


      d3.selectAll('#action_icon_top_id_'+d._id)
      .attr('y', function(d){ 
          var indent
          if (d.isList){
            indent = 7;
          } 
          else{
            indent = -1;
          } 
        var y = -rectHH + indent ;
        return y
      })

      d3.selectAll('#action_icon_right_id_'+d._id)
      .attr('visibility', function(d){ 
        return d.isList || d == root ? 'hidden' : 'visible'
      })

      d3.selectAll('#action_icon_left_id_'+d._id)
      .attr('visibility', function(d){ 
        return d.isList || d == root ? 'hidden' : 'visible'
      })

      d3.selectAll('text#id_'+d._id)
      .attr('y', function (d) {
        return d.isList ? rectHH - 15 : rectHH - 17; 
      })
      .attr('x', function(d){
        return d.isList ? -rectHW + 5 : '0'
      })
      .attr('text-anchor', function(d){ return !d.isList ? 'middle' : ''})
    })
   
    restrictViewChange(root)

  // Transition nodes to their new position.
    var nodeUpdate = node.transition()
        .duration(duration)
        .attr('transform', function(d) {
          return 'translate(' + d.x + ',' + d.y + ')'; });

    nodeUpdate.select('rect').style('fill', function(d) { return d._children ? '#eee' : '#fff'; });

    nodeUpdate.select('text').style('fill-opacity', 1);

  // Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition()
        .duration(duration)
        .attr('transform', function(d) { return 'translate(' + source.x + ',' + source.y + ')'; })
        .remove();

    nodeExit.select('text').style('fill-opacity', 1e-6);

  // LINKS !!!
    var link = svg.selectAll('path.link')
        .data(links, function(d) { return d.target.id; });

  // Enter any new links at the parent's previous position.
    link.enter().insert('path', 'g')
        .attr('class', function(d){
           if ( d.target.isGhost || d.source.isGhost || d.source.isGhostParent )  {
            return 'ghost'; 
           }else return 'link';
        })
        .attr('id', function(d){
          return d.target._id + '_' + d.source._id
        })
        .attr('d', function (d, i) {
          var o = { source : d.source, target : d.source };
          return elbow(o, i);
        });

  // Transition links to their new position.
    link.transition()
        .duration(duration)
        .attr('d', elbow);

  // Transition exiting nodes to the parent's new position.
    link.exit().transition()
        .duration(duration)
        .attr('d', function (d, i) {
          var o = { source : source, target : source };
          return elbow(o, i);
        })
        .remove();

  // Stash the old positions for transition.
    nodes.forEach(function(d) {
      d.x0 = d.x;
      d.y0 = d.y;
    });

  // function updateSVGSize(width, height) {
  //   d3.select('svg').attr('width',  width + margin.left + margin.right)
  //      .attr('height', bottomEdge + margin.top + margin.bottom + 10);
  // }

  leftEdge = 0;
  rightEdge = 0;
  bottomEdge = 0;
  nodeUpdate.tween('fullsize', function (d) {
    leftEdge   = d.x < leftEdge ? d.x : leftEdge;
    rightEdge  = d.x + rectW > rightEdge ? d.x + rectHW : rightEdge;
    bottomEdge = d.y > bottomEdge ? d.y : bottomEdge;

    width  = Math.abs(leftEdge) + rectHW + rightEdge,
    transformFinal = Math.abs(leftEdge) + rectHW;

$scope.longestBridge = false
    // if (svg.attr('width') > width || svg.attr('height') < bottomEdge) {
      // updateSVGSize(width, bottomEdge);
    // }

    // return function (t) {
    //   var transformDelta = transformFinal - lastTransform,
    //       currTransform = lastTransform + (transformDelta * t);
    //   lastTransform = currTransform;
    //   svg.attr('transform', 'translate(' + (margin.left + currTransform) + ',' + margin.top + ')');
    //  }
 });

nodeUpdate.each('end', function (d) {
  if (svg.attr('width') > width || svg.attr('height') > bottomEdge) {
    updateSVGSize(width, bottomEdge);
  }

  if (doubleClickTarget && d._id === doubleClickTarget) {
    doubleClickListener.call(d3.select('#id_' + d.id + ' rect'), d);
  }
 });
}

}])
.controller('schemeDeleteController', ['$scope', '$rootScope', '$location', '$stateParams', 'Project', 'Node', '$timeout', 'Scheme','$rootScope', '$modal', 'node', '$modalInstance',
function ($scope, $rootScope, $location, $stateParams, Project, Node, $timeout, schemeService, $rootScope, $modal, node, $modalInstance) {
  
  $scope.deleteNode = function(){
    $rootScope.delete_dv_task(node)
    $modalInstance.close('result');    
  }

  $scope.deleteTask = function(){
    if (!node.children && !node._children || !node.parent) {
      $scope.deleteNode()
      return
    };
    var childrenTasks = node.children ? node.children : node._children;
    var bros = node.parent.children ? node.parent.children : node.parent._children 
    childrenTasks.forEach(function(childTask){
      if (!childTask.isGhost) {
        var parent_id = node.parent._id == $rootScope.project._id ? null : node.parent._id
          console.log($rootScope.project._id )
        Node.updateParent(childTask._id, parent_id)
        .catch(function(error){
          console.log(error)
        })
        node.parent.children.push(childTask)
      }
    })
    setTimeout(function() {
      $scope.deleteNode()
    }, 1000);
  }

}])
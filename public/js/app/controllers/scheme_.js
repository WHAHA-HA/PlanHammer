'use strict';

angular.module('App.controllers')
  .controller('schemeController', ['$scope', '$location', '$stateParams', 'Project', 'Node', '$timeout', 'Scheme',
    function ($scope, $location, $stateParams, Project, Node, $timeout, schemeService) {
                 
    $scope.scheme = {
      configs : {},
      data : [],
      rData : {},
      cNet : {},
      target : {},
      init : function() {
        $(document).mousedown(function(e) {
          $scope.$apply(function() {   
            $scope.scheme.dragDrop.mouseIsDown(e);
          });
        }); 

        $(document).mousemove(function(e) {
          $scope.$apply(function() {
            $scope.scheme.dragDrop.mouseIsMoving(e);
          });
        });                

        $(document).mouseup(function(e) {
          $scope.$apply(function() {                
            $scope.scheme.dragDrop.mouseIsUp(e);
          });
        });   

        var pos = $("#drawArea").offset();
        this.configs.leftOffset = pos.left;
        this.configs.topOffset  = pos.top;                
      },

       updateDataObjectById : function(id, data) {
        for (var i in this.data)
        {
            if (this.data[i]._id == id)
            {
                for( var key in data)
                {
                    if (key === "order")
                    {
                        for (var i2 in this.data)
                        {
                            if (this.data[i2].order >= data[key])
                            {
                              var dif = this.data[i2].order - data[key];
                              dif++;
                              this.data[i2].order = data[key] + dif;
                            }
                        }
                    }
                    
                    this.data[i][key] = data[key];
                }
                
                
                for (var i2 in this.data)
                {
                  console.log(this.data[i2])
                  Node.update(this.data[i2]._id, this.data[i2]).then(function(data){
                    console.log('node-update 65')
                  }).catch(function(error){
                    console.log(error.message)
                  })                         
                }
                return this.data[i];
            }
        }
      },
        
      Nodes2Data : function(nodes, parent, level, parentClass)
      {
       
        var order = 0;
        for( var index in nodes)
        {

          var node = nodes[index];
          var newIndex = this.data.length;
          
          if (!newIndex) newIndex = 0;
          
          this.data[newIndex]           = node;
          this.data[newIndex]["id"]       = node["_id"];
          this.data[newIndex]["parent"]       = parent;
          this.data[newIndex]["parentClass"]  = parentClass;          
          this.data[newIndex]["order"]      = order;
          this.data[newIndex]["level"]      = level;          
          
          if (node["_nodes"]) {
            if (node["_nodes"].length > 0) {
              this.Nodes2Data(node["_nodes"], node["_id"], (level+1), node["_id"] + " " + parentClass);
              this.data[newIndex]["subNodes"]   = true;
            }
          }

          order++;
        }
        
        
      },
        
      drawScheme : function(target)
      {
      
        this.targetObject = $("#" + target);
        
        this.countAllBoxesCoordinates(this.targetObject);
      },
      
      countAllBoxesCoordinates : function(targetObject)
      {
        this.target       = 
        {
          width  : targetObject.width(),
          height : targetObject.height()
        }
        this.prepareBoxesRelativeArray();
        this.countBoxesCoordinates(0, 0, 0, true);
        this.connectors.data = this.data; 
      },
      
      
      
      prepareBoxesRelativeArray : function()
      {
        if (!this.data)
        {
        //  return false;
        }
        
        this.rData = [];
        

        for (var i in this.data)
        {
          var b = this.data[i];
          
          
          var order = this.getOrder(b);
          
          
          if (!this.rData[b.parent]) 
          {
            this.rData[b.parent]    = [];
          }
          
          this.rData[b.parent][order] = i;
                  
        }
        
      },
      
      
      getOrder : function(b)
      {
        var order = 0;
          
        for (var i in this.data) {
          if (this.data[i].order < b.order && this.data[i].parent == b.parent) {
            order++;
          }
        } 
      
        return order;
      },
      
      
      countBoxesCoordinates : function(parent, level, treeID, drawLines)
      {
        // Temporary width
        
        var width     = 120;
        var widthSpace  = 20;
        var height    = 40;
        var heightSpace = 40;
        
        if (!this.rData[parent])
        {
          return false;
        }
        

        for (var bIndex in this.rData[parent])
        {
          var box = this.data[ this.rData[parent][bIndex] ];
                 
    
          var left    = this.countLeft(box, width, height, widthSpace, bIndex, level);
          var top     = this.countTop(box, width, height, heightSpace, level);            
          
          box["left"]   = left;
          box["leftStr"]  = "left: " + left + "px;";
          box["top"]    = top;            
          box["width"]  = width;
          box["height"]   = height;           
          box["level"]  = level;              
          
          var cIndex = left+"_"+level;
          
          if (box["subNodes"])
          {
              this.connectors.makeIcons(box);             
              this.connectors.makeLines(box);
          }

        
          if (treeID)
          {
            if (!this.data[treeID]["levelsFarLeft"][level])
            {
              this.data[treeID]["levelsFarLeft"][level]   = left;
            }
                      
            if (!this.data[treeID]["levelsFarRight"][level])
            {
              this.data[treeID]["levelsFarRight"][level]  = left + width;
            }
          }
          
          
          if (treeID == 0)
          {
            box["farRight"] = left + width;
            
            box["levelsFarRight"]   = {};
            box["levelsFarLeft"]  = {};           
            
            box["levelsFarRight"][level]  = left + width;
            box["levelsFarLeft"][level]   = left;           
            
            treeID = this.rData[parent][bIndex];
          }
          else
          {
            var farRight = left + width;
            if (this.data[treeID]["farRight"] <  farRight)
            {
              this.data[treeID]["farRight"] = farRight;
            }
            
            
            if (this.data[treeID]["levelsFarLeft"][level] >  left)
            {
              this.data[treeID]["levelsFarLeft"][level] = left;
            }             
            
            
            if (this.data[treeID]["levelsFarRight"][level] <  farRight)
            {
              this.data[treeID]["levelsFarRight"][level] = farRight;
            }           
          }
          
          if (!box.doNotDrawSubNodes)
                  {
                        this.countBoxesCoordinates(box.id, (level+1), treeID, drawLines);
                  } 
          
          if (parent == 0) treeID = 0;        
        }
        
              
        
        
      },
      
      countLeft : function(box, width, height, widthSpace, bIndex, level)
      {
        
        if (level == 0 && bIndex == 0)
        {
          return 0;
        }
        else if (box.parent == 0)
        {          
          var farLeft = this.data[ this.rData[0][""+(bIndex-1)+""] ]["farRight"];
          
          var left = farLeft + widthSpace;  

          return left;      
        }

        var left = bIndex * (width + widthSpace);
        
        
        if (box.parent != 0)
        {
          var parentBox = this.getBoxById(box.parent);        
          
          left = left + parentBox.left;         
        }
                

        
        return left;
      },
      
      
      checkLeftOtherBoxes : function(level, left, widthSpace)
      {
        for (var i in this.data)
        {
          if (this.data[i]["level"] == level)
          {
            var sX1 = this.data[i].left;
            var sX2 = this.data[i].width + sX1;           
            
            
            if (sX1 == left)
            {
              var newLeft =  sX2 + widthSpace;
              
              return newLeft;
            }
            
            
          }
        }
        
        return left;
      },
      
      countTop  : function(box, width, height, heightSpace, level)
      {
        if (level == 0)
        {
          return 0;
        }
        else
        {
          var top = level * (height + heightSpace);
        }
        
        return top;
      },
      
      getBoxById : function(id)
      {
        if (!this.data)
        {
          return false;
        }
        
        for (var i in this.data)
        {
          var box = this.data[i];
          
          if (box.id == id)
          {
            return box;
          }
        }
      },
      
      
      
      
      /* CONNECTORS */
      connectors :
      {
                icons       : {},   // Stores all icons
                lines       : {},   // Stors all lines
                
                
                makeIcons : function(node)
                {
                    var cIndex = node["_id"];
                    
                    if (!this.icons[cIndex])
            {
                this.icons[cIndex] = { 
                    "val" : "-",
                    "_id" : cIndex
                };
            }
                
            this.icons[cIndex].left  = node.left  + node.width / 2;
            this.icons[cIndex].top   = node.top   + node.height - 10;                                 
               
                },
                
                
                clickConnectorIcon : function(icon)
                {
                    if (icon.val == "+")
                    {
                        icon.val = "-";
                    }
                    else
                    {
                        icon.val = "+";
                    }
                
                
                    for (var i in $scope.scheme.data)
                    {

                        if ($scope.scheme.data[i]._id == icon._id && icon.val == "+")
                        {
                            $scope.scheme.data[i].doNotDrawSubNodes = true;
                        }
                        else  if ($scope.scheme.data[i]._id == icon._id && icon.val == "-")
                        {
                            $scope.scheme.data[i].doNotDrawSubNodes = false;
                        }
                    }
                    
                    
                    if (icon.val== "+")
                    {
                         this.showHideBoxes(icon, "hide", icon["_id"]);
                    }
                    else
                    {
                        this.showHideBoxes(icon, "show", icon["_id"]);
                    }  
                                        
                    
                    $scope.scheme.countBoxesCoordinates(0,0,0, false);        
                },
                
                
                showHideBoxes : function(icon, action, parent)
                {
                    
                    for (var i in $scope.scheme.data)
                    {
                        var box = $scope.scheme.data[i];
                        
                       
                        if (box["parent"] == parent)
                        {
                        
                            var boxTarget      = "#box" + box["_id"];
                            var linesTarget    = ".line" + parent;
                            var iconTarget     = "#cIcon" + box["_id"];
                            
                            
                            
                            var doNotShow = false;  // Do not show subNodes if they were closed in sub icon
                                                   
                            if (action == "hide")
                            {
                                $(boxTarget + "," + linesTarget + "," + iconTarget).hide();
                                $scope.scheme.data[i].hide = true;
                            }
                            else if(action == "show")
                            {
                                
                                if (this.icons[box["_id"]])
                                {
                                    if (this.icons[box["_id"]].val == "+")
                                    {
                                        doNotShow = true;
                                    }
                                }
                                
                                
                                $(boxTarget + "," + linesTarget + "," + iconTarget).show();  
                                $scope.scheme.data[i].hide = false;                        
                                
                            }
                           
                            if (this.icons[box["_id"]] && doNotShow === false)
                            {
                                var icon = this.icons[box["_id"]];
                                this.showHideBoxes(icon, action, icon["_id"]);
                            }
                        }
                    }
                },
                
                
                lineConfig: 
                { 
                    thickness       : 2,
                    length          : 40
                },
                
                makeLines : function(node)
                {
                    if (node.subNodes == true && !node.doNotDrawSubNodes)
                    {


                        var subNodesNumber = (node._nodes.length-1);
                       
                        
                        this.makeLine("first",  node, subNodesNumber);
                        this.makeLine("hr",     node, subNodesNumber);
                       
                       
                        for (var i = 1; i <= subNodesNumber; i++)
                        {
                            this.makeLine("vr", node, i);                            
                        }                
                    }
                
                },
                
                
                // subNodesNumber - count of elements or current element index in loop
                makeLine: function(type, node, subNodesNumber)
                {
                    var newIndex = node._id + type;
                    
                    
                    if (type == "first")
                    {
                        var width    = this.lineConfig.thickness;
                        var height   = this.lineConfig.length;
                        var left     = node.left + node.width/2;
                        var top      = node.top  + node.height;
                        
                        
                    }
                    else if (type == "hr")
                    {
                        var width   = subNodesNumber * 140;
                        var height  = this.lineConfig.thickness;
                        var left    = node.left + node.width/2;
                        var top     = node.top + node.height + this.lineConfig.length/2; 
                    
                    }
                    else if(type == "vr")
                    {
                        newIndex = newIndex + "_" + subNodesNumber;
                        
                        var width    = this.lineConfig.thickness;
                        var height   = this.lineConfig.length/2;
                        var left     = node.left + 20 + ( ( node.width + 20) * subNodesNumber ) + (node.width)/2 - 20;
                        var top      = node.top  + node.height + this.lineConfig.length/2;
                    }
                    
                    
                    
                    if (!this.lines[newIndex])
                    {
                        this.lines[newIndex] = {};
                    }
                
                    this.lines[newIndex].width          = width; 
                    this.lines[newIndex].height         = height;                         
                    this.lines[newIndex].left           = left;
                    this.lines[newIndex].top          = top
                    this.lines[newIndex].parentClass    = "line" + node._id;
                },
                
                clearLines : function()
                {
                    this.lines = {};
                }
                
                               
      },
      
      
      
      boxes    :
      {
                icons :
                {
                    "left"  : {label : "left",     x : 0, y : 0},
                    "right" : {label : "right",    x : 0, y : 0},
                    "top"   : {label : "top",      x : 0, y : 0},
                    "bottom": {label : "bottom",   x : 0, y : 0}               
                },
                
                
                arrows      : 
                {
                    "left"  : {label : "left",     x : 0, y : 0, css : 'glyphicon glyphicon-circle-arrow-left',     show : false},
                    "right" : {label : "right",    x : 0, y : 0, css : 'glyphicon glyphicon-circle-arrow-right',    show : false},
                    "top"   : {label : "up",      x : 0, y : 0, css : 'glyphicon glyphicon-circle-arrow-top',      show : false},
                    "bottom": {label : "down",   x : 0, y : 0, css : 'glyphicon glyphicon-circle-arrow-down',     show : false}                                                           
                },
                
                                
                hoverIcons : 
                {
                    "left"          : 0,
                    "top"           : 0,
                    "show"          : false,
                    "arrowHeight"   : 18,
                    "node"          : false,              
                },
                
                hover : function(boxLeft, boxTop, x, y, box)
                {
                    if (box.titleEdit == true)
                    {
                        return false;
                    }
                    
                    
                    var left = box.left + (box.width /2 - 160/2);
                    var top  = box.top  + box.height + this.hoverIcons.arrowHeight;
                    
                    this.hoverIcons.left    = left;
                    this.hoverIcons.top     = top;
                    this.hoverIcons.show    = true;
                    this.hoverIcons.node    = box;
                    
                    
                    
                    // Display Arros
                    
                    var x = x - $scope.scheme.configs.leftOffset;
                    var y = y - $scope.scheme.configs.topOffset; 
                    
                    var boxSides = schemeService.getBoxSides(box, x, y);                    
                    
                    
                    this.arrowDisplay("none", true);
                    
                    
                    if (x < boxSides.leftZone)
                    {
                        this.arrowDisplay("left", true);
                        
                    }
                    
                    if (x > boxSides.rightZone)
                    {
                        this.arrowDisplay("right", true);
                    }
                    
                    if (y > boxSides.bottomZone)
                    {
                        this.arrowDisplay("bottom", true);
                    }
                    
                    if (y < boxSides.bottomZone)
                    {
                        this.arrowDisplay("top", true);
                    }                    
                    
                    
                               
                    this.arrows.left.x      = boxSides.left      - 10;
                    this.arrows.left.y      = boxSides.centerY   - 6;
                    
                    this.arrows.top.x       = boxSides.centerX    - 24;
                    this.arrows.top.y       = boxSides.top        - 9;
                    
                    this.arrows.right.x     = boxSides.right    - 3;
                    this.arrows.right.y     = boxSides.centerY  - 6; 
                    
                    this.arrows.bottom.x    = boxSides.centerX  - 24;
                    this.arrows.bottom.y    = boxSides.bottom - 4;   
                                        
                    
                    
                    this.cleanTimeout();                      
                },
                
                                
                
                arrowDisplay : function(arrow, status)
                {
                    for (var i in this.arrows)
                    {
                        if (i == arrow)
                        {
                            this.arrows[i].show = status;  
                        }
                        else if (arrow == "none")
                        {
                            this.arrows[i].show = false;
                        }
 
                    }
                  
                },
                
                hoverTimeout : false,
                
                cleanTimeout : function()
                {
                    if ($scope.scheme.boxes.hoverTimeout)
                    {
                         $timeout.cancel($scope.scheme.boxes.hoverTimeout);
                    } 
                },
                
                mouseout : function()
                {
                    this.cleanTimeout();
                    this.hoverTimeout = $timeout($scope.scheme.boxes.hideIcons
                    , 300);
                },
                
                
                hideIcons : function()
                {
                   $scope.scheme.boxes.hoverIcons.show = false;
                },
                
                hoverIconsBox : function(act)
                {
                    if (act === "out2")
                    {
                    }
                    
                    if (act == "out" || act == "out2")
                    {
                        this.mouseout();
                    }
                    else if (act == "over")
                    {
                        this.cleanTimeout();
                       
                    }
                },
                
                addNewNode : function(sub, arrow)
                {
                    var node = { title: ' ', titleEdit : true, _nodes: [], $new: true, $indexes: [], "_project" : $scope.scheme.boxes.hoverIcons.node._project, duration :{ value :1, type : 'minute'} };
                    
                    if (sub == true)
                    {
                        if (arrow != "bottom" && arrow != "down")
                        {
                            node._parent =  $scope.scheme.boxes.hoverIcons.node._parent;
                            
                            if (node._parent == 0) node._parent = null;
                        }
                        else
                        {
                            node._parent =  $scope.scheme.boxes.hoverIcons.node._id;
                        }
                    } 
                    
                    $scope.scheme.dragDrop.state.overlapedDirection = arrow;
                    
                    $scope.scheme.boxes.hoverIcons.newNode = node;
                    
                    Node.add(node._project, node._parent, node ).then(function (node_saved)
                    {
                        if (node_saved)
                        {
                          $scope.scheme.boxes.hoverIcons.newNode._id = node_saved._id;
                          $scope.scheme.boxes.hoverIcons.newNode.id  = node_saved._id;   
                          $scope.scheme.dragDrop.state.overlapedBox = $scope.scheme.boxes.hoverIcons.node;
                          var node = [];
                          node.push($scope.scheme.boxes.hoverIcons.newNode);
                          $scope.scheme.data.push($scope.scheme.boxes.hoverIcons.newNode);
                          $scope.scheme.dragDrop.reorganizeData($scope.scheme.dragDrop.state, node);
                          $scope.scheme.connectors.icons = {};
                          $scope.scheme.connectors.lines = {};                    
                          $scope.scheme.prepareBoxesRelativeArray();  
                          $scope.scheme.drawScheme("drawArea");   
                          $scope.scheme.boxes.hoverIcons.newNode.editing = true;
                          $("#boxInput" + $scope.scheme.boxes.hoverIcons.newNode.id).focus();  
                        }
                    });
                },
                
                
                
                
                
                arrowClick : function(arrow)
                {
                    this.addNewNode(true, arrow);                    
                   
                },
                
                
                doneEditingTitle : function()
                {
                     $scope.scheme.boxes.hoverIcons.newNode.titleEdit = false; 
                     
                     var node = $scope.scheme.boxes.hoverIcons.newNode;
                     
                     if (node.parent == 0)
                     {
                        node.parent = null;
                        
                     }
                     console.log('node-update 795')
                     Node.update(node._id, node).then(function(data){

                     });
                },
                // ON BOX FOCUS OUT
                doneEditingApply : function()
                {
                    // $scope.$apply(function()
                    // {
                    //     $scope.scheme.boxes.doneEditingTitle();   
                    // });
                }
      },
      
      
      
      dragDrop : 
      {
                mouseDown   : false,
                mouseMove   : false,
                mouseUp     : false,
                ghosts      : {},
                ghostArea   : {},
                startX      : false,
                startY      : false,
                areaLeft    : 0,
                areaTop     : 0,
                state       : {},
                
//                ng-show
                arrows      : 
                {
                    "left"  : {label : "left",     x : 0, y : 0},
                    "right" : {label : "right",    x : 0, y : 0},
                    "top"   : {label : "top",      x : 0, y : 0},
                    "bottom": {label : "bottom",   x : 0, y : 0}                                                           
                },
                
                
                
                arrowDisplay : function(arrow, status)
                {
                    
                    if (arrow == "all")
                    {
                        for (var i in this.arrows)
                        {
                            if (status == true)
                            {
                                $("#ddArrow_" + i).show();
                                
                            }
                            else
                            {
                                $("#ddArrow_" + i).hide();

                                this.state.overlapedDirection = false;
                            }
                        }  
                    }
                    else
                    {
                      
                        if (status == true)
                        {
                            $("#ddArrow_" + arrow).show();
                            this.state.overlapedDirection = arrow;
                        }
                        else
                        {
                            $("#ddArrow_" + arrow).hide();
                        }
                    }
                    
                    
                },
                
                mouseIsDown : function(e)
                {
                    if (e.target.id.indexOf("box") == -1)
                    {                 
                        return false;
                    }
               
                    
                    this.ghosts         = {};
                    this.ghostArea      = {};
                    
                    
                    var data = $scope.scheme.data;

                    for (var i in data)
                    {
                        var box = data[i];
                        
                        box.right   = box.left  + box.width;
                        box.bottom  = box.top   + box.height;  
                        
                        var x = e.pageX - $scope.scheme.configs.leftOffset;
                        var y = e.pageY - $scope.scheme.configs.topOffset;     
                        
                        this.stepX  = x;
                        this.stepY  = y;
                                         
                        if (box.left   < x  && 
                            box.right  > x &&
                            box.top    < y &&
                            box.bottom > y 
                            )
                        {
                            this.state.selectedBox  = box;
                            this.ghosts[box["_id"]] = box;
                            
                            this.ghostArea.width = box.left + box.width;
                            
                            this.makeGhost(box);
                            break;
                        }
                        
                      
                    }
                    
                    
                    
                    //$scope.$apply();
                    
                    this.ghostBoxesObjects = $(".ghostBox");
                    this.mainGhostObjectLeft   = box.left;
                    this.mainGhostObjectTop    = box.top;                    

                    this.mouseDown      = true;
                },
                
                makeGhost : function(box)
                {
                    if (box.doNotDrawSubNodes === true)
                    {
                        return false;
                    }
                    
                    var data = $scope.scheme.data;
                     
                     for (var i in data)
                     {

                        if (data[i].parent == box["_id"])
                        {
                            this.ghosts[data[i]["_id"]] = data[i];
                            
                            this.makeGhost(data[i]);
                        }
                     } 
                },
                
                ghostsPosition : { x : 0, y : 0},
                
                mouseIsMoving   : function(e)
                {                
                    if (this.mouseDown === false)
                    {
                        this.checkOverlap(e.pageX, e.pageY, "icons"); 
                        return false;
                    } 
                            
                    
                    this.skipMoving++;
                    
                    if (this.skipMoving < 3)
                    {
                    
                    }
                    else
                    {
                        this.skipMoving = 0;
                        this.checkOverlap(e.pageX, e.pageY, "arrows"); 
                    }                    
                    
                    if (this.skipMoving < 2)
                    {
                        this.ghostsPosition.x    = e.pageX - this.mainGhostObjectLeft - $scope.scheme.configs.leftOffset   - 60;
                        this.ghostsPosition.y    = e.pageY - this.mainGhostObjectTop  - $scope.scheme.configs.topOffset    - 30;          
                    }
                },
                
                
                mouseIsUp       : function(e)
                {
                
                    this.reorganizeData(this.state, this.ghosts);
                    
                    this.areaLeft   = 0;
                    this.areaTop    = 0;
                    this.mouseDown  = false;
                    this.ghosts     = {};


                    this.arrowDisplay("all", false);  
                    
                                 
                },
                
                
                setupArrowsOnOverlap : function (boxLeft, boxTop, x, y, box)
                {
                    
                    this.arrowDisplay("all", false);
                    
                    var x = x - $scope.scheme.configs.leftOffset;
                    var y = y - $scope.scheme.configs.topOffset;                     
                    
                  
                    var boxSides = schemeService.getBoxSides(box, x, y);
                    
                    
                    if (x < boxSides.leftZone)
                    {
                        this.arrowDisplay("left", true);
                        
                    }
                    else if (x > boxSides.rightZone)
                    {
                        this.arrowDisplay("right", true);
                    }
                    else if (y > boxSides.bottomZone)
                    {
                        this.arrowDisplay("bottom", true);
                    }
                    
                    
                               
                    this.arrows.left.x      = boxSides.left      - 10;
                    this.arrows.left.y      = boxSides.centerY   - 6;
                    
                    this.arrows.top.x       = boxSides.centerX    - 10;
                    this.arrows.top.y       = boxSides.top        - 6;
                    
                    this.arrows.right.x     = boxSides.right;
                    this.arrows.right.y     = boxSides.centerY - 6; 
                    
                    this.arrows.bottom.x    = boxSides.centerX  - 6;
                    this.arrows.bottom.y    = boxSides.bottom;                                           
                                        
                               /*
                    this.arrows.left.x = box.left   - 10;
                    this.arrows.left.y = box.top    + box.height/2 - 6;    
                    
                    
                    this.arrows.top.x = box.left    + box.width/2 - 6;
                    this.arrows.top.y = box.top     - 10;                                                              


                    this.arrows.right.x = box.left  + box.width;
                    this.arrows.right.y = box.top   + box.height/2 - 6;

                    
                    this.arrows.bottom.x = box.left + box.width/2 - 6;
                    this.arrows.bottom.y = box.top  + box.height;   
                    */                                                                                                 
                },
                
                checkOverlap    : function(x, y, act)
                {
                    var leftOffset  = $scope.scheme.configs.leftOffset;
                    var topOffset   = $scope.scheme.configs.topOffset;
                    var data        = $scope.scheme.data;
                    var noOverlap   = true;

                     for (var i in data)
                     {
                        var box = data[i];
                       
                     
                        var boxLeft = box.left + leftOffset;
                        var boxTop  = box.top  + topOffset;
                        
                        var notSelectedBox = true;
                        
                        if (act == "arrows")
                        {
                            if (this.state.selectedBox._id == box._id)
                            {
                                notSelectedBox = false;
                            }
                        }
                        
                                                
                        if (  boxLeft                   < x  &&
                             (boxLeft + box.width)      > x  &&
                             
                             boxTop                     < y  &&
                             (boxTop + box.height)      > y  &&
                             
                             !box.hide                       &&
                             
                             notSelectedBox === true
                            
                            )
                            {  
                                if (act == "arrows")
                                {
                                    this.setupArrowsOnOverlap(boxLeft, boxTop, x, y, box);
                                }
                                else if (act == "icons")
                                {
                                    $scope.scheme.boxes.hover(boxLeft, boxTop, x, y, box);
                                }
                                
                                this.state.overlapedBox = box;
                                noOverlap = false;                                 
 
                            }

                                
                                                    
                     } 
                     

                     if (noOverlap === true && act == "icons" && this.state.overlapedBox)
                     {
                        this.state.overlapedBox = false;
                        $scope.scheme.boxes.mouseout();
                     }
                     
                     if (act != 'arrows')
                     {
                        return false;
                     }
                                         
                     if (noOverlap == true)
                     {
                        this.state.overlapedBox       = false;
                        
                        if (act == "arrows")
                        {
                            this.arrowDisplay("all", false);
                        }
                        
                          return false;
                     }
                     else
                     {
                        return true;
                     }
                },
                
                
                
                removeNode  : function(box)
                {                    
                    var nodes   = this.remakeNodes(box.parent, box, "remove");   
            
                    if (nodes.length > 0)
                    {
                        var subNodes = true;
                    }
                    else
                    {
                        var subNodes = false;
                    }
                                       
                    var data    = {"_nodes" : nodes, "subNodes" : subNodes};
                    

                    var newNodeData = $scope.scheme.updateDataObjectById(box.parent, data);  

                    
                    
                    // Delete node
                    var parentBox     = $scope.scheme.getBoxById(box._id);
                    var nodesToDelete   = [];
                    
                    for (var i in parentBox._nodes)
                    {
                        nodesToDelete.push(parentBox._nodes[i]._id);
                    }
                    
                    nodesToDelete.push(parentBox._id);
                    var newData = [];
                    
                    
                    for (var i in $scope.scheme.data)
                    {        
                        var cont = false;            
                        for (var i2 in nodesToDelete)
                        {
                        
                            if ($scope.scheme.data[i]._id == nodesToDelete[i2])
                            {         
                               cont = true;
                               break;
                            }
                        }
                        
                        if (cont == true)
                        {
                            continue;
                        }
                        
                        newData.push($scope.scheme.data[i]);
                       
                    }
                    
                    $scope.scheme.data = newData;
                 
                    $scope.scheme.connectors.icons = {};
                    $scope.scheme.connectors.lines = {};                    
                    $scope.scheme.prepareBoxesRelativeArray();
                    $scope.scheme.drawScheme("drawArea");   
                    
                    
                },
                
                remakeNodes : function(id, box, act)
                {

                    var parentBox     = $scope.scheme.getBoxById(id);
                    
                 
                    var nodes   = parentBox._nodes;
                    
                                
                    if (act == "add")
                    {
                        nodes.push(box);
                    }
                    else if (act == "remove")
                    {
                        // get index
                        var newNodes        = [];
                        var newNodesIndex   = 0;
                        for ( var index in nodes)
                        {
                            if (nodes[index]._id == box._id)
                            {
                                continue;
                            }
                            
                            newNodes[newNodesIndex] = nodes[index];
                            newNodesIndex++;
                        }
                        
                        nodes = newNodes;
                    }
                    
                   
                    
                    
                    return nodes;
                    
                },
                
                reorganizeData : function(state, ghosts)
                {
                    $scope.scheme.connectors.clearLines();
                    var id  = false;
                    var box = false;
                    for (var i in ghosts)
                    {
                        id  = ghosts[i]._id;
                        box = ghosts[i];
                        break;
                    }
                    // Update SOURCE BOX
                    if (box.parent)
                    {
                        var parentOrder     = box.order;
                        var parentPosition  = box.position;                        
                        var nodes   = this.remakeNodes(box.parent, box, "remove");     
                        
                        if (nodes.length > 0)
                        {
                            var subNodes = true;
                        }
                        else
                        {
                            var subNodes = false;
                        }
                                           
                        var data    = {"_nodes" : nodes, "subNodes" : subNodes};
                        if (state.overlapedDirection === "up")  
                        {
                            data.parent = id;
                        }
                                        
                       var newNodeData = $scope.scheme.updateDataObjectById(box.parent, data);      
                        console.log('parent-update 1281')
                        Node.updateParent(box.parent, data.parent);
                    }
                    

                    if (state.overlapedDirection === "up")                        
                    {
                        var level = (state.overlapedBox.level - 1);
                        
                        var parentBox = $scope.scheme.getBoxById(box._id);
                        
                        if (level < 0) level = 0;

                        var data = {
                                        "parent"            :  state.overlapedBox.parent,
                                        "level"             :  level,
                                        "order"             :  state.overlapedBox.order,
                                        "removeNodeFrom"    : box.parent,
                                        "position"          : state.overlapedBox.position
                                    };
                                    
                            
                       var newBox = $scope.scheme.updateDataObjectById(id, data); 
                       console.log('parent-update 1305')

                       Node.updateParent(id, data.parent, function(response)
                        {
                        }, 
                        function(response)
                        {
                        });
                        
                                                 
                       
                       // Update Target Box
                       if (state.overlapedBox.parent != 0)
                       {
                           var nodes   = this.remakeNodes(state.overlapedBox.parent, box, "add");                        
                           var data    = { "_nodes" : nodes, "subNodes" : true};
                                                
                           var newNodeData =  $scope.scheme.updateDataObjectById(state.overlapedBox.parent, data);                          
                       }
                       
                       
                       var overLapedID = state.overlapedBox._id;
                       
  
                        
                    }
                    else if (state.overlapedDirection === "bottom" || state.overlapedDirection === "down")
                    {                        
                        var data = {
                                        "parent"            :  state.overlapedBox._id,
                                        "level"             :  (state.overlapedBox.level + 1),
                                        "order"             :  0,
                                        "removeNodeFrom"    : box.parent
                                    };
                                    
  
                        var newNodeData = $scope.scheme.updateDataObjectById(id, data);
                        console.log('parent-update 1341')

                      Node.updateParent(id, data.parent, function(response)
                        {
                        }, 
                        function(response)
                        {
                        });
                        
                     
                        // Update TARGET BOX
                        var nodes   = this.remakeNodes(state.overlapedBox._id, box, "add");                        
                        var data    = { "_nodes" : nodes, "subNodes" : true};
                                                
                       var newNodeData =  $scope.scheme.updateDataObjectById(state.overlapedBox._id, data);                        
                       
                                             
                        
                    }
                    else if (state.overlapedDirection === "left" || state.overlapedDirection === "right")
                    {
                        if (state.overlapedDirection === "right")
                        {
                            var order = state.overlapedBox.order + 1;
                        }
                        else
                        {
                            var order = state.overlapedBox.order;
                        }
                        
                        var data = {
                                        "parent"  :  state.overlapedBox.parent,
                                        "level"   :  (state.overlapedBox.level + 1),
                                        "order"   :  order
                                    };
                                    
                         var newNodeData = $scope.scheme.updateDataObjectById(id, data);

                        Node.updateParent(id, data.parent).then(function(data){
                          console.log('parent-updated 1380')
                        }).catch(function(error){
                          console.log(error.message)
                        })
                         
                        // Update TARGET BOX
                        if (state.overlapedBox.parent != 0)
                        {
                            var nodes   = this.remakeNodes(state.overlapedBox.parent, box, "add");                        
                            var data    = { "_nodes" : nodes, "subNodes" : true};
                                                
                            var newNodeData = $scope.scheme.updateDataObjectById(state.overlapedBox.parent, data);  
                                                        
                                                     
                        }
                        
                       
                    }
                    
                    $scope.scheme.prepareBoxesRelativeArray();
                    $scope.scheme.drawScheme("drawArea");
                    
//                    this.saveNodeChanges();

                       
                    if (state.overlapedDirection === "up")                       
                    {
                     
                       var b = $scope.scheme.getBoxById(overLapedID);
                          
                       $scope.scheme.dragDrop.state.overlapedDirection = "bottom";
                            
                       $scope.scheme.dragDrop.state.overlapedBox = newBox;                          
                                                 

                       this.reorganizeData($scope.scheme.dragDrop.state, [b]);                     
                    }
                },
             
      } 
      
      
                
      
              
      
      
    };
    
    
      
  
      Node.getList($stateParams.id)
      .then(function (nodes) {
        $scope.scheme.init();
        $scope.scheme.nodes = nodes;
        $scope.scheme.Nodes2Data(nodes, 0, 0);
        $scope.scheme.drawScheme("drawArea");
      });
    }
  ]);

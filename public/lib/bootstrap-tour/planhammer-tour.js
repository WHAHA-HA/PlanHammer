!function(){
  var tour = new Tour({
    name: "siteTour",
    storage: false,
    debug: true,
    orphan: true,
    steps: [
      {
      title: "\"My Projects\" List",
      content: "This is the \"My Projects\" page. Content of step will be displayed here",
      path: "#/projects/created",
      },
      {
      title: "\"Projects I'm Collaborating On\" List",
      content: "This is the \"Projects I'm Collaborating On\" List. Content of step will be displayed here.",
      path: "#/projects/shared",
      element: ".btn-group>a.btn:last-child",
      placement: "right",
      reflex: true,
      },
      {
      title: "\"My Projects\" List",
      content: "This is the \"My Projects\" list. Content of step will be displayed here.",
      path: "#/projects/created",
      element: ".btn-group>a.btn:first-child",
      placement: "top",
      reflex: true,
      },
      {
      title: "Settings",
      content: "This is how you change settings.",
      path: "#/projects/created",
      element: "tr:first-child td:last-child a:nth-child(2)",
      placement: "bottom",
      reflex: true,
      },
      {
      title: "Settings",
      content: "Content of step will be displayed here",
      path: "#/project/{{ project.id }}/manage",
      redirect: function() {
        var id = globalProjects[0].id;
        var url = '#/project/'+id+'/manage';
        document.location.href = url;
        }, 
      },
      {
      title: "Create a New Project",
      content: "Content of step will be displayed here.",
      path: "#/projects/created",
      element: "#create-new",
      placement: "right",
      reflex: true,
      backdrop: true,
      },
      {
      title: "Open Link",
      content: "Content of step will be displayed here.",
      path: "#/projects/created",
      element: "tr:first-child td:last-child a:first-child",
      placement: "bottom",
      backdrop: false,
      reflex: true,
      },
      {
      title: "Project Page",
      content: "This is the project page. Content of step will be displayed here",
      path: "#/project/{{ project.id }}/show",
      redirect: function() {
        var id = globalProjects[0].id;
        var url = '#/project/'+id+'/show';
        document.location.href = url;
        }, 
      },   
      {
      title: "This is a Task",
      content: "Content of step will be displayed here.",
      path: "#/project/{{ project.id }}/show",
      redirect: function() {
        var id = globalProjects[0].id;
        var url = '#/project/'+id+'/show';
        document.location.href = url;
        }, 
      element: "ul#task-list>li:first-child",
      placement: "bottom",
      template: "<div class=\'popover tour tour-step-task\'> <div class=\'arrow\'></div> <h3 class=\'popover-title\'></h3> <div class=\'popover-content\'></div> <div class=\'popover-navigation\'> <div class=\'btn-group\'><button class=\'btn btn-default\' data-role=\'prev\'>« Prev</button><button class=\'btn btn-default\' data-role=\'next\'>Next »</button></div> <button class=\'btn btn-default\' data-role=\'end\'>End tour</button></div></div>",
      },   
      {
      title: "Task Details",
      content: "Content of step will be displayed here.",
      path: "#/project/{{ project.id }}/show",
      redirect: function() {
        var id = globalProjects[0].id;
        var url = '#/project/'+id+'/show';
        document.location.href = url;
        
        angular.element('ul#task-list li:first-child span.taskicon-info').scope().currentNode.showForm = true;
        angular.element('ul#task-list li:first-child span.taskicon-info').scope().$apply(); 
        }, 
      },
      {
      title: "Chart View",
      content: "Content of step will be displayed here.",
      path: "#/project/{{ project.id }}/show/detailed",
      redirect: function() {
        var id = globalProjects[0].id;
        var url = '#/project/'+id+'/show/detailed';
        document.location.href = url;
        }, 
      element: "#toggle-view>a.btn:nth-child(2)",
      placement: "top",
      },
      {
      title: "RACI View",
      content: "Content of step will be displayed here.",
      path: "#/project/{{ project.id }}/show/raci",
      redirect: function() {
        var id = globalProjects[0].id;
        var url = '#/project/'+id+'/show/raci';
        document.location.href = url;
        }, 
      element: "#toggle-view>a.btn:nth-child(3)",
      placement: "right",
      },
      {
      title: "Free Month",
      content: "Invite people to use PlanHammer! Content of step will be displayed here.",
      path: "#/referral",
      element: ".nav li:nth-child(2)",
      placement: "bottom",
      },
      {
      title: "Feedback",
      content: "Content of step will be displayed here.",
      path: "#/feedback",
      element: ".nav li:nth-child(4)",
      placement: "bottom",
      },
      {
      title: "Account",
      content: "Content of step will be displayed here.",
      path: "#/account/profile",
      element: ".nav li:nth-child(5)",
      placement: "bottom",
      onShow: function() {
        setTimeout(function () {
          angular.element('ul.nav-tabs li:nth-child(1) a').scope().select();
          angular.element('ul.nav-tabs li:nth-child(1) a').scope().$apply();
          }, 1000);
        }
      },
      {
      title: "Payments",
      content: "Content of step will be displayed here.",
      path: "#/account/profile", 
      element: ".nav-tabs li:nth-child(2)",
      placement: "bottom",
      onShow: function() {
        setTimeout(function () {
          angular.element('ul.nav-tabs li:nth-child(2) a').scope().select();
          angular.element('ul.nav-tabs li:nth-child(2) a').scope().$apply();
          }, 1000);
        }
      },
      {
      title: "Collaborators",
      content: "Content of step will be displayed here.",
      path: "#/account/profile", 
      element: ".nav-tabs li:nth-child(3)",
      placement: "bottom",
      onShow: function() {
        setTimeout(function () {
          angular.element('ul.nav-tabs li:nth-child(3) a').scope().select();
          angular.element('ul.nav-tabs li:nth-child(3) a').scope().$apply();
          }, 1000);
        }
      },
      {
      title: "Create a New Project",
      content: "Content of step will be displayed here. Create a new project!",
      path: "#/projects/created",
      element: "#create-new",
      placement: "bottom",
      },
    ]
  });
  window.tour = tour;
}(jQuery,window);
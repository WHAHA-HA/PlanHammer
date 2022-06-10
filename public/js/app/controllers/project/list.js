'use strict';

angular.module('App.controllers').controller('ProjectListController', ['$scope', '$rootScope', '$location', '$stateParams', 'Project', 'Analytics', 'Alert',  'User', 'Node',
  function ($scope, $rootScope, $location, $stateParams, Project, Analytics, Alert, User, Node) {
    Analytics.pageTrack('/project');
    Alert.init($scope);

    window.globalProjects = {};
    $scope.projects = {};
    $scope.type = $stateParams.type;
    
    if($scope.type === 'assigned') {
      User.tasksAssigned()
      .then(function (tasks) {
        $scope.tasks = tasks;
      })
      .catch(Alert.danger);
    } else {
      Project.getList({ type: $scope.type })
      .then(function (projects) {
        $scope.projects = projects;
        window.globalProjects = projects;
      })
      .catch(Alert.danger);
    }

    $scope.signout = function () {
      User.signout()
      .then(function () {
        $location.url('/signin');
      })
      .catch(function (error) {
        $location.url('/signin');
      });
    };

    $scope.removeProject = function (project, index) {
      project.$process = true;
      
      Project.remove(project._id)
      .then(function () {
        $scope.projects.splice(index, 1);
      })
      .catch(Alert.danger)
    };

    $scope.updateTask = function (node) {
      Node.update(node._id, node)
      .then(function (node_updated) {
        console.log('updated');
      });
    };

    $rootScope.$on('project.updated', function () {
      Project.getList({ type: $scope.type })
      .then(function (projects) {
        $scope.projects = projects;
        window.globalProjects = projects;
      });
    });
  }
]);

  

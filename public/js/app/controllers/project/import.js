'use strict';

angular.module('App.controllers').controller('ProjectImportController', ['$scope', '$location', '$http', '$stateParams', '$modalInstance', 'Project', 'Alert',
  function ($scope, $location, $http, $stateParams, $modalInstance, Project, Alert) {
    $scope.inputFile = {projectFile: null};
    $scope.fileSending = false;
    $scope.send = function () {
      var result = {};
      var file = $scope.inputFile.projectFile;
      var fd = new FormData();
      fd.append('projectFile', file);
      $scope.fileSending = true;
      $http.post('/api/project/import', fd, {
        transformRequest: angular.identity,
        headers: {'Content-Type': undefined}
      }).success(function(data, status, headers, config) {
        result = {success: 1, message: 'Project file successfully sent!!!'};
        $modalInstance.close(result);
      }).error(function(data, status, headers, config) {
        result = {success: 0, message: 'Failed to send project file!'};
        $modalInstance.close(result);
      });
    };
    $scope.close = function() {
      $modalInstance.dismiss('cancel');
    };
  }
]);
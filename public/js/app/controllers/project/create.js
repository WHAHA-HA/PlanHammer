'use strict';

angular.module('App.controllers').controller('ProjectCreateController', ['$scope', '$rootScope', '$location', '$modal', 'Project', 'Alert',
    function ($scope, $rootScope, $location, $modal, Project, Alert) {
      Alert.init($scope);
      $scope.project = {};

      $scope.create = function (project, projectForm) {
        if (!projectForm.$valid) return;
        
        console.log(project);

        Project.create(project)
        .then(function ($project) {
          $scope.errors = null;
          $rootScope.projectCreated = true;

          Alert.success('Successfully created');
          $location.url('/project/' + $project._id + '/show');
        })
        .catch(function (errors) {
          var errorMessage = errors.name.message;
          $scope.errors = [errorMessage];
        });
      };
      $scope.openImportForm = function() {
        var modalInstance = $modal.open({
          templateUrl: 'importModal.html',
          controller: 'ProjectImportController'
        });
        
        modalInstance.result.then(function (result) {
          if (result.success == 1) {
            Alert.success(result.message);
            $location.url('/projects/created');
          } else {
            $scope.errors = result.message;
          }
        }, function () {
          $log.info('Modal dismissed at: ' + new Date());
        });
      };
    }
  ])

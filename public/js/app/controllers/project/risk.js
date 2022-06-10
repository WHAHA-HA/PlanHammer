'use strict';

angular.module('App.controllers').controller('ProjectRiskController', ['$scope', '$location', '$http', '$stateParams', '$modalInstance', 'Project', 'Alert', 'risk',
  function ($scope, $location, $http, $stateParams, $modalInstance, Project, Alert, risk) {
    $scope.risk = risk;

    $scope.close = function() {
      $modalInstance.close();
    };
  }
]);

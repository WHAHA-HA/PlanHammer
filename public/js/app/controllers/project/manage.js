'use strict';

angular.module('App.controllers').controller('ProjectManageController', ['$scope', '$location', '$http', '$timeout', '$stateParams', 'Project', 'Board', 'Alert', 'Time',
    function ($scope, $location, $http, $timeout, $stateParams, Project, Board, Alert, Time) {
      Alert.init($scope);
      $scope.project = null;
      $scope.timezones = Time.timezones();

      if (!$stateParams.id) return;

      Project.get($stateParams.id)
      .then(function (project) {
        $scope.project = project;

        if (project.image) {
          Project.getImage($scope.project.id)
          .then(function (image) {
            $scope.project.image = image;
          });
        }
      })
      .catch(Alert.danger);

      $scope.update = function (name, value) {
        var payload = {};

        if (name == 'show_numbers') {
          payload.settings = { 'show_numbers': value };
        } else {
          payload[name] = value;
        }

        Project.update($stateParams.id, payload)
        .then(function () {
          Alert.success('Project ' + name + ' was updated successfully');
          $scope.$emit('project.updated');
        })
        .catch(Alert.danger);
      };

      $scope.upload = function () {
        var files = angular.element('.image-uploader-form input[type="file"]')[0].files;
        var fd = new FormData();

        fd.append("image", files[0]);

        Project.setImage($scope.project.id, fd)
        .then(function () {
          var image_url = '/api/project/' + $scope.project.id +'/image?' + (new Date).getTime();
          angular.element('.image-uploader-form img.project-logo').attr('src', image_url);
        })
        .catch(Alert.danger);
      };
    }
  ]);

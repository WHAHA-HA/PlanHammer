'use strict';

angular.module('App.controllers').controller('ProjectInviteController', ['$scope', '$location', '$http', '$stateParams', '$modalInstance', 'Project', 'Node', 'node', 'Alert', 'User',
    function ($scope, $location, $http, $stateParams, $modalInstance, Project, Node, node, Alert, User) {
      Alert.init($scope);
      $scope.invited_user = {};
      $scope.users = [];
      $scope.waiting_assignments = [];

      Node.get(node._id)
      .then(function (full_node) {
        $scope.node = full_node;
      });

      Node.waitingRequests(node._id)
      .then(function (assignments) {
        $scope.waiting_assignments = assignments || [];
      });

      var user = { _id: '', email: '' };
      var projectId = $stateParams.id;

      $scope.onSelectUser = function ($item, $model, $label) {
        user._id = $item._id;
        user.email = $model;
      };
      $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
      };

      $scope.usersByEmail = User.searchByEmail;

      $scope.submit = function (invited_user, nodeUserForm) {
        var payload = {
          node: $scope.node._id,
          email: invited_user.email,
          project: invited_user.project
        };

        Node.invite(payload)
        .then(function (user) {
          if (user) {
            $scope.node._shared.push({ user: user });
          } else {
            $scope.waiting_assignments.push({ email: invited_user.email })
          }
          invited_user.email = '';

          if (invited_user.assign) {
            User.assign(payload.email, payload.node).then().catch(Alert.danger);
          }
          
        })
        .catch(Alert.danger);
      };

      $scope.reject = function (user, index, from_waiting) {
        user.$rejecting = true
        Node.reject($scope.node._id, user.email)
        .then(function () {
          if (from_waiting) {
            $scope.waiting_assignments.splice(index, 1);
          } else {
            $scope.node._shared.splice(index, 1);
          }

          user.$rejecting = false;
        });
      };

    }
  ])

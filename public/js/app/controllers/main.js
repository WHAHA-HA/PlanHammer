'use strict';

angular.module('App.controllers', ['ngCsv', 'ngSanitize'])
  .controller('AppController', ['$scope', '$http', '$location', 'User',
    function ($scope, $http, $location, User) {
      $scope.signout = function () {
        console.log('click')
        User.signout()
        .then(function () {
          $location.url('/signin');
        })
        .catch(function (error) {
          $location.url('/signin');
        });
      };
    }
  ])
  .controller('StaticController', ['$scope', 'Analytics', '$state',
    function ($scope, Analytics, $state) {
      if (typeof $state.current.data !== 'undefined') {
        var pageName = $state.current.data.pageName;
        if (typeof pageName !== 'undefined' && pageName.trim() !== '') {
          Analytics.pageTrack('/' + pageName);  
        }
      }
    }
  ]);

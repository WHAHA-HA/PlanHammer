'use strict';

angular.module('App.services')
.service('Alert', function ($timeout) {
  var self = this;

  this.init = function (scope) {
    self.scope = scope;
    self.clear();
  };

  this.success = function (text, $scope) {
    if (!text) return;
    
    self.scope.message = {
      type: 'success',
      text: text
    };

    $timeout(function (){ self.clear(); }, 3000);
  };

  this.info = function (text, $scope) {
    if (!text) return;

    self.scope.message = {
      type: 'info',
      text: text
    };

    $timeout(function (){ self.clear(); }, 3000);
  };

  this.warning = function (text, $scope) {
    if (!text) return;

    self.scope.message = {
      type: 'warning',
      text: text
    };

    $timeout(function (){ self.clear(); }, 3000);
  };

  this.danger = function (text) {
    if (!text) return;

    self.scope.message = {
      type: 'danger',
      text: text
    };

    $timeout(function (){ self.clear(); }, 3000);
  };

  this.clear = function () {
    self.scope.message = null;
  };
});

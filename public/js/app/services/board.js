'use strict';

angular.module('App.services')
  .service('Board', function($rootScope, $location, $http, $q) {
    var self = this;
    
    self.all = function (project_id) {
      var deffered = $q.defer();
      var url = '/api/project/' + project_id + '/board';

      $http.get(url)
      .success(deffered.resolve)
      .error(function (data) {
        deffered.reject(data.message);
      });

      return deffered.promise;
    };

    self.create = function (name, project_id) {
      var deffered = $q.defer();
      var url = '/api/board';
      var payload = {
        name: name,
        project: project_id
      };

      $http.post(url, payload)
        .success(deffered.resolve)
        .error(function (data) {
          deffered.reject(data.message);
        });

      return deffered.promise;
    };

    self.remove = function (board_id, project_id) {
      var deffered = $q.defer();
      var url = '/api/board/' + board_id;

      $http.delete(url)
      .success(deffered.resolve)
      .error(function (data) {
        deffered.reject(data.message);
      });
      
      return deffered.promise;
    };

    self.update = function (project_id, board_id, payload) {
      var deffered = $q.defer();
      var url = '/api/project/' + project_id + '/board/' + board_id;

      $http.put(url, payload)
      .success(deffered.resolve)
      .error(function (data) {
        deffered.reject(data.message);
      });

      return deffered.promise;
    };

    self.create_list = function (name, board_id) {
      var deffered = $q.defer();
      var url = '/api/board/' + board_id + '/list';
      var payload = {
        name: name
      };

      $http.post(url, payload)
      .success(deffered.resolve)
      .error(function (data) {
        deffered.reject(data.message);
      });

      return deffered.promise;
    };

    self.remove_list = function (list_id, board_id) {
      var deffered = $q.defer();
      var url = '/api/board/' + board_id + '/list/' + list_id;

      $http.delete(url)
      .success(deffered.resolve)
      .error(function (data) {
        deffered.reject(data.message);
      });
      
      return deffered.promise;
    };

    self.update_list = function (list_id, board_id, payload) {
      var deffered = $q.defer();
      var url = '/api/board/' + board_id + '/list/' + list_id;

      $http.put(url, payload)
      .success(deffered.resolve)
      .error(function (data) {
        deffered.reject(data.message);
      });

      return deffered.promise;
    };

    self.add_to_list = function (task_id, list_id, position) {
      var deffered = $q.defer();
      var url = '/api/list/' + list_id + '/task';
      var payload = {
        node: task_id,
        position: position
      };

      $http.post(url, payload)
      .success(deffered.resolve)
      .error(function (data) {
        deffered.reject(data.message);
      });

      return deffered.promise;
    };

    self.update_task = function (list_id, node_id, payload) {
      var deffered = $q.defer();
      var url = '/api/list/' + list_id + '/task/' + node_id;

      $http.put(url, payload)
      .success(deffered.resolve)
      .error(function (data) {
        deffered.reject(data.message);
      });

      return deffered.promise;
    };

    self.remove_task = function (task_id, list_id) {
      var deffered = $q.defer();
      var url = '/api/list/' + list_id + '/task/' + task_id;

      $http.delete(url)
      .success(deffered.resolve)
      .error(function (data) {
        deffered.reject(data.message);
      });
      
      return deffered.promise;
    };
  });

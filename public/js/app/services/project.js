'use strict';

angular.module('App.services')
  .service('Project', function($rootScope, $location, $http, $q) {
    var self = this;

    self.create = function (payload) {
      var deffered = $q.defer();

      $http.post('/api/project', payload)
        .success(function (data) {
          deffered.resolve(data.project);
        })
        .error(function (data) {
          deffered.reject(data.message.errors || [data.message]);
        });

      return deffered.promise;
    };

    self.get = function (id) {
      var deffered = $q.defer();
      var url = '/api/project/' + id;

      $http.get(url)
        .success(function (project) {
          deffered.resolve(project);
        })
        .error(function (data) {
          deffered.reject(data.message);
        });

      return deffered.promise;
    };

    self.getList = function (payload) {
      var deffered = $q.defer();

      $http.post('/api/project/list', payload)
        .success(function (data) {
          deffered.resolve(data.projects);
        })
        .error(function (data) {
          deffered.reject(data.message);
        });

      return deffered.promise;
    };

    self.addUser = function (payload) {
      var deffered = $q.defer();

      $http.post('/api/project/addUser', payload)
        .success(function (data) {
          deffered.resolve(data);
        })
        .error(function (data) {
          deffered.reject(data.message);
        });

      return deffered.promise;
    };

    self.update = function (project_id, payload) {
      var deffered = $q.defer();
      var url = '/api/project/' + project_id;
      
      $http.put(url, payload)
        .success(function (data) {
          deffered.resolve();
        })
        .error(function (data) {
          deffered.reject(data.message);
        });

      return deffered.promise;
    };

    self.remove = function (project_id) {
      var deffered = $q.defer();
      var url = '/api/project/delete';
      var payload = { project_id: project_id };

      $http.post(url, payload)
        .success(function (data) {
          deffered.resolve();
        })
        .error(function (data) {
          deffered.reject(data.message);
        });

      return deffered.promise;
    };

    self.getImage = function (project_id) {
      var deffered = $q.defer();
      var image_url = '/api/project/' + project_id + '/image?buffer=true';

      $http.get(image_url)
        .success(function (data) {
          deffered.resolve(data);
        })
        .error(function (data) {
          deffered.reject(data);
        });

      return deffered.promise;
    };

    self.setImage = function (project_id, form_data) {
      var deffered = $q.defer();
      var url = '/api/project/' + project_id + '/image';
      var options = {
        withCredentials: true,
        headers: {'Content-Type': undefined },
        transformRequest: angular.identity
      };

      $http.post(url, form_data, options)
        .success(function (data) {
          deffered.resolve();
        })
        .error(function (data) {
          deffered.reject(data.message);
        });

      return deffered.promise;
    };

    self.addRaci = function (payload) {
      var deffered = $q.defer();
      var url = '/api/project/' + payload.project + '/raci';

      $http.post(url, payload)
        .success(deffered.resolve) 
        .error(function (error) {
          deffered.reject(error.message);
        });

      return deffered.promise;
    };

    self.updateRaci = function (project_id, raci_id, payload) {
      var deffered = $q.defer();
      var url = '/api/project/' + project_id + '/raci/' + raci_id;

      $http.put(url, payload)
        .success(function (data) {
          deffered.resolve(data);
        })
        .error(function (error) {
          deffered.reject(error.message);
        });

      return deffered.promise;
    };

    self.deleteRaci = function (project_id, raci_id) {
      var deffered = $q.defer();
      var url = '/api/project/' + project_id + '/raci/' + raci_id;

      $http.delete(url)
        .success(deffered.resolve) 
        .error(function (error) {
          deffered.reject(error.message);
        });

      return deffered.promise;
    };

    self.deleteResource = function (project_id, resource) {
      var deffered = $q.defer();
      var url = '/api/project/' + project_id + '/resource/' + resource;

      $http.delete(url)
        .success(deffered.resolve) 
        .error(function (error) {
          deffered.reject(error.message);
        });

      return deffered.promise;
    };

    self.getRaciList = function (project_id) {
      var deffered = $q.defer()
      var url = '/api/project/' + project_id + '/raci';

      $http.get(url)
        .success(function (data) {
          deffered.resolve(data);
        })
        .error(function (data) {
          deffered.reject(data.message);
        });

      return deffered.promise;
    };
  });

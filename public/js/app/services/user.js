'use strict';

angular.module('App.services')
  .service('User', function($rootScope, $location, $cookieStore, $http, $q) {
    var self = this;
    var currentUser = null;

    function changeUser(user) {
      _.extend(currentUser, user);
    };

    self.auth = function (user) {
      $cookieStore.put('user', user);
    };

    self.isLogged = function () {
      return !angular.isUndefined($cookieStore.get('user'));
    };

    self.clean = function () {
      $cookieStore.remove('user');
    };
    
    self.get = function (name) {
      var user = $cookieStore.get('user');
      return (!_.isUndefined(user)) ? user[name] : null;
    };

    self.signin = function (user) {
      var deffered = $q.defer();

      $http.post('/api/signin', user)
        .success(function(data) {
          self.auth(data.user);
          deffered.resolve(data.user, data.redirect);
        })
        .error(function(data) {
          self.clean();
          deffered.reject(data.message);
        });

      return deffered.promise;
    };

    self.me = function () {
      var deffered = $q.defer();

      $http.get('/api/user/me')
        .success(function(data) {
          deffered.resolve(data);
        })
        .error(function(data) {
          deffered.reject(data.message);
        });

      return deffered.promise;
    };

    self.loggedin =function () {
      var deffered = $q.defer();

      $http.post('/api/loggedin', {})
        .success(function(data) {
          deffered.resolve(data.user);
        })
        .error(function(data) {
          self.clean();
          deffered.reject(data.message);
        });

      return deffered.promise;
    };

    self.signup = function (user) {
      var deffered = $q.defer();
      var payload = {
        username: user.username,
        email:user.email,
        password: user.password,
        referral: user.referral
      };

      $http.post('/api/signup', payload)
        .success(function(data, status, headers, config) {
          self.auth(data.user);
          deffered.resolve(data.user);
        })
        .error(function(data) {
          self.clean();
          deffered.reject(data.message.errors || data.message);
        });

      return deffered.promise;
    };

    self.confirm = function (code) {
      var deffered = $q.defer();

      $http.post('/api/user/confirm', { code: code })
        .success(function(data) {
          deffered.resolve();
        })
        .error(function (data) {
          deffered.reject(data.message);
        })

      return deffered.promise;
    };

    self.signout = function () {
      var deffered = $q.defer();

      $http.post('/api/signout', {changedProjects: $rootScope.changedProjects, projectCreated: $rootScope.projectCreated})
        .success(function(data) {
          self.clean();
          deffered.resolve();
        })
        .error(function (data) {
          deffered.reject(data.message);
        });
      $rootScope.changedProjects = [];
      $rootScope.projectCreated = false;

      return deffered.promise;
    };

    self.update = function (user) {
      var deffered = $q.defer();

      $http.post('/api/user/update', user)
        .success(function(data) {
          self.auth(data.user);
          deffered.resolve(data.user);
        })
        .error(function(data) {
          var msg = data.message;

          if (msg && !_.isArray(msg)) msg = [msg];

          self.clean();
          deffered.reject(msg);
        });

      return deffered.promise;
    };

    self.invite = function (data_send) {
      var deffered = $q.defer();

      $http.post('/api/user/invite', data_send)
        .success(function(data) {
          deffered.resolve();
        })
        .error(function(data) {
          deffered.reject(data.message);
        });

      return deffered.promise;
    };

    self.deactivate = function () {
      var deffered = $q.defer();

      $http.post('/api/user/deactivate', {})
        .success(function() {
          deffered.resolve();
        })
        .error(function(data) {
          self.clean();
          deffered.reject(data.message);
        });

      return deffered.promise;
    };

    self.collaborators = function () {
      var deffered = $q.defer();
      var url = '/api/user/collaborators';

      $http.get(url)
        .success(function (data) {
          deffered.resolve(data);
        })
        .error(function (data) {
          deffered.reject(data.message);
        });

      return deffered.promise;
    };

    self.removeFromProjects = function (user_id) {
      var deffered = $q.defer();
      var url = '/api/user/' + user_id + '/from_project/';

      $http.delete(url)
        .success(function () {
          deffered.resolve();
        })
        .error(function (data) {
          deffered.reject(data.message);
        });

      return deffered.promise;
    };

    self.assignedNodes = function (user_id, project_id) {
      var deffered = $q.defer();
      var url = '/api/user/' + user_id + '/project/' + project_id +  '/nodes';
      
      $http.get(url)
        .success(function (data) {
          deffered.resolve(data);
        })
        .error(function (data) {
          deffered.reject(data.message);
        });

      return deffered.promise;
    };

    self.resetLink = function (email) {
      var deffered = $q.defer()
      var url = '/user/reset';
      var payload = { email: email };

      $http.post(url, payload)
        .success(function (data) {
          deffered.resolve(data);
        })
        .error(function (data) {
          deffered.reject(data.message);
        });

      return deffered.promise;
    };

    self.reset = function (token, pass1, pass2) {
      var deffered = $q.defer()
      var url = '/user/reset/' + token;
      var payload = { password1: pass1, password2: pass2 };

      $http.post(url, payload)
        .success(function (data) {
          deffered.resolve(data);
        })
        .error(function (data) {
          deffered.reject(data.message);
        });

      return deffered.promise;
    };

    self.search = function (q) {
      return $http.post('/api/user/search', { q: q }).then(function (response) {
        return response.data;
      });
    };

    self.searchByEmail = function (email) {
      return $http.post('/api/user/searchByEmail', { q: email }).then(function (response) {
        return response.data;
      });
    };

    self.searchByUsername = function (username) {
      return $http.post('/api/user/searchByUsername', { q: username }).then(function (response) {
        return response.data;
      });
    };

    self.assign = function (email, node_id) {
      var deffered = $q.defer();
      var url = '/api/user/assign/';
      var payload = {
        email: email,
        node: node_id
      };

      $http.post(url, payload)
        .success(function (data) {
          deffered.resolve(data);
        })
        .error(function (data) {
          deffered.reject(data.message);
        });

      return deffered.promise;
    };

    self.tasksAssigned = function () {
      var deffered = $q.defer();
      var url = '/api/user/assigned_tasks/';
      
      $http.get(url)
        .success(function (data) {
          deffered.resolve(data);
        })
        .error(function (data) {
          deffered.reject(data.message);
        });

      return deffered.promise;
    };

    self.getImage = function (user_id) {
      var deffered = $q.defer();
      var image_url = '/api/user/' + user_id + '/image?buffer=true';

      $http.get(image_url)
        .success(function (data) {
          deffered.resolve(data);
        })
        .error(function (data) {
          deffered.reject(data);
        });

      return deffered.promise;
    };

    self.setImage = function (user_id, form_data) {
      var deffered = $q.defer();
      var url = '/api/user/' + user_id + '/image';
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
  });

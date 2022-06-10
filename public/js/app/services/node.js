'use strict';

angular.module('App.services')
  .service('Node', function($rootScope, $location, $http, $q) {
    var self = this;

    // Getting nodes list 
    self.getList = function (project) {
      var deffered = $q.defer();

      $http.post('/api/project/nodes', { project: project })
        .success(function (data) {
          deffered.resolve(data.nodes);
        })
        .error(function (data) {
          deffered.reject(data.message);
        });

      return deffered.promise;
    };

    // Update node info
    self.update = function (node_id, node_data) {
      var deffered = $q.defer();
      var url = '/api/project/node/' + node_id;
      var payload = {'node_data': node_data };
      
      $http.put(url, payload)
        .success(function (data) {
          deffered.resolve(data);
        })
        .error(function (data) {
          deffered.reject(data.message);
        });

      return deffered.promise;
    };

    // Update parent for Node
    self.updateParent = function (node_id, parent_id) {
      var deffered = $q.defer();
      var url = '/api/project/node/' + node_id + '/parent'
      var data = {
        parent_id: parent_id
      };

      $http.put(url, data )
        .success(function (data) {
          deffered.resolve(data.node);
        })
        .error(function (data) {
          deffered.reject(data.message);
        });

      return deffered.promise;
    };

    // Add Node
    self.add = function (project_id, parent_id, node_data) {
      var deffered = $q.defer();
      var url = '/api/project/node/' + ((parent_id) ? 'add' : 'add_root');
      var payload = { project_id: project_id, parent_id: parent_id, node_data: node_data };
      $http.post(url, payload)
        .success(function (data) {
          deffered.resolve(data.node);
        })
        .error(function (data) {
          deffered.reject(data.message);
        });

      return deffered.promise;
    };

    // Delete node
    self.delete = function (node_id) {
      var deffered = $q.defer();
      var url = '/api/project/node/' + node_id;
      
      $http.delete(url)
        .success(function (data) {
          deffered.resolve();
        })
        .error(function (data) {
          deffered.reject(data.message);
        });

      return deffered.promise;
    };

    // Get node full info
    self.get = function (node_id) {
      var deffered = $q.defer();
      var url = '/api/project/node/' + node_id;

      $http.get(url)
        .success(function (data) {
          deffered.resolve(data.node);
        })
        .error(function (data) {
          deffered.reject(data.message);
        });

      return deffered.promise;
    };

    self.addDependency = function (current_id, dep_id, type) {
      var deffered = $q.defer();
      var url = '/api/project/node/' + current_id + '/dependency';
      var payload = { id: dep_id, type: type };

      $http.post(url, payload)
        .success(function (data) {
          deffered.resolve(data);
        })
        .error(function (data) {
          deffered.reject(data.message);
        });

      return deffered.promise;
    };

    self.deleteDependency = function (current_id, dep_id, type) {
      var deffered = $q.defer();
      var url = '/api/project/node/' + current_id + '/dependency/' + dep_id + '/' + type;

      $http.delete(url)
        .success(function (data) {
          deffered.resolve(data);
        })
        .error(function (data) {
          deffered.reject(data.message);
        });

      return deffered.promise;
    };

    self.addQuality = function (node_id, payload) {
      var deffered = $q.defer();
      var url = '/api/project/node/' + node_id + '/quality';

      $http.post(url, payload)
        .success(function (data) {
          deffered.resolve(data);
        })
        .error(function (data) {
          deffered.reject(data.message);
        });

      return deffered.promise;
    };

    self.updateQualityText = function(nodeId, qualityId, newText) {
      var deffered = $q.defer();
      var url = '/api/project/node/' + nodeId + '/quality/' + qualityId;
      var payload = {
        text: newText
      };

      $http.put(url, payload)
        .success(function (data) {
          deffered.resolve(data);
        })
        .error(function (data) {
          deffered.reject(data.message);
        });

      return deffered.promise;
    };

    self.updateQuality = function (node_id, quality_id, completed) {
      var deffered = $q.defer();
      var url = '/api/project/node/' + node_id + '/quality/' + quality_id;
      var payload = {
        completed: completed
      };

      $http.put(url, payload)
      .success(function (data) {
        deffered.resolve(data);
      })
      .error(function (data) {
        deffered.reject(data.message);
      });

      return deffered.promise;
    };

    self.deleteQuality = function (node_id, quality_id) {
      var deffered = $q.defer();
      var url = '/api/project/node/' + node_id + '/quality/' + quality_id

      $http.delete(url)
        .success(function (data) {
          deffered.resolve(data);
        })
        .error(function (data) {
          deffered.reject(data.message);
        });

      return deffered.promise;
    };

    self.addRisk = function (node_id, payload) {
      var deffered = $q.defer();
      var url = '/api/project/node/' + node_id + '/risk';

      $http.post(url, payload)
        .success(function (data) {
          deffered.resolve(data);
        })
        .error(function (data) {
          deffered.reject(data.message);
        });

      return deffered.promise;
    };

    self.deleteRisk = function (node_id, risk_id) {
      var deffered = $q.defer();
      var url = '/api/project/node/' + node_id + '/risk/' + risk_id;

      $http.delete(url)
        .success(function (data) {
          deffered.resolve(data);
        })
        .error(function (data) {
          deffered.reject(data.message);
        });

      return deffered.promise;
    };


    //Invite user to Node
    self.invite = function (payload) {
      var deffered = $q.defer();
      var url = '/api/project/node/invite';
      
      $http.post(url, payload)
        .success(function (data) {
          deffered.resolve(data.user);
        })
        .error(function (data) {
          deffered.reject(data.message);
        });

      return deffered.promise;
    };

    // Reject user from node
    self.reject = function (node_id, email) {
      var deffered = $q.defer();
      var url = '/api/project/node/reject';
      var payload = { node_id: node_id, email: email } 
      
      $http.post(url, payload)
        .success(function (data) {
          deffered.resolve();
        })
        .error(function (data) {
          deffered.reject(data.message);
        });

      return deffered.promise;
    };

    // Getting list of users that waiting for invitation (not registered yet)
    self.waitingRequests = function (node_id) {
      var deffered = $q.defer();
      var url = '/api/project/node/delayed_assignment';
      var payload = { node_id: node_id }; 
      
      $http.post(url, payload)
        .success(function (data) {
          deffered.resolve(data.assignments);
        })
        .error(function (data) {
          deffered.reject(data.message);
        });

      return deffered.promise;
    };

    self.nodesByTitle = function (title, project_id) {
      var url = '/api/project/node/searchByTitle';
      var payload = { q: title, project_id: project_id };

      return $http.post(url, payload).then(function (res) {
        return res.data;
      });
    };

    self.changePosition = function (id, position) {
      var deffered = $q.defer();
      var url = '/api/project/node/' + id + '/position';
      var payload = { position: position };

      $http.post(url, payload)
        .success(function (data) {
          deffered.resolve();
        })
        .error(function (error) {
          deffered.reject(error.message);
        });

      return deffered.promise;
    };

    self.addFile = function (node_id, payload) {
      var deffered = $q.defer();
      var url = '/api/project/node/' + node_id + '/file';

      $http.post(url, payload)
        .success(deffered.resolve)
        .error(function (error) {
          deffered.reject(error.message);
        });
        
      return deffered.promise;
    };

    self.deleteFile = function (node_id, file_id) {
      var deffered = $q.defer();
      var url = '/api/project/node/' + node_id + '/file/' + file_id;

      $http.delete(url)
        .success(deffered.resolve) 
        .error(function (error) {
          deffered.reject(error.message);
        });

      return deffered.promise;
    };

    self.getRaci = function (node_id) {
      var deffered = $q.defer();
      var url = '/api/project/node/' + node_id + '/raci';

      $http.get(url)
        .success(deffered.resolve) 
        .error(function (error) {
          deffered.reject(error.message);
        });

      return deffered.promise;
    };
  });

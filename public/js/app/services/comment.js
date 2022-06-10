'use strict';

angular.module('App.services')
.service('Comment', function($rootScope, $http, $q) {
  var self = this;
  
  self.all = function (node_id) {
    var deffered = $q.defer();
    var url = '/api/node/' + node_id + '/comments';

    $http.get(url)
    .success(function (comments) {
      if (comments.length === 0) comments = [''];

      self.traverse(comments, function (comment) {
        if (comment.children.length === 0){
          comment.children = [''];
        }
        comment.upvotes_count = comment.upvotes.length;
      });
      deffered.resolve(comments);
    })
    .error(function (data) {
      deffered.reject(data.message);
    });

    return deffered.promise;
  };

  self.add = function (payload) {
    var deffered = $q.defer();
    var url = '/api/node/' + payload.node + '/comments';

    $http.post(url, payload)
    .success(deffered.resolve)
    .error(function (data) {
      deffered.reject(data.message);
    });

    return deffered.promise;
  };

  self.remove = function (id) {
    var deffered = $q.defer();
    var url = '/api/comment/' + id;

    $http.delete(url)
    .success(deffered.resolve)
    .error(function (data) {
      deffered.reject(data.message);
    });

    return deffered.promise;
  };

  self.update = function (id, payload) {
    var deffered = $q.defer();
    var url = '/api/comment/' + id;

    $http.put(url, payload)
    .success(deffered.resolve)
    .error(function (error) {
      deffered.reject(error.message);
    });

    return deffered.promise;
  };

  self.traverse = function (comments, fn) {
    comments.forEach(function (comment) {
      if (comment && comment.children) {
        fn(comment);
        self.traverse(comment.children, fn);
      }
    });
  };
});

'use strict';

angular.module('App.services')
  .service('Export', function ($http, $location) {
    var self = this;

    self.export_handler = function (url, data, export_type) {
      $http.post(url, data)
        .success(function (data) {
          var el = $('#export-' + export_type);
          el.attr('href', data.path)[0].click();
        })
        .error(function (data) {
          if (data.type ==='payment') {
            $location.url('/account/payments');
          }
        });
    };

    self.simple = function (export_type, project, tree) {
      var url = '/api/project/export/' + export_type + '/simple';
      var data = {
        project_id: project.id
      };

      if (export_type === 'raci') {
        data.raci = tree;
      } else if (export_type === 'risk-csv') {
        data.risks = tree;
      } else {
        data.tree = tree;
      }

      self.export_handler(url, data, export_type);
    };

    self.detailed = function (export_type, project, html_doc) {
      var url = '/api/project/export/' + export_type + '/detailed';
      var data = {
        project_id: project.id,
        html_doc: html_doc
      };

      self.export_handler(url, data, export_type);
    };
  });

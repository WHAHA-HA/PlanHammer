'use strict';

angular.module('App.services', [])
  .service('Analytics', function($analytics) {
    function pageTrack(pageUrl) {
      //to do: put a condition for different environments like localhost.
      $analytics.pageTrack(pageUrl);
    }
    this.pageTrack = pageTrack;
  })
  .factory('Config', function($location) {
    var host = $location.host();
    var config = {
      dev: {
        stripe: {
          api: 'pk_test_4nidLlr4nSBYx2nlZR3FuAZU'
        }
      },

      prod: {
        stripe: {
          api: 'pk_live_Ck9RvXWb9gHAq4hDETrZ4Xhh'
        }
      }
    };

    return (host === 'planhammer.io') ? config.prod : config.dev;
  });

'use strict';

angular.module('App.services')
  .service('Analytics', function($analytics) {
    function pageTrack(pageUrl) {
      //to do: put a condition for different environments like localhost.
      $analytics.pageTrack(pageUrl);
    }
    this.pageTrack = pageTrack;
  });

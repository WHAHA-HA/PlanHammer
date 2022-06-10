'use strict';

angular.module('App.services')
.service('Picker', function () {
  var self = this;

  self.google = function ($btn, cb) {
    var developerKey = 'AIzaSyBm9MfyKfeVLkwCzKR7Szcz037PPs8tHIw';
    var clientId = '957065445007-46ak8t91c9ihv6ae40t23fdt8bjoie3f.apps.googleusercontent.com';
    var scope = ['https://www.googleapis.com/auth/drive.readonly'];

    var pickerApiLoaded = false;
    var oauthToken;

    window.onApiLoad = function () {
      $btn.click(function () {
        gapi.load('auth', {'callback': onAuthApiLoad});
        gapi.load('picker', {'callback': onPickerApiLoad});
      });
    };

    function onAuthApiLoad() {
      window.gapi.auth.authorize(
        {
          'client_id': clientId,
          'scope': scope,
          'immediate': false
        },
        handleAuthResult);
    };

    function onPickerApiLoad() {
      pickerApiLoaded = true;
      createPicker();
    };

    function handleAuthResult(authResult) {
      if (authResult && !authResult.error) {
        oauthToken = authResult.access_token;
        createPicker();
      }
    };

    function createPicker() {
      if (pickerApiLoaded && oauthToken) {
        var picker = new google.picker.PickerBuilder().
            addView(google.picker.ViewId.DOCS).
            setOAuthToken(oauthToken).
            setDeveloperKey(developerKey).
            setCallback(pickerCallback).
            build();
        picker.setVisible(true);
      }
    }

    function pickerCallback(data) {
      if (data.action === 'picked') cb(data.docs);
    };
    
    $.ajax({
      url: 'https://apis.google.com/js/api.js?onload=onApiLoad',
      dataType: "script",
    });
  }
});

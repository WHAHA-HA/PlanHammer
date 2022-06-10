'use strict';

angular.module('App.services')
  .service('Payment', function($rootScope, $location, $http, $q) {
    var self = this;
    
    self.updateCard = function (token) {
      var deffered = $q.defer();

      $http.post('/api/payment/card/update', { token: token })
        .success(function (data) {
          deffered.resolve(data.plan);
        })
        .error(function (data) {
          deffered.reject(data.message);
        });

      return deffered.promise;
    };

    self.getPlan = function () {
      var deffered = $q.defer();

      $http.post('/api/payment/plan/get', {})
        .success(function (data) {
          deffered.resolve(data.plan);
        })
        .error(function (data) {
          deffered.reject(data.message);
        });

      return deffered.promise;
    };

    self.initPlugin = function () {
      $('#card-form').card({
        container: '.card-wrapper',
        numberInput: 'input#cardNumber',
        expiryInput: '#expdate',
        cvcInput: 'input#cvc',
        nameInput: 'input#nameOnCard',
        width: 320,
        formatting: true,
        messages: {
          validDate: 'valid\ndate',
          monthYear: 'mm/yyyy',
          fullName: 'Say my name'
        },
        values: {
          number: '•••• •••• •••• ••••',
          name: 'Full Name',
          expiry: '••/••',
          cvc: '•••'
        }
      });
    };
  });

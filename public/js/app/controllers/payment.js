'use strict';

angular.module('App.controllers')
   .controller('UserCardController', ['$scope', '$location', '$rootScope', '$http', '$stateParams', 'User', 'Config', 'Payment',
    function ($scope, $location, $rootScope, $http, $stateParams, User, Config, Payment) {
      $scope.showUpdateForm = false;
      $scope.card = {};

      Payment.getPlan()
      .then(function (plan) {
        if (plan) $scope.currentPlan = plan;
      });

      Payment.initPlugin();

      $scope.updateCard = function(card, cardForm) {
        Stripe.setPublishableKey(Config.stripe.api);

        var expdate = card.expdate.split('/');
        var card_data = {
          number: card.number,
          cvc: card.cvc,
          exp_month: expdate[0].trim(),
          exp_year: expdate[1].trim()
        };

        Stripe.createToken(card_data, function (status, response) {
          if (response.error) {
            $scope.$apply(function () {
              $scope.error = response.error.message;
            })
            return;
          }

          Payment.updateCard(response.id)
          .then(function (plan) {
            $scope.error = null;
            $scope.currentPlan = plan;
            $scope.card = {};
          })
          .catch(function (error) {
            $scope.error = error;
          });
        });
      };

      $scope.deactivateAccount = function () {
        var text = 'Are you sure? All data will be permanently erased.';
        var sure = window.confirm(text);
        
        if (sure) {
          User.deactivate()
          .then(function () {
            User.clean();
            User.signout(function () {
              $location.url('/signin');
            });
          });
        }
      };
    }
  ]);

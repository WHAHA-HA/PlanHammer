'use strict';

angular.module('App.controllers')
  .controller('SigninController', ['$scope', '$location', '$rootScope', 'User', 'Alert',
    function ($scope, $location, $rootScope, User, Alert) {
      Alert.init($rootScope);
      $scope.user = {};
      
      if (User.isLogged()) {
        // $location.url('/');
      }
      
      $scope.login = function (user, userForm) {
        if (!userForm.$valid) return;

        var data = { username: user.username, password: user.password };
        User.signin(data)
        .then(function (user, redirect) {
          if (redirect && redirect.model == 'Project' && redirect.action == 'show' && redirect.param.id) {
            $location.url('/project/' + redirect.param.id + '/show');
          } else if (user && user.should_pay) {
            //user.pay_reason
            $location.url('/account/payments');
          } else {
            $location.url('/');
          }
        })
        .catch(Alert.danger);
      }
    }
  ])
  .controller('SignupController', ['$scope', '$location', '$rootScope', '$stateParams', 'User', 'Alert',
    function ($scope, $location, $rootScope, $stateParams, User, Alert) {
      Alert.init($rootScope);
      $scope.user = {};

      if (User.isLogged()) {
        $location.url('/');
      }
      console.log($stateParams.referral);
      if ($stateParams.referral) {
        $('#connect-google').attr('href', '/auth/google?referral=' + $stateParams.referral);
      }
      
      $scope.signup = function (user, userForm) {
        if (!userForm.$valid) return;

        var data = {
          username: user.username,
          email:user.email,
          password: user.password,
          referral: $stateParams.referral
        };

        User.signup(data)
          .then(function (user) {
          //$scope.user = {};
          //$scope.errors = null;
          //Alert.success('You have been successfully registered. Please proceed with confirmation via email.');
            var loginData = { username: data.username, password: data.password };
            User.signin(loginData)
              .then(function (user, redirect) {
                if (redirect && redirect.model == 'Project' && redirect.action == 'show' && redirect.param.id) {
                  $location.url('/project/' + redirect.param.id + '/show');
                } else if (user && user.should_pay) {
                  //user.pay_reason
                  $location.url('/account/payments');
                } else {
                  $location.url('/');
                }
              })
              .catch(Alert.danger);
          })
          .catch(function (errors) {
            $scope.errors = errors;
          });
      };
    }
  ])
  .controller('ConfirmationController', ['$scope', '$location', '$rootScope', '$http', '$stateParams', 'User', 
    function ($scope, $location, $rootScope, $http, $stateParams, User) {
      $scope.user = {};

      $scope.login = function (user, userForm) {
        if (!userForm.$valid) return;
        
        User.signin({ username: user.username, password: user.password })
        .then(function (user, redirect) {
          if (redirect && redirect.model == 'Project' && redirect.action == 'show' && redirect.param.id) {
            $location.url('/project/' + redirect.param.id + '/show');
          } else if (user && user.should_pay) {
            //user.pay_reason
            $location.url('/account/payments');
          } else {
            $location.url('/');
          }
        })
        .catch(function (errors) {
          $scope.error = errors;
        });
      }
      if (User.isLogged()) {
        // $location.url('/');
      }

      User.confirm($stateParams.code)
        .then(function () {
          $scope.is_confirmed = true;
        });
    }
  ])
  .controller('AccountEditController', ['$scope', '$location', '$rootScope', '$stateParams', '$http', 'User', 'Analytics', 'Alert',
    function ($scope, $location, $rootScope, $stateParams, $http, User, Analytics, Alert) {
      Analytics.pageTrack('/account');
      Alert.init($rootScope);

      $scope.user = {};
      $scope.tab = { profile: false, payments: false, collaborators: false };
      $scope.tab[$stateParams.tab] = true;

      User.loggedin()
      .then(function (user) {
        $scope.user = user;

        User.getImage(user._id)
        .then(function (image) {
          $scope.user.image = image;
        });
      })
      .catch(function (error) {
        $location.url('/signin');
      });
      
      $scope.upload = function () {
        var files = angular.element('.image-uploader-form input[type="file"]')[0].files;
        var fd = new FormData();

        fd.append("image", files[0]);

        User.setImage($scope.user._id, fd)
        .then(function () {
          var image_url = '/api/user/' + $scope.user._id +'/image?' + (new Date).getTime();
          angular.element('.image-uploader-form img.user-picture').attr('src', image_url);
        })
        .catch(Alert.danger);
      };

      $scope.update = function (user, userForm) {
        if (!userForm.$valid) return;
        
        var data = {
          email: user.email,
          first_name: user.name.first,
          last_name: user.name.last,
          address: user.address,
          city: user.city,
          state: user.state,
          zip: user.zip,
          country: user.country,
          password: user.password,
        };
        
        User.update(data)
        .then(function (user){
          $scope.errors = null;
          Alert.success('Successfully updated');
        })
        .catch(function (errors) {
          $scope.errors = errors;
        });
      };
    }
  ])
  .controller('CollaboratorsCtrl', ['$scope','$modal', '$rootScope', 'User', 'Alert',
    function ($scope, $modal, $rootScope, User, Alert) {
      Alert.init($rootScope);
      var currentModal = null

      User.collaborators()
      .then(function (collaborators) {
        $scope.collaborators = collaborators;
      })
      .catch(Alert.danger);

      $scope.delete = function (index) {
        if (!confirm('are you sure?')) return;
        
        var user = $scope.collaborators[index];

        User.removeFromProjects(user._id)
        .then(function () {
          $scope.collaborators.splice(index, 1);
        })
        .catch(Alert.danger);
      };

      $scope.view = function (index) {
        var user = $scope.collaborators[index];
        
        User.assignedNodes(user._id)
        .then(function (nodes) {
          $scope.assignedNodes = nodes;

          currentModal = $modal.open({
            templateUrl: 'assignedModal.html',
            size: 'sm',
            scope: $scope
          });
        })
        .catch(Alert.danger);
      };

      $scope.cancel = function () {
        currentModal.dismiss('cancel');
      };
    }
  ])
  .controller('UserInviteController', ['$scope', '$location', '$rootScope', '$http', 'User', 'Analytics', 'Alert',
    function ($scope, $location, $rootScope, $http, User, Analytics, Alert) {
      Analytics.pageTrack('/referral');
      Alert.init($scope);
      $scope.referral = {};

      // options for the share button of gapi
      $scope.options = {
        contenturl: 'http://planhammer.io',
        contentdeeplinkid: '/pages',
        clientid: '957065445007.apps.googleusercontent.com',
        cookiepolicy: 'single_host_origin',
        prefilltext: generateUniqueUrl(User, $location),
        calltoactionlabel: 'CREATE',
        calltoactionurl: '',
        calltoactiondeeplinkid: '/pages/create',
        requestvisibleactions: 'http://schemas.google.com/AddActivity'
      };

      // configure share button via gapi
      gapi.interactivepost.render('sharePost', $scope.options);

      function generateUniqueUrl(User,  $location) {
        var userid = User.get('_id'); 
        var currentDomain = $location.host();
        return 'http://' + currentDomain + '/#/signup/' + userid;
      }
      
      function shareToLinkedIn(referral) {
        var userid = User.get('_id'); 
        var currentDomain = $location.host();
        var uniqueUrl =  generateUniqueUrl(User, $location);
        IN.API.Raw('/people/~/shares')
         .method('POST')
         .body(JSON.stringify({
           'content': {
             'submitted-url': 'http://planhammer.io',
             'title': 'Plan Hammer',
             'description': 'Plan Hammer'
           },
           'visibility': {
             'code': 'anyone'
           },
           'comment': referral.linkedInMessage + ' ' + uniqueUrl
         }))
         .result(function(result) {
          $scope.$apply(function() {
            Alert.success('Invite sent successfully');
          });
         })
         .error(function(error) {
          $scope.$apply(function() {
            Alert.danger(error);
          });
         });
      }

      $scope.shareInvitationToLinkedIn = function(referral, referralLinkedInForm) {
        if(!referralLinkedInForm.$valid) return;
        
        IN.User.authorize(function(result) {
          shareToLinkedIn(referral);
        }, function(scope) {
          //console.log(scope);
        });
      };

      $scope.invite = function (referral, referralForm) {
        if (!referralForm.$valid) return;
        
        var data = { email: referral.email, message: referral.message };
        
        User.invite(data)
        .then(function () {
          Alert.success('Invite sent successfully');
        })
        .catch(function (error) {
          if (error.type === 'payment') {
            $location.url('/account/payments');
          } else {
            Alert.danger(error)
          }
        });
      };
    }
  ])
  .controller('AdminUserListController', ['$scope', '$location', '$rootScope', '$http', 'User', 
    function ($scope, $location, $rootScope, $http, User) {
      $scope.users = [];

      $http.post('/api/admin/users', {})
        .success(function(data) {
          $scope.users = data.users;
        })
        .error(function(data) {
          $scope.error = data.message;
        });
    }
  ])
  .controller('AdminUserShowController', ['$scope', '$location', '$rootScope', '$http', '$stateParams', 'User', 
    function ($scope, $location, $rootScope, $http, $stateParams, User) {
      $scope.user = [];
      
      $http.post('/api/admin/user/show', { username: $stateParams.username })
        .success(function(data) {
          $scope.user = data.user;
        })
        .error(function(data) {
          $scope.error = data.message;
        });
    }
  ])
  .controller('UserResetController', ['$scope', '$location', '$rootScope', '$http', '$stateParams', 'User', 'Alert',
    function ($scope, $location, $rootScope, $http, $stateParams, User, Alert) {
      Alert.init($scope);

      $scope.reset = function (email) {
        User.resetLink(email)
        .then(function () {
          Alert.success('reset link was sent to your email');
        })
        .catch(Alert.danger);
      };

      $scope.completeReset = function (pass1, pass2) {
        var token = $location.absUrl();
        token = token.split('/')[token.split('/').length-2].slice(0, -1);

        User.reset(token, pass1, pass2)
        .then(function () {
          Alert.success('password was reset successfully');
        })
        .catch(Alert.danger);
      };
    }
  ]);


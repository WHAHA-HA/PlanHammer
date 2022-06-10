'use strict';

// Declare app level module which depends on filters, and services
var dependencies = [
  'App.controllers',
  'App.filters',
  'App.services',
  'App.directives',
  'ngCookies',
  'ngRoute',
  'ngAnimate',
  'ui.router',
  'ui.bootstrap',
  'angulartics',
  'angulartics.google.analytics',
  'angularMoment',
  "kendo.directives"
];

var App = angular.module('App', dependencies)
.config(function ($routeProvider, $locationProvider, $httpProvider, $stateProvider, $urlRouterProvider, $analyticsProvider) {
  //turn off automatic tracking
  $analyticsProvider.virtualPageviews(false);

  var checkLoggedin = ['$q', '$timeout', '$http', '$location', 'User', function($q, $timeout, $http, $location, User) {
    var deferred = $q.defer();
    
    $http.post('/api/loggedin').success(function(res) {
      if (res.success){
        $timeout(deferred.resolve, 0);
      } else {
        $rootScope.message = 'You need to log in.';
        $timeout(function(){ deferred.reject(); }, 0);

        User.clean();
        $location.url('/signin');
      }
    });

    return deferred.promise;
  }];

  // Add an interceptor for AJAX errors
  $httpProvider.responseInterceptors.push(['$q', '$location', function($q, $location) {
    return function(promise) {
      return promise.then(
        function(response) {
          return response;
        }, 
        function(response) {
          if (response.status === 401) {
            $location.url('/signin');
          }
          return $q.reject(response);
        }
      );
    }
  }]);

  $urlRouterProvider.otherwise('/');

  // redirects
  $urlRouterProvider.when('/projects', '/projects/created');
  $urlRouterProvider.when('/', '/projects/created');

  $stateProvider
    .state('default', {
      abstract: true,
      url: '',
      templateUrl: 'view/layout/authorized',
      resolve: {
        loggedin: checkLoggedin
      }
    })
    .state('default.home', {
      url: '/',
      templateUrl: 'view/main/home'
    })
    // plan
    .state('default.plans', {
      url: '/plans',
      templateUrl: '/view/payment/plans',
      controller: 'PlansController'
    })
    .state('default.plan_subscribe', {
      url: '/plan/:plan_id/subscribe',
      templateUrl: '/view/payment/subscribe',
      controller: 'PaymentController'
    })
        // project 
    .state('default.projects', {
      url: '/projects/:type',
      templateUrl: '/view/project/list',
      controller: 'ProjectListController'
    })
    // detail view
    .state('default.project', {
      abstract: true,
      url: '/project/:id/show',
      templateUrl: 'view/project/show',
      controller: 'ProjectShowCtrl'
    })
    // .state('default.project.agile', {
    //   url: '/agile',
    //   templateUrl: '/view/project/agile',
    //   controller: 'agileController'
    // })
    .state('default.project.gantt', {
      url: '/gantt',  
      templateUrl: '/view/project/gantt',
      controller: 'ProjectGanttController'
    })
    .state('default.project.simple', {
      url: '',
      views :
      {
          "" : { templateUrl: '/view/project/list_view'},
          "nodeForm@default.project.simple" : { templateUrl: '/view/project/nodeForm'}
      }            
    })
    .state('default.project.agile', {
      url: '/agile',
      // templateUrl: '/view/project/agile',
      views :
      {
        "" : { templateUrl: '/view/project/agile' },
        "nodeForm@default.project.agile" : { templateUrl: '/view/project/nodeForm'}
      },
      // controller: 'agileController'
    })


    .state('default.project.detailed', {
      url: '/detailed',
      views :
      {
        "" : { templateUrl: '/view/project/detailed_view' },
        "nodeForm@default.project.detailed" : { templateUrl: '/view/project/nodeForm'}
      }
    })


    .state('default.project.raci', {
      url: '/raci',
      views :
      {
        "" : { templateUrl: '/view/project/raci'},
        "nodeForm@default.project.detailed" : { templateUrl: '/view/project/nodeForm'}
      }
    })
    .state('default.project.risk', {
      url: '/risk',
      views :
      {
        "" : { templateUrl: '/view/project/risk'},
        "nodeForm@default.project.detailed" : { templateUrl: '/view/project/nodeForm'}
      }
    })          
    // .state('default.project.gantt', {
    //   url: '/gantt',
    //   views :
    //   {
    //     "" : { templateUrl: '/view/project/gantt'},
    //     "nodeForm@default.project.detailed" : { templateUrl: '/view/project/nodeForm'}
    //   }
    // })
    .state('default.project.quality', {
      url: '/quality',
      views :
      {
        "" : { templateUrl: '/view/project/quality'},
        "nodeForm@default.project.detailed" : { templateUrl: '/view/project/nodeForm'}
      }
    })
    .state('default.project_create', {
      url: '/project/create',
      templateUrl: '/view/project/create',
      controller: 'ProjectCreateController'
    })
    .state('default.project_manage', {
      url: '/project/:id/manage',
      templateUrl: '/view/project/manage',
      controller: 'ProjectManageController'
    })
    // end project 
    .state('default.feedback', {
      url: '/feedback',
      templateUrl: '/view/main/feedback',
      controller: 'StaticController',
      data: {
        pageName: 'feedback'
      }
    })
    .state('default.account', {
      url: '/account/:tab',
      templateUrl: '/view/user/account',
      controller: 'AccountEditController'
    })
    .state('default.settings', {
      url: '/settings',
      templateUrl: '/view/user/settings'
    })
    .state('default.referral', {
      url: '/referral',
      templateUrl: '/view/user/referral',
      controller: 'UserInviteController'
    })
    .state('not_authorized', {
      abstract: true,
      url: '',
      templateUrl: 'view/layout/not_authorized'
    })
    .state('not_authorized.signin', {
      url: '/signin',
      templateUrl: 'view/user/signin',
      controller: 'SigninController'
    })
    .state('not_authorized.signup', {
      url: '/signup',
      templateUrl: 'view/user/signup',
      controller: 'SignupController'
    })
    .state('not_authorized.referral', {
      url: '/signup/:referral',
      templateUrl: 'view/user/signup',
      controller: 'SignupController'
    })
    .state('not_authorized.confirmation', {
      url: '/confirm/:code',
      templateUrl: 'view/user/confirmation',
      controller: 'ConfirmationController'
    })
    .state('not_authorized.reset', {
      url: '/reset',
      templateUrl: 'view/user/reset',
      controller: 'UserResetController'
    })
    .state('admin', {
      abstract: true, 
      url: '/admin',
      templateUrl: 'view/admin/layout/default',
      resolve: {
        loggedin: checkLoggedin
      }
    })
    .state('admin.home', {
      url: '',
      templateUrl: 'view/admin/main/home',
      role: ['admin']
      // signin: '/account'
    })
    .state('admin.users', {
      url: '/users',
      templateUrl: 'view/admin/user/list',
      role: ['admin'],
      // signin: '/account'
      controller: 'AdminUserListController'
    })
    .state('admin.user_show', {
      url: '/user/:username',
      templateUrl: 'view/admin/user/show',
      role: ['admin'],
      // signin: '/account'
      controller: 'AdminUserShowController'
    });

  // $locationProvider.html5Mode(true);
})
.run(['$rootScope', '$http', 'User', function($rootScope, $http, User) {
  $rootScope.message = '';
  $rootScope.changedProjects = [];
  $rootScope.projectCreated = false;

  // Logout function is available in any pages
  $rootScope.logout = function(){
    $rootScope.changedProjects = [];
    User.clean();
    $rootScope.message = 'Logged out.';
    $http.post('/signout');
  };
}])
.run(['$rootScope', '$state', '$stateParams', function ($rootScope,   $state,   $stateParams) {
    $rootScope.$state = $state;
    $rootScope.$stateParams = $stateParams;
}])
.run(function ($rootScope, $location, User) {
  $rootScope.$on('$stateChangeStart', function (ev, to, toParams, from, fromParams) {
    if (to.role && (!User.isLogged() || !_.contains(to.role, User.get('role')))) {
      // $location.url('/signin');
      window.location = '#' + (to.signin || '/signin');
    }
  });
});

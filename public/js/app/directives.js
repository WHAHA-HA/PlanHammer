'use strict';

/* Directives */

angular.module('App.directives', ["kendo.directives"])
  .directive('appVersion', function (version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  })
  .directive('equals', function() {
    return {
      restrict: 'A', // only activate on element attribute
      require: '?ngModel', // get a hold of NgModelController
      link: function(scope, elem, attrs, ngModel) {
        if(!ngModel) return; // do nothing if no ng-model

        // watch own value and re-validate on change
        scope.$watch(attrs.ngModel, function() {
          validate();
        });

        // observe the other value and re-validate on change
        attrs.$observe('equals', function (val) {
          validate();
        });

        var validate = function() {
          // values
          var val1 = ngModel.$viewValue || "";
          var val2 = attrs.equals;
          
          // set validity
          ngModel.$setValidity('equals', val1 === val2);
        };
      }
    }
  })
  
  .directive('ngEnter', function($parse) {
    return function(scope, elm, attrs) {
      elm.bind('keypress', function(e) {
        var onEnterCallback = $parse(attrs.ngEnter);

        if (e.which === 13) {
          onEnterCallback(scope, {
            $alt: e.altKey
          });
        }
      });
    };
  })

  .directive('ngEnterup', function($parse) {
    return function(scope, elm, attrs) {
      elm.bind('keyup', function(e){
        if (e.keyCode === 13) scope.$apply(attrs.ngEnterup);
      })
    };
  })

  .directive('ngEsc', function($parse) {
    return function(scope, elm, attrs) {
      elm.bind('keyup', function(e){
        if (e.keyCode === 27) scope.$apply(attrs.ngEsc);
      })
    };
  })

  .directive('focus', function () {
    return function (scope, element, attrs) {
      attrs.$observe('focus', function (newValue) {
        newValue === 'true' && element[0].focus();
      });
    }
  })

  .directive('focusMe', function($timeout) {
    return {
      link: function(scope, element, attrs) {
        scope.$watch(attrs.focusMe, function(value) {
          if (value === true) { 
            $timeout(function() {
              element[0].focus();
              element[0].select();
              scope[attrs.focusMe] = false;
            });
          }
        });
      }
    };
  })

  .directive('focusOut', ['$timeout', function($timeout) {
    return {
      link: function($scope, iElm, iAttrs, controller) {
        iElm.bind('blur', function () {
          $scope.$apply(iAttrs.focusOut);
        })
      }
    };
  }])

  .directive('clickOutside', ['$timeout', function($timeout) {
    return {
      link: function($scope, element, attrs, controller) {
        element.bind('clickoutside', function (e) {
          if ($(e.target).hasClass('ng-scope')) {
            return;
          }
          // TODO: abstract from concrete top value, separate it to another param or sort of it
          if (element.position().top > 0) {
            $scope.$apply(attrs.clickOutside)
          }
        })
      }
    };
  }])

  .directive('shortcut', function() {
    return {
      restrict: 'E',
      replace: true,
      scope: true,
      link:    function postLink(scope, iElement, iAttrs){
        jQuery(document).on('keypress', function(e) {
          scope.$apply(scope.keyPressed(e));
        });
      }
    };
  })

  .directive('rangeSlider', function() {
    return {
      restrict: 'A',
      scope: {},
      require: 'ngModel',
      link: function(scope, element, attr, ngModel){
        var slider = $(element);
        slider.noUiSlider({
          range: [attr.min, attr.max]
          , start: attr.min
          , handles: 1
          , step: attr.step
          , slide: function () {
            scope.$apply(function () {
              ngModel.$setViewValue(slider.val());
            })
          }
          ,serialization: {
            resolution: 1
          }
        })
        .change(function () {
          scope.$apply(function () {
            ngModel.$setViewValue(slider.val());
          })
          
        });

        ngModel.$render = function () {
          slider.val(ngModel.$viewValue);
        }

        scope.$watch(attr.ngModel, function (val) {
          ngModel.$render();  
        }, true);
      }
    };
  })

  .directive('myProgress', function() {
    return function(scope, element, attrs) {
      var percentage;
      function updateProgress() {
        if (percentage > 5) {
          element.html('<div class="progress-bar progress-bar-success" style="width: ' + percentage + '%"><span>'+ percentage +'%</span></div>');
        }
        /* If 5% or less, add margin to percentage */
        else if (percentage <= 5 && percentage > 0) {
          element.html('<div class="progress-bar progress-bar-success" style="width: ' + percentage + '%"><span style="margin-left: 5px">'+ percentage +'%</span></div>');
        }
        /* If 0%, add margin and color to percentage */
        else if (percentage == 0) {
          element.html('<div class="progress-bar progress-bar-success" style="width: ' + percentage + '%; color: #555;"><span style="margin-left: 5px">'+ percentage +'%</span></div>');
        }
        /* In case of error, fall back on Default */
        else {
          element.html('<div class="progress-bar progress-bar-success" style="width: ' + percentage + '%"><span>'+ percentage +'%</span></div>');
        }
      }

      scope.$watch(attrs.myProgress, function(val) {
        percentage = val;
        updateProgress();
      });

      updateProgress();
    }
  })

  .directive('ngConfirmClick', [
    function(){
      return {
        link: function (scope, element, attr) {
          var msg = attr.ngConfirmClick || "Are you sure?";
          var clickAction = attr.confirmedClick;
          element.bind('click',function (event) {
            if ( window.confirm(msg) ) {
              scope.$eval(clickAction)
            }
          });
        }
      };
    }
  ])        
  .directive('formAutofillFix', [
    function() {
      return function(scope, elem, attrs) {
        // Fixes Chrome bug: https://groups.google.com/forum/#!topic/angular/6NlucSskQjY
        elem.prop('method', 'POST');

        // Fix autofill issues where Angular doesn't know about autofilled inputs
        if (attrs.ngSubmit) {
          setTimeout(function(){
            elem.unbind('submit').submit(function(e) {
              e.preventDefault();
              elem.find('input, textarea, select')
                .trigger('input')
                .trigger('change')
                .trigger('keydown');
              scope.$apply(attrs.ngSubmit);
            })
          }, 0);
        }
      };
    }
  ])
  .directive('uploadSubmit', ["$parse", function($parse) {
    // Utility function to get the closest parent element with a given tag
    function getParentNodeByTagName(element, tagName) {
      element = angular.element(element);
      var parent = element.parent();
      tagName = tagName.toLowerCase();

      if ( parent && parent[0].tagName.toLowerCase() === tagName ) {
          return parent;
      } else {
          return !parent ? null : getParentNodeByTagName(parent, tagName);
      }
    }
    return {
      restrict: 'AC',
      link: function(scope, element, attrs) {
        element.bind('click', function($event) {
          // prevent default behavior of click
          if ($event) {
            $event.preventDefault();
            $event.stopPropagation();
          }

          if (element.attr('disabled')) { return; }
          var form = getParentNodeByTagName(element, 'form');
          form.triggerHandler('submit');
          form[0].submit();
        });
      }
    };
  }])
  .directive('ngUpload', ["$log", "$parse", "$document",
    function ($log, $parse, $document) {
    var iframeID = 1;
    // Utility function to get meta tag with a given name attribute
    function getMetaTagWithName(name) {
      var head = $document.find('head');
      var match;

      angular.forEach(head.find('meta'), function(element) {
        if ( element.getAttribute('name') === name ) {
            match = element;
        }
      });

      return angular.element(match);
    }

    return {
      restrict: 'AC',
      link: function (scope, element, attrs) {
        // Give each directive instance a new id
        iframeID++;

        function setLoadingState(state) {
          scope.$isUploading = state;
        }

        var options = {};
        // Options (just 1 for now)
        // Each option should be prefixed with 'upload-options-' or 'uploadOptions'
        // {
        //    // add the Rails CSRF hidden input to form
        //    enableRailsCsrf: bool
        // }
        var fn = attrs.ngUpload ? $parse(attrs.ngUpload) : angular.noop;
        var loading = attrs.ngUploadLoading ? $parse(attrs.ngUploadLoading) : null;

        if ( attrs.hasOwnProperty( "uploadOptionsConvertHidden" ) ) {
            // Allow blank or true
            options.convertHidden = attrs.uploadOptionsConvertHidden != "false";
        }

        if ( attrs.hasOwnProperty( "uploadOptionsEnableRailsCsrf" ) ) {
            // allow for blank or true
            options.enableRailsCsrf = attrs.uploadOptionsEnableRailsCsrf != "false";
        }

        if ( attrs.hasOwnProperty( "uploadOptionsBeforeSubmit" ) ) {
            options.beforeSubmit = $parse(attrs.uploadOptionsBeforeSubmit);
        }

        element.attr({
          'target': 'upload-iframe-' + iframeID,
          'method': 'post',
          'enctype': 'multipart/form-data',
          'encoding': 'multipart/form-data'
        });

        var iframe = angular.element(
          '<iframe name="upload-iframe-' + iframeID + '" ' +
          'border="0" width="0" height="0" ' +
          'style="width:0px;height:0px;border:none;display:none">'
        );

        // If enabled, add csrf hidden input to form
        if ( options.enableRailsCsrf ) {
          var input = angular.element("<input />");
            input.attr("class", "upload-csrf-token");
            input.attr("type", "hidden");
            input.attr("name", getMetaTagWithName('csrf-param').attr('content'));
            input.val(getMetaTagWithName('csrf-token').attr('content'));

          element.append(input);
        }
        element.after(iframe);

        setLoadingState(false);
        // Start upload
        element.bind('submit', function uploadStart() {
          var formController = scope[attrs.name];
          // if form is invalid don't submit (e.g. keypress 13)
          if(formController && formController.$invalid) return false;
          // perform check before submit file
          if (options.beforeSubmit) { return options.beforeSubmit(); }

          // bind load after submit to prevent initial load triggering uploadEnd
          iframe.bind('load', uploadEnd);

          // If convertHidden option is enabled, set the value of hidden fields to the eval of the ng-model
          if (options.convertHidden) {
            angular.forEach(element.find('input'), function(el) {
              var _el = angular.element(el);
              if (_el.attr('ng-model') &&
                _el.attr('type') &&
                _el.attr('type') == 'hidden') {
                _el.attr('value', scope.$eval(_el.attr('ng-model')));
              }
            });
          }

          if (!scope.$$phase) {
            scope.$apply(function() {
              if (loading) loading(scope);
              setLoadingState(true);
            });
          } else {
            if (loading) loading(scope);
            setLoadingState(true);
          }
        });

        // Finish upload
       function uploadEnd() {
          // unbind load after uploadEnd to prevent another load triggering uploadEnd
          iframe.unbind('load');
          if (!scope.$$phase) {
            scope.$apply(function() {
              setLoadingState(false);
            });
          } else {
            setLoadingState(false);
          }
          // Get iframe body contents
          var bodyContent = (iframe[0].contentDocument ||
            iframe[0].contentWindow.document).body;
          var content;
          try {
            content = angular.fromJson(bodyContent.innerText || bodyContent.textContent);
          } catch (e) {
            // Fall back to html if json parse failed
            content = bodyContent.innerHTML;
            $log.warn('Response is not valid JSON');
          }
          // if outside a digest cycle, execute the upload response function in the active scope
          // else execute the upload response function in the current digest
          if (!scope.$$phase) {
             scope.$apply(function () {
                 fn(scope, { content: content});
             });
          } else {
            fn(scope, { content: content});
          }
        }
      }
    };
  }])
  .directive('fileModel', ['$parse', function ($parse) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        var model = $parse(attrs.fileModel);
        var modelSetter = model.assign;

        element.bind('change', function(){
          scope.$apply(function(){
            modelSetter(scope, element[0].files[0]);
          });
        });
      }
    };
  }])
  // app.directive('select', function($interpolate) {
  //   return {
  //     restrict: 'E',
  //     require: 'ngModel',
  //     link: function(scope, elem, attrs, ctrl) {
  //       var defaultOptionTemplate;
  //       scope.defaultOptionText = attrs.defaultOption || 'Select...';
  //       defaultOptionTemplate = '<option value="" disabled selected style="display: none;">{{defaultOptionText}}</option>';
  //       elem.prepend($interpolate(defaultOptionTemplate)(scope));
  //     }
  //   };
  // })
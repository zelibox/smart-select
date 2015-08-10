angular.module('smartSelect', [])
    .factory('smartSelectHandler', function(){
        function SmartSelectHandler(options) {
            var config = angular.merge({
                multiple: false,
                values: [],
                onCreateValue: function(query) {
                    //todo promise
                    if(typeof(query) != 'string') {
                        query = '';
                    }
                    query = query.trim();
                    if(query == '') {
                        return false;
                    }
                    return query;
                },
                checkUnique: function(compareValue) {
                    var flag = true;
                    angular.forEach(this.values, function(e) {
                        if(e == compareValue) {
                            flag = false;
                        }
                    });
                    return flag;
                }
            }, options);

            this.createValue = function(query) {
                var flag = false;
                var value = config.onCreateValue(query);
                if(value !== false) {
                    if(config.checkUnique(value)) {
                        config.values.push(value);
                        flag = true;
                    }
                }
                return flag;
            };

            this.getValues = function (){
              return config.values;
            }
        }

        return function(options){
            return new SmartSelectHandler(options)
        }
    })
    .directive('smartSelect', function () {
        return {
            restrict: 'E',
            scope: {
                handler: '='
            },
            template: '\
            <div class="smart-select">\
                <div class="smart-select-wrap">\
                    <div class="smart-select-value" ng-bind="value" ng-repeat="value in handler.getValues()"></div>\
                    <smart-select-input></smart-select-input>\
                </div>\
                <div class="smart-select-toggle"></div>\
            </div>',
            controller: function ($scope) {
                console.log('init smartSelect', $scope.handler);
            }
        }
    })
    .directive('smartSelectInput', function($timeout) {
        return {
            restrict: 'E',
            replace: true,
            template: '\
            <input type="text"\
                   ng-trim="false"\
                   ng-model="query"\
                   ng-blur="timeoutUpdate()"\
                   ng-cut="timeoutUpdate()"\
                   ng-paste="timeoutUpdate()"\
                   ng-keydown="keyDown($event)">',
            require: '^smartSelect',
            link: function($scope, $element, $attrs) {
                var wrapper = angular.element('#smart-select-input-wrapper');
                if (!wrapper.length) {
                    wrapper = angular.element('<div id="smart-select-input-wrapper" style="position:fixed; top:-999px; left:0;"></div>');
                    angular.element('body').append(wrapper);
                }
                var mirror = angular.element('<span style="white-space:pre;"></span>');
                angular.forEach([
                    'fontFamily',
                    'fontSize',
                    'fontWeight',
                    'fontStyle',
                    'letterSpacing',
                    'textTransform',
                    'wordSpacing',
                    'textIndent',
                    'boxSizing',
                    'borderRightWidth',
                    'borderLeftWidth',
                    'borderLeftStyle',
                    'borderRightStyle',
                    'paddingLeft',
                    'paddingRight',
                    'marginLeft',
                    'marginRight'
                ], function (value) {
                    mirror.css(value, $element.css(value));
                });
                wrapper.append(mirror);
                function update(text) {
                    text = text ? text : ' ';
                    mirror.text(text || $attrs.placeholder);
                    $element.css('width', mirror.outerWidth() + 1);
                }

                $scope.query = null;

                $scope.keyDown = function ($event) {
                    switch ($event.which) {
                        case 13: // enter
                            if($scope.handler.createValue($scope.query)) {
                                $scope.query = null;
                                $timeout(function() {
                                    $element.css('width', 0);
                                })
                            }
                            break;
                    }
                };
                $scope.$watch('query', function (newText) {
                    update(newText);
                });

                $scope.timeoutUpdate = function () {
                    $timeout(function() {
                        update($scope.query);
                    })
                };

                $scope.$on('$destroy', function () {
                    mirror.remove();
                });
            }
        }
    });
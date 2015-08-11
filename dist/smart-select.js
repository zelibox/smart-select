angular.module('smartSelect', [])
    .factory('smartSelectHandler', function () {
        function SmartSelectHandler(options) {
            var config = angular.merge({
                multiple: false,
                values: [],
                onCreateValue: function (query) {
                    //todo promise
                    if (typeof(query) != 'string') {
                        query = '';
                    }
                    query = query.trim();
                    if (query == '') {
                        return false;
                    }
                    return query;
                },
                checkUnique: function (compareValue) {
                    var flag = true;
                    angular.forEach(this.values, function (e) {
                        if (e == compareValue) {
                            flag = false;
                        }
                    });
                    return flag;
                }
            }, options);

            this.createValue = function (query) {
                var flag = false;
                var value = config.onCreateValue(query);
                if (value !== false) {
                    if (config.checkUnique(value)) {
                        config.values.push(value);
                        flag = true;
                    }
                }
                return flag;
            };

            this.getValues = function () {
                return config.values;
            };

            this.removeValue = function (value) {
                config.values.splice(config.values.indexOf(value), 1);
            };

            this.focusInput = false;
            this.focusValue = null; //todo
        }

        return function (options) {
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
                <div ng-click="focusInput($event)" class="smart-select-wrap">\
                    <smart-select-value value="value" ng-repeat="value in handler.getValues()"></smart-select-value>\
                    <smart-select-input></smart-select-input>\
                </div>\
                <div class="smart-select-toggle"></div>\
            </div>',
            controller: function ($scope) {
                this.handler = $scope.handler;

                $scope.focusInput = function ($event) {
                    if ($event.currentTarget == $event.target) {
                        $scope.handler.focusInput = true;
                    }
                };
            }
        }
    })
    .directive('smartSelectInput', function ($timeout) {
        //todo custom template
        return {
            restrict: 'E',
            replace: true,
            require: '^smartSelect',
            scope: {},
            template: '\
            <input type="text"\
                   ng-trim="false"\
                   ng-model="query"\
                   ng-focus="handler.focusInput = true;"\
                   ng-blur="timeoutUpdate(); handler.focusInput = false;"\
                   ng-cut="timeoutUpdate()"\
                   ng-paste="timeoutUpdate()"\
                   ng-keydown="keyDown($event)">',
            link: function ($scope, $element, $attr, $smartSelectCtrl) {
                $scope.handler = $smartSelectCtrl.handler;
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
                    mirror.text(text || $attr.placeholder);
                    $element.css('width', mirror.outerWidth() + 1);
                }

                $scope.query = null;

                function getPos(element) {
                    if ('selectionStart' in element) {
                        return element.selectionStart;
                    } else if (document.selection) {
                        element.focus();
                        var sel = document.selection.createRange();
                        var selLen = document.selection.createRange().text.length;
                        sel.moveStart('character', -element.value.length);
                        return sel.text.length - selLen;
                    }
                }

                $scope.keyDown = function ($event) {
                    switch ($event.which) {
                        case 13: // enter
                            if ($scope.handler.createValue($scope.query)) {
                                $scope.query = null;
                                $timeout(function () {
                                    $element.css('width', 0);
                                })
                            }
                            break;
                        case 8:
                            if (getPos($element[0]) == 0) {
                                //focus last
                                $scope.handler.focusValue = $scope.handler.getValues()[$scope.handler.getValues().length - 1]
                            }
                            break;
                    }
                };
                $scope.$watch('query', function (newText) {
                    update(newText);
                });

                $scope.timeoutUpdate = function () {
                    $timeout(function () {
                        update($scope.query);
                    })
                };

                $scope.$watch(
                    function () {
                        return $smartSelectCtrl.handler.focusInput
                    },
                    function (isFocus) {
                        if (isFocus) {
                            $element.focus();
                        }
                    }
                );

                $scope.$on('$destroy', function () {
                    mirror.remove();
                });
            }
        }
    })
    .directive('smartSelectValue', function () {
        //todo custom template
        return {
            restrict: 'E',
            replace: true,
            require: '^smartSelect',
            scope: {
                value: '='
            },
            template: '\
            <div tabindex="1"\
                 ng-keydown="onKeyDown($event)"\
                 ng-focus="handler.focusValue = value"\
                 ng-blur="handler.focusValue = null" \
                 class="smart-select-value">\
                <span class="smart-select-value-title" ng-bind="value"></span>\
                <span ng-click="remove()" class="smart-select-value-remove">&times;</span>\
            </div>',
            link: function ($scope, $element, $attr, $smartSelectCtrl) {
                $scope.handler = $smartSelectCtrl.handler;

                $scope.remove = function () {
                    $scope.handler.removeValue($scope.value);
                };

                $scope.onKeyDown = function ($event) {
                    if ($event.which == 8 || $event.which == 46) {
                        var index;
                        switch ($event.which) {
                            case 8:
                                index = $scope.handler.getValues().indexOf($scope.value) - 1;
                                break;
                            case 46:
                                index = $scope.handler.getValues().indexOf($scope.value) + 1;
                                break;
                        }
                        if ($scope.handler.getValues()[index]) {
                            $scope.handler.focusValue = $scope.handler.getValues()[index]
                        } else {
                            $scope.handler.focusValue = null;
                            $scope.handler.focusInput = true;
                        }
                        $scope.remove();
                    }
                };

                $scope.$watch(
                    function () {
                        return $scope.handler.focusValue
                    },
                    function (focusValue) {
                        if (focusValue == $scope.value) {
                            $element.focus();
                        }
                    }
                );
            }
        }
    });
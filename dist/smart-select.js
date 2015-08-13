angular.module('smartSelect', [])
    .factory('smartSelectHandler', function () {
        function SmartSelectHandler(options) {
            var config = angular.merge({
                multiple: true,
                values: [],
                defaultValues: [1, 2, 3, 4, 5, 546, 88, 435, 43534534, 44345, 'dfgdfgdfg'],
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
                onRemoveValue: function (value) {
                    return true;
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

            this.getListItems = function () {
                var listItems = [];
                angular.forEach(config.defaultValues, function(e) {
                    if (config.checkUnique(e)) {
                        listItems.push(e);
                    }
                });
                return listItems;
            };

            this.selectListItem = function (item) {
                config.values.push(item);
                this.activeSelectListItem = null;
            };

            this.getValues = function () {
                return config.values;
            };

            this.removeValue = function (value) {
                if (config.onRemoveValue(value) !== false) {
                    config.values.splice(config.values.indexOf(value), 1);
                }
            };

            this.focusInput = false; // todo refactor
            this.focusValue = null; // todo refactor
            this.activeSelectListItem = null; // todo refactor

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
                <div ng-mousedown="focusInput($event)" class="smart-select-wrap">\
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
                        $event.preventDefault();
                    }
                };
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
                    var index = null;
                    var isRemove = false;

                    switch ($event.which) {
                        case 8: // backspace
                            index = $scope.handler.getValues().indexOf($scope.value) - 1;
                            isRemove = true;
                            break;
                        case 37: // prev
                            index = $scope.handler.getValues().indexOf($scope.value) - 1;
                            break;
                        case 46: // delete
                            index = $scope.handler.getValues().indexOf($scope.value) + 1;
                            isRemove = true;
                            break;
                        case 39: // next
                            index = $scope.handler.getValues().indexOf($scope.value) + 1;
                            break;
                    }

                    if (index != null) {
                        if ($scope.handler.getValues()[index]) {
                            $scope.handler.focusValue = $scope.handler.getValues()[index]
                        } else {
                            $scope.handler.focusValue = null;
                            $scope.handler.focusInput = true;
                        }

                        if (isRemove) {
                            $scope.remove();
                        }

                        $event.preventDefault();
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
    })
    .directive('smartSelectInput', function ($timeout, $compile) {
        return {
            restrict: 'E',
            replace: true,
            require: '^smartSelect',
            scope: {},
            template: '\
            <input type="text"\
                   ng-trim="false"\
                   ng-model="query"\
                   ng-focus="onFocus()"\
                   ng-blur="onBlur()"\
                   ng-cut="timeoutUpdate()"\
                   ng-paste="timeoutUpdate()"\
                   ng-keydown="onKeyDown($event)">',
            link: function ($scope, $element, $attr, $smartSelectCtrl) {
                $scope.query = null;
                var wrapper = angular.element('.smart-select-input-wrapper');
                if (!wrapper.length) {
                    wrapper = angular.element('<div class="smart-select-input-wrapper"></div>');
                    angular.element('body').append(wrapper);
                }
                var mirror = angular.element('<span></span>');
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

                var selectList = angular.element('\
                    <div ng-show="isFocus && handler.getListItems().length"\
                         tabindex="1" \
                         ng-focus="isFocus = true" \
                         ng-blur="isFocus = false" \
                         ng-style="style"\
                         class="smart-select-list-container">\
                        <smart-select-list></smart-select-list>\
                    </div>'
                );
                var selectListScope = $scope.$new();
                selectListScope.handler = $smartSelectCtrl.handler;
                angular.element('body').append(selectList);
                $compile(selectList)(selectListScope);


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

                function update(text) {
                    text = text ? text : ' ';
                    mirror.text(text || $attr.placeholder);
                    $element.css('width', mirror.outerWidth() + 1);
                }

                function timeoutUpdate() {
                    $timeout(function () {
                        update($scope.query);
                    })
                }

                function updateSelectListPosition() {
                    $timeout(function () {
                        var smartSelectElement = $element.closest('.smart-select');
                        selectListScope.style = {
                            width: smartSelectElement.outerWidth(true),
                            top: smartSelectElement.offset().top + smartSelectElement.height(),
                            left: smartSelectElement.offset().left
                        };
                    });
                }

                $scope.onKeyDown = function ($event) {
                    switch ($event.which) {
                        case 13: // enter
                            if ($smartSelectCtrl.handler.activeSelectListItem) {
                                $smartSelectCtrl.handler.selectListItem($smartSelectCtrl.handler.activeSelectListItem);
                                $scope.query = null;
                                $timeout(function () {
                                    $element.css('width', 0);
                                });

                                //todo refactor
                                var index = $smartSelectCtrl.handler.getListItems().indexOf($smartSelectCtrl.handler.activeSelectListItem);
                                $smartSelectCtrl.handler.activeSelectListItem = $smartSelectCtrl.handler.getListItems()[index + 1]

                            } else if ($smartSelectCtrl.handler.createValue($scope.query)) {
                                $scope.query = null;
                                $timeout(function () {
                                    $element.css('width', 0);
                                })
                            }
                            break;
                        case 8: // backspace
                        case 37: // prev
                            if (getPos($element[0]) == 0) {
                                $smartSelectCtrl.handler.focusValue = $smartSelectCtrl.handler.getValues()[$smartSelectCtrl.handler.getValues().length - 1];
                                $event.originalEvent.preventDefault();
                            }
                            break;
                        case 38: //up
                            console.log('up'); // todo refactor!!!
                            if ($smartSelectCtrl.handler.activeSelectListItem) {
                                var index = $smartSelectCtrl.handler.getListItems().indexOf($smartSelectCtrl.handler.activeSelectListItem);
                                $smartSelectCtrl.handler.activeSelectListItem = $smartSelectCtrl.handler.getListItems()[index - 1]
                            }
                            break;
                        case 40: // down
                            console.log('down'); // todo refactor!!!
                            if ($smartSelectCtrl.handler.activeSelectListItem) {
                                var index = $smartSelectCtrl.handler.getListItems().indexOf($smartSelectCtrl.handler.activeSelectListItem);
                                $smartSelectCtrl.handler.activeSelectListItem = $smartSelectCtrl.handler.getListItems()[index + 1]
                            } else {
                                $smartSelectCtrl.handler.activeSelectListItem = $smartSelectCtrl.handler.getListItems()[0]
                            }
                            break;
                    }
                    updateSelectListPosition()
                };
                $scope.$watch('query', function (newText) {
                    update(newText);
                });

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
                $scope.onFocus = function () {
                    $smartSelectCtrl.handler.focusInput = true;
                    selectListScope.isFocus = true;
                    updateSelectListPosition()
                };
                $scope.onBlur = function () {
                    timeoutUpdate();
                    $smartSelectCtrl.handler.focusInput = false;
                    selectListScope.isFocus = false;
                };
                $scope.$on('$destroy', function () {
                    mirror.remove();
                });
            }
        }
    })
    .directive('smartSelectList', function () {
        return {
            restrict: 'E',
            replace: true,
            template: '\
            <ul class="smart-select-list">\
                <li ng-bind="value"\
                    class="smart-select-list-item" \
                    ng-class="{\'smart-select-list-item-active\': handler.activeSelectListItem == value}" \
                    ng-mouseover="handler.activeSelectListItem = value"\
                    ng-repeat="value in handler.getListItems()"></li>\
            </ul>',
            link: function ($scope) {
                console.log($scope);
            }
        }
    })
;
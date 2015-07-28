'use strict';

angular.module('<%=angularAppName%>')
    .controller('<%= entityClass %>Controller', function ($scope<% for (idx in differentTypes) { %>, <%= differentTypes[idx] %><% } %><% if (searchEngine == 'elasticsearch') { %>, <%= entityClass %>Search<% } %><% if (pagination != 'no') { %>, ParseLinks<% } %>) {
        window.scope = $scope;
        $scope.<%= entityInstance %>s = [];<% for (idx in differentTypes) { if (differentTypes[idx] != entityClass) { %>
        $scope.<%= differentTypes[idx].toLowerCase() %>s = <%= differentTypes[idx] %>.get();<% } } %><% if (pagination == 'pager' || pagination == 'pagination') { %>
        $scope.page = 1;
        $scope.loadAll = function() {
            <%= entityClass %>.get({page: $scope.page, per_page: 20}, function(result, headers) {
                $scope.links = ParseLinks.parse(headers('link'));
                $scope.<%= entityInstance %>s = result;
            });
        };<% } %><% if (pagination == 'infinite-scroll') { %>
        $scope.page = 1;
        $scope.loadAll = function() {
            <%= entityClass %>.get({page: $scope.page, per_page: 20}, function(result, headers) {
                $scope.links = ParseLinks.parse(headers('link'));
                for (var i = 0; i < result.length; i++) {
                    $scope.<%= entityInstance %>s.push(result[i]);
                }
            });
        };
        $scope.reset = function() {
            $scope.page = 1;
            $scope.<%= entityInstance %>s = [];
            $scope.loadAll();
        };<% } %><% if (pagination != 'no') { %>
        $scope.loadPage = function(page) {
            $scope.page = page;
            $scope.loadAll();
        };<% } %><% if (pagination == 'no') { %>
        $scope.loadAll = function() {
            <%= entityClass %>.get(function(result) {
               $scope.<%= entityInstance %>s = result;
            });
        };<% } %>
        $scope.loadAll();

        $scope.showUpdate = function (id) {
            <%= entityClass %>.get({id: id}, function(result) {
                $scope.<%= entityInstance %> = result;
            });
        };

        $scope.save = function () {
            if ($scope.<%= entityInstance %>.id != null) {
                <%= entityClass %>.update($scope.<%= entityInstance %>,
                    function () {
                        $scope.refresh();
                    });
            } else {
                <%= entityClass %>.save($scope.<%= entityInstance %>,
                    function () {
                        $scope.refresh();
                    });
            }
        };

        $scope.edit = function (entity) {
            $scope.<%= entityInstance %> = entity;
            $scope.showForm = true;
        };

        $scope.delete = function (id) {
            <%= entityClass %>.delete({id: id},
                function () {<% if (pagination != 'infinite-scroll') { %>
                    $scope.loadAll();<% } else { %>
                    $scope.reset();<% } %>
                    $scope.clear();
                });
        };<% if (searchEngine == 'elasticsearch') { %>

        $scope.search = function () {
            <%= entityClass %>Search.get({query: $scope.searchQuery}, function(result) {
                $scope.<%= entityInstance %>s = result;
            }, function(response) {
                if(response.status === 404) {
                    $scope.loadAll();
                }
            });
        };<% } %>

        $scope.refresh = function () {<% if (pagination != 'infinite-scroll') { %>
            $scope.loadAll();<% } else { %>
            $scope.reset();<% } %>
            $scope.clear();
        };

        $scope.<%= entityInstance %> = {<% for (fieldId in fields) { %><%= fields[fieldId].fieldName %>: null, <% } %>id: null};

        $scope.clear = function () {
            $scope.<%= entityInstance %> = {<% for (fieldId in fields) { %><%= fields[fieldId].fieldName %>: null, <% } %>id: null};
            $scope.editForm.$setPristine();
            $scope.editForm.$setUntouched();
<%  for (idx in differentTypes) {
        if (differentTypes[idx] != entityClass) { %>
            $scope.ctrl.searchText<%= differentTypes[idx] %> = null;
            $scope.<%= entityInstance %>.<%= differentTypes[idx].toLowerCase() %> = null;
    <%  }
}  %>
        };

        $scope.gridOptions = {
            data: '<%= entityInstance %>s',
            enableFiltering: true,
            onRegisterApi: function(gridApi) {
                $scope.gridApi = gridApi;
                gridApi.edit.on.afterCellEdit($scope, function(rowEntity, colDef, newValue, oldValue) {
                    <%= entityClass %>.update(rowEntity,
                        function() {
                            $scope.refresh();
                        });
                });
            },
            columnDefs: [{
                field: "id",
                displayName: "ID",
                enableCellEdit: false,
                pinnedLeft: true
<%  for (fieldId in fields) {
        var fieldInputType = 'text';
        if (fields[fieldId].fieldValidate == true) {
            var fieldValidateRules = fields[fieldId].fieldValidateRules;
            var rulesArray = new Array();
            for (var i = 0; i < fieldValidateRules.length; i++) {
                fieldValidateRules[i]
                something = fieldValidateRules[i];
                switch (fieldValidateRules[i]) {
                  case 'required':
                    rulesArray.push('required');
                    break;
                  case 'minlength':
                    rulesArray.push('minlength=' + fields[fieldId].fieldValidateRulesMinlength);
                    break;
                  case 'maxlength':
                    rulesArray.push('maxlength=' + fields[fieldId].fieldValidateRulesMaxlength);
                    break;
                  case 'pattern':
                    rulesArray.push('pattern=' + fields[fieldId].fieldValidateRulesPattern);
                    break;
                  case 'min':
                    rulesArray.push('min=' + fields[fieldId].fieldValidateRulesMin);
                    break;
                  case 'max':
                    rulesArray.push('max=' + fields[fieldId].fieldValidateRulesMax);
                    break;
                  default:
                    break;
                }
            };
        }
        if (fields[fieldId].fieldType == 'Integer' || fields[fieldId].fieldType == 'Long' || fields[fieldId].fieldType == 'BigDecimal') {
            fieldInputType = 'number';
        } else if (fields[fieldId].fieldType == 'LocalDate') {
            fieldInputType = 'date';
        } else if (fields[fieldId].fieldType == 'DateTime') {
            fieldInputType = 'datetime-local';
        } else if (fields[fieldId].fieldType == 'Boolean') {
            fieldInputType = 'checkbox';
        } %>
            }, {
                field: "<%=fields[fieldId].fieldName%>",
                displayName: "<%=fields[fieldId].fieldName%>",
                editableCellTemplate: '<div> <form name="inputForm"> <input validate-required-cell type="<%= fieldInputType %>" <%= rulesArray.join(' ') %> ng-class="\'colt\' + col.uid" ui-grid-editor ng-model="MODEL_COL_FIELD" /> </form></div>'
<%  } %>
<%  for (relationshipId in relationships) {
        var otherEntityField = relationships[relationshipId].otherEntityField;
        var otherEntityName = relationships[relationshipId].otherEntityName;
        var relationshipName = relationships[relationshipId].relationshipName;
        if (relationships[relationshipId].relationshipType == 'many-to-one') { %>
            }, {
                field: "<%=otherEntityName%>.<%=otherEntityField%>",
                displayName: "<%=relationshipName%>",
                editModelField: "<%=otherEntityName%>.id",
                editableCellTemplate: 'ui-grid/dropdownEditor',
                editDropdownOptionsArray: $scope.<%=otherEntityName%>s,
                editDropdownValueLabel: '<%=otherEntityField%>'
    <%  } else if (relationships[relationshipId].relationshipType == 'many-to-many' && relationships[relationshipId].ownerSide == true) {}
    } %>
            }, {
                name: 'placeholder',
                displayName: '',
                width: 150,
                enableSorting: false,
                enableCellEdit: false,
                enableFiltering: false,
                headerCellTemplate: '<span></span>',
                cellClass: 'tableButton',
                cellTemplate: '<div class="tableButton"><button id="delBtn" type="button" class="btn-small" ng-click="grid.appScope.delete(row.entity.id)">Delete</button><button id="editBtn" type="button" class="btn-small" ng-click="grid.appScope.edit(row.entity)">Edit</button></div>'
            }],
        };

        $scope.ctrl = {};
        $scope.ctrl.querySearch = querySearch;

        function querySearch(query, entity) {
            var results = query ? $scope[entity].filter(createFilterFor(query)) : $scope[entity];
            return results;
        }

        function createFilterFor(query) {
            var lowercaseQuery = angular.lowercase(query);
            return function filterFn(state) {
                return (state.name.toLowerCase().indexOf(lowercaseQuery) === 0);
            };
        }
    });

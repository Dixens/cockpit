(function($){

    App.module.controller("entries", function($scope, $rootScope, $http, $timeout){

        $scope.collection = COLLECTION || {};
        $scope.fields = [];
        $scope.filter = $('input[name="filter"]').val();

        $scope.fields = (COLLECTION.fields.length ? COLLECTION.fields : [COLLECTION.fields]).filter(function(field){
            return field.lst;
        });

        $scope.remove = function(index, entryId){
            App.Ui.confirm(App.i18n.get("Are you sure?"), function(){

                $http.post(App.route("/api/collections/removeentry"), {

                    "collection": angular.copy($scope.collection),
                    "entryId": entryId

                }, {responseType:"json"}).success(function(data){

                    $timeout(function(){
                        $scope.entries.splice(index, 1);
                        $scope.collection.count -= 1;

                        App.notify(App.i18n.get("Entry removed"), "success");
                    }, 0);
                }).error(App.module.callbacks.error.http);
            });
        };

        $scope.loadmore = function() {

            var limit  = 25, filter = false;

            if($scope.filter) {

                var criteria = {};

                COLLECTION.fields.forEach(function(field){
                    switch(field.type) {
                        case 'text':
                        case 'code':
                        case 'html':
                        case 'markdown':
                        case 'wysiwyg':
                            criteria[field.name] = {'$regex':$scope.filter};
                            break;
                    }
                });

                if(Object.keys(criteria).length) filter = {'$or':criteria};
            }

            $http.post(App.route("/api/collections/entries"), {

                "collection": angular.copy($scope.collection),
                "limit": limit,
                "filter": JSON.stringify(filter),
                "skip": $scope.entries ? $scope.entries.length : 0

            }, {responseType:"json"}).success(function(data){

                if(data) {

                    if(!$scope.entries) {
                        $scope.entries = [];
                    }

                    if(data.length) {

                        if(data.length < limit) {
                            $scope.nomore = true;
                        }

                        $scope.entries = $scope.entries.concat(data);

                    } else {
                       $scope.nomore = true;
                    }

                }

            }).error(App.module.callbacks.error.http);
        };

        // batch actions

        $scope.selected = [];

        $scope.removeSelected = function(){

            if(!$scope.selected.length) return;

            App.Ui.confirm(App.i18n.get("Are you sure?"), function(){

                var collection = angular.copy($scope.collection);

                $scope.selected.forEach(function(entryId){
                    for(var index=0; index<$scope.entries.length;index++) {
                        if($scope.entries[index]._id == entryId) {

                            $http.post(App.route("/api/collections/removeentry"), {
                                "collection": collection,
                                "entryId": entryId
                            }, {responseType:"json"}).error(App.module.callbacks.error.http);

                            $scope.entries.splice(index, 1);
                            $scope.collection.count -= 1;
                            break;
                        }
                    }
                });

                $scope.selected = [];
            });
        };

        var updateSelected = function(){
            var items = $(".js-select:checked");

            $scope.$apply(function(){
                $scope.selected = [];

                items.each(function(){
                    $scope.selected.push($(this).data("id"));
                });
            });
        };

        var cbAll = $(".js-all").on("click", function(){
            $(".js-select").prop("checked", cbAll.prop("checked"));
            updateSelected();
        });

        $("table").on("click", ".js-select", function(){
            cbAll.prop("checked", false);
            updateSelected();
        });

        $scope.loadmore();
    });

})(jQuery);
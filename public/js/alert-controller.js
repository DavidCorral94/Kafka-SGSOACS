angular.module("AlertListApp").controller("AlertCtrl", function ($scope, $http, $location, $q) {
    $scope.inputs = [];
    $scope.alerts = [];
    $scope.event = '{ id: 1, eventTypeName: "Temperature", value: 28.9 }';
    $scope.epl = '@NAME("DUMMY") SELECT count(*) from Temperature';

    let socket = io();
    socket.on('connect', function () {
        console.log("Connected to socket: " + socket.id);
    });
    socket.on('newAlert', function (data) {
        updateAlertList();
    });

    $scope.addEvent = function () {
        let event = {
            value: $scope.event,
            type: 'Event'
        };
        $scope.inputs.push(event);
        postInput(event);
    };

    $scope.addEPL = function () {
        let epl = {
            value: $scope.epl,
            type: 'EPL'
        };
        $scope.inputs.push(epl);
        postInput(epl);
    };

    function refresh() {
        console.log("Refreshing");
        $scope.actionTitle = "Add item";
        $scope.action = "Add";
        $scope.buttonClass = "btn btn-primary";
        $scope.alerts = [];
        updateAlertList();
    }

    function postInput(input) {
        $http.post("/inputs", input).then(function () {
            console.log('Event/EPL sent to Kafka')
        });
    }

    function updateAlertList() {
        $http.get("/alerts").then(function (response) {
            $scope.alerts = response.data;
        });
    }

    $scope.refresh = function () {
        refresh();
    };
    refresh();
});
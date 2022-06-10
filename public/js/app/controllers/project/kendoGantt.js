angular.module('App.controllers')
  .controller('kendoGanttController', ['$scope',function ($scope){
 // gantt view
      $scope.serviceRoot = "asdasd"
      // var serviceRoot = "http://localhost:3000/";
      // var tasksDataSource = new kendo.data.GanttDataSource({
      //     batch: false,
      //     transport: {
      //         read: {
      //             url: serviceRoot + "/GanttTasks",
      //             dataType: "json"
      //         },
      //         update: {
      //             url: serviceRoot + "/api/project/node/update",
      //             dataType: "json"
      //         },
      //         destroy: {
      //             url: serviceRoot + "/api/project/node/remove",
      //             dataType: "json"
      //         },
      //         create: {
      //             url: serviceRoot + "/api/project/node/add",
      //             dataType: "json"
      //         },
      //         parameterMap: function(options, operation) {
      //             if (operation !== "read") {
      //                 return { models: kendo.stringify(options.models || [options]) };
      //             }
      //         }
      //     },
      //     schema: {
      //         model: {
      //             id: "id",
      //             fields: {
      //                 id: { from: "ID", type: "number" },
      //                 orderId: { from: "OrderID", type: "number", validation: { required: true } },
      //                 parentId: { from: "ParentID", type: "number", defaultValue: null, validation: { required: true } },
      //                 start: { from: "Start", type: "date" },
      //                 end: { from: "End", type: "date" },
      //                 title: { from: "Title", defaultValue: "", type: "string" },
      //                 percentComplete: { from: "PercentComplete", type: "number" },
      //                 summary: { from: "Summary", type: "boolean" },
      //                 expanded: { from: "Expanded", type: "boolean", defaultValue: true }
      //             }
      //         }
      //     }
      // });

      // var dependenciesDataSource = new kendo.data.GanttDependencyDataSource({
      //     transport: {
      //         read: {
      //             url: serviceRoot + "/GanttDependencies",
      //             dataType: "json"
      //         },
      //         update: {
      //             url: serviceRoot + "/GanttDependencies/Update",
      //             dataType: "json"
      //         },
      //         destroy: {
      //             url: serviceRoot + "/GanttDependencies/Destroy",
      //             dataType: "json"
      //         },  
      //         create: {
      //             url: serviceRoot + "/GanttDependencies/Create",
      //             dataType: "json"
      //         },
      //         parameterMap: function(options, operation) {
      //             if (operation !== "read" && options.models) {
      //                 return { models: kendo.stringify(options.models) };
      //             }
      //         }
      //     },
      //     schema: {
      //         model: {
      //              id: { from: "_id", type: "number" },
      //             fields: {
      //                 predecessorId: { from: "PredecessorID", type: "number" },
      //                 successorId: { from: "SuccessorID", type: "number" },
      //                 type: { from: "Type", type: "number" }
      //                 // orderId: { from: "OrderID", type: "number", validation: { required: true } },
      //                 parentId: { from: "ParentID", type: "number", validation: { required: true } },
      //                 start_date: { from: "Start", type: "stri" },
      //                 end_date: { from: "End", type: "string" },
      //                 title: { from: "title", defaultValue: "", type: "string", defaultValue: 0 },
      //                 percentComplete: { from: "complete", type: "number" },
      //                 expanded: { from: "collapsed", type: "boolean" }
      //             }
      //         }
      //     }
      // });

      // $scope.ganttOptions = {
      //     dataSource: tasksDataSource,
      //     dependencies: dependenciesDataSource,
      //     views: [
      //         "day",
      //         { type: "week", selected: true },
      //         "month"
      //     ],
      //     columns: [
      //         { field: "id", title: "ID", width: 50 },
      //         { field: "title", title: "Title", editable: true },
      //         { field: "start", title: "Start Time", format: "{0:MM/dd/yyyy}", width: 100 },
      //         { field: "end", title: "End Time", format: "{0:MM/dd/yyyy}", width: 100 }
      //     ],
      //     height: 400,

      //     showWorkHours: false,
      //     showWorkDays: false
      // };
  }
]);

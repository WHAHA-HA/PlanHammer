var fs = require('fs');
var PDFDocument = require('pdfkit');
var json2csv = require('json2csv');
var wkhtmltopdf = require('wkhtmltopdf');
var toArray = require('stream-to-array');

exports.pdf_paint_tree = function (doc, tree, level_text) {
  var text, node, _level_text;

  for(var i=0; i < tree.length; i++) {
    node = tree[i];
    text = level_text ? level_text + '.' + (i+1): i+1;

    if (!node.title) continue;

    doc.font('Times-Italic')
      .text(text, 30 + node.level * 15, null, { continued: true })
      .font('Helvetica')
      .text(' ' + node.title);

    if (node.$expanded !== false && node._nodes && node._nodes.length > 0) {
      _level_text = level_text ? level_text + '.' + (i+1): i+1;
      exports.pdf_paint_tree(doc, node._nodes, _level_text);
    }
  }
};

exports.csv_prepare_json = function (doc, tree, level_text) {
  var text, node, _level_text;

  for(var i=0; i < tree.length; i++) {
    node = tree[i];
    if (!node.title) continue;
    _level_text = level_text ? level_text + '.' + (i+1): i+1;

    var task = {
      'TaskNumber': _level_text,
      'TaskTitle': node.title,
      'StartDate': node.start_date,
      'EndDate': node.end_date,
      'Notes': node.notes,
      'Complete%': node.complete,
      'Duration': node.duration.value + node.duration.type + '(s)',
      'Cost': node.cost,
      'Resources': node.resources
    };
    doc.push(task);

    if (node.$expanded !== false && node._nodes && node._nodes.length > 0) {
      exports.csv_prepare_json(doc, node._nodes, _level_text);
    }
  }
};

exports.raci_prepare_json = function (list) {
  var data = [];
  var tasks = list.tasks
  var resources = list.resources;
  var racis = list.racis;
  
  tasks.forEach(function (task) {
    var current = { 'Task': task.title }

    resources.forEach(function (resource) {
      current[resource] = exports.findRaci(resource, task, racis);
    });

    data.push(current);
  });

  return data;
};

exports.risk_prepare_json = function (risks) {
  var result = [];

  risks.forEach(function (risk) {
    result.push({
      'Name': risk.name,
      'Topic': risk.topic,
      'Level': risk.level,
      'Probability': risk.probability,
      'Impact': risk.impact,
      'Score': risk.score,
      'Mitigation': risk.mitigation,
      'Contingency': risk.contingency,
      'Consequence': risk.consequence,
      'Associated Task': risk.task.title
    });
  });

  return result;
};

exports.findRaci = function (resource, task, racis) {
  var found = _.find(racis, function (raci) {
    if (!raci.node) return false;
    return raci.node._id === task._id && resource === raci.resource;
  });

  return found ? found.role: 'Unassigned';
};

exports.xml_prepare_json = function (doc, tree) {
  var tasks_array = [];
  var titles = ['SaveVersion', 'Name', 'Author', 'CreationDate', 'LastSaved',
    'ScheduleFromStart', 'StartDate', 'FinishDate', 'FYStartDate', 'CriticalSlackLimit',
    'LoadRealTimeCollaboration', 'CurrencyDigits', 'CurrencySymbol', 'CurrencyCode',
    'CurrencySymbolPosition', 'CalendarUID', 'DefaultStartTime', 'DefaultFinishTime',
    'MinutesPerDay', 'MinutesPerWeek', 'DaysPerMonth', 'DefaultTaskType', 'DefaultFixedCostAccrual',
    'DefaultStandardRate', 'DefaultOvertimeRate', 'DurationFormat', 'WorkFormat',
    'EditableActualCosts', 'HonorConstraints', 'InsertedProjectsLikeSummary',
    'MultipleCriticalPaths', 'NewTasksEffortDriven', 'NewTasksEstimated',
    'SplitsInProgressTasks', 'SpreadActualCost', 'SpreadPercentComplete',
    'TaskUpdatesResource', 'FiscalYearStart', 'WeekStartDay', 'MoveCompletedEndsBack',
    'MoveRemainingStartsBack', 'MoveRemainingStartsForward', 'MoveCompletedEndsForward',
    'BaselineForEarnedValue', 'AutoAddNewResourcesAndTasks', 'CurrentDate',
    'MicrosoftProjectServerURL', 'Autolink', 'NewTaskStartDate', 'DefaultTaskEVMethod',
    'ProjectExternallyEdited', 'ExtendedCreationDate', 'ActualsInSync',
    'RemoveFileProperties', 'AdminProject', 'OutlineCodes', 'WBSMasks',
    'ExtendedAttributes', 'ProjectDateFormat', 'ProjectTimeFormat', 'Assignments', 'Risks'
  ];

  titles.forEach(function (title) {
    doc[title] = null;
  });

  function read_tasks(tree, level_text) {
    var text, node, _level_text;

    for(var i=0; i < tree.length; i++) {
      node = tree[i];
      _level_text = level_text ? level_text + '.' + (i+1): i+1;

      var task = {
        'Task': {
          'TaskNumber': _level_text,
          'TaskTitle': node.title,
          'StartDate': node.start_date,
          'EndDate': node.end_date,
          'Notes': node.notes,
          'Complete': node.complete,
          'Duration': node.duration.value + node.duration.type + '(s)',
          'Cost': node.cost,
          'Resources': node.resources
        }
      };
      tasks_array.push(task);

      if (node.$expanded !== false && node._nodes.length > 0) {
        read_tasks(node._nodes, _level_text);
      }
    }
  }
  read_tasks(tree);
  doc['Tasks'] = {'Entries': tasks_array};
};

exports.calendars_xml = function () {
  var str = [
    '<Calendars><Calendar><UID>1</UID><Name>Standard</Name>',
    '<IsBaseCalendar>1</IsBaseCalendar><BaseCalendarUID>-1</BaseCalendarUID>',
    '<WeekDays><WeekDay><DayType>1</DayType><DayWorking>0</DayWorking></WeekDay>',
    '<WeekDay><DayType>2</DayType><DayWorking>1</DayWorking><WorkingTimes>',
    '<WorkingTime><FromTime>08:00:00</FromTime><ToTime>12:00:00</ToTime>',
    '</WorkingTime><WorkingTime><FromTime>13:00:00</FromTime><ToTime>17:00:00',
    '</ToTime></WorkingTime></WorkingTimes></WeekDay><WeekDay><DayType>3',
    '</DayType><DayWorking>1</DayWorking><WorkingTimes><WorkingTime><FromTime>',
    '08:00:00</FromTime><ToTime>12:00:00</ToTime></WorkingTime><WorkingTime>',
    '<FromTime>13:00:00</FromTime><ToTime>17:00:00</ToTime></WorkingTime>',
    '</WorkingTimes></WeekDay><WeekDay><DayType>4</DayType><DayWorking>1',
    '</DayWorking><WorkingTimes><WorkingTime><FromTime>08:00:00</FromTime>',
    '<ToTime>12:00:00</ToTime></WorkingTime><WorkingTime><FromTime>13:00:00',
    '</FromTime><ToTime>17:00:00</ToTime></WorkingTime></WorkingTimes></WeekDay>',
    '<WeekDay><DayType>5</DayType><DayWorking>1</DayWorking><WorkingTimes>',
    '<WorkingTime><FromTime>08:00:00</FromTime><ToTime>12:00:00</ToTime>',
    '</WorkingTime><WorkingTime><FromTime>13:00:00</FromTime><ToTime>17:00:00',
    '</ToTime></WorkingTime></WorkingTimes></WeekDay><WeekDay><DayType>6</DayType>',
    '<DayWorking>1</DayWorking><WorkingTimes><WorkingTime><FromTime>08:00:00',
    '</FromTime><ToTime>12:00:00</ToTime></WorkingTime><WorkingTime><FromTime>',
    '13:00:00</FromTime><ToTime>17:00:00</ToTime></WorkingTime></WorkingTimes>',
    '</WeekDay><WeekDay><DayType>7</DayType><DayWorking>0</DayWorking></WeekDay>',
    '</WeekDays></Calendar></Calendars>'
  ];
  return str.join('');
};

exports.handler = function (export_type, view_type, project_id, tree, callback) {
  var json2xml = Helpers.json2xml;
  var amazon = Helpers.amazon;
  var file_path = APP_PATH + 'public/files/' + export_type + '/' + project_id + '_' + view_type + '.'
  var doc = [];

  file_path += (export_type === 'raci') ? 'csv' : export_type;

  if (view_type === 'simple') {
    if (export_type === 'pdf') doc = new PDFDocument();
    if (export_type === 'xml') doc = {};

    Models.Project.findById(project_id, function (error, project) {
      if (error) return callback(error);
      
      if (export_type === 'pdf') {
        doc.fontSize(20).font('Helvetica');
        doc.text(project.name, 45, 40);
        doc.text(' ').fontSize(16);

        amazon.get_file('projects', 'image', project_id, function (error, image) {
          if (!error && image) {
            doc.image(image, 450, 10, { width: 120 });
          }

          exports.pdf_paint_tree(doc, tree);
          doc.save().end();

          toArray(doc, function (error, data) {
            data = Buffer.concat(data);

            amazon.upload('projects', 'pdf-simple', project_id, data)
            .then(function (url) {
              callback();
            })
            .catch(function (error) {
              callback(error);
            });
          });
        });
      }

      if (export_type === 'csv') {
        exports.csv_prepare_json(doc, tree);

        var data = {
          data: doc,
          fields: [
            'TaskNumber', 'TaskTitle', 'StartDate', 'EndDate',
            'Notes', 'Complete%', 'Duration', 'Cost', 'Resources'
          ]
        };

        json2csv(data, function (err, csv) {
          if (err) return callback(err);

          amazon.upload('projects', 'csv', project_id, csv)
          .then(function (url) {
            callback();
          })
          .catch(function (error) {
            callback(error);
          });
        });
      }

      if (export_type === 'raci') {
        var data = {
          data: exports.raci_prepare_json(tree),
          fields: ['Task']
        };

        data.fields = data.fields.concat(tree.resources);

        json2csv(data, function (err, csv) {
          if (err) return callback(err);

          amazon.upload('projects', 'raci', project_id, csv)
          .then(function (url) {
            callback();
          })
          .catch(function (error) {
            callback(error);
          });
        });
      }

      if (export_type === 'risk-csv') {
        var data = {
          data: exports.risk_prepare_json(tree),
          fields: ['Name', 'Topic', 'Level', 'Probability', 'Impact', 'Score',
            'Mitigation', 'Contingency', 'Consequence', 'Associated Task'
          ]
        };

        json2csv(data, function (err, csv) {
          if (err) return callback(err);

          amazon.upload('projects', 'risk-csv', project_id, csv)
          .then(function (url) {
            callback();
          })
          .catch(function (error) {
            callback(error);
          });
        });
      }

      if (export_type === 'xml') {
        exports.xml_prepare_json(doc, tree);

        var output_xml = json2xml.convert(doc);
        var calendars_xml = exports.calendars_xml();

        output_xml += calendars_xml;
        output_xml = '<Project>' + output_xml + '</Project>';

        amazon.upload('projects', 'xml', project_id, output_xml)
        .then(function (url) {
          callback();
        })
        .catch(function (error) {
          callback(error);
        });
      }
    });
  } else { // detailed
    if (export_type === 'pdf') {
      Models.Project.findById(project_id, function (error, project) {
        if (error) return callback(error);

        var css_text = 'body { width: 100%; height: 100%; overflow-x: visible; } svg:not(:root) { overflow: hidden; } svg { overflow: scroll; } .link { fill: none; stroke: #ccc; } .node .toolbox, .node circle, .node .actionArrows { display: none; }';
        var project_title = '<div style="float: left; vertical-align: bottom;"><p style="font-family: Halvetica; font-size: 20px; padding-top: 30px;">' + project.name + '</p></div>';
        var project_logo = '<div style="float: right;"><img src="http://' + config.get('domain') + '/api/project/' + project_id + '/image" width="120"></div><div style="clear: both;"></div>';
        var reader = wkhtmltopdf('<html><head><style>' + css_text + '</style></head><body>' + project_title + project_logo + tree + '</body></html>', {orientation: 'landscape'});

        reader.on('end', function() {
          toArray(reader, function (error, data) {
            data = Buffer.concat(data);

            amazon.upload('projects', 'pdf-detailed', project_id, data)
            .then(function (url) {
              callback();
            })
            .catch(function (error) {
              callback(error);
            });
          });
        });
      });
    }
  }
};

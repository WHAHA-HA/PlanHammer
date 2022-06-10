var isProjectOwner = Middlewares.secure.isProjectOwner;
var canExport = Middlewares.secure.canExport;
var export_handler = Helpers.export.handler;
var Api_Response = Middlewares.general.api_response;
var Project = Models.Project;
var amazon = Helpers.amazon;

app.get('/data/:type/:name', function (req, res, next) {
  var project_id, file_type, filename;
  var type = req.params.type;
  var name = req.params.name;
  var path = APP_PATH + 'public/files/' + type + '/' + name;
  var match = name.match(/^(.+)_(simple|detailed)\.(.{3})$/);

  if (match && match.length === 4) {
    project_id = match[1];
    file_type = match[3];

    Project.findById(project_id, function (error, project) {
      filename = project.name;

      if (type === 'risk') filename += ' Risk Register';
      if (type === 'raci') filename += ' RACI';

      if (type === 'pdf') {
        filename += ' ' + match[2];
        type = type + '-' + match[2];
      }

      amazon.get_file('projects', type, project_id, function (error, file) {
        filename += '.' + file_type;
        res.set({ 'Content-Disposition': 'attachment; filename="' + filename +'"' });
        res.send(file);
      });
    });
  } else {
    res.download(path);
  }
});

app.post('/api/project/export/pdf/simple', isProjectOwner, canExport, function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var project_id = req.body.project_id;
  var tree = req.body.tree;

  export_handler('pdf', 'simple', project_id, tree, function(error, url) {
    if (error) return api_response(error);
    api_response(null, { path: '/data/pdf/' + project_id + '_simple.pdf' });
  });
});

app.post('/api/project/export/pdf/detailed', isProjectOwner, canExport, function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var project_id = req.body.project_id;
  var html_doc = req.body.html_doc;

  export_handler('pdf', 'detailed', project_id, html_doc, function(error) {
    if (error) return api_response(error);

    api_response(null, { path: '/data/pdf/' + project_id + '_detailed.pdf' });
  });
});

app.post('/api/project/export/csv/simple', isProjectOwner, canExport, function(req, res, next) {
  var api_response = Api_Response(req, res, next);
  var project_id = req.body.project_id;
  var tree = req.body.tree;

  export_handler('csv', 'simple', project_id, tree, function(error) {
    if (error) return api_response(error);

    api_response(null, { path: '/data/csv/' + project_id + '_simple.csv' });
  });
});

app.post('/api/project/export/raci/simple', isProjectOwner, canExport, function(req, res, next) {
  var api_response = Api_Response(req, res, next);
  var data = req.body.raci;
  var project_id = req.body.project_id;

  export_handler('raci', 'simple', project_id, data, function(error) {
    if (error) return api_response(error);

    api_response(null, { path: '/data/raci/' + project_id + '_simple.csv' });
  });
});

app.post('/api/project/export/risk-csv/simple', isProjectOwner, canExport, function(req, res, next) {
  var api_response = Api_Response(req, res, next);
  var data = req.body.risks;
  var project_id = req.body.project_id;

  export_handler('risk-csv', 'simple', project_id, data, function(error) {
    if (error) return api_response(error);

    api_response(null, { path: '/data/risk/' + project_id + '_simple.csv' });
  });
});

app.post('/api/project/export/xml/simple', isProjectOwner, canExport, function(req, res, next) {
  var api_response = Api_Response(req, res, next);
  var project_id = req.body.project_id;
  var tree = req.body.tree;

  export_handler('xml', 'simple', project_id, tree, function(error) {
    if (error) return api_response(error)

    api_response(null, { path: '/data/xml/' + project_id + '_simple.xml' });
  });
});

var deploy = Helpers.deploy;

app.post('/deploy', function (req, res, next) {
  var payload = JSON.parse(req.body.payload);

  if (payload && payload.commits) {
    for(var i=0; i<payload.commits.length; i++) {
      if (payload.commits[i].branch === 'master') return deploy.prod();
      if (payload.commits[i].branch === 'develop') return deploy.dev();
    }
  }
});

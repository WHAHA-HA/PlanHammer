exports.example = function (user) {
  var Project = Models.Project;
  var Node = Models.Node;
  var deffered = Q.defer();

  var project = new Project({
    name: 'Example project ' + user.username,
    description: 'this is example project',
    _user: user._id
  });
  
  project.save(function (error, project) {
    if (error) return deffered.reject(error);

    var node1 = new Node({
      title: 'Task 1',
      _project: project._id,
      _shared: [{ user: user._id, is_root: true }]
    });

    var node2 = new Node({
      title: 'Task 2',
      _project: project._id,
      _shared: [{ user: user._id, is_root: true }]
    });

    node1.save(function (error) {
      if (error) return deffered.reject(error);
      node2.save(function (error) {
        if (error) return deffered.reject(error);
        deffered.resolve();
      });  
    });
  });

  return deffered.promise;
};

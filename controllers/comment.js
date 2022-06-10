var Api_Response = Middlewares.general.api_response;
var $Comment = Models.Comment;


app.get('/api/node/:id/comments', function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var node_id = req.params.id;

  $Comment.all(node_id, api_response);
});

app.post('/api/node/:id/comments', function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var payload = req.body;

  payload.user = req.user._id;

  $Comment.add(payload, api_response);
});

app.delete('/api/comment/:id', function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var id = req.params.id;

  $Comment.findById(id, function (error, comment) {
    if (error) return api_response(error);
    if (!comment) return api_response('comment was not found');
    if (comment.user != req.user._id) return api_response('you have no right to remove this comment');

    comment.remove(api_response);
  });
});

app.put('/api/comment/:id', function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var id = req.params.id;
  var user_id = req.user._id;
  var upvote = req.body.upvote;
  var text = req.body.text;

  $Comment.findById(id, function (error, comment) {
    if (upvote) {
      (upvote == 1) ? comment.upvotes.push(user_id) : comment.upvotes.pull(user_id);
      comment.save(api_response);
    }

    if (text) {
      comment.text = text;
      comment.save(api_response);
    }
  });
});

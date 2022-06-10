var auth = Middlewares.secure.auth;
var async = require('async');
var User = Models.User;
var stripe = app.get('stripe');
var Api_Response = Middlewares.general.api_response;

app.post('/api/payment/card/update', auth, function (req, res, next) {
  var api_response = Api_Response(req, res, next);
  var token = req.body.token
  var customer = req.user.stripe && req.user.stripe.customer;
  var user_id = req.user._id;

  if (customer) {
    stripe.customers.del(customer);
  }

  User.calculatePlan(user_id, function (error, plan) {
    if (error) return api_response(error);

    var data = {
      card: token,
      email: req.user.email,
      plan: plan
    };

    stripe.customers.create(data, function (error, response) {
      if (error) return api_response(error);

      var stripe_data = {
        customer: response.id,
        card: response.cards.data[0].id,
        plan: plan
      };

      User.setStripeData(user_id, stripe_data, function (error) {
        Helpers.user.refreshSession(req, function (error) {
          api_response(error, { plan: User.plans[plan] });
        });
      });
    });
  });
});

app.post('/api/payment/plan/get', auth, function (req, res, next) {
  var api_response = Api_Response(req, res, next);

  User.findById(req.user._id, function (error, user) {
    if (error) return api_response(error);
    if (!user.stripe) return api_response(null);

    var plan = User.plans[user.stripe.plan];
    api_response(null, { plan: plan });
  });
});

app.post('/api/stripe', function(req, res) {
  var body = (typeof(req.body) === 'string') ? JSON.parse(req.body) : req.body;

  if (!body || !body.data || body.type !== 'invoice.created') {
    return res.send(200);
  }
  
  var query = { 'stripe.customer': body.data.customer };

  User.find(query, function (error, user) {
    if (error || !user) return res.send(200);
    var count = user.free_month_count;

    if (count && count > 0) {
      user.set('free_month_count', count - 1);
      user.save();

      stripe.invoiceItems.create({
        customer: body.data.customer,
        amount: -body.total,
        currency: 'usd',
        description: 'free month'
      }, function(err, invoiceItem) {
        res.send(200);
      });
    } else {
      res.send(200);
    }
  });
});

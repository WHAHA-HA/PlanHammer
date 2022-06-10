module.exports = function() {
  var payment = config.get('payment');

  if (payment && payment.options && payment.options.api_key)
    app.set('stripe', require('stripe')(payment.options.api_key));
};

var _iz = require('iz').validators;
var validators = [
  {
    name: 'email',
    message: 'is not a valid email',
    fn: function (value) {
      return _iz.email(value);
    }
  },
  {
    name: 'required',
    message: '#{name} is required',
    fn: function (value) {
      return _iz.required(value);
    }
  },
  {
    name: 'date',
    message: '#{name} is not valid date',
    fn: function (value) {
      return _iz.date(value);
    }
  },
  {
    name: 'number',
    message: '#{name} is not valid number',
    fn: function (value) {
      return _iz.number(value);
    }
  },
  {
    name: 'string',
    message: '#{name} is not valid string',
    fn: function (value) {
      return _iz.string(value);
    }
  },
  {
    name: 'between',
    message: '#{name} is not in range',
    fn: function (n, l, r) {
      return n > l && n < r ? true : false;
    }
  },
  {
    name: 'length',
    message: '#{name} length is not in range',
    fn: function (value, l, r) {
      return value.length > l && value.length < r ? true : false;
    }
  }
];

var Iz = function (name, value) {
  var self = this;

  self.errors = [];
  self.valid = true;
  self.value = value;
  self.name = name;

  validators.forEach(self.addValidator.bind(self));

  return self;
};

Iz.prototype.addValidator = function (obj) {
  var self = this;
  var name = obj.name;
  var message = obj.message;
  var validator = obj.fn;

  if (self[name]) {
    throw new Error('validator already exists');
  }

  self[name] = function () {
    var args = Array.prototype.slice.apply(arguments);
    args.unshift(self.value);

    var valid = validator.apply(self, args);
    var msg = message.replace(/#{name}/g, self.name);

    if (!valid) {
      self.errors.push(msg);
      self.valid = false;
    }

    return self;
  };
};

module.exports = function (name, value) {
  return new Iz(name, value);
};

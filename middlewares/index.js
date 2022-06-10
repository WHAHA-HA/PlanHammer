var fs = require('fs');

fs.readdirSync(__dirname)
  .filter(function (name) {
    return name !== 'index.js';
  })
  .forEach(function (name) {
    var name = name.replace('.js', '');
    exports[name] = require(__dirname + '/' + name);
  });

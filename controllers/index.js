var fs = require('fs');

fs.readdirSync(__dirname)
  .filter(function (name) {
    return name !== 'index.js';
  })
  .forEach(function (name) {
    require(__dirname + '/' + name);
  });

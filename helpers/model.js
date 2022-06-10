var mongoose = require('mongoose');
var validation = {};

validation.uniqueFieldInsensitive = function ( modelName, field ) {
  return function(val, cb) {
    if ( val && val.length ) {
      var query = mongoose.models[modelName].where( field, new RegExp('^'+val+'$', 'i') )
       
      if ( !this.isNew ) {
        query = query.where('_id').ne(this._id)
      }
      
      query.count(function(err, n) {
        cb( n < 1 )
      })
    } else {
      cb( false )
    }
  }
};

exports.validation = validation;

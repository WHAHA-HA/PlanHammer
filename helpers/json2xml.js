exports.convert = function(obj, rootname) {
    var xml = "";
    function tag(name, options) {
        options = options || {};
        return "<"+(options.closing ? "/" : "")+name+">";
    }

    for (var i in obj) {
        if(obj.hasOwnProperty(i)){
            var value = obj[i], type = typeof value;
            if (value instanceof Array && type == 'object') {
                for (var sub in value) {
                    xml += exports.convert(value[sub]);
                }
            } else if (value instanceof Object && type == 'object') {
                xml += tag(i) + exports.convert(value)+tag(i,{closing:1});
            } else {
                xml += tag(i) + value + tag(i,{closing:1});
            }
        }
    }
    return rootname ? tag(rootname) + xml + tag(rootname,{closing:1}) : xml;
}
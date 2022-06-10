angular.module('App.services')
  .service('Scheme', function () {
    this.getBoxSides = function(box, x, y) {
      var boxRight  = box.left + box.width;
      var boxBottom = box.top  + box.height;
      data = {
        left      : box.left,
        top       : box.top,
        right     : boxRight,
        bottom    : boxBottom,
        centerY   : (box.top     + box.height/2),
        centerX   : (box.left    + box.width/2),
        leftZone  : (box.left    + box.width/2.5),
        rightZone : (box.left    + box.width/1.5),
        bottomZone: (box.top     + box.height/1.5)
      };
      
      return data;
    };
  });
  

/**
 * Author: Russell Toris 
 * Version: October 18, 2012
 * 
 * Converted to AMD by Jihoon Lee 
 * Version: Oct 05, 2012
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([ 'eventemitter2' ], factory);
  } else {
    root.Map = factory(root.EventEmitter2);
  }
}(this, function(EventEmitter2) {
  var Map = function(options) {
    var map = this;
    options = options || {};
    map.ros = options.ros;
    map.mapTopic = options.mapTopic || '/map';
    map.continuous = options.continuous;

    // internal drawing canvas
    map.image = document.createElement('canvas');
    var context = map.image.getContext('2d');

    // map meta data and raw data
    map.info;
    map.data;

    // setup a listener for the map data
    var mapListener = new map.ros.Topic({
      name : map.mapTopic,
      messageType : 'nav_msgs/OccupancyGrid',
      compression : 'png'
    });
    mapListener.subscribe(function(occupancyGrid) {
      // set the metadata
      map.info = occupancyGrid.info;
      // store the raw data
      map.data = occupancyGrid.data;

      // set the size
      map.image.width = map.info.width;
      map.image.height = map.info.height;

      var imageData = context.createImageData(map.info.width, map.info.height);
      for ( var row = 0; row < map.info.height; row++) {
        for ( var col = 0; col < map.info.width; col++) {
          // determine the index into the map data
          var mapI = col + ((map.info.height - row - 1) * map.info.width);
          // determine the value
          if (map.data[mapI] == 100) {
            var val = 0;
          } else if (map.data[mapI] == 0) {
            var val = 255;
          } else {
            var val = 127;
          }

          // determine the index into the image data array
          var i = (col + (row * imageData.width)) * 4;
          // r
          imageData.data[i] = val;
          // g
          imageData.data[++i] = val;
          // b
          imageData.data[++i] = val;
          // a
          imageData.data[++i] = 255;
        }
      }
      context.putImageData(imageData, 0, 0);

      // check if we only wanted one message
      if (!map.continuous) {
        mapListener.unsubscribe();
      }

      // notify the user an image is ready
      map.emit('available');
    });
  };
  Map.prototype.__proto__ = EventEmitter2.prototype;
  return Map;
}));

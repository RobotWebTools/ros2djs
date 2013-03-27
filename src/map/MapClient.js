/**
 * @author Russell Toris - rctoris@wpi.edu
 */

ROS2D.MapClient = function(options) {
  var that = this;
  var options = options || {};
  this.ros = options.ros;
  this.topic = options.mapTopic || '/map';
  this.continuous = options.continuous;

  // map metadata
  this.pose = null;
  this.resolution = null;
  // internal drawing canvas
  this.image = document.createElement('canvas');

  // setup a listener for the map data
  var mapListener = new ROSLIB.Topic({
    ros : this.ros,
    name : this.topic,
    messageType : 'nav_msgs/OccupancyGrid',
    compression : 'png'
  });
  mapListener.subscribe(function(occupancyGrid) {
    var context = that.image.getContext('2d');

    // save the metadata we need
    that.pose = new ROSLIB.Pose({
      position : occupancyGrid.info.origin.position,
      orientation : occupancyGrid.info.origin.orientation
    });
    that.resolution = occupancyGrid.info.resolution;

    // set the size
    var width = occupancyGrid.info.width;
    var height = occupancyGrid.info.height;
    that.image.width = width;
    that.image.height = height;

    var imageData = context.createImageData(width, height);
    for ( var row = 0; row < height; row++) {
      for ( var col = 0; col < width; col++) {
        // determine the index into the map data
        var mapI = col + ((height - row - 1) * width);
        // determine the value
        var data = occupancyGrid.data[mapI];
        if (data === 100) {
          var val = 0;
        } else if (data === 0) {
          var val = 255;
        } else {
          var val = 127;
        }

        // determine the index into the image data array
        var i = (col + (row * width)) * 4;
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
    if (!that.continuous) {
      mapListener.unsubscribe();
    }

    // notify the user an image is ready
    that.emit('ready', that.image);
  });
};
ROS2D.MapClient.prototype.__proto__ = EventEmitter2.prototype;

/**
 * @author Russell Toris - rctoris@wpi.edu
 */

ROS2D.OccupancyGrid = function(options) {
  var that = this;
  var options = options || {};
  var message = options.message;

  // internal drawing canvas
  var canvas = document.createElement('canvas');
  var context = canvas.getContext('2d');

  // save the metadata we need
  this.pose = new ROSLIB.Pose({
    position : message.info.origin.position,
    orientation : message.info.origin.orientation
  });
  this.resolution = message.info.resolution;

  // set the size
  this.width = message.info.width;
  this.height = message.info.height;
  canvas.width = this.width;
  canvas.height = this.height;

  var imageData = context.createImageData(this.width, this.height);
  for ( var row = 0; row < this.height; row++) {
    for ( var col = 0; col < this.width; col++) {
      // determine the index into the map data
      var mapI = col + ((this.height - row - 1) * this.width);
      // determine the value
      var data = message.data[mapI];
      if (data === 100) {
        var val = 0;
      } else if (data === 0) {
        var val = 255;
      } else {
        var val = 127;
      }

      // determine the index into the image data array
      var i = (col + (row * this.width)) * 4;
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

  this.object = new createjs.Bitmap(canvas);
};

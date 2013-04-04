/**
 * @author Russell Toris - rctoris@wpi.edu
 */

var ROS2D = ROS2D || {
  REVISION : '1'
};

// convert the given global Stage coordinates to ROS coordinates
createjs.Stage.prototype.globalToRos = function(x, y) {
  var rosX = x / this.scaleX;
  // change Y direction
  var rosY = this.y - (y / this.scaleY);
  return {
    x : rosX,
    y : rosY
  };
};

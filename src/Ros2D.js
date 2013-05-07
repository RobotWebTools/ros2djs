/**
 * @author Russell Toris - rctoris@wpi.edu
 */

var ROS2D = ROS2D || {
  REVISION : '3-devel'
};

// convert the given global Stage coordinates to ROS coordinates
createjs.Stage.prototype.globalToRos = function(x, y) {
  var rosX = (x - this.x) / this.scaleX;
  var rosY = (this.y - y) / this.scaleY;
  return {
    x : rosX,
    y : rosY
  };
};

// convert a ROS quaternion to theta in degrees
createjs.Stage.prototype.rosQuaternionToGlobalTheta = function(orientation) {
  // convert to radians
  var q0 = orientation.w;
  var q1 = orientation.x;
  var q2 = orientation.y;
  var q3 = orientation.z;
  var theta = Math.atan2(2 * (q0 * q3 + q1 * q2), 1 - 2 * (Math.pow(q2, 2) + Math.pow(q3, 2)));

  // convert to degrees
  var deg = theta * (180.0 / Math.PI);
  if (deg >= 0 && deg <= 180) {
    deg += 270;
  } else {
    deg -= 90;
  }

  return -deg;
};

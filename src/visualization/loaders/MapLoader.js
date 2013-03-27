/**
 * @author Russell Toris - rctoris@wpi.edu
 */

ROS2D.MapLoader = function(options) {
  options = options || {};
  this.ros = options.ros;
  this.viewer = options.viewer;
};
ROS2D.MapLoader.prototype.loadTopic = function(topic, continuous) {
  var that = this;
  var client = new ROS2D.MapClient({
    ros : this.ros,
    topic : topic,
    continuous : continuous
  });
  
  client.on('ready', function(image) {
    var bitmap = new createjs.Bitmap(image);
    bitmap.addEventListener("mousedown", function(){
      console.log('test');
    });
    that.viewer.addObject(bitmap);
  });
};

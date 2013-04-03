/**
 * @author Russell Toris - rctoris@wpi.edu
 */

var ROS2D = ROS2D || {
  REVISION : '1'
};/**
 * @author Russell Toris - rctoris@wpi.edu
 */

/**
 * An OccupancyGrid can convert a ROS occupancy grid message into a createjs Bitmap object.
 *
 * @constructor
 * @param options - object with following keys:
 *   * message - the occupancy grid message
 */
ROS2D.OccupancyGrid = function(options) {
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

  // create the bitmap
  createjs.Bitmap.call(this, canvas);
  // change Y direction
  this.y = -this.height * message.info.resolution;
  this.scaleX = message.info.resolution;
  this.scaleY = message.info.resolution;
};
ROS2D.OccupancyGrid.prototype.__proto__ = createjs.Bitmap.prototype;
/**
 * @author Russell Toris - rctoris@wpi.edu
 */

/**
 * A map that listens to a given occupancy grid topic.
 * 
 * Emits the following events:
 *  * 'change' - there was an update or change in the map
 *  
 * @constructor
 * @param options - object with following keys:
 *   * ros - the ROSLIB.Ros connection handle
 *   * topic (optional) - the map topic to listen to
 *   * rootObject (optional) - the root object to add this marker to
 *   * continuous (optional) - if the map should be continuously loaded (e.g., for SLAM)
 */
ROS2D.OccupancyGridClient = function(options) {
  var that = this;
  var options = options || {};
  var ros = options.ros;
  var topic = options.topic || '/map';
  this.continuous = options.continuous;
  this.rootObject = options.rootObject || new createjs.Container();

  // current grid that is displayed
  this.currentGrid = null;

  // subscribe to the topic
  var rosTopic = new ROSLIB.Topic({
    ros : ros,
    name : topic,
    messageType : 'nav_msgs/OccupancyGrid',
    compression : 'png'
  });
  rosTopic.subscribe(function(message) {
    // check for an old map
    if (that.currentGrid) {
      that.rootObject.removeChild(that.currentGrid);
    }

    that.currentGrid = new ROS2D.OccupancyGrid({
      message : message
    });
    that.rootObject.addChild(that.currentGrid);

    that.emit('change');

    // check if we should unsubscribe
    if (!that.continuous) {
      rosTopic.unsubscribe();
    }
  });
};
ROS2D.OccupancyGridClient.prototype.__proto__ = EventEmitter2.prototype;
/**
 * @author Russell Toris - rctoris@wpi.edu
 */

/**
 * A Viewer can be used to render an interactive 2D scene to a HTML5 canvas.
 *
 * @constructor
 * @param options - object with following keys:
 *  * divID - the ID of the div to place the viewer in
 *  * width - the initial width, in pixels, of the canvas
 *  * height - the initial height, in pixels, of the canvas
 *  * background - the color to render the background, like #efefef
 */
ROS2D.Viewer = function(options) {
  var that = this;
  var options = options || {};
  this.divID = options.divID;
  this.width = options.width;
  this.height = options.height;
  this.background = options.background || '#111111';

  // create the canvas to render to
  var canvas = document.createElement('canvas');
  canvas.width = this.width;
  canvas.height = this.height;
  canvas.style.background = this.background;
  document.getElementById(this.divID).appendChild(canvas);
  // create the easel to use
  this.scene = new createjs.Stage(canvas);
  
  // default zoom factor
  this.scene.scaleX = 20;
  this.scene.scaleY = 20;
  
  // change Y axis center
  this.scene.y = this.height;

  // add the renderer to the page
  document.getElementById(this.divID).appendChild(canvas);
  
  // update at 30fps
  createjs.Ticker.setFPS(30);
  createjs.Ticker.addListener(function() {
    that.scene.update();
  });
};

/**
 * Add the given createjs ojbect to the global scene in the viewer.
 * 
 * @param object - the object to add
 */
ROS2D.Viewer.prototype.addObject = function(object) {
  this.scene.addChild(object);
};

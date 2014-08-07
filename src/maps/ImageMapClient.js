/**
 * @author Russell Toris - rctoris@wpi.edu
 */

/**
 * A image map is a PNG image scaled to fit to the dimensions of a OccupancyGrid.
 *
 * Emits the following events:
 *   * 'change' - there was an update or change in the map
 *
 * @constructor
 * @param options - object with following keys:
 *   * ros - the ROSLIB.Ros connection handle
 *   * topic (optional) - the map meta data topic to listen to
 *   * image - the image URL to load
 *   * rootObject (optional) - the root object to add this marker to
 */
ROS2D.ImageMapClient = function(options) {
  var that = this;
  options = options || {};
  var ros = options.ros;
  var topic = options.topic || '/map_metadata';
  this.image = options.image;
  this.rootObject = options.rootObject || new createjs.Container();

  // create an empty shape to start with
  this.currentImage = new createjs.Shape();

  // subscribe to the topic
  var rosTopic = new ROSLIB.Topic({
    ros : ros,
    name : topic,
    messageType : 'nav_msgs/MapMetaData'
  });

  rosTopic.subscribe(function(message) {
    // we only need this once
    rosTopic.unsubscribe();

    // create the image
    that.currentImage = new ROS2D.ImageMap({
      message : message,
      image : that.image
    });
    that.rootObject.addChild(that.currentImage);
    // work-around for a bug in easeljs -- needs a second object to render correctly
    that.rootObject.addChild(new ROS2D.Grid({size:1}));

    that.emit('change');
  });
};
ROS2D.ImageMapClient.prototype.__proto__ = EventEmitter2.prototype;

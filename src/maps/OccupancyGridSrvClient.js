/**
 * @author Jihoon Lee- jihoonlee.in@gmail.com 
 *
 * - Most Implementation is copied from OccupancyGridClient implemented by Russel Toris - rctoris@wpi.edu
 */

/**
 * A map that listens to a given occupancy grid topic.
 *
 * Emits the following events:
 *   * 'change' - there was an update or change in the map
 *
 * @constructor
 * @param options - object with following keys:
 *   * ros - the ROSLIB.Ros connection handle
 *   * topic (optional) - the map topic to listen to
 *   * rootObject (optional) - the root object to add this marker to
 *   * continuous (optional) - if the map should be continuously loaded (e.g., for SLAM)
 */
ROS2D.OccupancyGridSrvClient = function(options) {
  var that = this;
  options = options || {};
  var ros = options.ros;
  var service = options.service || '/static_map';
  this.continuous = options.continuous;
  this.rootObject = options.rootObject || new createjs.Container();

  // current grid that is displayed
  this.currentGrid = null;

  // Setting up to the service
  var rosService = new ROSLIB.Service({
    ros : ros,
    name : service,
    serviceType : 'nav_msgs/GetMap',
    compression : 'png'
  });

  rosService.callService(new ROSLIB.ServiceRequest(),function(response) {
    // check for an old map
    if (that.currentGrid) {
      that.rootObject.removeChild(that.currentGrid);
    }

    that.currentGrid = new ROS2D.OccupancyGrid({
      message : response.map
    });
    that.rootObject.addChild(that.currentGrid);

    that.emit('change',that.currentGrid.origin);

  });
};
ROS2D.OccupancyGridSrvClient.prototype.__proto__ = EventEmitter2.prototype;

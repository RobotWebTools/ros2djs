/**
 * @author Jihoon Lee- jihoonlee.in@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

/**
 * A static map that receives from map_server.
 *
 * Emits the following events:
 *   * 'change' - there was an update or change in the map
 *
 * @constructor
 * @param options - object with following keys:
 *   * ros - the ROSLIB.Ros connection handle
 *   * service (optional) - the map topic to listen to, like '/static_map'
 *   * rootObject (optional) - the root object to add this marker to
 */
ROS2D.OccupancyGridSrvClient = function(options) {
  var that = this;
  options = options || {};
  var ros = options.ros;
  var service = options.service || '/static_map';
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

    that.emit('change', that.currentGrid);
  });
};
ROS2D.OccupancyGridSrvClient.prototype.__proto__ = EventEmitter2.prototype;

/**
 * @author Russell Toris - rctoris@wpi.edu
 */

var ROS2D = ROS2D || {
  REVISION : '0.5.0'
};

// convert the given global Stage coordinates to ROS coordinates
createjs.Stage.prototype.globalToRos = function(x, y) {
  var rosX = (x - this.x) / this.scaleX;
  var rosY = (this.y - y) / this.scaleY;
  return new ROSLIB.Vector3({
    x : rosX,
    y : rosY
  });
};

// convert the given ROS coordinates to global Stage coordinates
createjs.Stage.prototype.rosToGlobal = function(pos) {
  var x = pos.x * this.scaleX + this.x;
  var y = pos.y * this.scaleY + this.y;
  return {
    x : x,
    y : y
  };
};

// convert a ROS quaternion to theta in degrees
createjs.Stage.prototype.rosQuaternionToGlobalTheta = function(orientation) {
  // See https://en.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles#Rotation_matrices
  // here we use [x y z] = R * [1 0 0]
  var q0 = orientation.w;
  var q1 = orientation.x;
  var q2 = orientation.y;
  var q3 = orientation.z;
  // Canvas rotation is clock wise and in degrees
  return -Math.atan2(2 * (q0 * q3 + q1 * q2), 1 - 2 * (q2 * q2 + q3 * q3)) * 180.0 / Math.PI;
};

/**
 * @author Russell Toris - rctoris@wpi.edu
 */

/**
 * An image map is a PNG image scaled to fit to the dimensions of a OccupancyGrid.
 *
 * @constructor
 * @param options - object with following keys:
 *   * message - the occupancy grid map meta data message
 *   * image - the image URL to load
 */
ROS2D.ImageMap = function(options) {
  options = options || {};
  var message = options.message;
  var image = options.image;

  // save the metadata we need
  this.pose = new ROSLIB.Pose({
    position : message.origin.position,
    orientation : message.origin.orientation
  });

  // set the size
  this.width = message.width;
  this.height = message.height;

  // create the bitmap
  createjs.Bitmap.call(this, image);
  // change Y direction
  this.y = -this.height * message.resolution;

  // scale the image
  this.scaleX = message.resolution;
  this.scaleY = message.resolution;
  this.width *= this.scaleX;
  this.height *= this.scaleY;

  // set the pose
  this.x += this.pose.position.x;
  this.y -= this.pose.position.y;
};
ROS2D.ImageMap.prototype.__proto__ = createjs.Bitmap.prototype;

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

/**
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
  options = options || {};
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
      var val;
      if (data === 100) {
        val = 0;
      } else if (data === 0) {
        val = 255;
      } else {
        val = 127;
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
  
  // scale the image
  this.scaleX = message.info.resolution;
  this.scaleY = message.info.resolution;
  this.width *= this.scaleX;
  this.height *= this.scaleY;

  // set the pose
  this.x += this.pose.position.x;
  this.y -= this.pose.position.y;
};
ROS2D.OccupancyGrid.prototype.__proto__ = createjs.Bitmap.prototype;

/**
 * @author Russell Toris - rctoris@wpi.edu
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
ROS2D.OccupancyGridClient = function(options) {
  var that = this;
  options = options || {};
  var ros = options.ros;
  var topic = options.topic || '/map';
  this.continuous = options.continuous;
  this.rootObject = options.rootObject || new createjs.Container();

  // current grid that is displayed
  // create an empty shape to start with, so that the order remains correct.
  this.currentGrid = new createjs.Shape();
  this.rootObject.addChild(this.currentGrid);
  // work-around for a bug in easeljs -- needs a second object to render correctly
  this.rootObject.addChild(new ROS2D.Grid({size:1}));

  // subscribe to the topic
  var rosTopic = new ROSLIB.Topic({
    ros : ros,
    name : topic,
    messageType : 'nav_msgs/OccupancyGrid',
    compression : 'png'
  });

  rosTopic.subscribe(function(message) {
    // check for an old map
    var index = null;
    if (that.currentGrid) {
      index = that.rootObject.getChildIndex(that.currentGrid);
      that.rootObject.removeChild(that.currentGrid);
    }

    that.currentGrid = new ROS2D.OccupancyGrid({
      message : message
    });
    if (index !== null) {
      that.rootObject.addChildAt(that.currentGrid, index);
    }
    else {
      that.rootObject.addChild(that.currentGrid);
    }

    that.emit('change');

    // check if we should unsubscribe
    if (!that.continuous) {
      rosTopic.unsubscribe();
    }
  });
};
ROS2D.OccupancyGridClient.prototype.__proto__ = EventEmitter2.prototype;

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

/**
 * @author Bart van Vliet - bart@dobots.nl
 */

/**
 * An arrow with line and triangular head, based on the navigation arrow.
 * Aims to the left at 0 rotation, as would be expected.
 *
 * @constructor
 * @param options - object with following keys:
 *   * size (optional) - the size of the marker
 *   * strokeSize (optional) - the size of the outline
 *   * strokeColor (optional) - the createjs color for the stroke
 *   * fillColor (optional) - the createjs color for the fill
 *   * pulse (optional) - if the marker should "pulse" over time
 */
ROS2D.ArrowShape = function(options) {
	var that = this;
	options = options || {};
	var size = options.size || 10;
	var strokeSize = options.strokeSize || 3;
	var strokeColor = options.strokeColor || createjs.Graphics.getRGB(0, 0, 0);
	var fillColor = options.fillColor || createjs.Graphics.getRGB(255, 0, 0);
	var pulse = options.pulse;
	
	// draw the arrow
	var graphics = new createjs.Graphics();
	
	var headLen = size / 3.0;
	var headWidth = headLen * 2.0 / 3.0;
	
	graphics.setStrokeStyle(strokeSize);
	graphics.beginStroke(strokeColor);
	graphics.moveTo(0, 0);
	graphics.lineTo(size-headLen, 0);
	
	graphics.beginFill(fillColor);
	graphics.moveTo(size, 0);
	graphics.lineTo(size-headLen, headWidth / 2.0);
	graphics.lineTo(size-headLen, -headWidth / 2.0);
	graphics.closePath();
	graphics.endFill();
	graphics.endStroke();
	
	// create the shape
	createjs.Shape.call(this, graphics);
	
	// check if we are pulsing
	if (pulse) {
		// have the model "pulse"
		var growCount = 0;
		var growing = true;
		createjs.Ticker.addEventListener('tick', function() {
			if (growing) {
				that.scaleX *= 1.035;
				that.scaleY *= 1.035;
				growing = (++growCount < 10);
			} else {
				that.scaleX /= 1.035;
				that.scaleY /= 1.035;
				growing = (--growCount < 0);
			}
		});
	}
};
ROS2D.ArrowShape.prototype.__proto__ = createjs.Shape.prototype;

/**
 * @author Raffaello Bonghi - raffaello.bonghi@officinerobotiche.it
 */

/**
 * A Grid object draw in map.
 *
 * @constructor
 * @param options - object with following keys:
 *  * size (optional) - the size of the grid
 *  * cellSize (optional) - the cell size of map
 *  * lineWidth (optional) - the width of the lines in the grid
 */
 ROS2D.Grid = function(options) {
    var that = this;
    options = options || {};
    var size = options.size || 10;
    var cellSize = options.cellSize || 0.1;
    var lineWidth = options.lineWidth || 0.001;
    // draw the arrow
    var graphics = new createjs.Graphics();
    // line width
    graphics.setStrokeStyle(lineWidth*5);
    graphics.beginStroke(createjs.Graphics.getRGB(0, 0, 0));
    graphics.beginFill(createjs.Graphics.getRGB(255, 0, 0));
    graphics.moveTo(-size*cellSize, 0);
    graphics.lineTo(size*cellSize, 0);
    graphics.moveTo(0, -size*cellSize);
    graphics.lineTo(0, size*cellSize);
    graphics.endFill();
    graphics.endStroke();

    graphics.setStrokeStyle(lineWidth);
    graphics.beginStroke(createjs.Graphics.getRGB(0, 0, 0));
    graphics.beginFill(createjs.Graphics.getRGB(255, 0, 0));
    for (var i = -size; i <= size; i++) {
        graphics.moveTo(-size*cellSize, i * cellSize);
        graphics.lineTo(size*cellSize, i * cellSize);
        graphics.moveTo(i * cellSize, -size*cellSize);
        graphics.lineTo(i * cellSize, size*cellSize);
    }
    graphics.endFill();
    graphics.endStroke();
    // create the shape
    createjs.Shape.call(this, graphics);

};
ROS2D.Grid.prototype.__proto__ = createjs.Shape.prototype;

/**
 * @author Russell Toris - rctoris@wpi.edu
 */

/**
 * A navigation arrow is a directed triangle that can be used to display orientation.
 *
 * @constructor
 * @param options - object with following keys:
 *   * size (optional) - the size of the marker
 *   * strokeSize (optional) - the size of the outline
 *   * strokeColor (optional) - the createjs color for the stroke
 *   * fillColor (optional) - the createjs color for the fill
 *   * pulse (optional) - if the marker should "pulse" over time
 */
ROS2D.NavigationArrow = function(options) {
  var that = this;
  options = options || {};
  var size = options.size || 10;
  var strokeSize = options.strokeSize || 3;
  var strokeColor = options.strokeColor || createjs.Graphics.getRGB(0, 0, 0);
  var fillColor = options.fillColor || createjs.Graphics.getRGB(255, 0, 0);
  var pulse = options.pulse;

  // draw the arrow
  var graphics = new createjs.Graphics();
  // line width
  graphics.setStrokeStyle(strokeSize);
  graphics.moveTo(-size / 2.0, -size / 2.0);
  graphics.beginStroke(strokeColor);
  graphics.beginFill(fillColor);
  graphics.lineTo(size, 0);
  graphics.lineTo(-size / 2.0, size / 2.0);
  graphics.closePath();
  graphics.endFill();
  graphics.endStroke();

  // create the shape
  createjs.Shape.call(this, graphics);
  
  // check if we are pulsing
  if (pulse) {
    // have the model "pulse"
    var growCount = 0;
    var growing = true;
    createjs.Ticker.addEventListener('tick', function() {
      if (growing) {
        that.scaleX *= 1.035;
        that.scaleY *= 1.035;
        growing = (++growCount < 10);
      } else {
        that.scaleX /= 1.035;
        that.scaleY /= 1.035;
        growing = (--growCount < 0);
      }
    });
  }
};
ROS2D.NavigationArrow.prototype.__proto__ = createjs.Shape.prototype;

/**
 * @author Bart van Vliet - bart@dobots.nl
 */

/**
 * A shape to draw a nav_msgs/Path msg
 *
 * @constructor
 * @param options - object with following keys:
 *   * path (optional) - the initial path to draw
 *   * strokeSize (optional) - the size of the outline
 *   * strokeColor (optional) - the createjs color for the stroke
 */
ROS2D.PathShape = function(options) {
	options = options || {};
	var path = options.path;
	this.strokeSize = options.strokeSize || 3;
	this.strokeColor = options.strokeColor || createjs.Graphics.getRGB(0, 0, 0);
	
	// draw the line
	this.graphics = new createjs.Graphics();
	
	if (path !== null && typeof path !== 'undefined') {
		this.graphics.setStrokeStyle(this.strokeSize);
		this.graphics.beginStroke(this.strokeColor);
		this.graphics.moveTo(path.poses[0].pose.position.x / this.scaleX, path.poses[0].pose.position.y / -this.scaleY);
		for (var i=1; i<path.poses.length; ++i) {
			this.graphics.lineTo(path.poses[i].pose.position.x / this.scaleX, path.poses[i].pose.position.y / -this.scaleY);
		}
		this.graphics.endStroke();
	}
	
	// create the shape
	createjs.Shape.call(this, this.graphics);
};

/**
 * Set the path to draw
 *
 * @param path of type nav_msgs/Path
 */
ROS2D.PathShape.prototype.setPath = function(path) {
	this.graphics.clear();
	if (path !== null && typeof path !== 'undefined') {
		this.graphics.setStrokeStyle(this.strokeSize);
		this.graphics.beginStroke(this.strokeColor);
		this.graphics.moveTo(path.poses[0].pose.position.x / this.scaleX, path.poses[0].pose.position.y / -this.scaleY);
		for (var i=1; i<path.poses.length; ++i) {
			this.graphics.lineTo(path.poses[i].pose.position.x / this.scaleX, path.poses[i].pose.position.y / -this.scaleY);
		}
		this.graphics.endStroke();
	}
};

ROS2D.PathShape.prototype.__proto__ = createjs.Shape.prototype;

/**
 * @author Bart van Vliet - bart@dobots.nl
 */

/**
 * A polygon that can be edited by an end user
 *
 * @constructor
 * @param options - object with following keys:
 *   * pose (optional) - the first pose of the trace
 *   * lineSize (optional) - the width of the lines
 *   * lineColor (optional) - the createjs color of the lines
 *   * pointSize (optional) - the size of the points
 *   * pointColor (optional) - the createjs color of the points
 *   * fillColor (optional) - the createjs color to fill the polygon
 *   * lineCallBack (optional) - callback function for mouse interaction with a line
 *   * pointCallBack (optional) - callback function for mouse interaction with a point
 */
ROS2D.PolygonMarker = function(options) {
//	var that = this;
	options = options || {};
	this.lineSize = options.lineSize || 3;
	this.lineColor = options.lineColor || createjs.Graphics.getRGB(0, 0, 255, 0.66);
	this.pointSize = options.pointSize || 10;
	this.pointColor = options.pointColor || createjs.Graphics.getRGB(255, 0, 0, 0.66);
	this.fillColor = options.pointColor || createjs.Graphics.getRGB(0, 255, 0, 0.33);
	this.lineCallBack = options.lineCallBack;
	this.pointCallBack = options.pointCallBack;
	
	// Array of point shapes
//	this.points = [];
	this.pointContainer = new createjs.Container();
	
	// Array of line shapes
//	this.lines = [];
	this.lineContainer = new createjs.Container();
	
	this.fillShape = new createjs.Shape();
	
	// Container with all the lines and points
	createjs.Container.call(this);
	
	this.addChild(this.fillShape);
	this.addChild(this.lineContainer);
	this.addChild(this.pointContainer);
};

/**
 * Internal use only
 */
ROS2D.PolygonMarker.prototype.createLineShape = function(startPoint, endPoint) {
	var line = new createjs.Shape();
//	line.graphics.setStrokeStyle(this.strokeSize);
//	line.graphics.beginStroke(this.strokeColor);
//	line.graphics.moveTo(startPoint.x, startPoint.y);
//	line.graphics.lineTo(endPoint.x, endPoint.y);
	this.editLineShape(line, startPoint, endPoint);
	
	var that = this;
	line.addEventListener('mousedown', function(event) {
		if (that.lineCallBack !== null && typeof that.lineCallBack !== 'undefined') {
			that.lineCallBack('mousedown', event, that.lineContainer.getChildIndex(event.target));
		}
	});
	
	return line;
};

/**
 * Internal use only
 */
ROS2D.PolygonMarker.prototype.editLineShape = function(line, startPoint, endPoint) {
	line.graphics.clear();
	line.graphics.setStrokeStyle(this.lineSize);
	line.graphics.beginStroke(this.lineColor);
	line.graphics.moveTo(startPoint.x, startPoint.y);
	line.graphics.lineTo(endPoint.x, endPoint.y);
};

/**
 * Internal use only
 */
ROS2D.PolygonMarker.prototype.createPointShape = function(pos) {
	var point = new createjs.Shape();
	point.graphics.beginFill(this.pointColor);
	point.graphics.drawCircle(0, 0, this.pointSize);
	point.x = pos.x;
	point.y = -pos.y;
	
	var that = this;
	point.addEventListener('mousedown', function(event) {
		if (that.pointCallBack !== null && typeof that.pointCallBack !== 'undefined') {
			that.pointCallBack('mousedown', event, that.pointContainer.getChildIndex(event.target));
		}
	});
	
	return point;
};

/**
 * Adds a point to the polygon
 *
 * @param position of type ROSLIB.Vector3
 */
ROS2D.PolygonMarker.prototype.addPoint = function(pos) {
	var point = this.createPointShape(pos);
	this.pointContainer.addChild(point);
	var numPoints = this.pointContainer.getNumChildren();
	
	// 0 points -> 1 point, 0 lines
	// 1 point  -> 2 points, lines: add line between previous and new point, add line between new point and first point
	// 2 points -> 3 points, 3 lines: change last line, add line between new point and first point
	// 3 points -> 4 points, 4 lines: change last line, add line between new point and first point
	// etc
	
	if (numPoints < 2) {
		// Now 1 point
	}
	else if (numPoints < 3) {
		// Now 2 points: add line between previous and new point
		var line = this.createLineShape(this.pointContainer.getChildAt(numPoints-2), point);
		this.lineContainer.addChild(line);
	}
	if (numPoints > 2) {
		// Now 3 or more points: change last line
		this.editLineShape(this.lineContainer.getChildAt(numPoints-2), this.pointContainer.getChildAt(numPoints-2), point);
	}
	if (numPoints > 1) {
		// Now 2 or more points: add line between new point and first point
		var lineEnd = this.createLineShape(point, this.pointContainer.getChildAt(0));
		this.lineContainer.addChild(lineEnd);
	}
	
	this.drawFill();
};

/**
 * Removes a point from the polygon
 *
 * @param obj either an index (integer) or a point shape of the polygon
 */
ROS2D.PolygonMarker.prototype.remPoint = function(obj) {
	var index;
//	var point;
	if (obj instanceof createjs.Shape) {
		index = this.pointContainer.getChildIndex(obj);
//		point = obj;
	}
	else {
		index = obj;
//		point = this.pointContainer.getChildAt(index);
	}
	
	// 0 points -> 0 points, 0 lines
	// 1 point  -> 0 points, 0 lines
	// 2 points -> 1 point,  0 lines: remove all lines
	// 3 points -> 2 points, 2 lines: change line before point to remove, remove line after point to remove
	// 4 points -> 3 points, 3 lines: change line before point to remove, remove line after point to remove
	// etc
	
	var numPoints = this.pointContainer.getNumChildren();
	
	if (numPoints < 2) {
		
	}
	else if (numPoints < 3) {
		// 2 points: remove all lines
		this.lineContainer.removeAllChildren();
	}
	else {
		// 3 or more points: change line before point to remove, remove line after point to remove
		this.editLineShape(
			this.lineContainer.getChildAt((index-1+numPoints)%numPoints),
			this.pointContainer.getChildAt((index-1+numPoints)%numPoints),
			this.pointContainer.getChildAt((index+1)%numPoints)
		);
		this.lineContainer.removeChildAt(index);
	}
	this.pointContainer.removeChildAt(index);
//	this.points.splice(index, 1);
	
	this.drawFill();
};

/**
 * Moves a point of the polygon
 *
 * @param obj either an index (integer) or a point shape of the polygon
 * @param position of type ROSLIB.Vector3
 */
ROS2D.PolygonMarker.prototype.movePoint = function(obj, newPos) {
	var index;
	var point;
	if (obj instanceof createjs.Shape) {
		index = this.pointContainer.getChildIndex(obj);
		point = obj;
	}
	else {
		index = obj;
		point = this.pointContainer.getChildAt(index);
	}
	point.x = newPos.x;
	point.y = -newPos.y;
	
	var numPoints = this.pointContainer.getNumChildren();
	if (numPoints > 1) {
		// line before moved point
		var line1 = this.lineContainer.getChildAt((index-1+numPoints)%numPoints);
		this.editLineShape(line1, this.pointContainer.getChildAt((index-1+numPoints)%numPoints), point);
		
		// line after moved point
		var line2 = this.lineContainer.getChildAt(index);
		this.editLineShape(line2, point, this.pointContainer.getChildAt((index+1)%numPoints));
	}
	
	this.drawFill();
};

/**
 * Splits a line of the polygon: inserts a point at the center of the line
 *
 * @param obj either an index (integer) or a line shape of the polygon
 */
ROS2D.PolygonMarker.prototype.splitLine = function(obj) {
	var index;
	var line;
	if (obj instanceof createjs.Shape) {
		index = this.lineContainer.getChildIndex(obj);
		line = obj;
	}
	else {
		index = obj;
		line = this.lineContainer.getChildAt(index);
	}
	var numPoints = this.pointContainer.getNumChildren();
	var xs = this.pointContainer.getChildAt(index).x;
	var ys = this.pointContainer.getChildAt(index).y;
	var xe = this.pointContainer.getChildAt((index+1)%numPoints).x;
	var ye = this.pointContainer.getChildAt((index+1)%numPoints).y;
	var xh = (xs+xe)/2.0;
	var yh = (ys+ye)/2.0;
	var pos = new ROSLIB.Vector3({ x:xh, y:-yh });
	
	// Add a point in the center of the line to split
	var point = this.createPointShape(pos);
	this.pointContainer.addChildAt(point, index+1);
	++numPoints;
	
	// Add a line between the new point and the end of the line to split
	var lineNew = this.createLineShape(point, this.pointContainer.getChildAt((index+2)%numPoints));
	this.lineContainer.addChildAt(lineNew, index+1);

	// Set the endpoint of the line to split to the new point
	this.editLineShape(line, this.pointContainer.getChildAt(index), point);
	
	this.drawFill();
};

/**
 * Internal use only
 */
ROS2D.PolygonMarker.prototype.drawFill = function() {
	var numPoints = this.pointContainer.getNumChildren();
	if (numPoints > 2) {
		var g = this.fillShape.graphics;
		g.clear();
		g.setStrokeStyle(0);
		g.moveTo(this.pointContainer.getChildAt(0).x, this.pointContainer.getChildAt(0).y);
		g.beginStroke();
		g.beginFill(this.fillColor);
		for (var i=1; i<numPoints; ++i) {
			g.lineTo(this.pointContainer.getChildAt(i).x, this.pointContainer.getChildAt(i).y);
		}
		g.closePath();
		g.endFill();
		g.endStroke();
	}
	else {
		this.fillShape.graphics.clear();
	}
};


ROS2D.PolygonMarker.prototype.__proto__ = createjs.Container.prototype;

/**
 * @author Bart van Vliet - bart@dobots.nl
 */

/**
 * A trace of poses, handy to see where a robot has been
 *
 * @constructor
 * @param options - object with following keys:
 *   * pose (optional) - the first pose of the trace
 *   * strokeSize (optional) - the size of the outline
 *   * strokeColor (optional) - the createjs color for the stroke
 *   * maxPoses (optional) - the maximum number of poses to keep, 0 for infinite
 *   * minDist (optional) - the minimal distance between poses to use the pose for drawing (default 0.05)
 */
ROS2D.TraceShape = function(options) {
//	var that = this;
	options = options || {};
	var pose = options.pose;
	this.strokeSize = options.strokeSize || 3;
	this.strokeColor = options.strokeColor || createjs.Graphics.getRGB(0, 0, 0);
	this.maxPoses = options.maxPoses || 100;
	this.minDist = options.minDist || 0.05;
	
	// Store minDist as the square of it
	this.minDist = this.minDist*this.minDist;
	
	// Array of the poses
	// TODO: do we need this?
	this.poses = [];
	
	// Create the graphics
	this.graphics = new createjs.Graphics();
	this.graphics.setStrokeStyle(this.strokeSize);
	this.graphics.beginStroke(this.strokeColor);
	
	// Add first pose if given
	if (pose !== null && typeof pose !== 'undefined') {
		this.poses.push(pose);
	}
	
	// Create the shape
	createjs.Shape.call(this, this.graphics);
};

/**
 * Adds a pose to the trace and updates the graphics
 *
 * @param pose of type ROSLIB.Pose
 */
ROS2D.TraceShape.prototype.addPose = function(pose) {
	var last = this.poses.length-1;
	if (last < 0) {
		this.poses.push(pose);
		this.graphics.moveTo(pose.position.x / this.scaleX, pose.position.y / -this.scaleY);
	}
	else {
		var prevX = this.poses[last].position.x;
		var prevY = this.poses[last].position.y;
		var dx = (pose.position.x - prevX);
		var dy = (pose.position.y - prevY);
		if (dx*dx + dy*dy > this.minDist) {
			this.graphics.lineTo(pose.position.x / this.scaleX, pose.position.y / -this.scaleY);
			this.poses.push(pose);
		}
	}
	if (this.maxPoses > 0 && this.maxPoses < this.poses.length) {
		this.popFront();
	}
};

/**
 * Removes front pose and updates the graphics
 */
ROS2D.TraceShape.prototype.popFront = function() {
	if (this.poses.length > 0) {
		this.poses.shift();
		// TODO: shift drawing instructions rather than doing it all over
		this.graphics.clear();
		this.graphics.setStrokeStyle(this.strokeSize);
		this.graphics.beginStroke(this.strokeColor);
		this.graphics.lineTo(this.poses[0].position.x / this.scaleX, this.poses[0].position.y / -this.scaleY);
		for (var i=1; i<this.poses.length; ++i) {
			this.graphics.lineTo(this.poses[i].position.x / this.scaleX, this.poses[i].position.y / -this.scaleY);
		}
	}
};

ROS2D.TraceShape.prototype.__proto__ = createjs.Shape.prototype;

/**
 * @author Bart van Vliet - bart@dobots.nl
 */

/**
 * Adds panning to a view
 *
 * @constructor
 * @param options - object with following keys:
 *   * rootObject (optional) - the root object to apply panning to
 */
ROS2D.PanView = function(options) {
	options = options || {};
	this.rootObject = options.rootObject;
	
	// get a handle to the stage
	if (this.rootObject instanceof createjs.Stage) {
		this.stage = this.rootObject;
	}
	else {
		this.stage = this.rootObject.getStage();
	}
	
	this.startPos = new ROSLIB.Vector3();
};


ROS2D.PanView.prototype.startPan = function(startX, startY) {
	this.startPos.x = startX;
	this.startPos.y = startY;
};

ROS2D.PanView.prototype.pan = function(curX, curY) {
	this.stage.x += curX - this.startPos.x;
	this.startPos.x = curX;
	this.stage.y += curY - this.startPos.y;
	this.startPos.y = curY;
};

/**
 * @author Russell Toris - rctoris@wpi.edu
 */

/**
 * A Viewer can be used to render an interactive 2D scene to a HTML5 canvas.
 *
 * @constructor
 * @param options - object with following keys:
 *   * divID - the ID of the div to place the viewer in
 *   * width - the initial width, in pixels, of the canvas
 *   * height - the initial height, in pixels, of the canvas
 *   * background (optional) - the color to render the background, like '#efefef'
 */
ROS2D.Viewer = function(options) {
  var that = this;
  options = options || {};
  var divID = options.divID;
  this.width = options.width;
  this.height = options.height;
  var background = options.background || '#111111';

  // create the canvas to render to
  var canvas = document.createElement('canvas');
  canvas.width = this.width;
  canvas.height = this.height;
  canvas.style.background = background;
  document.getElementById(divID).appendChild(canvas);
  // create the easel to use
  this.scene = new createjs.Stage(canvas);

  // change Y axis center
  this.scene.y = this.height;

  // add the renderer to the page
  document.getElementById(divID).appendChild(canvas);

  // update at 30fps
  createjs.Ticker.setFPS(30);
  createjs.Ticker.addEventListener('tick', this.scene);
};

/**
 * Add the given createjs object to the global scene in the viewer.
 *
 * @param object - the object to add
 */
ROS2D.Viewer.prototype.addObject = function(object) {
  this.scene.addChild(object);
};

/**
 * Scale the scene to fit the given width and height into the current canvas.
 *
 * @param width - the width to scale to in meters
 * @param height - the height to scale to in meters
 */
ROS2D.Viewer.prototype.scaleToDimensions = function(width, height) {
  // store the actual offset in the ROS coordinate system
  var tmpY = this.height - (this.scene.y * this.scene.scaleY);
  this.scene.scaleX = this.width / width;
  this.scene.scaleY = this.height / height;
  // reset the offset
  this.scene.x = (this.scene.x * this.scene.scaleX);
  this.scene.y -= (tmpY * this.scene.scaleY) - tmpY;
};

/**
 * Shift the main view of the canvas by the given amount. This is based on the
 * ROS coordinate system. That is, Y is opposite that of a traditional canvas.
 *
 * @param x - the amount to shift by in the x direction in meters
 * @param y - the amount to shift by in the y direction in meters
 */
ROS2D.Viewer.prototype.shift = function(x, y) {
  this.scene.x -= (x * this.scene.scaleX);
  this.scene.y += (y * this.scene.scaleY);
};

/**
 * @author Bart van Vliet - bart@dobots.nl
 */

/**
 * Adds zooming to a view
 *
 * @constructor
 * @param options - object with following keys:
 *   * rootObject (optional) - the root object to apply zoom to
 *   * minScale (optional) - minimum scale to set to preserve precision
 */
ROS2D.ZoomView = function(options) {
	options = options || {};
	this.rootObject = options.rootObject;
	this.minScale = options.minScale || 0.001;
	
	// get a handle to the stage
	if (this.rootObject instanceof createjs.Stage) {
		this.stage = this.rootObject;
	}
	else {
		this.stage = this.rootObject.getStage();
	}
	
	this.center = new ROSLIB.Vector3();
	this.startShift = new ROSLIB.Vector3();
	this.startScale = new ROSLIB.Vector3();
};


ROS2D.ZoomView.prototype.startZoom = function(centerX, centerY) {
	this.center.x = centerX;
	this.center.y = centerY;
	this.startShift.x = this.stage.x;
	this.startShift.y = this.stage.y;
	this.startScale.x = this.stage.scaleX;
	this.startScale.y = this.stage.scaleY;
};

ROS2D.ZoomView.prototype.zoom = function(zoom) {
	// Make sure scale doesn't become too small
	if (this.startScale.x*zoom < this.minScale) {
		zoom = this.minScale/this.startScale.x;
	}
	if (this.startScale.y*zoom < this.minScale) {
		zoom = this.minScale/this.startScale.y;
	}
	
	this.stage.scaleX = this.startScale.x*zoom;
	this.stage.scaleY = this.startScale.y*zoom;
	
	this.stage.x = this.startShift.x - (this.center.x-this.startShift.x) * (this.stage.scaleX/this.startScale.x - 1);
	this.stage.y = this.startShift.y - (this.center.y-this.startShift.y) * (this.stage.scaleY/this.startScale.y - 1);
};

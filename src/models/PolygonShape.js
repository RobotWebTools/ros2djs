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

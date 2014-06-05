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
ROS2D.PolygonMarker = function(options) {
//	var that = this;
	options = options || {};
	this.strokeSize = options.strokeSize || 3;
	this.strokeColor = options.strokeColor || createjs.Graphics.getRGB(0, 0, 255, 0.66);
	this.pointSize = options.pointSize || 10;
	this.pointColor = options.pointColor || createjs.Graphics.getRGB(255, 0, 0, 0.66);
	
	// Array of point shapes
//	this.points = [];
	this.pointContainer = new createjs.Container();
	
	// Array of line shapes
//	this.lines = [];
	this.lineContainer = new createjs.Container();
	
	
	
//	// Container with all the lines and points
//	this.container = new createjs.Container();
	
	createjs.Container.call(this);
	
	this.addChild(this.pointContainer);
	this.addChild(this.lineContainer);
};


ROS2D.PolygonMarker.prototype.createLineShape = function(startPoint, endPoint) {
	var line = new createjs.Shape();
//	line.graphics.setStrokeStyle(this.strokeSize);
//	line.graphics.beginStroke(this.strokeColor);
//	line.graphics.moveTo(startPoint.x, startPoint.y);
//	line.graphics.lineTo(endPoint.x, endPoint.y);
	this.editLineShape(line, startPoint, endPoint);
	return line;
};

ROS2D.PolygonMarker.prototype.editLineShape = function(line, startPoint, endPoint) {
	line.graphics.setStrokeStyle(this.strokeSize);
	line.graphics.beginStroke(this.strokeColor);
	line.graphics.moveTo(startPoint.x, startPoint.y);
	line.graphics.lineTo(endPoint.x, endPoint.y);
};


ROS2D.PolygonMarker.prototype.createPointShape = function(pos) {
	var circle = new createjs.Shape();
	circle.graphics.beginFill(this.pointColor);
	circle.graphics.drawCircle(0, 0, this.pointSize);
	circle.x = pos.x;
	circle.y = pos.y;
	return circle;
};


ROS2D.PolygonMarker.prototype.addPoint = function(pos) {
	if (this.lineContainer.getNumChildren() < 1) {
		var circleStart = this.createCircleShape(pos);
		//	this.circles.push(circleStart);
		this.circleContainer.addChild(circleStart);
	}
	var circle = this.createCircleShape(pos);
//	this.circles.push(circle);
	this.circleContainer.addChild(circle);
	var line = this.createLineShape(this.circleContainer.getChildAt(this.circleContainer.getNumChildren()-2), circle);
//	this.lines.push(line);
	this.lineContainer.addChild(line);
};

ROS2D.PolygonMarker.prototype.splitLine = function(index) {
	var xs = this.circleContainer.getChildAt(index).x;
	var ys = this.circleContainer.getChildAt(index).y;
	var xe = this.circleContainer.getChildAt(index+1).x;
	var ye = this.circleContainer.getChildAt(index+1).y;
	var xh = (xs+xe)/2.0;
	var yh = (ys+ye)/2.0;
	var pos = new ROSLIB.Vector3({ x:xh, y:yh });
	var circle = this.createCircleShape(pos);
	this.circleContainer.addChildAt(circle, index+1);
//	this.circles.splice(index+1, 0, circle);
	var lineNew = this.createLineShape(circle, this.circleContainer.getChildAt(index+2));
	this.lineContainer.addChildAt(lineNew, index+1);
//	this.lines.splice(index+1, 0, line);
	this.editLineShape(this.lineContainer.getChildAt(index), this.circleContainer.getChildAt(index), circle);
};

ROS2D.PolygonMarker.prototype.remPoint = function(index) {
	if (index === 0) {
		this.lineContainer.removeChildAt(0);
//		this.lines.shift(;
	}
	else if (index === this.circleContainer.getNumChildren()-1) {
		this.lineContainer.removeChildAt(index-1);
//		this.lines.pop();
	}
	else {
		this.lineContainer.removeChildAt(index);
//		this.lines.splice(index, 1);
		this.editLineShape(this.lineContainer.getChildAt(index-1), this.circleContainer.getChildAt(index-1), this.circleContainer.getChildAt(index+1));
	}
	this.circleContainer.removeChildAt(index);
//	this.circles.splice(index, 1);
	
	if (this.circleContainer.getNumChildren() === 1) {
		this.circleContainer.removeChildAt(0);
//		this.circles.pop();
	}
};





/*
ROS2D.PolygonMarker.prototype.redraw = function() {
	// Clear all instructions
	this.graphics.clear();
	
	// Draw lines
	this.graphics.setStrokeStyle(this.strokeSize);
	this.graphics.beginStroke(this.strokeColor);
	this.graphics.moveTo(this.points[0].x, this.points[0].y);
	for (var i=1; i<this.points.length; ++i) {
		this.graphics.lineTo(this.points[i].x, this.points[i].y);
	}
	this.graphics.endStroke();
	
	// Draw points
	this.graphics.beginFill(this.pointColor)
	for (var i=0; i<this.points.length; ++i) {
		this..graphics.drawCircle(this.points[i].x, this.points[i].y, this.pointSize);
	}
};

ROS2D.TraceShape.prototype.addLine = function(pos) {
	if (this.points.length < 1) {
		points.push(pos);
	}
	else {
		points.push(pos);
	}
	
};

ROS2D.TraceShape.prototype.removePoint = function() {
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
*/

ROS2D.PolygonMarker.prototype.__proto__ = createjs.Container.prototype;

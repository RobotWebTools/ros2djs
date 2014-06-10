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
	
//	// Container with all the lines and points
//	this.container = new createjs.Container();
	createjs.Container.call(this);
	
	this.addChild(this.fillShape);
	this.addChild(this.lineContainer);
	this.addChild(this.pointContainer);
};


ROS2D.PolygonMarker.prototype.createLineShape = function(startPoint, endPoint) {
	var line = new createjs.Shape();
//	line.graphics.setStrokeStyle(this.strokeSize);
//	line.graphics.beginStroke(this.strokeColor);
//	line.graphics.moveTo(startPoint.x, startPoint.y);
//	line.graphics.lineTo(endPoint.x, endPoint.y);
	this.editLineShape(line, startPoint, endPoint);
	
	var that = this;
	line.addEventListener('mousedown', function(event) {
		that.lineCallBack('mousedown', event, that.lineContainer.getChildIndex(event.target));
	});
	
	return line;
};

ROS2D.PolygonMarker.prototype.editLineShape = function(line, startPoint, endPoint) {
	line.graphics.clear();
	line.graphics.setStrokeStyle(this.lineSize);
	line.graphics.beginStroke(this.lineColor);
	line.graphics.moveTo(startPoint.x, startPoint.y);
	line.graphics.lineTo(endPoint.x, endPoint.y);
};


ROS2D.PolygonMarker.prototype.createPointShape = function(pos) {
	var point = new createjs.Shape();
	point.graphics.beginFill(this.pointColor);
	point.graphics.drawCircle(0, 0, this.pointSize);
	point.x = pos.x;
	point.y = -pos.y;
	
	var that = this;
	point.addEventListener('mousedown', function(event) {
		that.pointCallBack('mousedown', event, that.pointContainer.getChildIndex(event.target));
	});
	
	return point;
};


ROS2D.PolygonMarker.prototype.addPoint = function(pos) {
	if (this.pointContainer.getNumChildren() < 1) {
		var pointStart = this.createPointShape(pos);
		//	this.points.push(pointStart);
		this.pointContainer.addChild(pointStart);
	}
	else {
		var point = this.createPointShape(pos);
//		this.points.push(point);
		this.pointContainer.addChild(point);
		var line = this.createLineShape(this.pointContainer.getChildAt(this.pointContainer.getNumChildren()-2), point);
//		this.lines.push(line);
		this.lineContainer.addChild(line);
	}
	
	this.drawFill();
};

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
	
	if (this.lineContainer.getNumChildren() > 0) {
		// line before moved point
		if (index > 0) {
			var line1 = this.lineContainer.getChildAt(index-1);
			this.editLineShape(line1, this.pointContainer.getChildAt(index-1), point);
		}
		// line after moved point
		if (index < this.pointContainer.getNumChildren()-1) {
			var line2 = this.lineContainer.getChildAt(index);
			this.editLineShape(line2, point, this.pointContainer.getChildAt(index+1));
		}
	}
	
	this.drawFill();
};

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
	var xs = this.pointContainer.getChildAt(index).x;
	var ys = this.pointContainer.getChildAt(index).y;
	var xe = this.pointContainer.getChildAt(index+1).x;
	var ye = this.pointContainer.getChildAt(index+1).y;
	var xh = (xs+xe)/2.0;
	var yh = (ys+ye)/2.0;
	var pos = new ROSLIB.Vector3({ x:xh, y:-yh });
	var point = this.createPointShape(pos);
	this.pointContainer.addChildAt(point, index+1);
//	this.points.splice(index+1, 0, point);
	var lineNew = this.createLineShape(point, this.pointContainer.getChildAt(index+2));
	this.lineContainer.addChildAt(lineNew, index+1);
//	this.lines.splice(index+1, 0, line);
	this.editLineShape(line, this.pointContainer.getChildAt(index), point);
	
	this.drawFill();
};

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
	
	if (this.lineContainer.getNumChildren() > 0) {
		if (index === 0) {
			this.lineContainer.removeChildAt(0);
//			this.lines.shift(;
		}
		else if (index === this.pointContainer.getNumChildren()-1) {
			this.lineContainer.removeChildAt(index-1);
//			this.lines.pop();
		}
		else {
			this.lineContainer.removeChildAt(index);
//			this.lines.splice(index, 1);
			this.editLineShape(this.lineContainer.getChildAt(index-1), this.pointContainer.getChildAt(index-1), this.pointContainer.getChildAt(index+1));
		}
	}
	this.pointContainer.removeChildAt(index);
//	this.points.splice(index, 1);
	
	this.drawFill();
};

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

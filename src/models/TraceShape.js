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

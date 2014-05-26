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

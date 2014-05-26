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

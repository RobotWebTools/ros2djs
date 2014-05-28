/**
 * @author Bart van Vliet - bart@dobots.nl
 */

/**
 * Send and draw a goal pose
 *
 * @constructor
 * @param options - object with following keys:
 *   * ros - the ROSLIB.Ros connection handle
 *   * rootObject (optional) - the root object to render to
 *   * actionTopic (optional) - the action server topic to use for navigation, like '/move_base'
 *   * actionMsgType (optional) - the navigation action message type, like 'move_base_msgs/MoveBaseAction'
 *   * mapFrame (optional) - the frame of the map to use when sending a goal, like '/map'
 */
ROS2D.NavGoal = function(options) {
	var that = this;
	options = options || {};
	var ros = options.ros;
	this.rootObject = options.rootObject || new createjs.Container();
	var actionTopic = options.actionTopic || '/move_base';
	var actionMsgType = options.actionMsgType || 'move_base_msgs/MoveBaseAction';
	this.mapFrame = options.mapFrame || '/map';
	
	// setup the actionlib client
	this.actionClient = new ROSLIB.ActionClient({
		ros : ros,
		actionName : actionMsgType,
		serverName : actionTopic
	});
	
	// get a handle to the stage
	if (this.rootObject instanceof createjs.Stage) {
		this.stage = this.rootObject;
	} else {
		this.stage = this.rootObject.getStage();
	}
	
	this.container = new createjs.Container();
	this.rootObject.addChild(this.container);
	
	// marker for goal orientation
	this.goalOrientationMarker = new ROS2D.ArrowShape({
		size : 30,
		strokeSize : 1,
		fillColor : createjs.Graphics.getRGB(0, 255, 0, 0.66),
		pulse : false
	});
	this.goalOrientationMarker.visible = false;
	this.container.addChild(this.goalOrientationMarker);
	
	// Used to set the goal marker
	this.goalStartPos = null;
	
	this.initScaleSet = false;
};


/**
 * Initialize scale, current scale will be used for the goal markers
 */
ROS2D.NavGoal.prototype.initScale = function() {
	if (this.initScaleSet) {
		console.log('Warning: scale has already been initialized!');
		// TODO: reinit
	}
	this.initScaleSet = true;
	this.initScaleX = 1.0 / this.stage.scaleX;
	this.initScaleY = 1.0 / this.stage.scaleY;
};


/**
 * Start goal selection, given position will be the goal position, draw the orientation marker
 *
 * @param pos - current selection position on the map in meters (ROSLIB.Vector3)
 */
ROS2D.NavGoal.prototype.startGoalSelection = function(pos) {
	this.goalStartPos = pos;
	this.goalOrientationMarker.visible = true;
	this.goalOrientationMarker.scaleX = 1.0 / this.stage.scaleX;
	this.goalOrientationMarker.scaleY = 1.0 / this.stage.scaleY;
	this.goalOrientationMarker.x = pos.x;
	this.goalOrientationMarker.y = -pos.y;
};

/**
 * Orient goal, after starting the goal, this function updates the orientation of the goal orientation marker
 *
 * @param pos - current selection position on the map in meters (ROSLIB.Vector3)
 */
ROS2D.NavGoal.prototype.orientGoalSelection = function(pos) {
	this.goalOrientationMarker.scaleX = 1.0 / this.stage.scaleX;
	this.goalOrientationMarker.scaleY = 1.0 / this.stage.scaleY;
	var dx = pos.x - this.goalStartPos.x;
	var dy = pos.y - this.goalStartPos.y;
	this.goalOrientationMarker.rotation = -Math.atan2(dy, dx) * 180.0 / Math.PI;
};

/**
 * End of selecting a goal, removes the orientation marker
 *
 * @param pos - current selection position on the map in meters (ROSLIB.Vector3)
 *
 * @returns the goal pose (ROSLIB.Pose)
 */
ROS2D.NavGoal.prototype.endGoalSelection = function(pos) {
	this.goalOrientationMarker.visible = false;
	
	var dx = pos.x - this.goalStartPos.x;
	var dy = pos.y - this.goalStartPos.y;
//	var theta  = Math.atan2(dy, dx);
	// Get angle from orientation marker, so that the goal always matches with the marker
	// convert to radians and counter clock wise
	var theta = -this.goalOrientationMarker.rotation * Math.PI / 180.0;
	var qz =  Math.sin(theta/2.0);
	var qw =  Math.cos(theta/2.0);
	var quat = new ROSLIB.Quaternion({
		x : 0,
		y : 0,
		z : qz,
		w : qw
	});
	return new ROSLIB.Pose({
		position : this.goalStartPos,
		orientation : quat
	});
};


/**
 * Send a goal to the navigation stack with the given pose.
 * Draw the goal
 *
 * @param pose - the goal pose (ROSLIB.Pose)
 */
ROS2D.NavGoal.prototype.sendGoal = function(pose) {
	// create a goal
	var goal = new ROSLIB.Goal({
		actionClient : this.actionClient,
		goalMessage : {
			target_pose : {
				header : {
					frame_id : this.mapFrame
				},
				pose : pose
			}
		}
	});
	goal.send();
	
	// create a marker for the goal
	var goalMarker = new ROS2D.ArrowShape({
		size : 10,
		strokeSize : 1,
		fillColor : createjs.Graphics.getRGB(255, 64, 128, 0.66),
		pulse : true
	});
	goalMarker.x = pose.position.x;
	goalMarker.y = -pose.position.y;
	goalMarker.rotation = this.stage.rosQuaternionToGlobalTheta(pose.orientation);
	goalMarker.scaleX = this.initScaleX;
	goalMarker.scaleY = this.initScaleY;
	this.container.addChild(goalMarker);
	
	var that = this;
	goal.on('result', function() {
		that.container.removeChild(goalMarker);
	});
};

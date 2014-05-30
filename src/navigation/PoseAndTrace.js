/**
 * @author Bart van Vliet - bart@dobots.nl
 */

/**
 * Listens for pose msgs and draws the robot pose and a trace
 *
 * @constructor
 * @param options - object with following keys:
 *   * ros - the ROSLIB.Ros connection handle
 *   * rootObject (optional) - the root object to render to
 *   * poseTopic (optional) - the pose topic to subscribe to, like '/robot_pose', must be of type: 'geometry_msgs/Pose'
 *   * withTrace (optional) - whether to draw the robot's trace (default: true)
 *   * maxTraceLength (optional) - maximum length of the trace in number of poses (0 for infinite)
 *   * traceColor (optional) - color of the trace shape
 *   * traceSize (optional) - size of the trace shape
 *   * robotColor (optional) - color of the robot shape
 *   * robotSize (optional) - size of the robot shape
 *   * robotShape (optional) - shape of your robot, front should point to the east at 0 rotation
 */
ROS2D.PoseAndTrace = function(options) {
	var that = this;
	options = options || {};
	var ros = options.ros;
	this.rootObject = options.rootObject || new createjs.Container();
	var poseTopic = options.poseTopic || '/robot_pose';
	this.withTrace = options.withTrace || true;
	this.maxTraceLength = options.maxTraceLength || 100;
	var traceColor = options.traceColor || createjs.Graphics.getRGB(0, 150, 0, 0.66);
	var traceSize = options.traceSize || 1.5;
	var robotColor = options.robotColor || createjs.Graphics.getRGB(255, 0, 0, 0.66);
	var robotSize = options.robotSize || 15;
	this.robotMarker = options.robotShape || null;
	
	// get a handle to the stage
	if (this.rootObject instanceof createjs.Stage) {
		this.stage = this.rootObject;
	} else {
		this.stage = this.rootObject.getStage();
	}
	
	// shape for the trace
	this.trace = new ROS2D.TraceShape({
		strokeSize : traceSize,
		strokeColor : traceColor,
		maxPoses : this.maxTraceLength
	});
	this.trace.visible = false;
	this.rootObject.addChild(this.trace);
	
	// marker for the robot
	if (!this.robotMarker) {
		this.robotMarker = new ROS2D.ArrowShape({
			size : robotSize,
			strokeSize : 1,
			strokeColor : robotColor,
			fillColor : robotColor,
			pulse : true
		});
	}
	this.robotMarker.visible = false;
	this.rootObject.addChild(this.robotMarker);
	
	this.initScaleSet = false;
	
	// setup a listener for the robot pose
	var poseListener = new ROSLIB.Topic({
		ros : ros,
		name : poseTopic,
		messageType : 'geometry_msgs/Pose',
		throttle_rate : 100
	});
	poseListener.subscribe(this.updatePose.bind(this));
};

/**
 * Initialize scale, current scale will be used for the goal markers
 */
ROS2D.PoseAndTrace.prototype.initScale = function() {
	if (this.initScaleSet) {
		console.log('Warning: scale has already been initialized!');
		// TODO: reinit
	}
	this.initScaleSet = true;
	this.robotMarker.scaleX = 1.0 / this.stage.scaleX;
	this.robotMarker.scaleY = 1.0 / this.stage.scaleY;
	this.trace.scaleX = 1.0 / this.stage.scaleX;
	this.trace.scaleY = 1.0 / this.stage.scaleY;
};

/**
 * Update the robot's pose: move the robot marker and add to trace
 *
 * @param pose - the robot's pose (geometry_msgs/Pose)
 */
ROS2D.PoseAndTrace.prototype.updatePose = function(pose) {
	// update the robot's position and rotation on the map
	this.robotMarker.x = pose.position.x;
	this.robotMarker.y = -pose.position.y;
	this.robotMarker.rotation = this.stage.rosQuaternionToGlobalTheta(pose.orientation);
	if (this.initScaleSet) {
		this.robotMarker.visible = true;
	}
	
	// Draw trace
	if (this.withTrace === true && this.initScaleSet === true) {
		this.trace.addPose(pose);
		this.trace.visible = true;
	}
};

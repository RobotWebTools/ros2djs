ros2djs
========

#### 2D Visualization Library for use with the ROS JavaScript Libraries ####

For full documentation, see [the ROS wiki](http://ros.org/wiki/ros2djs) or check out some [working demos](http://robotwebtools.org/).

[JSDoc](http://robotwebtools.org/jsdoc/ros2djs/current/) can be found on the Robot Web Tools website.

This project is released as part of the [Robot Web Tools](http://robotwebtools.org/) effort.

### Usage ###
Pre-built files can be found in either [ros3d.js](build/ros3d.js) or [ros3d.min.js](build/ros3d.min.js).

Alternatively, you can use the current release via the Robot Web Tools CDN ([full](http://cdn.robotwebtools.org/ros2djs/current/ros3d.js)) | ([min](http://cdn.robotwebtools.org/ros2djs/current/ros3d.min.js))

### Dependencies ###
ros2djs depends on:

[EventEmitter2](https://github.com/hij1nx/EventEmitter2). The current supported version is 0.4.11.
The current supported version can be found [in this project](include/EventEmitter2/eventemitter2.js) or on the Robot Web Tools CDN ([full](http://cdn.robotwebtools.org/EventEmitter2/0.4.11/eventemitter2.js)) | ([min](http://cdn.robotwebtools.org/EventEmitter2/0.4.11/eventemitter2.min.js))

[EaselJS](https://github.com/CreateJS/EaselJS/). The current supported version is 0.6.0.
The current supported version can be found [in this project](include/EaselJS/easeljs.js) or on the Robot Web Tools CDN ([full](http://cdn.robotwebtools.org/EaselJS/0.6.0/easeljs.js)) | ([min](http://cdn.robotwebtools.org/EaselJS/0.6.0/easeljs.min.js)).

[roslibjs](https://github.com/RobotWebTools/roslibjs). The current supported version is r4.
The current supported version can be found [in this project](include/roslibjs/roslib.js) or on the Robot Web Tools CDN ([full](http://cdn.robotwebtools.org/roslibjs/r4/roslib.js)) | ([min](http://cdn.robotwebtools.org/roslibjs/r4/roslib.min.js)).

### Build ###
To build from source, use the provided [ANT script](utils/build.xml).

The script requires ANT, YUI Compressor, and JSDoc. To install these on an Ubuntu machine, use the following:

    sudo apt-get install ant yui-compressor jsdoc-toolkit

To run the build script, use the following:

    cd utils/
    ant

### License ###
ros2djs is released with a BSD license. For full terms and conditions, see the [LICENSE](LICENSE) file.

### Authors ###
See the [AUTHORS](AUTHORS) file for a full list of contributors.


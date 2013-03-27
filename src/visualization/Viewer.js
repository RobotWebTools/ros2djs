/**
 * @author Russell Toris - rctoris@wpi.edu
 */

/**
 * A Viewer can be used to render an interactive 2D scene to a HTML5 canvas.
 *
 * @constructor
 * @param options - object with following keys:
 *  * divID - the ID of the div to place the viewer in
 *  * width - the initial width, in pixels, of the canvas
 *  * height - the initial height, in pixels, of the canvas
 *  * background - the color to render the background, like #efefef
 */
ROS2D.Viewer = function(options) {
  var that = this;
  var options = options || {};
  this.divID = options.divID;
  this.width = options.width;
  this.height = options.height;
  this.background = options.background || '#111111';
  
  // create the canvas to render to
  var canvas = document.createElement('canvas');
  canvas.style.width = this.width + 'px';
  canvas.style.height = this.height + 'px';
  canvas.style.background = this.background;
  // create the easel to use
  this.scene = new createjs.Stage(canvas);

  // add the renderer to the page
  document.getElementById(this.divID).appendChild(canvas);
};

/**
 * Add the given createjs ojbect to the global scene in the viewer.
 * 
 * @param object - the object to add
 */
ROS2D.Viewer.prototype.addObject = function(object) {
  this.scene.addChild(object);
  this.scene.update();
};

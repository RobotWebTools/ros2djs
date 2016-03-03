/**
 * @author Russell Toris - rctoris@wpi.edu
 */

/**
 * A Viewer can be used to render an interactive 2D scene to a HTML5 canvas.
 *
 * @constructor
 * @param options - object with following keys:
 *   * divID - the ID of the div to place the viewer in
 *   * width - the initial width, in pixels, of the canvas
 *   * height - the initial height, in pixels, of the canvas
 *   * background (optional) - the color to render the background, like '#efefef'
 */
ROS2D.Viewer = function(options) {
  var that = this;
  options = options || {};
  var divID = options.divID;
  this.width = options.width;
  this.height = options.height;
  var background = options.background || '#111111';

  // create the canvas to render to
  var canvas = document.createElement('canvas');
  canvas.width = this.width;
  canvas.height = this.height;
  canvas.style.background = background;
  document.getElementById(divID).appendChild(canvas);
  // create the easel to use
  this.scene = new createjs.Stage(canvas);

  // change Y axis center
  this.scene.y = this.height;

  // add the renderer to the page
  document.getElementById(divID).appendChild(canvas);

  // update at 30fps
  createjs.Ticker.setFPS(30);
  createjs.Ticker.addEventListener('tick', this.scene);
};

/**
 * Add the given createjs object to the global scene in the viewer.
 *
 * @param object - the object to add
 */
ROS2D.Viewer.prototype.addObject = function(object) {
  this.scene.addChild(object);
};

/**
 * Scale the scene to fit the given width and height into the current canvas.
 *
 * @param width - the width to scale to in meters
 * @param height - the height to scale to in meters
 */
ROS2D.Viewer.prototype.scaleToDimensions = function(width, height) {
  // restore to values before shifting, if ocurred
  this.scene.x = typeof this.scene.x_prev_shift !== 'undefined' ? this.scene.x_prev_shift : this.scene.x;
  this.scene.y = typeof this.scene.y_prev_shift !== 'undefined' ? this.scene.y_prev_shift : this.scene.y;
  
  // save scene scaling
  this.scene.scaleX = this.width / width;
  this.scene.scaleY = this.height / height;
};

/**
 * Shift the main view of the canvas by the given amount. This is based on the
 * ROS coordinate system. That is, Y is opposite that of a traditional canvas.
 *
 * @param x - the amount to shift by in the x direction in meters
 * @param y - the amount to shift by in the y direction in meters
 */
ROS2D.Viewer.prototype.shift = function(x, y) {
  // save current offset
  this.scene.x_prev_shift = this.scene.x;
  this.scene.y_prev_shift = this.scene.y;

  // shift scene by scaling the desired offset
  this.scene.x -= (x * this.scene.scaleX);
  this.scene.y += (y * this.scene.scaleY);
};

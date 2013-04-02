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
  canvas.width = this.width;
  canvas.height = this.height;
  canvas.style.background = this.background;
  document.getElementById(this.divID).appendChild(canvas);
  // create the easel to use
  this.scene = new createjs.Stage(canvas);
  
  // default zoom factor
  this.scene.scaleX = 20;
  this.scene.scaleY = 20;
  
  // change Y axis center
  this.scene.y = this.height;

  // add the renderer to the page
  document.getElementById(this.divID).appendChild(canvas);
  
  // update at 30fps
  createjs.Ticker.setFPS(30);
  createjs.Ticker.addListener(function() {
    that.scene.update();
  });
};

/**
 * Add the given createjs ojbect to the global scene in the viewer.
 * 
 * @param object - the object to add
 */
ROS2D.Viewer.prototype.addObject = function(object) {
  this.scene.addChild(object);
};

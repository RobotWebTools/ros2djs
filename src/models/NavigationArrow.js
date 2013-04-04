/**
 * @author Russell Toris - rctoris@wpi.edu
 */

/**
 * A navigation arrow is a directed triangle that can be used to display orientation.
 * 
 * @constructor
 * @param options - object with following keys:
 *   * size (optional) - the size of the marker
 *   * strokeSize (optional) - the size of the outline
 *   * strokeColor (optional) - the createjs color for the stroke
 *   * fillColor (optional) - the createjs color for the fill
 */
ROS2D.NavigationArrow = function(options) {
  var options = options || {};
  var size = options.size || 10;
  var strokeSize = options.strokeSize || 3;
  var strokeColor = options.strokeColor || createjs.Graphics.getRGB(0, 0, 0);
  var fillColor = options.fillColor || createjs.Graphics.getRGB(255, 0, 0);

  // draw the arrow
  var graphics = new createjs.Graphics();
  // line width
  graphics.setStrokeStyle(size / 3.0);
  graphics.moveTo(-size / 2.0, size / 2.0);
  graphics.beginStroke(createjs.Graphics.getRGB(0, 0, 0));
  graphics.beginFill(createjs.Graphics.getRGB(255, 0, 0));
  graphics.lineTo(0, -size);
  graphics.lineTo(size / 2.0, size / 2.0);
  graphics.lineTo(-size / 2.0, size / 2.0);
  graphics.closePath();
  graphics.endFill();
  graphics.endStroke();

  // create the shape
  createjs.Shape.call(this, graphics);
};
ROS2D.NavigationArrow.prototype.__proto__ = createjs.Shape.prototype;

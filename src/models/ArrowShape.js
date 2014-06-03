/**
 * @author Bart van Vliet - bart@dobots.nl
 */

/**
 * An arrow with line and triangular head, based on the navigation arrow.
 * Aims to the left at 0 rotation, as would be expected.
 *
 * @constructor
 * @param options - object with following keys:
 *   * size (optional) - the size of the marker
 *   * strokeSize (optional) - the size of the outline
 *   * strokeColor (optional) - the createjs color for the stroke
 *   * fillColor (optional) - the createjs color for the fill
 *   * pulse (optional) - if the marker should "pulse" over time
 */
ROS2D.ArrowShape = function(options) {
	var that = this;
	options = options || {};
	var size = options.size || 10;
	var strokeSize = options.strokeSize || 3;
	var strokeColor = options.strokeColor || createjs.Graphics.getRGB(0, 0, 0);
	var fillColor = options.fillColor || createjs.Graphics.getRGB(255, 0, 0);
	var pulse = options.pulse;
	
	// draw the arrow
	var graphics = new createjs.Graphics();
	
	var headLen = size / 3.0;
	var headWidth = headLen * 2.0 / 3.0;
	
	graphics.setStrokeStyle(strokeSize);
	graphics.beginStroke(strokeColor);
	graphics.moveTo(0, 0);
	graphics.lineTo(size-headLen, 0);
	
	graphics.beginFill(fillColor);
	graphics.moveTo(size, 0);
	graphics.lineTo(size-headLen, headWidth / 2.0);
	graphics.lineTo(size-headLen, -headWidth / 2.0);
	graphics.closePath();
	graphics.endFill();
	graphics.endStroke();
	
	// create the shape
	createjs.Shape.call(this, graphics);
	
	// check if we are pulsing
	if (pulse) {
		// have the model "pulse"
		var growCount = 0;
		var growing = true;
		createjs.Ticker.addEventListener('tick', function() {
			if (growing) {
				that.scaleX *= 1.035;
				that.scaleY *= 1.035;
				growing = (++growCount < 10);
			} else {
				that.scaleX /= 1.035;
				that.scaleY /= 1.035;
				growing = (--growCount < 0);
			}
		});
	}
};
ROS2D.ArrowShape.prototype.__proto__ = createjs.Shape.prototype;

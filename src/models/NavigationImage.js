/**
 * @fileOverview
 * @author Inigo Gonzalez - ingonza85@gmail.com
 */

/**
 * A navigation image that can be used to display orientation.
 *
 * @constructor
 * @param options - object with following keys:
 *   * size (optional) - the size of the marker
 *   * image - the image to use as a marker
 *   * pulse (optional) - if the marker should "pulse" over time
 */
ROS2D.NavigationImage = function(options) {
  options = options || {};
  var size = options.size || 10;
  var image_url = options.image;
  var pulse = options.pulse;
  var alpha = options.alpha || 1;

  var originals = {};

  var image = new Image();

  createjs.Bitmap.call(this, image);

  var paintImage = function() {
    var scale = calculateScale(size);
    this.alpha = alpha;
    this.scaleX = scale;
    this.scaleY = scale;
    this.regY = this.image.height/2;
    this.regX = this.image.width/2;
    originals['rotation'] = this.rotation;
    Object.defineProperty(this, 'rotation', {
      get: function(){ return originals['rotation'] + 90; },
      set: function(value){ originals['rotation'] = value; }
    });
    if (pulse) {
      // have the model "pulse"
      var growCount = 0;
      var growing = true;
      var SCALE_SIZE = 1.020;
      createjs.Ticker.addEventListener('tick', function() {
        if (growing) {
          this.scaleX *= SCALE_SIZE;
          this.scaleY *= SCALE_SIZE;
          growing = (++growCount < 10);
        } else {
          this.scaleX /= SCALE_SIZE;
          this.scaleY /= SCALE_SIZE;
          growing = (--growCount < 0);
        }
      });
    }
  };

  image.onload = paintImage.bind(this);
  image.src = image_url;

  var calculateScale = function(_size){
    return _size / image.width;
  };

};

ROS2D.NavigationImage.prototype.__proto__ = createjs.Bitmap.prototype;

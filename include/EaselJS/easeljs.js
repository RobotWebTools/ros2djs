/*
* EaselJS
* Visit http://createjs.com/ for documentation, updates and examples.
*
* Copyright (c) 2011 gskinner.com, inc.
* 
* Distributed under the terms of the MIT license.
* http://www.opensource.org/licenses/mit-license.html
*
* This notice shall be included in all copies or substantial portions of the Software.
*/
this.createjs = this.createjs || {};
(function() {
  var UID = function() {
    throw"UID cannot be instantiated";
  };
  UID._nextID = 0;
  UID.get = function() {
    return UID._nextID++
  };
  createjs.UID = UID
})();
this.createjs = this.createjs || {};
(function() {
  var EventDispatcher = function() {
    this.initialize()
  };
  var p = EventDispatcher.prototype;
  EventDispatcher.initialize = function(target) {
    target.addEventListener = p.addEventListener;
    target.removeEventListener = p.removeEventListener;
    target.removeAllEventListeners = p.removeAllEventListeners;
    target.hasEventListener = p.hasEventListener;
    target.dispatchEvent = p.dispatchEvent
  };
  p._listeners = null;
  p.initialize = function() {
  };
  p.addEventListener = function(type, listener) {
    var listeners = this._listeners;
    if(!listeners) {
      listeners = this._listeners = {}
    }else {
      this.removeEventListener(type, listener)
    }
    var arr = listeners[type];
    if(!arr) {
      arr = listeners[type] = []
    }
    arr.push(listener);
    return listener
  };
  p.removeEventListener = function(type, listener) {
    var listeners = this._listeners;
    if(!listeners) {
      return
    }
    var arr = listeners[type];
    if(!arr) {
      return
    }
    for(var i = 0, l = arr.length;i < l;i++) {
      if(arr[i] == listener) {
        if(l == 1) {
          delete listeners[type]
        }else {
          arr.splice(i, 1)
        }
        break
      }
    }
  };
  p.removeAllEventListeners = function(type) {
    if(!type) {
      this._listeners = null
    }else {
      if(this._listeners) {
        delete this._listeners[type]
      }
    }
  };
  p.dispatchEvent = function(eventObj, target) {
    var ret = false, listeners = this._listeners;
    if(eventObj && listeners) {
      if(typeof eventObj == "string") {
        eventObj = {type:eventObj}
      }
      eventObj.target = target || this;
      var arr = listeners[eventObj.type];
      if(!arr) {
        return ret
      }
      arr = arr.slice();
      for(var i = 0, l = arr.length;i < l;i++) {
        var o = arr[i];
        if(o instanceof Function) {
          ret = ret || o.apply(null, [eventObj])
        }else {
          if(o.handleEvent) {
            ret = ret || o.handleEvent(eventObj)
          }
        }
      }
    }
    return!!ret
  };
  p.hasEventListener = function(type) {
    var listeners = this._listeners;
    return!!(listeners && listeners[type])
  };
  p.toString = function() {
    return"[EventDispatcher]"
  };
  createjs.EventDispatcher = EventDispatcher
})();
this.createjs = this.createjs || {};
(function() {
  var Ticker = function() {
    throw"Ticker cannot be instantiated.";
  };
  Ticker.useRAF = false;
  Ticker.addEventListener = null;
  Ticker.removeEventListener = null;
  Ticker.removeAllEventListeners = null;
  Ticker.dispatchEvent = null;
  Ticker.hasEventListener = null;
  Ticker._listeners = null;
  createjs.EventDispatcher.initialize(Ticker);
  Ticker._listeners = null;
  Ticker._pauseable = null;
  Ticker._paused = false;
  Ticker._inited = false;
  Ticker._startTime = 0;
  Ticker._pausedTime = 0;
  Ticker._ticks = 0;
  Ticker._pausedTicks = 0;
  Ticker._interval = 50;
  Ticker._lastTime = 0;
  Ticker._times = null;
  Ticker._tickTimes = null;
  Ticker._rafActive = false;
  Ticker._timeoutID = null;
  Ticker.addListener = function(o, pauseable) {
    if(o == null) {
      return
    }
    Ticker.removeListener(o);
    Ticker._pauseable[Ticker._listeners.length] = pauseable == null ? true : pauseable;
    Ticker._listeners.push(o)
  };
  Ticker.init = function() {
    Ticker._inited = true;
    Ticker._times = [];
    Ticker._tickTimes = [];
    Ticker._pauseable = [];
    Ticker._listeners = [];
    Ticker._times.push(Ticker._lastTime = Ticker._startTime = Ticker._getTime());
    Ticker.setInterval(Ticker._interval)
  };
  Ticker.removeListener = function(o) {
    var listeners = Ticker._listeners;
    if(!listeners) {
      return
    }
    var index = listeners.indexOf(o);
    if(index != -1) {
      listeners.splice(index, 1);
      Ticker._pauseable.splice(index, 1)
    }
  };
  Ticker.removeAllListeners = function() {
    Ticker._listeners = [];
    Ticker._pauseable = []
  };
  Ticker.setInterval = function(interval) {
    Ticker._interval = interval;
    if(!Ticker._inited) {
      return
    }
    Ticker._setupTick()
  };
  Ticker.getInterval = function() {
    return Ticker._interval
  };
  Ticker.setFPS = function(value) {
    Ticker.setInterval(1E3 / value)
  };
  Ticker.getFPS = function() {
    return 1E3 / Ticker._interval
  };
  Ticker.getMeasuredFPS = function(ticks) {
    if(Ticker._times.length < 2) {
      return-1
    }
    if(ticks == null) {
      ticks = Ticker.getFPS() | 0
    }
    ticks = Math.min(Ticker._times.length - 1, ticks);
    return 1E3 / ((Ticker._times[0] - Ticker._times[ticks]) / ticks)
  };
  Ticker.setPaused = function(value) {
    Ticker._paused = value
  };
  Ticker.getPaused = function() {
    return Ticker._paused
  };
  Ticker.getTime = function(runTime) {
    return Ticker._getTime() - Ticker._startTime - (runTime ? Ticker._pausedTime : 0)
  };
  Ticker.getTicks = function(pauseable) {
    return Ticker._ticks - (pauseable ? Ticker._pausedTicks : 0)
  };
  Ticker._handleAF = function() {
    Ticker._rafActive = false;
    Ticker._setupTick();
    if(Ticker._getTime() - Ticker._lastTime >= (Ticker._interval - 1) * 0.97) {
      Ticker._tick()
    }
  };
  Ticker._handleTimeout = function() {
    Ticker.timeoutID = null;
    Ticker._setupTick();
    Ticker._tick()
  };
  Ticker._setupTick = function() {
    if(Ticker._rafActive || Ticker.timeoutID != null) {
      return
    }
    if(Ticker.useRAF) {
      var f = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame;
      if(f) {
        f(Ticker._handleAF);
        Ticker._rafActive = true;
        return
      }
    }
    Ticker.timeoutID = setTimeout(Ticker._handleTimeout, Ticker._interval)
  };
  Ticker._tick = function() {
    var time = Ticker._getTime();
    Ticker._ticks++;
    var elapsedTime = time - Ticker._lastTime;
    var paused = Ticker._paused;
    if(paused) {
      Ticker._pausedTicks++;
      Ticker._pausedTime += elapsedTime
    }
    Ticker._lastTime = time;
    var pauseable = Ticker._pauseable;
    var listeners = Ticker._listeners.slice();
    var l = listeners ? listeners.length : 0;
    for(var i = 0;i < l;i++) {
      var listener = listeners[i];
      if(listener == null || paused && pauseable[i]) {
        continue
      }
      if(listener.tick) {
        listener.tick(elapsedTime, paused)
      }else {
        if(listener instanceof Function) {
          listener(elapsedTime, paused)
        }
      }
    }
    Ticker.dispatchEvent({type:"tick", paused:paused, delta:elapsedTime, time:time, runTime:time - Ticker._pausedTime});
    Ticker._tickTimes.unshift(Ticker._getTime() - time);
    while(Ticker._tickTimes.length > 100) {
      Ticker._tickTimes.pop()
    }
    Ticker._times.unshift(time);
    while(Ticker._times.length > 100) {
      Ticker._times.pop()
    }
  };
  var now = window.performance && (performance.now || performance.mozNow || performance.msNow || performance.oNow || performance.webkitNow);
  Ticker._getTime = function() {
    return now && now.call(performance) || (new Date).getTime()
  };
  Ticker.init();
  createjs.Ticker = Ticker
})();
this.createjs = this.createjs || {};
(function() {
  var MouseEvent = function(type, stageX, stageY, target, nativeEvent, pointerID, primary, rawX, rawY) {
    this.initialize(type, stageX, stageY, target, nativeEvent, pointerID, primary, rawX, rawY)
  };
  var p = MouseEvent.prototype;
  p.stageX = 0;
  p.stageY = 0;
  p.rawX = 0;
  p.rawY = 0;
  p.type = null;
  p.nativeEvent = null;
  p.onMouseMove = null;
  p.onMouseUp = null;
  p.target = null;
  p.pointerID = 0;
  p.primary = false;
  p.addEventListener = null;
  p.removeEventListener = null;
  p.removeAllEventListeners = null;
  p.dispatchEvent = null;
  p.hasEventListener = null;
  p._listeners = null;
  createjs.EventDispatcher.initialize(p);
  p.initialize = function(type, stageX, stageY, target, nativeEvent, pointerID, primary, rawX, rawY) {
    this.type = type;
    this.stageX = stageX;
    this.stageY = stageY;
    this.target = target;
    this.nativeEvent = nativeEvent;
    this.pointerID = pointerID;
    this.primary = primary;
    this.rawX = rawX == null ? stageX : rawX;
    this.rawY = rawY == null ? stageY : rawY
  };
  p.clone = function() {
    return new MouseEvent(this.type, this.stageX, this.stageY, this.target, this.nativeEvent, this.pointerID, this.primary, this.rawX, this.rawY)
  };
  p.toString = function() {
    return"[MouseEvent (type=" + this.type + " stageX=" + this.stageX + " stageY=" + this.stageY + ")]"
  };
  createjs.MouseEvent = MouseEvent
})();
this.createjs = this.createjs || {};
(function() {
  var Matrix2D = function(a, b, c, d, tx, ty) {
    this.initialize(a, b, c, d, tx, ty)
  };
  var p = Matrix2D.prototype;
  Matrix2D.identity = null;
  Matrix2D.DEG_TO_RAD = Math.PI / 180;
  p.a = 1;
  p.b = 0;
  p.c = 0;
  p.d = 1;
  p.tx = 0;
  p.ty = 0;
  p.alpha = 1;
  p.shadow = null;
  p.compositeOperation = null;
  p.initialize = function(a, b, c, d, tx, ty) {
    if(a != null) {
      this.a = a
    }
    this.b = b || 0;
    this.c = c || 0;
    if(d != null) {
      this.d = d
    }
    this.tx = tx || 0;
    this.ty = ty || 0;
    return this
  };
  p.prepend = function(a, b, c, d, tx, ty) {
    var tx1 = this.tx;
    if(a != 1 || b != 0 || c != 0 || d != 1) {
      var a1 = this.a;
      var c1 = this.c;
      this.a = a1 * a + this.b * c;
      this.b = a1 * b + this.b * d;
      this.c = c1 * a + this.d * c;
      this.d = c1 * b + this.d * d
    }
    this.tx = tx1 * a + this.ty * c + tx;
    this.ty = tx1 * b + this.ty * d + ty;
    return this
  };
  p.append = function(a, b, c, d, tx, ty) {
    var a1 = this.a;
    var b1 = this.b;
    var c1 = this.c;
    var d1 = this.d;
    this.a = a * a1 + b * c1;
    this.b = a * b1 + b * d1;
    this.c = c * a1 + d * c1;
    this.d = c * b1 + d * d1;
    this.tx = tx * a1 + ty * c1 + this.tx;
    this.ty = tx * b1 + ty * d1 + this.ty;
    return this
  };
  p.prependMatrix = function(matrix) {
    this.prepend(matrix.a, matrix.b, matrix.c, matrix.d, matrix.tx, matrix.ty);
    this.prependProperties(matrix.alpha, matrix.shadow, matrix.compositeOperation);
    return this
  };
  p.appendMatrix = function(matrix) {
    this.append(matrix.a, matrix.b, matrix.c, matrix.d, matrix.tx, matrix.ty);
    this.appendProperties(matrix.alpha, matrix.shadow, matrix.compositeOperation);
    return this
  };
  p.prependTransform = function(x, y, scaleX, scaleY, rotation, skewX, skewY, regX, regY) {
    if(rotation % 360) {
      var r = rotation * Matrix2D.DEG_TO_RAD;
      var cos = Math.cos(r);
      var sin = Math.sin(r)
    }else {
      cos = 1;
      sin = 0
    }
    if(regX || regY) {
      this.tx -= regX;
      this.ty -= regY
    }
    if(skewX || skewY) {
      skewX *= Matrix2D.DEG_TO_RAD;
      skewY *= Matrix2D.DEG_TO_RAD;
      this.prepend(cos * scaleX, sin * scaleX, -sin * scaleY, cos * scaleY, 0, 0);
      this.prepend(Math.cos(skewY), Math.sin(skewY), -Math.sin(skewX), Math.cos(skewX), x, y)
    }else {
      this.prepend(cos * scaleX, sin * scaleX, -sin * scaleY, cos * scaleY, x, y)
    }
    return this
  };
  p.appendTransform = function(x, y, scaleX, scaleY, rotation, skewX, skewY, regX, regY) {
    if(rotation % 360) {
      var r = rotation * Matrix2D.DEG_TO_RAD;
      var cos = Math.cos(r);
      var sin = Math.sin(r)
    }else {
      cos = 1;
      sin = 0
    }
    if(skewX || skewY) {
      skewX *= Matrix2D.DEG_TO_RAD;
      skewY *= Matrix2D.DEG_TO_RAD;
      this.append(Math.cos(skewY), Math.sin(skewY), -Math.sin(skewX), Math.cos(skewX), x, y);
      this.append(cos * scaleX, sin * scaleX, -sin * scaleY, cos * scaleY, 0, 0)
    }else {
      this.append(cos * scaleX, sin * scaleX, -sin * scaleY, cos * scaleY, x, y)
    }
    if(regX || regY) {
      this.tx -= regX * this.a + regY * this.c;
      this.ty -= regX * this.b + regY * this.d
    }
    return this
  };
  p.rotate = function(angle) {
    var cos = Math.cos(angle);
    var sin = Math.sin(angle);
    var a1 = this.a;
    var c1 = this.c;
    var tx1 = this.tx;
    this.a = a1 * cos - this.b * sin;
    this.b = a1 * sin + this.b * cos;
    this.c = c1 * cos - this.d * sin;
    this.d = c1 * sin + this.d * cos;
    this.tx = tx1 * cos - this.ty * sin;
    this.ty = tx1 * sin + this.ty * cos;
    return this
  };
  p.skew = function(skewX, skewY) {
    skewX = skewX * Matrix2D.DEG_TO_RAD;
    skewY = skewY * Matrix2D.DEG_TO_RAD;
    this.append(Math.cos(skewY), Math.sin(skewY), -Math.sin(skewX), Math.cos(skewX), 0, 0);
    return this
  };
  p.scale = function(x, y) {
    this.a *= x;
    this.d *= y;
    this.tx *= x;
    this.ty *= y;
    return this
  };
  p.translate = function(x, y) {
    this.tx += x;
    this.ty += y;
    return this
  };
  p.identity = function() {
    this.alpha = this.a = this.d = 1;
    this.b = this.c = this.tx = this.ty = 0;
    this.shadow = this.compositeOperation = null;
    return this
  };
  p.invert = function() {
    var a1 = this.a;
    var b1 = this.b;
    var c1 = this.c;
    var d1 = this.d;
    var tx1 = this.tx;
    var n = a1 * d1 - b1 * c1;
    this.a = d1 / n;
    this.b = -b1 / n;
    this.c = -c1 / n;
    this.d = a1 / n;
    this.tx = (c1 * this.ty - d1 * tx1) / n;
    this.ty = -(a1 * this.ty - b1 * tx1) / n;
    return this
  };
  p.isIdentity = function() {
    return this.tx == 0 && this.ty == 0 && this.a == 1 && this.b == 0 && this.c == 0 && this.d == 1
  };
  p.decompose = function(target) {
    if(target == null) {
      target = {}
    }
    target.x = this.tx;
    target.y = this.ty;
    target.scaleX = Math.sqrt(this.a * this.a + this.b * this.b);
    target.scaleY = Math.sqrt(this.c * this.c + this.d * this.d);
    var skewX = Math.atan2(-this.c, this.d);
    var skewY = Math.atan2(this.b, this.a);
    if(skewX == skewY) {
      target.rotation = skewY / Matrix2D.DEG_TO_RAD;
      if(this.a < 0 && this.d >= 0) {
        target.rotation += target.rotation <= 0 ? 180 : -180
      }
      target.skewX = target.skewY = 0
    }else {
      target.skewX = skewX / Matrix2D.DEG_TO_RAD;
      target.skewY = skewY / Matrix2D.DEG_TO_RAD
    }
    return target
  };
  p.reinitialize = function(a, b, c, d, tx, ty, alpha, shadow, compositeOperation) {
    this.initialize(a, b, c, d, tx, ty);
    this.alpha = alpha || 1;
    this.shadow = shadow;
    this.compositeOperation = compositeOperation;
    return this
  };
  p.appendProperties = function(alpha, shadow, compositeOperation) {
    this.alpha *= alpha;
    this.shadow = shadow || this.shadow;
    this.compositeOperation = compositeOperation || this.compositeOperation;
    return this
  };
  p.prependProperties = function(alpha, shadow, compositeOperation) {
    this.alpha *= alpha;
    this.shadow = this.shadow || shadow;
    this.compositeOperation = this.compositeOperation || compositeOperation;
    return this
  };
  p.clone = function() {
    var mtx = new Matrix2D(this.a, this.b, this.c, this.d, this.tx, this.ty);
    mtx.shadow = this.shadow;
    mtx.alpha = this.alpha;
    mtx.compositeOperation = this.compositeOperation;
    return mtx
  };
  p.toString = function() {
    return"[Matrix2D (a=" + this.a + " b=" + this.b + " c=" + this.c + " d=" + this.d + " tx=" + this.tx + " ty=" + this.ty + ")]"
  };
  Matrix2D.identity = new Matrix2D(1, 0, 0, 1, 0, 0);
  createjs.Matrix2D = Matrix2D
})();
this.createjs = this.createjs || {};
(function() {
  var Point = function(x, y) {
    this.initialize(x, y)
  };
  var p = Point.prototype;
  p.x = 0;
  p.y = 0;
  p.initialize = function(x, y) {
    this.x = x == null ? 0 : x;
    this.y = y == null ? 0 : y
  };
  p.clone = function() {
    return new Point(this.x, this.y)
  };
  p.toString = function() {
    return"[Point (x=" + this.x + " y=" + this.y + ")]"
  };
  createjs.Point = Point
})();
this.createjs = this.createjs || {};
(function() {
  var Rectangle = function(x, y, width, height) {
    this.initialize(x, y, width, height)
  };
  var p = Rectangle.prototype;
  p.x = 0;
  p.y = 0;
  p.width = 0;
  p.height = 0;
  p.initialize = function(x, y, width, height) {
    this.x = x == null ? 0 : x;
    this.y = y == null ? 0 : y;
    this.width = width == null ? 0 : width;
    this.height = height == null ? 0 : height
  };
  p.clone = function() {
    return new Rectangle(this.x, this.y, this.width, this.height)
  };
  p.toString = function() {
    return"[Rectangle (x=" + this.x + " y=" + this.y + " width=" + this.width + " height=" + this.height + ")]"
  };
  createjs.Rectangle = Rectangle
})();
this.createjs = this.createjs || {};
(function() {
  var ButtonHelper = function(target, outLabel, overLabel, downLabel, play, hitArea, hitLabel) {
    this.initialize(target, outLabel, overLabel, downLabel, play, hitArea, hitLabel)
  };
  var p = ButtonHelper.prototype;
  p.target = null;
  p.overLabel = null;
  p.outLabel = null;
  p.downLabel = null;
  p.play = false;
  p._isPressed = false;
  p._isOver = false;
  p.initialize = function(target, outLabel, overLabel, downLabel, play, hitArea, hitLabel) {
    if(!target.addEventListener) {
      return
    }
    this.target = target;
    target.cursor = "pointer";
    this.overLabel = overLabel == null ? "over" : overLabel;
    this.outLabel = outLabel == null ? "out" : outLabel;
    this.downLabel = downLabel == null ? "down" : downLabel;
    this.play = play;
    this.setEnabled(true);
    this.handleEvent({});
    if(hitArea) {
      if(hitLabel) {
        hitArea.actionsEnabled = false;
        hitArea.gotoAndStop && hitArea.gotoAndStop(hitLabel)
      }
      target.hitArea = hitArea
    }
  };
  p.setEnabled = function(value) {
    var o = this.target;
    if(value) {
      o.addEventListener("mouseover", this);
      o.addEventListener("mouseout", this);
      o.addEventListener("mousedown", this)
    }else {
      o.removeEventListener("mouseover", this);
      o.removeEventListener("mouseout", this);
      o.removeEventListener("mousedown", this)
    }
  };
  p.toString = function() {
    return"[ButtonHelper]"
  };
  p.handleEvent = function(evt) {
    var label, t = this.target, type = evt.type;
    if(type == "mousedown") {
      evt.addEventListener("mouseup", this);
      this._isPressed = true;
      label = this.downLabel
    }else {
      if(type == "mouseup") {
        this._isPressed = false;
        label = this._isOver ? this.overLabel : this.outLabel
      }else {
        if(type == "mouseover") {
          this._isOver = true;
          label = this._isPressed ? this.downLabel : this.overLabel
        }else {
          this._isOver = false;
          label = this._isPressed ? this.overLabel : this.outLabel
        }
      }
    }
    if(this.play) {
      t.gotoAndPlay && t.gotoAndPlay(label)
    }else {
      t.gotoAndStop && t.gotoAndStop(label)
    }
  };
  createjs.ButtonHelper = ButtonHelper
})();
this.createjs = this.createjs || {};
(function() {
  var Shadow = function(color, offsetX, offsetY, blur) {
    this.initialize(color, offsetX, offsetY, blur)
  };
  var p = Shadow.prototype;
  Shadow.identity = null;
  p.color = null;
  p.offsetX = 0;
  p.offsetY = 0;
  p.blur = 0;
  p.initialize = function(color, offsetX, offsetY, blur) {
    this.color = color;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.blur = blur
  };
  p.toString = function() {
    return"[Shadow]"
  };
  p.clone = function() {
    return new Shadow(this.color, this.offsetX, this.offsetY, this.blur)
  };
  Shadow.identity = new Shadow("transparent", 0, 0, 0);
  createjs.Shadow = Shadow
})();
this.createjs = this.createjs || {};
(function() {
  var SpriteSheet = function(data) {
    this.initialize(data)
  };
  var p = SpriteSheet.prototype;
  p.complete = true;
  p.onComplete = null;
  p.addEventListener = null;
  p.removeEventListener = null;
  p.removeAllEventListeners = null;
  p.dispatchEvent = null;
  p.hasEventListener = null;
  p._listeners = null;
  createjs.EventDispatcher.initialize(p);
  p._animations = null;
  p._frames = null;
  p._images = null;
  p._data = null;
  p._loadCount = 0;
  p._frameHeight = 0;
  p._frameWidth = 0;
  p._numFrames = 0;
  p._regX = 0;
  p._regY = 0;
  p.initialize = function(data) {
    var i, l, o, a;
    if(data == null) {
      return
    }
    if(data.images && (l = data.images.length) > 0) {
      a = this._images = [];
      for(i = 0;i < l;i++) {
        var img = data.images[i];
        if(typeof img == "string") {
          var src = img;
          img = new Image;
          img.src = src
        }
        a.push(img);
        if(!img.getContext && !img.complete) {
          this._loadCount++;
          this.complete = false;
          (function(o) {
            img.onload = function() {
              o._handleImageLoad()
            }
          })(this)
        }
      }
    }
    if(data.frames == null) {
    }else {
      if(data.frames instanceof Array) {
        this._frames = [];
        a = data.frames;
        for(i = 0, l = a.length;i < l;i++) {
          var arr = a[i];
          this._frames.push({image:this._images[arr[4] ? arr[4] : 0], rect:new createjs.Rectangle(arr[0], arr[1], arr[2], arr[3]), regX:arr[5] || 0, regY:arr[6] || 0})
        }
      }else {
        o = data.frames;
        this._frameWidth = o.width;
        this._frameHeight = o.height;
        this._regX = o.regX || 0;
        this._regY = o.regY || 0;
        this._numFrames = o.count;
        if(this._loadCount == 0) {
          this._calculateFrames()
        }
      }
    }
    if((o = data.animations) != null) {
      this._animations = [];
      this._data = {};
      var name;
      for(name in o) {
        var anim = {name:name};
        var obj = o[name];
        if(typeof obj == "number") {
          a = anim.frames = [obj]
        }else {
          if(obj instanceof Array) {
            if(obj.length == 1) {
              anim.frames = [obj[0]]
            }else {
              anim.frequency = obj[3];
              anim.next = obj[2];
              a = anim.frames = [];
              for(i = obj[0];i <= obj[1];i++) {
                a.push(i)
              }
            }
          }else {
            anim.frequency = obj.frequency;
            anim.next = obj.next;
            var frames = obj.frames;
            a = anim.frames = typeof frames == "number" ? [frames] : frames.slice(0)
          }
        }
        anim.next = a.length < 2 || anim.next == false ? null : anim.next == null || anim.next == true ? name : anim.next;
        if(!anim.frequency) {
          anim.frequency = 1
        }
        this._animations.push(name);
        this._data[name] = anim
      }
    }
  };
  p.getNumFrames = function(animation) {
    if(animation == null) {
      return this._frames ? this._frames.length : this._numFrames
    }else {
      var data = this._data[animation];
      if(data == null) {
        return 0
      }else {
        return data.frames.length
      }
    }
  };
  p.getAnimations = function() {
    return this._animations.slice(0)
  };
  p.getAnimation = function(name) {
    return this._data[name]
  };
  p.getFrame = function(frameIndex) {
    var frame;
    if(this.complete && this._frames && (frame = this._frames[frameIndex])) {
      return frame
    }
    return null
  };
  p.getFrameBounds = function(frameIndex) {
    var frame = this.getFrame(frameIndex);
    return frame ? new createjs.Rectangle(-frame.regX, -frame.regY, frame.rect.width, frame.rect.height) : null
  };
  p.toString = function() {
    return"[SpriteSheet]"
  };
  p.clone = function() {
    var o = new SpriteSheet;
    o.complete = this.complete;
    o._animations = this._animations;
    o._frames = this._frames;
    o._images = this._images;
    o._data = this._data;
    o._frameHeight = this._frameHeight;
    o._frameWidth = this._frameWidth;
    o._numFrames = this._numFrames;
    o._loadCount = this._loadCount;
    return o
  };
  p._handleImageLoad = function() {
    if(--this._loadCount == 0) {
      this._calculateFrames();
      this.complete = true;
      this.onComplete && this.onComplete();
      this.dispatchEvent("complete")
    }
  };
  p._calculateFrames = function() {
    if(this._frames || this._frameWidth == 0) {
      return
    }
    this._frames = [];
    var ttlFrames = 0;
    var fw = this._frameWidth;
    var fh = this._frameHeight;
    for(var i = 0, imgs = this._images;i < imgs.length;i++) {
      var img = imgs[i];
      var cols = (img.width + 1) / fw | 0;
      var rows = (img.height + 1) / fh | 0;
      var ttl = this._numFrames > 0 ? Math.min(this._numFrames - ttlFrames, cols * rows) : cols * rows;
      for(var j = 0;j < ttl;j++) {
        this._frames.push({image:img, rect:new createjs.Rectangle(j % cols * fw, (j / cols | 0) * fh, fw, fh), regX:this._regX, regY:this._regY})
      }
      ttlFrames += ttl
    }
    this._numFrames = ttlFrames
  };
  createjs.SpriteSheet = SpriteSheet
})();
this.createjs = this.createjs || {};
(function() {
  function Command(f, params, path) {
    this.f = f;
    this.params = params;
    this.path = path == null ? true : path
  }
  Command.prototype.exec = function(scope) {
    this.f.apply(scope, this.params)
  };
  var Graphics = function() {
    this.initialize()
  };
  var p = Graphics.prototype;
  Graphics.getRGB = function(r, g, b, alpha) {
    if(r != null && b == null) {
      alpha = g;
      b = r & 255;
      g = r >> 8 & 255;
      r = r >> 16 & 255
    }
    if(alpha == null) {
      return"rgb(" + r + "," + g + "," + b + ")"
    }else {
      return"rgba(" + r + "," + g + "," + b + "," + alpha + ")"
    }
  };
  Graphics.getHSL = function(hue, saturation, lightness, alpha) {
    if(alpha == null) {
      return"hsl(" + hue % 360 + "," + saturation + "%," + lightness + "%)"
    }else {
      return"hsla(" + hue % 360 + "," + saturation + "%," + lightness + "%," + alpha + ")"
    }
  };
  Graphics.BASE_64 = {"A":0, "B":1, "C":2, "D":3, "E":4, "F":5, "G":6, "H":7, "I":8, "J":9, "K":10, "L":11, "M":12, "N":13, "O":14, "P":15, "Q":16, "R":17, "S":18, "T":19, "U":20, "V":21, "W":22, "X":23, "Y":24, "Z":25, "a":26, "b":27, "c":28, "d":29, "e":30, "f":31, "g":32, "h":33, "i":34, "j":35, "k":36, "l":37, "m":38, "n":39, "o":40, "p":41, "q":42, "r":43, "s":44, "t":45, "u":46, "v":47, "w":48, "x":49, "y":50, "z":51, "0":52, 1:53, 2:54, 3:55, 4:56, 5:57, 6:58, 7:59, 8:60, 9:61, "+":62, "/":63};
  Graphics.STROKE_CAPS_MAP = ["butt", "round", "square"];
  Graphics.STROKE_JOINTS_MAP = ["miter", "round", "bevel"];
  Graphics._ctx = (createjs.createCanvas ? createjs.createCanvas() : document.createElement("canvas")).getContext("2d");
  Graphics.beginCmd = new Command(Graphics._ctx.beginPath, [], false);
  Graphics.fillCmd = new Command(Graphics._ctx.fill, [], false);
  Graphics.strokeCmd = new Command(Graphics._ctx.stroke, [], false);
  p._strokeInstructions = null;
  p._strokeStyleInstructions = null;
  p._ignoreScaleStroke = false;
  p._fillInstructions = null;
  p._instructions = null;
  p._oldInstructions = null;
  p._activeInstructions = null;
  p._active = false;
  p._dirty = false;
  p.initialize = function() {
    this.clear();
    this._ctx = Graphics._ctx
  };
  p.isEmpty = function() {
    return!(this._instructions.length || this._oldInstructions.length || this._activeInstructions.length)
  };
  p.draw = function(ctx) {
    if(this._dirty) {
      this._updateInstructions()
    }
    var instr = this._instructions;
    for(var i = 0, l = instr.length;i < l;i++) {
      instr[i].exec(ctx)
    }
  };
  p.drawAsPath = function(ctx) {
    if(this._dirty) {
      this._updateInstructions()
    }
    var instr, instrs = this._instructions;
    for(var i = 0, l = instrs.length;i < l;i++) {
      if((instr = instrs[i]).path || i == 0) {
        instr.exec(ctx)
      }
    }
  };
  p.moveTo = function(x, y) {
    this._activeInstructions.push(new Command(this._ctx.moveTo, [x, y]));
    return this
  };
  p.lineTo = function(x, y) {
    this._dirty = this._active = true;
    this._activeInstructions.push(new Command(this._ctx.lineTo, [x, y]));
    return this
  };
  p.arcTo = function(x1, y1, x2, y2, radius) {
    this._dirty = this._active = true;
    this._activeInstructions.push(new Command(this._ctx.arcTo, [x1, y1, x2, y2, radius]));
    return this
  };
  p.arc = function(x, y, radius, startAngle, endAngle, anticlockwise) {
    this._dirty = this._active = true;
    if(anticlockwise == null) {
      anticlockwise = false
    }
    this._activeInstructions.push(new Command(this._ctx.arc, [x, y, radius, startAngle, endAngle, anticlockwise]));
    return this
  };
  p.quadraticCurveTo = function(cpx, cpy, x, y) {
    this._dirty = this._active = true;
    this._activeInstructions.push(new Command(this._ctx.quadraticCurveTo, [cpx, cpy, x, y]));
    return this
  };
  p.bezierCurveTo = function(cp1x, cp1y, cp2x, cp2y, x, y) {
    this._dirty = this._active = true;
    this._activeInstructions.push(new Command(this._ctx.bezierCurveTo, [cp1x, cp1y, cp2x, cp2y, x, y]));
    return this
  };
  p.rect = function(x, y, w, h) {
    this._dirty = this._active = true;
    this._activeInstructions.push(new Command(this._ctx.rect, [x, y, w, h]));
    return this
  };
  p.closePath = function() {
    if(this._active) {
      this._dirty = true;
      this._activeInstructions.push(new Command(this._ctx.closePath, []))
    }
    return this
  };
  p.clear = function() {
    this._instructions = [];
    this._oldInstructions = [];
    this._activeInstructions = [];
    this._strokeStyleInstructions = this._strokeInstructions = this._fillInstructions = null;
    this._active = this._dirty = false;
    return this
  };
  p.beginFill = function(color) {
    if(this._active) {
      this._newPath()
    }
    this._fillInstructions = color ? [new Command(this._setProp, ["fillStyle", color], false), Graphics.fillCmd] : null;
    return this
  };
  p.beginLinearGradientFill = function(colors, ratios, x0, y0, x1, y1) {
    if(this._active) {
      this._newPath()
    }
    var o = this._ctx.createLinearGradient(x0, y0, x1, y1);
    for(var i = 0, l = colors.length;i < l;i++) {
      o.addColorStop(ratios[i], colors[i])
    }
    this._fillInstructions = [new Command(this._setProp, ["fillStyle", o], false), Graphics.fillCmd];
    return this
  };
  p.beginRadialGradientFill = function(colors, ratios, x0, y0, r0, x1, y1, r1) {
    if(this._active) {
      this._newPath()
    }
    var o = this._ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
    for(var i = 0, l = colors.length;i < l;i++) {
      o.addColorStop(ratios[i], colors[i])
    }
    this._fillInstructions = [new Command(this._setProp, ["fillStyle", o], false), Graphics.fillCmd];
    return this
  };
  p.beginBitmapFill = function(image, repetition, matrix) {
    if(this._active) {
      this._newPath()
    }
    repetition = repetition || "";
    var o = this._ctx.createPattern(image, repetition);
    var cmd = new Command(this._setProp, ["fillStyle", o], false);
    var arr;
    if(matrix) {
      arr = [cmd, new Command(this._ctx.save, [], false), new Command(this._ctx.transform, [matrix.a, matrix.b, matrix.c, matrix.d, matrix.tx, matrix.ty], false), Graphics.fillCmd, new Command(this._ctx.restore, [], false)]
    }else {
      arr = [cmd, Graphics.fillCmd]
    }
    this._fillInstructions = arr;
    return this
  };
  p.endFill = function() {
    return this.beginFill()
  };
  p.setStrokeStyle = function(thickness, caps, joints, miterLimit, ignoreScale) {
    if(this._active) {
      this._newPath()
    }
    this._strokeStyleInstructions = [new Command(this._setProp, ["lineWidth", thickness == null ? "1" : thickness], false), new Command(this._setProp, ["lineCap", caps == null ? "butt" : isNaN(caps) ? caps : Graphics.STROKE_CAPS_MAP[caps]], false), new Command(this._setProp, ["lineJoin", joints == null ? "miter" : isNaN(joints) ? joints : Graphics.STROKE_JOINTS_MAP[joints]], false), new Command(this._setProp, ["miterLimit", miterLimit == null ? "10" : miterLimit], false)];
    this._ignoreScaleStroke = ignoreScale;
    return this
  };
  p.beginStroke = function(color) {
    if(this._active) {
      this._newPath()
    }
    this._strokeInstructions = color ? [new Command(this._setProp, ["strokeStyle", color], false)] : null;
    return this
  };
  p.beginLinearGradientStroke = function(colors, ratios, x0, y0, x1, y1) {
    if(this._active) {
      this._newPath()
    }
    var o = this._ctx.createLinearGradient(x0, y0, x1, y1);
    for(var i = 0, l = colors.length;i < l;i++) {
      o.addColorStop(ratios[i], colors[i])
    }
    this._strokeInstructions = [new Command(this._setProp, ["strokeStyle", o], false)];
    return this
  };
  p.beginRadialGradientStroke = function(colors, ratios, x0, y0, r0, x1, y1, r1) {
    if(this._active) {
      this._newPath()
    }
    var o = this._ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
    for(var i = 0, l = colors.length;i < l;i++) {
      o.addColorStop(ratios[i], colors[i])
    }
    this._strokeInstructions = [new Command(this._setProp, ["strokeStyle", o], false)];
    return this
  };
  p.beginBitmapStroke = function(image, repetition) {
    if(this._active) {
      this._newPath()
    }
    repetition = repetition || "";
    var o = this._ctx.createPattern(image, repetition);
    this._strokeInstructions = [new Command(this._setProp, ["strokeStyle", o], false)];
    return this
  };
  p.endStroke = function() {
    this.beginStroke();
    return this
  };
  p.curveTo = p.quadraticCurveTo;
  p.drawRect = p.rect;
  p.drawRoundRect = function(x, y, w, h, radius) {
    this.drawRoundRectComplex(x, y, w, h, radius, radius, radius, radius);
    return this
  };
  p.drawRoundRectComplex = function(x, y, w, h, radiusTL, radiusTR, radiusBR, radiusBL) {
    var max = (w < h ? w : h) / 2;
    var mTL = 0, mTR = 0, mBR = 0, mBL = 0;
    if(radiusTL < 0) {
      radiusTL *= mTL = -1
    }
    if(radiusTL > max) {
      radiusTL = max
    }
    if(radiusTR < 0) {
      radiusTR *= mTR = -1
    }
    if(radiusTR > max) {
      radiusTR = max
    }
    if(radiusBR < 0) {
      radiusBR *= mBR = -1
    }
    if(radiusBR > max) {
      radiusBR = max
    }
    if(radiusBL < 0) {
      radiusBL *= mBL = -1
    }
    if(radiusBL > max) {
      radiusBL = max
    }
    this._dirty = this._active = true;
    var arcTo = this._ctx.arcTo, lineTo = this._ctx.lineTo;
    this._activeInstructions.push(new Command(this._ctx.moveTo, [x + w - radiusTR, y]), new Command(arcTo, [x + w + radiusTR * mTR, y - radiusTR * mTR, x + w, y + radiusTR, radiusTR]), new Command(lineTo, [x + w, y + h - radiusBR]), new Command(arcTo, [x + w + radiusBR * mBR, y + h + radiusBR * mBR, x + w - radiusBR, y + h, radiusBR]), new Command(lineTo, [x + radiusBL, y + h]), new Command(arcTo, [x - radiusBL * mBL, y + h + radiusBL * mBL, x, y + h - radiusBL, radiusBL]), new Command(lineTo, [x, 
    y + radiusTL]), new Command(arcTo, [x - radiusTL * mTL, y - radiusTL * mTL, x + radiusTL, y, radiusTL]), new Command(this._ctx.closePath));
    return this
  };
  p.drawCircle = function(x, y, radius) {
    this.arc(x, y, radius, 0, Math.PI * 2);
    return this
  };
  p.drawEllipse = function(x, y, w, h) {
    this._dirty = this._active = true;
    var k = 0.5522848;
    var ox = w / 2 * k;
    var oy = h / 2 * k;
    var xe = x + w;
    var ye = y + h;
    var xm = x + w / 2;
    var ym = y + h / 2;
    this._activeInstructions.push(new Command(this._ctx.moveTo, [x, ym]), new Command(this._ctx.bezierCurveTo, [x, ym - oy, xm - ox, y, xm, y]), new Command(this._ctx.bezierCurveTo, [xm + ox, y, xe, ym - oy, xe, ym]), new Command(this._ctx.bezierCurveTo, [xe, ym + oy, xm + ox, ye, xm, ye]), new Command(this._ctx.bezierCurveTo, [xm - ox, ye, x, ym + oy, x, ym]));
    return this
  };
  p.drawPolyStar = function(x, y, radius, sides, pointSize, angle) {
    this._dirty = this._active = true;
    if(pointSize == null) {
      pointSize = 0
    }
    pointSize = 1 - pointSize;
    if(angle == null) {
      angle = 0
    }else {
      angle /= 180 / Math.PI
    }
    var a = Math.PI / sides;
    this._activeInstructions.push(new Command(this._ctx.moveTo, [x + Math.cos(angle) * radius, y + Math.sin(angle) * radius]));
    for(var i = 0;i < sides;i++) {
      angle += a;
      if(pointSize != 1) {
        this._activeInstructions.push(new Command(this._ctx.lineTo, [x + Math.cos(angle) * radius * pointSize, y + Math.sin(angle) * radius * pointSize]))
      }
      angle += a;
      this._activeInstructions.push(new Command(this._ctx.lineTo, [x + Math.cos(angle) * radius, y + Math.sin(angle) * radius]))
    }
    return this
  };
  p.decodePath = function(str) {
    var instructions = [this.moveTo, this.lineTo, this.quadraticCurveTo, this.bezierCurveTo, this.closePath];
    var paramCount = [2, 2, 4, 6, 0];
    var i = 0, l = str.length;
    var params = [];
    var x = 0, y = 0;
    var base64 = Graphics.BASE_64;
    while(i < l) {
      var c = str.charAt(i);
      var n = base64[c];
      var fi = n >> 3;
      var f = instructions[fi];
      if(!f || n & 3) {
        throw"bad path data (@" + i + "): " + c;
      }
      var pl = paramCount[fi];
      if(!fi) {
        x = y = 0
      }
      params.length = 0;
      i++;
      var charCount = (n >> 2 & 1) + 2;
      for(var p = 0;p < pl;p++) {
        var num = base64[str.charAt(i)];
        var sign = num >> 5 ? -1 : 1;
        num = (num & 31) << 6 | base64[str.charAt(i + 1)];
        if(charCount == 3) {
          num = num << 6 | base64[str.charAt(i + 2)]
        }
        num = sign * num / 10;
        if(p % 2) {
          x = num += x
        }else {
          y = num += y
        }
        params[p] = num;
        i += charCount
      }
      f.apply(this, params)
    }
    return this
  };
  p.clone = function() {
    var o = new Graphics;
    o._instructions = this._instructions.slice();
    o._activeInstructions = this._activeInstructions.slice();
    o._oldInstructions = this._oldInstructions.slice();
    if(this._fillInstructions) {
      o._fillInstructions = this._fillInstructions.slice()
    }
    if(this._strokeInstructions) {
      o._strokeInstructions = this._strokeInstructions.slice()
    }
    if(this._strokeStyleInstructions) {
      o._strokeStyleInstructions = this._strokeStyleInstructions.slice()
    }
    o._active = this._active;
    o._dirty = this._dirty;
    return o
  };
  p.toString = function() {
    return"[Graphics]"
  };
  p.mt = p.moveTo;
  p.lt = p.lineTo;
  p.at = p.arcTo;
  p.bt = p.bezierCurveTo;
  p.qt = p.quadraticCurveTo;
  p.a = p.arc;
  p.r = p.rect;
  p.cp = p.closePath;
  p.c = p.clear;
  p.f = p.beginFill;
  p.lf = p.beginLinearGradientFill;
  p.rf = p.beginRadialGradientFill;
  p.bf = p.beginBitmapFill;
  p.ef = p.endFill;
  p.ss = p.setStrokeStyle;
  p.s = p.beginStroke;
  p.ls = p.beginLinearGradientStroke;
  p.rs = p.beginRadialGradientStroke;
  p.bs = p.beginBitmapStroke;
  p.es = p.endStroke;
  p.dr = p.drawRect;
  p.rr = p.drawRoundRect;
  p.rc = p.drawRoundRectComplex;
  p.dc = p.drawCircle;
  p.de = p.drawEllipse;
  p.dp = p.drawPolyStar;
  p.p = p.decodePath;
  p._updateInstructions = function() {
    this._instructions = this._oldInstructions.slice();
    this._instructions.push(Graphics.beginCmd);
    this._instructions.push.apply(this._instructions, this._activeInstructions);
    if(this._fillInstructions) {
      this._instructions.push.apply(this._instructions, this._fillInstructions)
    }
    if(this._strokeInstructions) {
      if(this._strokeStyleInstructions) {
        this._instructions.push.apply(this._instructions, this._strokeStyleInstructions)
      }
      this._instructions.push.apply(this._instructions, this._strokeInstructions);
      if(this._ignoreScaleStroke) {
        this._instructions.push(new Command(this._ctx.save, [], false), new Command(this._ctx.setTransform, [1, 0, 0, 1, 0, 0], false), Graphics.strokeCmd, new Command(this._ctx.restore, [], false))
      }else {
        this._instructions.push(Graphics.strokeCmd)
      }
    }
  };
  p._newPath = function() {
    if(this._dirty) {
      this._updateInstructions()
    }
    this._oldInstructions = this._instructions;
    this._activeInstructions = [];
    this._active = this._dirty = false
  };
  p._setProp = function(name, value) {
    this[name] = value
  };
  createjs.Graphics = Graphics
})();
this.createjs = this.createjs || {};
(function() {
  var DisplayObject = function() {
    this.initialize()
  };
  var p = DisplayObject.prototype;
  DisplayObject.suppressCrossDomainErrors = false;
  DisplayObject._hitTestCanvas = createjs.createCanvas ? createjs.createCanvas() : document.createElement("canvas");
  DisplayObject._hitTestCanvas.width = DisplayObject._hitTestCanvas.height = 1;
  DisplayObject._hitTestContext = DisplayObject._hitTestCanvas.getContext("2d");
  DisplayObject._nextCacheID = 1;
  p.alpha = 1;
  p.cacheCanvas = null;
  p.id = -1;
  p.mouseEnabled = true;
  p.name = null;
  p.parent = null;
  p.regX = 0;
  p.regY = 0;
  p.rotation = 0;
  p.scaleX = 1;
  p.scaleY = 1;
  p.skewX = 0;
  p.skewY = 0;
  p.shadow = null;
  p.visible = true;
  p.x = 0;
  p.y = 0;
  p.compositeOperation = null;
  p.snapToPixel = false;
  p.onPress = null;
  p.onClick = null;
  p.onDoubleClick = null;
  p.onMouseOver = null;
  p.onMouseOut = null;
  p.onTick = null;
  p.filters = null;
  p.cacheID = 0;
  p.mask = null;
  p.hitArea = null;
  p.cursor = null;
  p.addEventListener = null;
  p.removeEventListener = null;
  p.removeAllEventListeners = null;
  p.dispatchEvent = null;
  p.hasEventListener = null;
  p._listeners = null;
  createjs.EventDispatcher.initialize(p);
  p._cacheOffsetX = 0;
  p._cacheOffsetY = 0;
  p._cacheScale = 1;
  p._cacheDataURLID = 0;
  p._cacheDataURL = null;
  p._matrix = null;
  p.initialize = function() {
    this.id = createjs.UID.get();
    this._matrix = new createjs.Matrix2D
  };
  p.isVisible = function() {
    return!!(this.visible && this.alpha > 0 && this.scaleX != 0 && this.scaleY != 0)
  };
  p.draw = function(ctx, ignoreCache) {
    var cacheCanvas = this.cacheCanvas;
    if(ignoreCache || !cacheCanvas) {
      return false
    }
    var scale = this._cacheScale;
    ctx.drawImage(cacheCanvas, this._cacheOffsetX, this._cacheOffsetY, cacheCanvas.width / scale, cacheCanvas.height / scale);
    return true
  };
  p.updateContext = function(ctx) {
    var mtx, mask = this.mask, o = this;
    if(mask && mask.graphics && !mask.graphics.isEmpty()) {
      mtx = mask.getMatrix(mask._matrix);
      ctx.transform(mtx.a, mtx.b, mtx.c, mtx.d, mtx.tx, mtx.ty);
      mask.graphics.drawAsPath(ctx);
      ctx.clip();
      mtx.invert();
      ctx.transform(mtx.a, mtx.b, mtx.c, mtx.d, mtx.tx, mtx.ty)
    }
    mtx = o._matrix.identity().appendTransform(o.x, o.y, o.scaleX, o.scaleY, o.rotation, o.skewX, o.skewY, o.regX, o.regY);
    if(createjs["Stage"]._snapToPixelEnabled && o.snapToPixel) {
      ctx.transform(mtx.a, mtx.b, mtx.c, mtx.d, mtx.tx + 0.5 | 0, mtx.ty + 0.5 | 0)
    }else {
      ctx.transform(mtx.a, mtx.b, mtx.c, mtx.d, mtx.tx, mtx.ty)
    }
    ctx.globalAlpha *= o.alpha;
    if(o.compositeOperation) {
      ctx.globalCompositeOperation = o.compositeOperation
    }
    if(o.shadow) {
      this._applyShadow(ctx, o.shadow)
    }
  };
  p.cache = function(x, y, width, height, scale) {
    scale = scale || 1;
    if(!this.cacheCanvas) {
      this.cacheCanvas = createjs.createCanvas ? createjs.createCanvas() : document.createElement("canvas")
    }
    this.cacheCanvas.width = Math.ceil(width * scale);
    this.cacheCanvas.height = Math.ceil(height * scale);
    this._cacheOffsetX = x;
    this._cacheOffsetY = y;
    this._cacheScale = scale || 1;
    this.updateCache()
  };
  p.updateCache = function(compositeOperation) {
    var cacheCanvas = this.cacheCanvas, scale = this._cacheScale, offX = this._cacheOffsetX * scale, offY = this._cacheOffsetY * scale;
    if(!cacheCanvas) {
      throw"cache() must be called before updateCache()";
    }
    var ctx = cacheCanvas.getContext("2d");
    ctx.save();
    if(!compositeOperation) {
      ctx.clearRect(0, 0, cacheCanvas.width, cacheCanvas.height)
    }
    ctx.globalCompositeOperation = compositeOperation;
    ctx.setTransform(scale, 0, 0, scale, -offX, -offY);
    this.draw(ctx, true);
    this._applyFilters();
    ctx.restore();
    this.cacheID = DisplayObject._nextCacheID++
  };
  p.uncache = function() {
    this._cacheDataURL = this.cacheCanvas = null;
    this.cacheID = this._cacheOffsetX = this._cacheOffsetY = 0;
    this._cacheScale = 1
  };
  p.getCacheDataURL = function() {
    if(!this.cacheCanvas) {
      return null
    }
    if(this.cacheID != this._cacheDataURLID) {
      this._cacheDataURL = this.cacheCanvas.toDataURL()
    }
    return this._cacheDataURL
  };
  p.getStage = function() {
    var o = this;
    while(o.parent) {
      o = o.parent
    }
    if(o instanceof createjs["Stage"]) {
      return o
    }
    return null
  };
  p.localToGlobal = function(x, y) {
    var mtx = this.getConcatenatedMatrix(this._matrix);
    if(mtx == null) {
      return null
    }
    mtx.append(1, 0, 0, 1, x, y);
    return new createjs.Point(mtx.tx, mtx.ty)
  };
  p.globalToLocal = function(x, y) {
    var mtx = this.getConcatenatedMatrix(this._matrix);
    if(mtx == null) {
      return null
    }
    mtx.invert();
    mtx.append(1, 0, 0, 1, x, y);
    return new createjs.Point(mtx.tx, mtx.ty)
  };
  p.localToLocal = function(x, y, target) {
    var pt = this.localToGlobal(x, y);
    return target.globalToLocal(pt.x, pt.y)
  };
  p.setTransform = function(x, y, scaleX, scaleY, rotation, skewX, skewY, regX, regY) {
    this.x = x || 0;
    this.y = y || 0;
    this.scaleX = scaleX == null ? 1 : scaleX;
    this.scaleY = scaleY == null ? 1 : scaleY;
    this.rotation = rotation || 0;
    this.skewX = skewX || 0;
    this.skewY = skewY || 0;
    this.regX = regX || 0;
    this.regY = regY || 0;
    return this
  };
  p.getMatrix = function(matrix) {
    var o = this;
    return(matrix ? matrix.identity() : new createjs.Matrix2D).appendTransform(o.x, o.y, o.scaleX, o.scaleY, o.rotation, o.skewX, o.skewY, o.regX, o.regY).appendProperties(o.alpha, o.shadow, o.compositeOperation)
  };
  p.getConcatenatedMatrix = function(matrix) {
    if(matrix) {
      matrix.identity()
    }else {
      matrix = new createjs.Matrix2D
    }
    var o = this;
    while(o != null) {
      matrix.prependTransform(o.x, o.y, o.scaleX, o.scaleY, o.rotation, o.skewX, o.skewY, o.regX, o.regY).prependProperties(o.alpha, o.shadow, o.compositeOperation);
      o = o.parent
    }
    return matrix
  };
  p.hitTest = function(x, y) {
    var ctx = DisplayObject._hitTestContext;
    var canvas = DisplayObject._hitTestCanvas;
    ctx.setTransform(1, 0, 0, 1, -x, -y);
    this.draw(ctx);
    var hit = this._testHit(ctx);
    canvas.width = 0;
    canvas.width = 1;
    return hit
  };
  p.set = function(props) {
    for(var n in props) {
      this[n] = props[n]
    }
    return this
  };
  p.clone = function() {
    var o = new DisplayObject;
    this.cloneProps(o);
    return o
  };
  p.toString = function() {
    return"[DisplayObject (name=" + this.name + ")]"
  };
  p.cloneProps = function(o) {
    o.alpha = this.alpha;
    o.name = this.name;
    o.regX = this.regX;
    o.regY = this.regY;
    o.rotation = this.rotation;
    o.scaleX = this.scaleX;
    o.scaleY = this.scaleY;
    o.shadow = this.shadow;
    o.skewX = this.skewX;
    o.skewY = this.skewY;
    o.visible = this.visible;
    o.x = this.x;
    o.y = this.y;
    o.mouseEnabled = this.mouseEnabled;
    o.compositeOperation = this.compositeOperation;
    if(this.cacheCanvas) {
      o.cacheCanvas = this.cacheCanvas.cloneNode(true);
      o.cacheCanvas.getContext("2d").putImageData(this.cacheCanvas.getContext("2d").getImageData(0, 0, this.cacheCanvas.width, this.cacheCanvas.height), 0, 0)
    }
  };
  p._applyShadow = function(ctx, shadow) {
    shadow = shadow || Shadow.identity;
    ctx.shadowColor = shadow.color;
    ctx.shadowOffsetX = shadow.offsetX;
    ctx.shadowOffsetY = shadow.offsetY;
    ctx.shadowBlur = shadow.blur
  };
  p._tick = function(params) {
    this.onTick && this.onTick.apply(this, params);
    var ls = this._listeners;
    if(ls && ls["tick"]) {
      this.dispatchEvent({type:"tick", params:params})
    }
  };
  p._testHit = function(ctx) {
    try {
      var hit = ctx.getImageData(0, 0, 1, 1).data[3] > 1
    }catch(e) {
      if(!DisplayObject.suppressCrossDomainErrors) {
        throw"An error has occurred. This is most likely due to security restrictions on reading canvas pixel data with local or cross-domain images.";
      }
    }
    return hit
  };
  p._applyFilters = function() {
    if(!this.filters || this.filters.length == 0 || !this.cacheCanvas) {
      return
    }
    var l = this.filters.length;
    var ctx = this.cacheCanvas.getContext("2d");
    var w = this.cacheCanvas.width;
    var h = this.cacheCanvas.height;
    for(var i = 0;i < l;i++) {
      this.filters[i].applyFilter(ctx, 0, 0, w, h)
    }
  };
  p._hasMouseHandler = function(typeMask) {
    var ls = this._listeners;
    return!!(typeMask & 1 && (this.onPress || this.onClick || this.onDoubleClick || ls && (this.hasEventListener("mousedown") || this.hasEventListener("click") || this.hasEventListener("dblclick"))) || typeMask & 2 && (this.onMouseOver || this.onMouseOut || this.cursor || ls && (this.hasEventListener("mouseover") || this.hasEventListener("mouseout"))))
  };
  createjs.DisplayObject = DisplayObject
})();
this.createjs = this.createjs || {};
(function() {
  var Container = function() {
    this.initialize()
  };
  var p = Container.prototype = new createjs.DisplayObject;
  p.children = null;
  p.DisplayObject_initialize = p.initialize;
  p.initialize = function() {
    this.DisplayObject_initialize();
    this.children = []
  };
  p.isVisible = function() {
    var hasContent = this.cacheCanvas || this.children.length;
    return!!(this.visible && this.alpha > 0 && this.scaleX != 0 && this.scaleY != 0 && hasContent)
  };
  p.DisplayObject_draw = p.draw;
  p.draw = function(ctx, ignoreCache) {
    if(this.DisplayObject_draw(ctx, ignoreCache)) {
      return true
    }
    var list = this.children.slice(0);
    for(var i = 0, l = list.length;i < l;i++) {
      var child = list[i];
      if(!child.isVisible()) {
        continue
      }
      ctx.save();
      child.updateContext(ctx);
      child.draw(ctx);
      ctx.restore()
    }
    return true
  };
  p.addChild = function(child) {
    if(child == null) {
      return child
    }
    var l = arguments.length;
    if(l > 1) {
      for(var i = 0;i < l;i++) {
        this.addChild(arguments[i])
      }
      return arguments[l - 1]
    }
    if(child.parent) {
      child.parent.removeChild(child)
    }
    child.parent = this;
    this.children.push(child);
    return child
  };
  p.addChildAt = function(child, index) {
    var l = arguments.length;
    var indx = arguments[l - 1];
    if(indx < 0 || indx > this.children.length) {
      return arguments[l - 2]
    }
    if(l > 2) {
      for(var i = 0;i < l - 1;i++) {
        this.addChildAt(arguments[i], indx + i)
      }
      return arguments[l - 2]
    }
    if(child.parent) {
      child.parent.removeChild(child)
    }
    child.parent = this;
    this.children.splice(index, 0, child);
    return child
  };
  p.removeChild = function(child) {
    var l = arguments.length;
    if(l > 1) {
      var good = true;
      for(var i = 0;i < l;i++) {
        good = good && this.removeChild(arguments[i])
      }
      return good
    }
    return this.removeChildAt(this.children.indexOf(child))
  };
  p.removeChildAt = function(index) {
    var l = arguments.length;
    if(l > 1) {
      var a = [];
      for(var i = 0;i < l;i++) {
        a[i] = arguments[i]
      }
      a.sort(function(a, b) {
        return b - a
      });
      var good = true;
      for(var i = 0;i < l;i++) {
        good = good && this.removeChildAt(a[i])
      }
      return good
    }
    if(index < 0 || index > this.children.length - 1) {
      return false
    }
    var child = this.children[index];
    if(child) {
      child.parent = null
    }
    this.children.splice(index, 1);
    return true
  };
  p.removeAllChildren = function() {
    var kids = this.children;
    while(kids.length) {
      kids.pop().parent = null
    }
  };
  p.getChildAt = function(index) {
    return this.children[index]
  };
  p.getChildByName = function(name) {
    var kids = this.children;
    for(var i = 0, l = kids.length;i < l;i++) {
      if(kids[i].name == name) {
        return kids[i]
      }
    }
    return null
  };
  p.sortChildren = function(sortFunction) {
    this.children.sort(sortFunction)
  };
  p.getChildIndex = function(child) {
    return this.children.indexOf(child)
  };
  p.getNumChildren = function() {
    return this.children.length
  };
  p.swapChildrenAt = function(index1, index2) {
    var kids = this.children;
    var o1 = kids[index1];
    var o2 = kids[index2];
    if(!o1 || !o2) {
      return
    }
    kids[index1] = o2;
    kids[index2] = o1
  };
  p.swapChildren = function(child1, child2) {
    var kids = this.children;
    var index1, index2;
    for(var i = 0, l = kids.length;i < l;i++) {
      if(kids[i] == child1) {
        index1 = i
      }
      if(kids[i] == child2) {
        index2 = i
      }
      if(index1 != null && index2 != null) {
        break
      }
    }
    if(i == l) {
      return
    }
    kids[index1] = child2;
    kids[index2] = child1
  };
  p.setChildIndex = function(child, index) {
    var kids = this.children, l = kids.length;
    if(child.parent != this || index < 0 || index >= l) {
      return
    }
    for(var i = 0;i < l;i++) {
      if(kids[i] == child) {
        break
      }
    }
    if(i == l || i == index) {
      return
    }
    kids.splice(i, 1);
    if(index < i) {
      index--
    }
    kids.splice(index, 0, child)
  };
  p.contains = function(child) {
    while(child) {
      if(child == this) {
        return true
      }
      child = child.parent
    }
    return false
  };
  p.hitTest = function(x, y) {
    return this.getObjectUnderPoint(x, y) != null
  };
  p.getObjectsUnderPoint = function(x, y) {
    var arr = [];
    var pt = this.localToGlobal(x, y);
    this._getObjectsUnderPoint(pt.x, pt.y, arr);
    return arr
  };
  p.getObjectUnderPoint = function(x, y) {
    var pt = this.localToGlobal(x, y);
    return this._getObjectsUnderPoint(pt.x, pt.y)
  };
  p.clone = function(recursive) {
    var o = new Container;
    this.cloneProps(o);
    if(recursive) {
      var arr = o.children = [];
      for(var i = 0, l = this.children.length;i < l;i++) {
        var clone = this.children[i].clone(recursive);
        clone.parent = o;
        arr.push(clone)
      }
    }
    return o
  };
  p.toString = function() {
    return"[Container (name=" + this.name + ")]"
  };
  p.DisplayObject__tick = p._tick;
  p._tick = function(params) {
    for(var i = this.children.length - 1;i >= 0;i--) {
      var child = this.children[i];
      if(child._tick) {
        child._tick(params)
      }
    }
    this.DisplayObject__tick(params)
  };
  p._getObjectsUnderPoint = function(x, y, arr, mouseEvents) {
    var ctx = createjs.DisplayObject._hitTestContext;
    var canvas = createjs.DisplayObject._hitTestCanvas;
    var mtx = this._matrix;
    var hasHandler = this._hasMouseHandler(mouseEvents);
    if(!this.hitArea && this.cacheCanvas && hasHandler) {
      this.getConcatenatedMatrix(mtx);
      ctx.setTransform(mtx.a, mtx.b, mtx.c, mtx.d, mtx.tx - x, mtx.ty - y);
      ctx.globalAlpha = mtx.alpha;
      this.draw(ctx);
      if(this._testHit(ctx)) {
        canvas.width = 0;
        canvas.width = 1;
        return this
      }
    }
    var l = this.children.length;
    for(var i = l - 1;i >= 0;i--) {
      var child = this.children[i];
      var hitArea = child.hitArea;
      if(!child.visible || !hitArea && !child.isVisible() || mouseEvents && !child.mouseEnabled) {
        continue
      }
      var childHasHandler = mouseEvents && child._hasMouseHandler(mouseEvents);
      if(child instanceof Container && !(hitArea && childHasHandler)) {
        var result;
        if(hasHandler) {
          result = child._getObjectsUnderPoint(x, y);
          if(result) {
            return this
          }
        }else {
          result = child._getObjectsUnderPoint(x, y, arr, mouseEvents);
          if(!arr && result) {
            return result
          }
        }
      }else {
        if(!mouseEvents || hasHandler || childHasHandler) {
          child.getConcatenatedMatrix(mtx);
          if(hitArea) {
            mtx.appendTransform(hitArea.x, hitArea.y, hitArea.scaleX, hitArea.scaleY, hitArea.rotation, hitArea.skewX, hitArea.skewY, hitArea.regX, hitArea.regY);
            mtx.alpha = hitArea.alpha
          }
          ctx.globalAlpha = mtx.alpha;
          ctx.setTransform(mtx.a, mtx.b, mtx.c, mtx.d, mtx.tx - x, mtx.ty - y);
          (hitArea || child).draw(ctx);
          if(!this._testHit(ctx)) {
            continue
          }
          canvas.width = 0;
          canvas.width = 1;
          if(hasHandler) {
            return this
          }else {
            if(arr) {
              arr.push(child)
            }else {
              return child
            }
          }
        }
      }
    }
    return null
  };
  createjs.Container = Container
})();
this.createjs = this.createjs || {};
(function() {
  var Stage = function(canvas) {
    this.initialize(canvas)
  };
  var p = Stage.prototype = new createjs.Container;
  Stage._snapToPixelEnabled = false;
  p.autoClear = true;
  p.canvas = null;
  p.mouseX = 0;
  p.mouseY = 0;
  p.onMouseMove = null;
  p.onMouseUp = null;
  p.onMouseDown = null;
  p.snapToPixelEnabled = false;
  p.mouseInBounds = false;
  p.tickOnUpdate = true;
  p.mouseMoveOutside = false;
  p._pointerData = null;
  p._pointerCount = 0;
  p._primaryPointerID = null;
  p._mouseOverIntervalID = null;
  p.Container_initialize = p.initialize;
  p.initialize = function(canvas) {
    this.Container_initialize();
    this.canvas = typeof canvas == "string" ? document.getElementById(canvas) : canvas;
    this._pointerData = {};
    this.enableDOMEvents(true)
  };
  p.update = function() {
    if(!this.canvas) {
      return
    }
    if(this.autoClear) {
      this.clear()
    }
    Stage._snapToPixelEnabled = this.snapToPixelEnabled;
    if(this.tickOnUpdate) {
      this._tick(arguments.length ? arguments : null)
    }
    var ctx = this.canvas.getContext("2d");
    ctx.save();
    this.updateContext(ctx);
    this.draw(ctx, false);
    ctx.restore()
  };
  p.tick = p.update;
  p.handleEvent = function(evt) {
    if(evt.type == "tick") {
      this.update(evt)
    }
  };
  p.clear = function() {
    if(!this.canvas) {
      return
    }
    var ctx = this.canvas.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  };
  p.toDataURL = function(backgroundColor, mimeType) {
    if(!mimeType) {
      mimeType = "image/png"
    }
    var ctx = this.canvas.getContext("2d");
    var w = this.canvas.width;
    var h = this.canvas.height;
    var data;
    if(backgroundColor) {
      data = ctx.getImageData(0, 0, w, h);
      var compositeOperation = ctx.globalCompositeOperation;
      ctx.globalCompositeOperation = "destination-over";
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, w, h)
    }
    var dataURL = this.canvas.toDataURL(mimeType);
    if(backgroundColor) {
      ctx.clearRect(0, 0, w, h);
      ctx.putImageData(data, 0, 0);
      ctx.globalCompositeOperation = compositeOperation
    }
    return dataURL
  };
  p.enableMouseOver = function(frequency) {
    if(this._mouseOverIntervalID) {
      clearInterval(this._mouseOverIntervalID);
      this._mouseOverIntervalID = null
    }
    if(frequency == null) {
      frequency = 20
    }else {
      if(frequency <= 0) {
        return
      }
    }
    var o = this;
    this._mouseOverIntervalID = setInterval(function() {
      o._testMouseOver()
    }, 1E3 / Math.min(50, frequency))
  };
  p.enableDOMEvents = function(enable) {
    if(enable == null) {
      enable = true
    }
    var n, o, ls = this._eventListeners;
    if(!enable && ls) {
      for(n in ls) {
        o = ls[n];
        o.t.removeEventListener(n, o.f)
      }
      this._eventListeners = null
    }else {
      if(enable && !ls) {
        var t = window.addEventListener ? window : document;
        var _this = this;
        ls = this._eventListeners = {};
        ls["mouseup"] = {t:t, f:function(e) {
          _this._handleMouseUp(e)
        }};
        ls["mousemove"] = {t:t, f:function(e) {
          _this._handleMouseMove(e)
        }};
        ls["dblclick"] = {t:t, f:function(e) {
          _this._handleDoubleClick(e)
        }};
        t = this.canvas;
        if(t) {
          ls["mousedown"] = {t:t, f:function(e) {
            _this._handleMouseDown(e)
          }}
        }
        for(n in ls) {
          o = ls[n];
          o.t.addEventListener(n, o.f)
        }
      }
    }
  };
  p.clone = function() {
    var o = new Stage(null);
    this.cloneProps(o);
    return o
  };
  p.toString = function() {
    return"[Stage (name=" + this.name + ")]"
  };
  p._getPointerData = function(id) {
    var data = this._pointerData[id];
    if(!data) {
      data = this._pointerData[id] = {x:0, y:0};
      if(this._primaryPointerID == null) {
        this._primaryPointerID = id
      }
    }
    return data
  };
  p._handleMouseMove = function(e) {
    if(!e) {
      e = window.event
    }
    this._handlePointerMove(-1, e, e.pageX, e.pageY)
  };
  p._handlePointerMove = function(id, e, pageX, pageY) {
    if(!this.canvas) {
      return
    }
    var evt;
    var o = this._getPointerData(id);
    var inBounds = o.inBounds;
    this._updatePointerPosition(id, pageX, pageY);
    if(!inBounds && !o.inBounds && !this.mouseMoveOutside) {
      return
    }
    if(this.onMouseMove || this.hasEventListener("stagemousemove")) {
      evt = new createjs.MouseEvent("stagemousemove", o.x, o.y, this, e, id, id == this._primaryPointerID, o.rawX, o.rawY);
      this.onMouseMove && this.onMouseMove(evt);
      this.dispatchEvent(evt)
    }
    var oEvt = o.event;
    if(oEvt && (oEvt.onMouseMove || oEvt.hasEventListener("mousemove"))) {
      evt = new createjs.MouseEvent("mousemove", o.x, o.y, oEvt.target, e, id, id == this._primaryPointerID, o.rawX, o.rawY);
      oEvt.onMouseMove && oEvt.onMouseMove(evt);
      oEvt.dispatchEvent(evt, oEvt.target)
    }
  };
  p._updatePointerPosition = function(id, pageX, pageY) {
    var rect = this._getElementRect(this.canvas);
    pageX -= rect.left;
    pageY -= rect.top;
    var w = this.canvas.width;
    var h = this.canvas.height;
    pageX /= (rect.right - rect.left) / w;
    pageY /= (rect.bottom - rect.top) / h;
    var o = this._getPointerData(id);
    if(o.inBounds = pageX >= 0 && pageY >= 0 && pageX <= w - 1 && pageY <= h - 1) {
      o.x = pageX;
      o.y = pageY
    }else {
      if(this.mouseMoveOutside) {
        o.x = pageX < 0 ? 0 : pageX > w - 1 ? w - 1 : pageX;
        o.y = pageY < 0 ? 0 : pageY > h - 1 ? h - 1 : pageY
      }
    }
    o.rawX = pageX;
    o.rawY = pageY;
    if(id == this._primaryPointerID) {
      this.mouseX = o.x;
      this.mouseY = o.y;
      this.mouseInBounds = o.inBounds
    }
  };
  p._getElementRect = function(e) {
    var bounds;
    try {
      bounds = e.getBoundingClientRect()
    }catch(err) {
      bounds = {top:e.offsetTop, left:e.offsetLeft, width:e.offsetWidth, height:e.offsetHeight}
    }
    var offX = (window.pageXOffset || document.scrollLeft || 0) - (document.clientLeft || document.body.clientLeft || 0);
    var offY = (window.pageYOffset || document.scrollTop || 0) - (document.clientTop || document.body.clientTop || 0);
    var styles = window.getComputedStyle ? getComputedStyle(e) : e.currentStyle;
    var padL = parseInt(styles.paddingLeft) + parseInt(styles.borderLeftWidth);
    var padT = parseInt(styles.paddingTop) + parseInt(styles.borderTopWidth);
    var padR = parseInt(styles.paddingRight) + parseInt(styles.borderRightWidth);
    var padB = parseInt(styles.paddingBottom) + parseInt(styles.borderBottomWidth);
    return{left:bounds.left + offX + padL, right:bounds.right + offX - padR, top:bounds.top + offY + padT, bottom:bounds.bottom + offY - padB}
  };
  p._handleMouseUp = function(e) {
    this._handlePointerUp(-1, e, false)
  };
  p._handlePointerUp = function(id, e, clear) {
    var o = this._getPointerData(id);
    var evt;
    if(this.onMouseMove || this.hasEventListener("stagemouseup")) {
      evt = new createjs.MouseEvent("stagemouseup", o.x, o.y, this, e, id, id == this._primaryPointerID, o.rawX, o.rawY);
      this.onMouseUp && this.onMouseUp(evt);
      this.dispatchEvent(evt)
    }
    var oEvt = o.event;
    if(oEvt && (oEvt.onMouseUp || oEvt.hasEventListener("mouseup"))) {
      evt = new createjs.MouseEvent("mouseup", o.x, o.y, oEvt.target, e, id, id == this._primaryPointerID, o.rawX, o.rawY);
      oEvt.onMouseUp && oEvt.onMouseUp(evt);
      oEvt.dispatchEvent(evt, oEvt.target)
    }
    var oTarget = o.target;
    if(oTarget && (oTarget.onClick || oTarget.hasEventListener("click")) && this._getObjectsUnderPoint(o.x, o.y, null, true, this._mouseOverIntervalID ? 3 : 1) == oTarget) {
      evt = new createjs.MouseEvent("click", o.x, o.y, oTarget, e, id, id == this._primaryPointerID, o.rawX, o.rawY);
      oTarget.onClick && oTarget.onClick(evt);
      oTarget.dispatchEvent(evt)
    }
    if(clear) {
      if(id == this._primaryPointerID) {
        this._primaryPointerID = null
      }
      delete this._pointerData[id]
    }else {
      o.event = o.target = null
    }
  };
  p._handleMouseDown = function(e) {
    this._handlePointerDown(-1, e, false)
  };
  p._handlePointerDown = function(id, e, x, y) {
    var o = this._getPointerData(id);
    if(y != null) {
      this._updatePointerPosition(id, x, y)
    }
    if(this.onMouseDown || this.hasEventListener("stagemousedown")) {
      var evt = new createjs.MouseEvent("stagemousedown", o.x, o.y, this, e, id, id == this._primaryPointerID, o.rawX, o.rawY);
      this.onMouseDown && this.onMouseDown(evt);
      this.dispatchEvent(evt)
    }
    var target = this._getObjectsUnderPoint(o.x, o.y, null, this._mouseOverIntervalID ? 3 : 1);
    if(target) {
      o.target = target;
      if(target.onPress || target.hasEventListener("mousedown")) {
        evt = new createjs.MouseEvent("mousedown", o.x, o.y, target, e, id, id == this._primaryPointerID, o.rawX, o.rawY);
        target.onPress && target.onPress(evt);
        target.dispatchEvent(evt);
        if(evt.onMouseMove || evt.onMouseUp || evt.hasEventListener("mousemove") || evt.hasEventListener("mouseup")) {
          o.event = evt
        }
      }
    }
  };
  p._testMouseOver = function() {
    if(this._primaryPointerID != -1) {
      return
    }
    if(this.mouseX == this._mouseOverX && this.mouseY == this._mouseOverY && this.mouseInBounds) {
      return
    }
    var target = null;
    if(this.mouseInBounds) {
      target = this._getObjectsUnderPoint(this.mouseX, this.mouseY, null, 3);
      this._mouseOverX = this.mouseX;
      this._mouseOverY = this.mouseY
    }
    var mouseOverTarget = this._mouseOverTarget;
    if(mouseOverTarget != target) {
      var o = this._getPointerData(-1);
      if(mouseOverTarget && (mouseOverTarget.onMouseOut || mouseOverTarget.hasEventListener("mouseout"))) {
        var evt = new createjs.MouseEvent("mouseout", o.x, o.y, mouseOverTarget, null, -1, o.rawX, o.rawY);
        mouseOverTarget.onMouseOut && mouseOverTarget.onMouseOut(evt);
        mouseOverTarget.dispatchEvent(evt)
      }
      if(mouseOverTarget) {
        this.canvas.style.cursor = ""
      }
      if(target && (target.onMouseOver || target.hasEventListener("mouseover"))) {
        evt = new createjs.MouseEvent("mouseover", o.x, o.y, target, null, -1, o.rawX, o.rawY);
        target.onMouseOver && target.onMouseOver(evt);
        target.dispatchEvent(evt)
      }
      if(target) {
        this.canvas.style.cursor = target.cursor || ""
      }
      this._mouseOverTarget = target
    }
  };
  p._handleDoubleClick = function(e) {
    var o = this._getPointerData(-1);
    var target = this._getObjectsUnderPoint(o.x, o.y, null, this._mouseOverIntervalID ? 3 : 1);
    if(target && (target.onDoubleClick || target.hasEventListener("dblclick"))) {
      evt = new createjs.MouseEvent("dblclick", o.x, o.y, target, e, -1, true, o.rawX, o.rawY);
      target.onDoubleClick && target.onDoubleClick(evt);
      target.dispatchEvent(evt)
    }
  };
  createjs.Stage = Stage
})();
this.createjs = this.createjs || {};
(function() {
  var Bitmap = function(imageOrUri) {
    this.initialize(imageOrUri)
  };
  var p = Bitmap.prototype = new createjs.DisplayObject;
  p.image = null;
  p.snapToPixel = true;
  p.sourceRect = null;
  p.DisplayObject_initialize = p.initialize;
  p.initialize = function(imageOrUri) {
    this.DisplayObject_initialize();
    if(typeof imageOrUri == "string") {
      this.image = new Image;
      this.image.src = imageOrUri
    }else {
      this.image = imageOrUri
    }
  };
  p.isVisible = function() {
    var hasContent = this.cacheCanvas || this.image && (this.image.complete || this.image.getContext || this.image.readyState >= 2);
    return!!(this.visible && this.alpha > 0 && this.scaleX != 0 && this.scaleY != 0 && hasContent)
  };
  p.DisplayObject_draw = p.draw;
  p.draw = function(ctx, ignoreCache) {
    if(this.DisplayObject_draw(ctx, ignoreCache)) {
      return true
    }
    var rect = this.sourceRect;
    if(rect) {
      ctx.drawImage(this.image, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height)
    }else {
      ctx.drawImage(this.image, 0, 0)
    }
    return true
  };
  p.clone = function() {
    var o = new Bitmap(this.image);
    if(this.sourceRect) {
      o.sourceRect = this.sourceRect.clone()
    }
    this.cloneProps(o);
    return o
  };
  p.toString = function() {
    return"[Bitmap (name=" + this.name + ")]"
  };
  createjs.Bitmap = Bitmap
})();
this.createjs = this.createjs || {};
(function() {
  var BitmapAnimation = function(spriteSheet) {
    this.initialize(spriteSheet)
  };
  var p = BitmapAnimation.prototype = new createjs.DisplayObject;
  p.onAnimationEnd = null;
  p.currentFrame = -1;
  p.currentAnimation = null;
  p.paused = true;
  p.spriteSheet = null;
  p.snapToPixel = true;
  p.offset = 0;
  p.currentAnimationFrame = 0;
  p.addEventListener = null;
  p.removeEventListener = null;
  p.removeAllEventListeners = null;
  p.dispatchEvent = null;
  p.hasEventListener = null;
  p._listeners = null;
  createjs.EventDispatcher.initialize(p);
  p._advanceCount = 0;
  p._animation = null;
  p.DisplayObject_initialize = p.initialize;
  p.initialize = function(spriteSheet) {
    this.DisplayObject_initialize();
    this.spriteSheet = spriteSheet
  };
  p.isVisible = function() {
    var hasContent = this.cacheCanvas || this.spriteSheet.complete && this.currentFrame >= 0;
    return!!(this.visible && this.alpha > 0 && this.scaleX != 0 && this.scaleY != 0 && hasContent)
  };
  p.DisplayObject_draw = p.draw;
  p.draw = function(ctx, ignoreCache) {
    if(this.DisplayObject_draw(ctx, ignoreCache)) {
      return true
    }
    this._normalizeFrame();
    var o = this.spriteSheet.getFrame(this.currentFrame);
    if(!o) {
      return
    }
    var rect = o.rect;
    ctx.drawImage(o.image, rect.x, rect.y, rect.width, rect.height, -o.regX, -o.regY, rect.width, rect.height);
    return true
  };
  p.play = function() {
    this.paused = false
  };
  p.stop = function() {
    this.paused = true
  };
  p.gotoAndPlay = function(frameOrAnimation) {
    this.paused = false;
    this._goto(frameOrAnimation)
  };
  p.gotoAndStop = function(frameOrAnimation) {
    this.paused = true;
    this._goto(frameOrAnimation)
  };
  p.advance = function() {
    if(this._animation) {
      this.currentAnimationFrame++
    }else {
      this.currentFrame++
    }
    this._normalizeFrame()
  };
  p.getBounds = function() {
    return this.spriteSheet.getFrameBounds(this.currentFrame)
  };
  p.clone = function() {
    var o = new BitmapAnimation(this.spriteSheet);
    this.cloneProps(o);
    return o
  };
  p.toString = function() {
    return"[BitmapAnimation (name=" + this.name + ")]"
  };
  p.DisplayObject__tick = p._tick;
  p._tick = function(params) {
    var f = this._animation ? this._animation.frequency : 1;
    if(!this.paused && (++this._advanceCount + this.offset) % f == 0) {
      this.advance()
    }
    this.DisplayObject__tick(params)
  };
  p._normalizeFrame = function() {
    var animation = this._animation;
    var frame = this.currentFrame;
    var paused = this.paused;
    var l;
    if(animation) {
      l = animation.frames.length;
      if(this.currentAnimationFrame >= l) {
        var next = animation.next;
        if(this._dispatchAnimationEnd(animation, frame, paused, next, l - 1)) {
        }else {
          if(next) {
            this._goto(next)
          }else {
            this.paused = true;
            this.currentAnimationFrame = animation.frames.length - 1;
            this.currentFrame = animation.frames[this.currentAnimationFrame]
          }
        }
      }else {
        this.currentFrame = animation.frames[this.currentAnimationFrame]
      }
    }else {
      l = this.spriteSheet.getNumFrames();
      if(frame >= l) {
        if(!this._dispatchAnimationEnd(animation, frame, paused, l - 1)) {
          this.currentFrame = 0
        }
      }
    }
  };
  p._dispatchAnimationEnd = function(animation, frame, paused, next, end) {
    var name = animation ? animation.name : null;
    this.onAnimationEnd && this.onAnimationEnd(this, name, next);
    this.dispatchEvent({type:"animationend", name:name, next:next});
    if(!paused && this.paused) {
      this.currentAnimationFrame = end
    }
    return this.paused != paused || this._animation != animation || this.currentFrame != frame
  };
  p.DisplayObject_cloneProps = p.cloneProps;
  p.cloneProps = function(o) {
    this.DisplayObject_cloneProps(o);
    o.onAnimationEnd = this.onAnimationEnd;
    o.currentFrame = this.currentFrame;
    o.currentAnimation = this.currentAnimation;
    o.paused = this.paused;
    o.offset = this.offset;
    o._animation = this._animation;
    o.currentAnimationFrame = this.currentAnimationFrame
  };
  p._goto = function(frameOrAnimation) {
    if(isNaN(frameOrAnimation)) {
      var data = this.spriteSheet.getAnimation(frameOrAnimation);
      if(data) {
        this.currentAnimationFrame = 0;
        this._animation = data;
        this.currentAnimation = frameOrAnimation;
        this._normalizeFrame()
      }
    }else {
      this.currentAnimation = this._animation = null;
      this.currentFrame = frameOrAnimation
    }
  };
  createjs.BitmapAnimation = BitmapAnimation
})();
this.createjs = this.createjs || {};
(function() {
  var Shape = function(graphics) {
    this.initialize(graphics)
  };
  var p = Shape.prototype = new createjs.DisplayObject;
  p.graphics = null;
  p.DisplayObject_initialize = p.initialize;
  p.initialize = function(graphics) {
    this.DisplayObject_initialize();
    this.graphics = graphics ? graphics : new createjs.Graphics
  };
  p.isVisible = function() {
    var hasContent = this.cacheCanvas || this.graphics && !this.graphics.isEmpty();
    return!!(this.visible && this.alpha > 0 && this.scaleX != 0 && this.scaleY != 0 && hasContent)
  };
  p.DisplayObject_draw = p.draw;
  p.draw = function(ctx, ignoreCache) {
    if(this.DisplayObject_draw(ctx, ignoreCache)) {
      return true
    }
    this.graphics.draw(ctx);
    return true
  };
  p.clone = function(recursive) {
    var o = new Shape(recursive && this.graphics ? this.graphics.clone() : this.graphics);
    this.cloneProps(o);
    return o
  };
  p.toString = function() {
    return"[Shape (name=" + this.name + ")]"
  };
  createjs.Shape = Shape
})();
this.createjs = this.createjs || {};
(function() {
  var Text = function(text, font, color) {
    this.initialize(text, font, color)
  };
  var p = Text.prototype = new createjs.DisplayObject;
  Text._workingContext = (createjs.createCanvas ? createjs.createCanvas() : document.createElement("canvas")).getContext("2d");
  p.text = "";
  p.font = null;
  p.color = "#000";
  p.textAlign = "left";
  p.textBaseline = "top";
  p.maxWidth = null;
  p.outline = false;
  p.lineHeight = 0;
  p.lineWidth = null;
  p.DisplayObject_initialize = p.initialize;
  p.initialize = function(text, font, color) {
    this.DisplayObject_initialize();
    this.text = text;
    this.font = font;
    this.color = color ? color : "#000"
  };
  p.isVisible = function() {
    var hasContent = this.cacheCanvas || this.text != null && this.text !== "";
    return!!(this.visible && this.alpha > 0 && this.scaleX != 0 && this.scaleY != 0 && hasContent)
  };
  p.DisplayObject_draw = p.draw;
  p.draw = function(ctx, ignoreCache) {
    if(this.DisplayObject_draw(ctx, ignoreCache)) {
      return true
    }
    if(this.outline) {
      ctx.strokeStyle = this.color
    }else {
      ctx.fillStyle = this.color
    }
    ctx.font = this.font;
    ctx.textAlign = this.textAlign || "start";
    ctx.textBaseline = this.textBaseline || "alphabetic";
    this._drawText(ctx);
    return true
  };
  p.getMeasuredWidth = function() {
    return this._getWorkingContext().measureText(this.text).width
  };
  p.getMeasuredLineHeight = function() {
    return this._getWorkingContext().measureText("M").width * 1.2
  };
  p.getMeasuredHeight = function() {
    return this._drawText() * (this.lineHeight || this.getMeasuredLineHeight())
  };
  p.clone = function() {
    var o = new Text(this.text, this.font, this.color);
    this.cloneProps(o);
    return o
  };
  p.toString = function() {
    return"[Text (text=" + (this.text.length > 20 ? this.text.substr(0, 17) + "..." : this.text) + ")]"
  };
  p.DisplayObject_cloneProps = p.cloneProps;
  p.cloneProps = function(o) {
    this.DisplayObject_cloneProps(o);
    o.textAlign = this.textAlign;
    o.textBaseline = this.textBaseline;
    o.maxWidth = this.maxWidth;
    o.outline = this.outline;
    o.lineHeight = this.lineHeight;
    o.lineWidth = this.lineWidth
  };
  p._getWorkingContext = function() {
    var ctx = Text._workingContext;
    ctx.font = this.font;
    ctx.textAlign = this.textAlign || "start";
    ctx.textBaseline = this.textBaseline || "alphabetic";
    return ctx
  };
  p._drawText = function(ctx) {
    var paint = !!ctx;
    if(!paint) {
      ctx = this._getWorkingContext()
    }
    var lines = String(this.text).split(/(?:\r\n|\r|\n)/);
    var lineHeight = this.lineHeight || this.getMeasuredLineHeight();
    var count = 0;
    for(var i = 0, l = lines.length;i < l;i++) {
      var w = ctx.measureText(lines[i]).width;
      if(this.lineWidth == null || w < this.lineWidth) {
        if(paint) {
          this._drawTextLine(ctx, lines[i], count * lineHeight)
        }
        count++;
        continue
      }
      var words = lines[i].split(/(\s)/);
      var str = words[0];
      for(var j = 1, jl = words.length;j < jl;j += 2) {
        if(ctx.measureText(str + words[j] + words[j + 1]).width > this.lineWidth) {
          if(paint) {
            this._drawTextLine(ctx, str, count * lineHeight)
          }
          count++;
          str = words[j + 1]
        }else {
          str += words[j] + words[j + 1]
        }
      }
      if(paint) {
        this._drawTextLine(ctx, str, count * lineHeight)
      }
      count++
    }
    return count
  };
  p._drawTextLine = function(ctx, text, y) {
    if(this.outline) {
      ctx.strokeText(text, 0, y, this.maxWidth || 65535)
    }else {
      ctx.fillText(text, 0, y, this.maxWidth || 65535)
    }
  };
  createjs.Text = Text
})();
this.createjs = this.createjs || {};
(function() {
  var SpriteSheetUtils = function() {
    throw"SpriteSheetUtils cannot be instantiated";
  };
  SpriteSheetUtils._workingCanvas = createjs.createCanvas ? createjs.createCanvas() : document.createElement("canvas");
  SpriteSheetUtils._workingContext = SpriteSheetUtils._workingCanvas.getContext("2d");
  SpriteSheetUtils.addFlippedFrames = function(spriteSheet, horizontal, vertical, both) {
    if(!horizontal && !vertical && !both) {
      return
    }
    var count = 0;
    if(horizontal) {
      SpriteSheetUtils._flip(spriteSheet, ++count, true, false)
    }
    if(vertical) {
      SpriteSheetUtils._flip(spriteSheet, ++count, false, true)
    }
    if(both) {
      SpriteSheetUtils._flip(spriteSheet, ++count, true, true)
    }
  };
  SpriteSheetUtils.extractFrame = function(spriteSheet, frame) {
    if(isNaN(frame)) {
      frame = spriteSheet.getAnimation(frame).frames[0]
    }
    var data = spriteSheet.getFrame(frame);
    if(!data) {
      return null
    }
    var r = data.rect;
    var canvas = SpriteSheetUtils._workingCanvas;
    canvas.width = r.width;
    canvas.height = r.height;
    SpriteSheetUtils._workingContext.drawImage(data.image, r.x, r.y, r.width, r.height, 0, 0, r.width, r.height);
    var img = new Image;
    img.src = canvas.toDataURL("image/png");
    return img
  };
  SpriteSheetUtils.mergeAlpha = function(rgbImage, alphaImage, canvas) {
    if(!canvas) {
      canvas = createjs.createCanvas ? createjs.createCanvas() : document.createElement("canvas")
    }
    canvas.width = Math.max(alphaImage.width, rgbImage.width);
    canvas.height = Math.max(alphaImage.height, rgbImage.height);
    var ctx = canvas.getContext("2d");
    ctx.save();
    ctx.drawImage(rgbImage, 0, 0);
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(alphaImage, 0, 0);
    ctx.restore();
    return canvas
  };
  SpriteSheetUtils._flip = function(spriteSheet, count, h, v) {
    var imgs = spriteSheet._images;
    var canvas = SpriteSheetUtils._workingCanvas;
    var ctx = SpriteSheetUtils._workingContext;
    var il = imgs.length / count;
    for(var i = 0;i < il;i++) {
      var src = imgs[i];
      src.__tmp = i;
      canvas.width = 0;
      canvas.width = src.width;
      canvas.height = src.height;
      ctx.setTransform(h ? -1 : 1, 0, 0, v ? -1 : 1, h ? src.width : 0, v ? src.height : 0);
      ctx.drawImage(src, 0, 0);
      var img = new Image;
      img.src = canvas.toDataURL("image/png");
      img.width = src.width;
      img.height = src.height;
      imgs.push(img)
    }
    var frames = spriteSheet._frames;
    var fl = frames.length / count;
    for(i = 0;i < fl;i++) {
      src = frames[i];
      var rect = src.rect.clone();
      img = imgs[src.image.__tmp + il * count];
      var frame = {image:img, rect:rect, regX:src.regX, regY:src.regY};
      if(h) {
        rect.x = img.width - rect.x - rect.width;
        frame.regX = rect.width - src.regX
      }
      if(v) {
        rect.y = img.height - rect.y - rect.height;
        frame.regY = rect.height - src.regY
      }
      frames.push(frame)
    }
    var sfx = "_" + (h ? "h" : "") + (v ? "v" : "");
    var names = spriteSheet._animations;
    var data = spriteSheet._data;
    var al = names.length / count;
    for(i = 0;i < al;i++) {
      var name = names[i];
      src = data[name];
      var anim = {name:name + sfx, frequency:src.frequency, next:src.next, frames:[]};
      if(src.next) {
        anim.next += sfx
      }
      frames = src.frames;
      for(var j = 0, l = frames.length;j < l;j++) {
        anim.frames.push(frames[j] + fl * count)
      }
      data[anim.name] = anim;
      names.push(anim.name)
    }
  };
  createjs.SpriteSheetUtils = SpriteSheetUtils
})();
this.createjs = this.createjs || {};
(function() {
  var SpriteSheetBuilder = function() {
    this.initialize()
  };
  var p = SpriteSheetBuilder.prototype;
  SpriteSheetBuilder.ERR_DIMENSIONS = "frame dimensions exceed max spritesheet dimensions";
  SpriteSheetBuilder.ERR_RUNNING = "a build is already running";
  p.maxWidth = 2048;
  p.maxHeight = 2048;
  p.spriteSheet = null;
  p.scale = 1;
  p.padding = 1;
  p.timeSlice = 0.3;
  p.progress = -1;
  p.onComplete = null;
  p.onProgress = null;
  p.addEventListener = null;
  p.removeEventListener = null;
  p.removeAllEventListeners = null;
  p.dispatchEvent = null;
  p.hasEventListener = null;
  p._listeners = null;
  createjs.EventDispatcher.initialize(p);
  p._frames = null;
  p._animations = null;
  p._data = null;
  p._nextFrameIndex = 0;
  p._index = 0;
  p._timerID = null;
  p._scale = 1;
  p.initialize = function() {
    this._frames = [];
    this._animations = {}
  };
  p.addFrame = function(source, sourceRect, scale, setupFunction, setupParams, setupScope) {
    if(this._data) {
      throw SpriteSheetBuilder.ERR_RUNNING;
    }
    var rect = sourceRect || source.bounds || source.nominalBounds;
    if(!rect && source.getBounds) {
      rect = source.getBounds()
    }
    if(!rect) {
      return null
    }
    scale = scale || 1;
    return this._frames.push({source:source, sourceRect:rect, scale:scale, funct:setupFunction, params:setupParams, scope:setupScope, index:this._frames.length, height:rect.height * scale}) - 1
  };
  p.addAnimation = function(name, frames, next, frequency) {
    if(this._data) {
      throw SpriteSheetBuilder.ERR_RUNNING;
    }
    this._animations[name] = {frames:frames, next:next, frequency:frequency}
  };
  p.addMovieClip = function(source, sourceRect, scale) {
    if(this._data) {
      throw SpriteSheetBuilder.ERR_RUNNING;
    }
    var rects = source.frameBounds;
    var rect = sourceRect || source.bounds || source.nominalBounds;
    if(!rect && source.getBounds) {
      rect = source.getBounds()
    }
    if(!rect && !rects) {
      return null
    }
    var baseFrameIndex = this._frames.length;
    var duration = source.timeline.duration;
    for(var i = 0;i < duration;i++) {
      var r = rects && rects[i] ? rects[i] : rect;
      this.addFrame(source, r, scale, function(frame) {
        var ae = this.actionsEnabled;
        this.actionsEnabled = false;
        this.gotoAndStop(frame);
        this.actionsEnabled = ae
      }, [i], source)
    }
    var labels = source.timeline._labels;
    var lbls = [];
    for(var n in labels) {
      lbls.push({index:labels[n], label:n})
    }
    if(lbls.length) {
      lbls.sort(function(a, b) {
        return a.index - b.index
      });
      for(var i = 0, l = lbls.length;i < l;i++) {
        var label = lbls[i].label;
        var start = baseFrameIndex + lbls[i].index;
        var end = baseFrameIndex + (i == l - 1 ? duration : lbls[i + 1].index);
        var frames = [];
        for(var j = start;j < end;j++) {
          frames.push(j)
        }
        this.addAnimation(label, frames, true)
      }
    }
  };
  p.build = function() {
    if(this._data) {
      throw SpriteSheetBuilder.ERR_RUNNING;
    }
    this._startBuild();
    while(this._drawNext()) {
    }
    this._endBuild();
    return this.spriteSheet
  };
  p.buildAsync = function(timeSlice) {
    if(this._data) {
      throw SpriteSheetBuilder.ERR_RUNNING;
    }
    this.timeSlice = timeSlice;
    this._startBuild();
    var _this = this;
    this._timerID = setTimeout(function() {
      _this._run()
    }, 50 - Math.max(0.01, Math.min(0.99, this.timeSlice || 0.3)) * 50)
  };
  p.stopAsync = function() {
    clearTimeout(this._timerID);
    this._data = null
  };
  p.clone = function() {
    throw"SpriteSheetBuilder cannot be cloned.";
  };
  p.toString = function() {
    return"[SpriteSheetBuilder]"
  };
  p._startBuild = function() {
    var pad = this.padding || 0;
    this.progress = 0;
    this.spriteSheet = null;
    this._index = 0;
    this._scale = this.scale;
    var dataFrames = [];
    this._data = {images:[], frames:dataFrames, animations:this._animations};
    var frames = this._frames.slice();
    frames.sort(function(a, b) {
      return a.height <= b.height ? -1 : 1
    });
    if(frames[frames.length - 1].height + pad * 2 > this.maxHeight) {
      throw SpriteSheetBuilder.ERR_DIMENSIONS;
    }
    var y = 0, x = 0;
    var img = 0;
    while(frames.length) {
      var o = this._fillRow(frames, y, img, dataFrames, pad);
      if(o.w > x) {
        x = o.w
      }
      y += o.h;
      if(!o.h || !frames.length) {
        var canvas = createjs.createCanvas ? createjs.createCanvas() : document.createElement("canvas");
        canvas.width = this._getSize(x, this.maxWidth);
        canvas.height = this._getSize(y, this.maxHeight);
        this._data.images[img] = canvas;
        if(!o.h) {
          x = y = 0;
          img++
        }
      }
    }
  };
  p._getSize = function(size, max) {
    var pow = 4;
    while(Math.pow(2, ++pow) < size) {
    }
    return Math.min(max, Math.pow(2, pow))
  };
  p._fillRow = function(frames, y, img, dataFrames, pad) {
    var w = this.maxWidth;
    var maxH = this.maxHeight;
    y += pad;
    var h = maxH - y;
    var x = pad;
    var height = 0;
    for(var i = frames.length - 1;i >= 0;i--) {
      var frame = frames[i];
      var sc = this._scale * frame.scale;
      var rect = frame.sourceRect;
      var source = frame.source;
      var rx = Math.floor(sc * rect.x - pad);
      var ry = Math.floor(sc * rect.y - pad);
      var rh = Math.ceil(sc * rect.height + pad * 2);
      var rw = Math.ceil(sc * rect.width + pad * 2);
      if(rw > w) {
        throw SpriteSheetBuilder.ERR_DIMENSIONS;
      }
      if(rh > h || x + rw > w) {
        continue
      }
      frame.img = img;
      frame.rect = new createjs.Rectangle(x, y, rw, rh);
      height = height || rh;
      frames.splice(i, 1);
      dataFrames[frame.index] = [x, y, rw, rh, img, Math.round(-rx + sc * source.regX - pad), Math.round(-ry + sc * source.regY - pad)];
      x += rw
    }
    return{w:x, h:height}
  };
  p._endBuild = function() {
    this.spriteSheet = new createjs.SpriteSheet(this._data);
    this._data = null;
    this.progress = 1;
    this.onComplete && this.onComplete(this);
    this.dispatchEvent("complete")
  };
  p._run = function() {
    var ts = Math.max(0.01, Math.min(0.99, this.timeSlice || 0.3)) * 50;
    var t = (new Date).getTime() + ts;
    var complete = false;
    while(t > (new Date).getTime()) {
      if(!this._drawNext()) {
        complete = true;
        break
      }
    }
    if(complete) {
      this._endBuild()
    }else {
      var _this = this;
      this._timerID = setTimeout(function() {
        _this._run()
      }, 50 - ts)
    }
    var p = this.progress = this._index / this._frames.length;
    this.onProgress && this.onProgress(this, p);
    this.dispatchEvent({type:"progress", progress:p})
  };
  p._drawNext = function() {
    var frame = this._frames[this._index];
    var sc = frame.scale * this._scale;
    var rect = frame.rect;
    var sourceRect = frame.sourceRect;
    var canvas = this._data.images[frame.img];
    var ctx = canvas.getContext("2d");
    frame.funct && frame.funct.apply(frame.scope, frame.params);
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.width, rect.height);
    ctx.clip();
    ctx.translate(Math.ceil(rect.x - sourceRect.x * sc), Math.ceil(rect.y - sourceRect.y * sc));
    ctx.scale(sc, sc);
    frame.source.draw(ctx);
    ctx.restore();
    return++this._index < this._frames.length
  };
  createjs.SpriteSheetBuilder = SpriteSheetBuilder
})();
this.createjs = this.createjs || {};
(function() {
  var DOMElement = function(htmlElement) {
    this.initialize(htmlElement)
  };
  var p = DOMElement.prototype = new createjs.DisplayObject;
  p.htmlElement = null;
  p._oldMtx = null;
  p.DisplayObject_initialize = p.initialize;
  p.initialize = function(htmlElement) {
    if(typeof htmlElement == "string") {
      htmlElement = document.getElementById(htmlElement)
    }
    this.DisplayObject_initialize();
    this.mouseEnabled = false;
    this.htmlElement = htmlElement;
    var style = htmlElement.style;
    style.position = "absolute";
    style.transformOrigin = style.WebkitTransformOrigin = style.msTransformOrigin = style.MozTransformOrigin = style.OTransformOrigin = "0% 0%"
  };
  p.isVisible = function() {
    return this.htmlElement != null
  };
  p.draw = function(ctx, ignoreCache) {
    if(this.htmlElement == null) {
      return
    }
    var mtx = this.getConcatenatedMatrix(this._matrix);
    var o = this.htmlElement;
    var style = o.style;
    if(this.visible) {
      style.visibility = "visible"
    }else {
      return true
    }
    var oMtx = this._oldMtx || {};
    if(oMtx.alpha != mtx.alpha) {
      style.opacity = "" + mtx.alpha;
      oMtx.alpha = mtx.alpha
    }
    if(oMtx.tx != mtx.tx || oMtx.ty != mtx.ty || oMtx.a != mtx.a || oMtx.b != mtx.b || oMtx.c != mtx.c || oMtx.d != mtx.d) {
      style.transform = style.WebkitTransform = style.OTransform = style.msTransform = ["matrix(" + mtx.a, mtx.b, mtx.c, mtx.d, mtx.tx + 0.5 | 0, (mtx.ty + 0.5 | 0) + ")"].join(",");
      style.MozTransform = ["matrix(" + mtx.a, mtx.b, mtx.c, mtx.d, (mtx.tx + 0.5 | 0) + "px", (mtx.ty + 0.5 | 0) + "px)"].join(",");
      this._oldMtx = mtx.clone()
    }
    return true
  };
  p.cache = function() {
  };
  p.uncache = function() {
  };
  p.updateCache = function() {
  };
  p.hitTest = function() {
  };
  p.localToGlobal = function() {
  };
  p.globalToLocal = function() {
  };
  p.localToLocal = function() {
  };
  p.clone = function() {
    throw"DOMElement cannot be cloned.";
  };
  p.toString = function() {
    return"[DOMElement (name=" + this.name + ")]"
  };
  p.DisplayObject__tick = p._tick;
  p._tick = function(params) {
    this.htmlElement.style.visibility = "hidden";
    this.DisplayObject__tick(params)
  };
  createjs.DOMElement = DOMElement
})();
this.createjs = this.createjs || {};
(function() {
  var Filter = function() {
    this.initialize()
  };
  var p = Filter.prototype;
  p.initialize = function() {
  };
  p.getBounds = function() {
    return new createjs.Rectangle(0, 0, 0, 0)
  };
  p.applyFilter = function(ctx, x, y, width, height, targetCtx, targetX, targetY) {
  };
  p.toString = function() {
    return"[Filter]"
  };
  p.clone = function() {
    return new Filter
  };
  createjs.Filter = Filter
})();
this.createjs = this.createjs || {};
(function() {
  var Touch = function() {
    throw"Touch cannot be instantiated";
  };
  Touch.isSupported = function() {
    return"ontouchstart" in window || window.navigator["msPointerEnabled"]
  };
  Touch.enable = function(stage, singleTouch, allowDefault) {
    if(!stage || !stage.canvas || !Touch.isSupported()) {
      return false
    }
    stage.__touch = {pointers:{}, multitouch:!singleTouch, preventDefault:!allowDefault, count:0};
    if("ontouchstart" in window) {
      Touch._IOS_enable(stage)
    }else {
      if(window.navigator["msPointerEnabled"]) {
        Touch._IE_enable(stage)
      }
    }
    return true
  };
  Touch.disable = function(stage) {
    if(!stage) {
      return
    }
    if("ontouchstart" in window) {
      Touch._IOS_disable(stage)
    }else {
      if(window.navigator["msPointerEnabled"]) {
        Touch._IE_disable(stage)
      }
    }
  };
  Touch._IOS_enable = function(stage) {
    var canvas = stage.canvas;
    var f = stage.__touch.f = function(e) {
      Touch._IOS_handleEvent(stage, e)
    };
    canvas.addEventListener("touchstart", f, false);
    canvas.addEventListener("touchmove", f, false);
    canvas.addEventListener("touchend", f, false);
    canvas.addEventListener("touchcancel", f, false)
  };
  Touch._IOS_disable = function(stage) {
    var canvas = stage.canvas;
    if(!canvas) {
      return
    }
    var f = stage.__touch.f;
    canvas.removeEventListener("touchstart", f, false);
    canvas.removeEventListener("touchmove", f, false);
    canvas.removeEventListener("touchend", f, false);
    canvas.removeEventListener("touchcancel", f, false)
  };
  Touch._IOS_handleEvent = function(stage, e) {
    if(!stage) {
      return
    }
    if(stage.__touch.preventDefault) {
      e.preventDefault && e.preventDefault()
    }
    var touches = e.changedTouches;
    var type = e.type;
    for(var i = 0, l = touches.length;i < l;i++) {
      var touch = touches[i];
      var id = touch.identifier;
      if(touch.target != stage.canvas) {
        continue
      }
      if(type == "touchstart") {
        this._handleStart(stage, id, e, touch.pageX, touch.pageY)
      }else {
        if(type == "touchmove") {
          this._handleMove(stage, id, e, touch.pageX, touch.pageY)
        }else {
          if(type == "touchend" || type == "touchcancel") {
            this._handleEnd(stage, id, e)
          }
        }
      }
    }
  };
  Touch._IE_enable = function(stage) {
    var canvas = stage.canvas;
    var f = stage.__touch.f = function(e) {
      Touch._IE_handleEvent(stage, e)
    };
    canvas.addEventListener("MSPointerDown", f, false);
    window.addEventListener("MSPointerMove", f, false);
    window.addEventListener("MSPointerUp", f, false);
    window.addEventListener("MSPointerCancel", f, false);
    if(stage.__touch.preventDefault) {
      canvas.style.msTouchAction = "none"
    }
    stage.__touch.activeIDs = {}
  };
  Touch._IE_disable = function(stage) {
    var f = stage.__touch.f;
    window.removeEventListener("MSPointerMove", f, false);
    window.removeEventListener("MSPointerUp", f, false);
    window.removeEventListener("MSPointerCancel", f, false);
    if(stage.canvas) {
      stage.canvas.removeEventListener("MSPointerDown", f, false)
    }
  };
  Touch._IE_handleEvent = function(stage, e) {
    if(!stage) {
      return
    }
    if(stage.__touch.preventDefault) {
      e.preventDefault && e.preventDefault()
    }
    var type = e.type;
    var id = e.pointerId;
    var ids = stage.__touch.activeIDs;
    if(type == "MSPointerDown") {
      if(e.srcElement != stage.canvas) {
        return
      }
      ids[id] = true;
      this._handleStart(stage, id, e, e.pageX, e.pageY)
    }else {
      if(ids[id]) {
        if(type == "MSPointerMove") {
          this._handleMove(stage, id, e, e.pageX, e.pageY)
        }else {
          if(type == "MSPointerUp" || type == "MSPointerCancel") {
            delete ids[id];
            this._handleEnd(stage, id, e)
          }
        }
      }
    }
  };
  Touch._handleStart = function(stage, id, e, x, y) {
    var props = stage.__touch;
    if(!props.multitouch && props.count) {
      return
    }
    var ids = props.pointers;
    if(ids[id]) {
      return
    }
    ids[id] = true;
    props.count++;
    stage._handlePointerDown(id, e, x, y)
  };
  Touch._handleMove = function(stage, id, e, x, y) {
    if(!stage.__touch.pointers[id]) {
      return
    }
    stage._handlePointerMove(id, e, x, y)
  };
  Touch._handleEnd = function(stage, id, e) {
    var props = stage.__touch;
    var ids = props.pointers;
    if(!ids[id]) {
      return
    }
    props.count--;
    stage._handlePointerUp(id, e, true);
    delete ids[id]
  };
  createjs.Touch = Touch
})();
(function() {
  var o = this.createjs = this.createjs || {};
  o = o.EaselJS = o.EaselJS || {};
  o.version = "NEXT";
  o.buildDate = "Tue, 02 Apr 2013 20:18:53 GMT"
})();

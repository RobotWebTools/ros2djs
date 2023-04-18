import * as createjs from 'createjs';
import * as ROSLIB from 'roslib';

// convert the given global Stage coordinates to ROS coordinates
createjs.Stage.prototype.globalToRos = function(x, y) {
  var rosX = (x - this.x) / this.scaleX;
  var rosY = (this.y - y) / this.scaleY;
  return new ROSLIB.Vector3({
    x : rosX,
    y : rosY
  });
};

// convert the given ROS coordinates to global Stage coordinates
createjs.Stage.prototype.rosToGlobal = function(pos) {
  var x = pos.x * this.scaleX + this.x;
  var y = pos.y * this.scaleY + this.y;
  return {
    x : x,
    y : y
  };
};

// convert a ROS quaternion to theta in degrees
createjs.Stage.prototype.rosQuaternionToGlobalTheta = function(orientation) {
  // See https://en.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles#Rotation_matrices
  // here we use [x y z] = R * [1 0 0]
  var q0 = orientation.w;
  var q1 = orientation.x;
  var q2 = orientation.y;
  var q3 = orientation.z;
  // Canvas rotation is clock wise and in degrees
  return -Math.atan2(2 * (q0 * q3 + q1 * q2), 1 - 2 * (q2 * q2 + q3 * q3)) * 180.0 / Math.PI;
};

/**
 * @fileOverview
 * @author Russell Toris - rctoris@wpi.edu
 */

var ImageMap = /*@__PURE__*/(function (superclass) {
  function ImageMap(options) {
    options = options || {};
    var message = options.message;
    var image = options.image;

    // create the bitmap
    superclass.call(this, image);

    // save the metadata we need
    this.pose = new ROSLIB.Pose({
      position : message.origin.position,
      orientation : message.origin.orientation
    });

    // set the size
    this.width = message.width;
    this.height = message.height;

    // change Y direction
    this.y = -this.height * message.resolution;

    // scale the image
    this.scaleX = message.resolution;
    this.scaleY = message.resolution;
    this.width *= this.scaleX;
    this.height *= this.scaleY;

    // set the pose
    this.x += this.pose.position.x;
    this.y -= this.pose.position.y;
  }

  if ( superclass ) ImageMap.__proto__ = superclass;
  ImageMap.prototype = Object.create( superclass && superclass.prototype );
  ImageMap.prototype.constructor = ImageMap;

  return ImageMap;
}(createjs.Bitmap));

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var eventemitter2 = {exports: {}};

/*!
 * EventEmitter2
 * https://github.com/hij1nx/EventEmitter2
 *
 * Copyright (c) 2013 hij1nx
 * Licensed under the MIT license.
 */
eventemitter2.exports;

(function (module, exports) {
!function(undefined$1) {
	  var hasOwnProperty= Object.hasOwnProperty;
	  var isArray = Array.isArray ? Array.isArray : function _isArray(obj) {
	    return Object.prototype.toString.call(obj) === "[object Array]";
	  };
	  var defaultMaxListeners = 10;
	  var nextTickSupported= typeof process=='object' && typeof process.nextTick=='function';
	  var symbolsSupported= typeof Symbol==='function';
	  var reflectSupported= typeof Reflect === 'object';
	  var setImmediateSupported= typeof setImmediate === 'function';
	  var _setImmediate= setImmediateSupported ? setImmediate : setTimeout;
	  var ownKeys= symbolsSupported? (reflectSupported && typeof Reflect.ownKeys==='function'? Reflect.ownKeys : function(obj){
	    var arr= Object.getOwnPropertyNames(obj);
	    arr.push.apply(arr, Object.getOwnPropertySymbols(obj));
	    return arr;
	  }) : Object.keys;

	  function init() {
	    this._events = {};
	    if (this._conf) {
	      configure.call(this, this._conf);
	    }
	  }

	  function configure(conf) {
	    if (conf) {
	      this._conf = conf;

	      conf.delimiter && (this.delimiter = conf.delimiter);

	      if(conf.maxListeners!==undefined$1){
	          this._maxListeners= conf.maxListeners;
	      }

	      conf.wildcard && (this.wildcard = conf.wildcard);
	      conf.newListener && (this._newListener = conf.newListener);
	      conf.removeListener && (this._removeListener = conf.removeListener);
	      conf.verboseMemoryLeak && (this.verboseMemoryLeak = conf.verboseMemoryLeak);
	      conf.ignoreErrors && (this.ignoreErrors = conf.ignoreErrors);

	      if (this.wildcard) {
	        this.listenerTree = {};
	      }
	    }
	  }

	  function logPossibleMemoryLeak(count, eventName) {
	    var errorMsg = '(node) warning: possible EventEmitter memory ' +
	        'leak detected. ' + count + ' listeners added. ' +
	        'Use emitter.setMaxListeners() to increase limit.';

	    if(this.verboseMemoryLeak){
	      errorMsg += ' Event name: ' + eventName + '.';
	    }

	    if(typeof process !== 'undefined' && process.emitWarning){
	      var e = new Error(errorMsg);
	      e.name = 'MaxListenersExceededWarning';
	      e.emitter = this;
	      e.count = count;
	      process.emitWarning(e);
	    } else {
	      console.error(errorMsg);

	      if (console.trace){
	        console.trace();
	      }
	    }
	  }

	  var toArray = function (a, b, c) {
	    var arguments$1 = arguments;

	    var n = arguments.length;
	    switch (n) {
	      case 0:
	        return [];
	      case 1:
	        return [a];
	      case 2:
	        return [a, b];
	      case 3:
	        return [a, b, c];
	      default:
	        var arr = new Array(n);
	        while (n--) {
	          arr[n] = arguments$1[n];
	        }
	        return arr;
	    }
	  };

	  function toObject(keys, values) {
	    var obj = {};
	    var key;
	    var len = keys.length;
	    var valuesCount = values ? value.length : 0;
	    for (var i = 0; i < len; i++) {
	      key = keys[i];
	      obj[key] = i < valuesCount ? values[i] : undefined$1;
	    }
	    return obj;
	  }

	  function TargetObserver(emitter, target, options) {
	    this._emitter = emitter;
	    this._target = target;
	    this._listeners = {};
	    this._listenersCount = 0;

	    var on, off;

	    if (options.on || options.off) {
	      on = options.on;
	      off = options.off;
	    }

	    if (target.addEventListener) {
	      on = target.addEventListener;
	      off = target.removeEventListener;
	    } else if (target.addListener) {
	      on = target.addListener;
	      off = target.removeListener;
	    } else if (target.on) {
	      on = target.on;
	      off = target.off;
	    }

	    if (!on && !off) {
	      throw Error('target does not implement any known event API');
	    }

	    if (typeof on !== 'function') {
	      throw TypeError('on method must be a function');
	    }

	    if (typeof off !== 'function') {
	      throw TypeError('off method must be a function');
	    }

	    this._on = on;
	    this._off = off;

	    var _observers= emitter._observers;
	    if(_observers){
	      _observers.push(this);
	    }else {
	      emitter._observers= [this];
	    }
	  }

	  Object.assign(TargetObserver.prototype, {
	    subscribe: function(event, localEvent, reducer){
	      var observer= this;
	      var target= this._target;
	      var emitter= this._emitter;
	      var listeners= this._listeners;
	      var handler= function(){
	        var args= toArray.apply(null, arguments);
	        var eventObj= {
	          data: args,
	          name: localEvent,
	          original: event
	        };
	        if(reducer){
	          var result= reducer.call(target, eventObj);
	          if(result!==false){
	            emitter.emit.apply(emitter, [eventObj.name].concat(args));
	          }
	          return;
	        }
	        emitter.emit.apply(emitter, [localEvent].concat(args));
	      };


	      if(listeners[event]){
	        throw Error('Event \'' + event + '\' is already listening');
	      }

	      this._listenersCount++;

	      if(emitter._newListener && emitter._removeListener && !observer._onNewListener){

	        this._onNewListener = function (_event) {
	          if (_event === localEvent && listeners[event] === null) {
	            listeners[event] = handler;
	            observer._on.call(target, event, handler);
	          }
	        };

	        emitter.on('newListener', this._onNewListener);

	        this._onRemoveListener= function(_event){
	          if(_event === localEvent && !emitter.hasListeners(_event) && listeners[event]){
	            listeners[event]= null;
	            observer._off.call(target, event, handler);
	          }
	        };

	        listeners[event]= null;

	        emitter.on('removeListener', this._onRemoveListener);
	      }else {
	        listeners[event]= handler;
	        observer._on.call(target, event, handler);
	      }
	    },

	    unsubscribe: function(event){
	      var observer= this;
	      var listeners= this._listeners;
	      var emitter= this._emitter;
	      var handler;
	      var events;
	      var off= this._off;
	      var target= this._target;
	      var i;

	      if(event && typeof event!=='string'){
	        throw TypeError('event must be a string');
	      }

	      function clearRefs(){
	        if(observer._onNewListener){
	          emitter.off('newListener', observer._onNewListener);
	          emitter.off('removeListener', observer._onRemoveListener);
	          observer._onNewListener= null;
	          observer._onRemoveListener= null;
	        }
	        var index= findTargetIndex.call(emitter, observer);
	        emitter._observers.splice(index, 1);
	      }

	      if(event){
	        handler= listeners[event];
	        if(!handler) { return; }
	        off.call(target, event, handler);
	        delete listeners[event];
	        if(!--this._listenersCount){
	          clearRefs();
	        }
	      }else {
	        events= ownKeys(listeners);
	        i= events.length;
	        while(i-->0){
	          event= events[i];
	          off.call(target, event, listeners[event]);
	        }
	        this._listeners= {};
	        this._listenersCount= 0;
	        clearRefs();
	      }
	    }
	  });

	  function resolveOptions(options, schema, reducers, allowUnknown) {
	    var computedOptions = Object.assign({}, schema);

	    if (!options) { return computedOptions; }

	    if (typeof options !== 'object') {
	      throw TypeError('options must be an object')
	    }

	    var keys = Object.keys(options);
	    var length = keys.length;
	    var option, value;
	    var reducer;

	    function reject(reason) {
	      throw Error('Invalid "' + option + '" option value' + (reason ? '. Reason: ' + reason : ''))
	    }

	    for (var i = 0; i < length; i++) {
	      option = keys[i];
	      if (!allowUnknown && !hasOwnProperty.call(schema, option)) {
	        throw Error('Unknown "' + option + '" option');
	      }
	      value = options[option];
	      if (value !== undefined$1) {
	        reducer = reducers[option];
	        computedOptions[option] = reducer ? reducer(value, reject) : value;
	      }
	    }
	    return computedOptions;
	  }

	  function constructorReducer(value, reject) {
	    if (typeof value !== 'function' || !value.hasOwnProperty('prototype')) {
	      reject('value must be a constructor');
	    }
	    return value;
	  }

	  function makeTypeReducer(types) {
	    var message= 'value must be type of ' + types.join('|');
	    var len= types.length;
	    var firstType= types[0];
	    var secondType= types[1];

	    if (len === 1) {
	      return function (v, reject) {
	        if (typeof v === firstType) {
	          return v;
	        }
	        reject(message);
	      }
	    }

	    if (len === 2) {
	      return function (v, reject) {
	        var kind= typeof v;
	        if (kind === firstType || kind === secondType) { return v; }
	        reject(message);
	      }
	    }

	    return function (v, reject) {
	      var kind = typeof v;
	      var i = len;
	      while (i-- > 0) {
	        if (kind === types[i]) { return v; }
	      }
	      reject(message);
	    }
	  }

	  var functionReducer= makeTypeReducer(['function']);

	  var objectFunctionReducer= makeTypeReducer(['object', 'function']);

	  function makeCancelablePromise(Promise, executor, options) {
	    var isCancelable;
	    var callbacks;
	    var timer= 0;
	    var subscriptionClosed;

	    var promise = new Promise(function (resolve, reject, onCancel) {
	      options= resolveOptions(options, {
	        timeout: 0,
	        overload: false
	      }, {
	        timeout: function(value, reject){
	          value*= 1;
	          if (typeof value !== 'number' || value < 0 || !Number.isFinite(value)) {
	            reject('timeout must be a positive number');
	          }
	          return value;
	        }
	      });

	      isCancelable = !options.overload && typeof Promise.prototype.cancel === 'function' && typeof onCancel === 'function';

	      function cleanup() {
	        if (callbacks) {
	          callbacks = null;
	        }
	        if (timer) {
	          clearTimeout(timer);
	          timer = 0;
	        }
	      }

	      var _resolve= function(value){
	        cleanup();
	        resolve(value);
	      };

	      var _reject= function(err){
	        cleanup();
	        reject(err);
	      };

	      if (isCancelable) {
	        executor(_resolve, _reject, onCancel);
	      } else {
	        callbacks = [function(reason){
	          _reject(reason || Error('canceled'));
	        }];
	        executor(_resolve, _reject, function (cb) {
	          if (subscriptionClosed) {
	            throw Error('Unable to subscribe on cancel event asynchronously')
	          }
	          if (typeof cb !== 'function') {
	            throw TypeError('onCancel callback must be a function');
	          }
	          callbacks.push(cb);
	        });
	        subscriptionClosed= true;
	      }

	      if (options.timeout > 0) {
	        timer= setTimeout(function(){
	          var reason= Error('timeout');
	          reason.code = 'ETIMEDOUT';
	          timer= 0;
	          promise.cancel(reason);
	          reject(reason);
	        }, options.timeout);
	      }
	    });

	    if (!isCancelable) {
	      promise.cancel = function (reason) {
	        if (!callbacks) {
	          return;
	        }
	        var length = callbacks.length;
	        for (var i = 1; i < length; i++) {
	          callbacks[i](reason);
	        }
	        // internal callback to reject the promise
	        callbacks[0](reason);
	        callbacks = null;
	      };
	    }

	    return promise;
	  }

	  function findTargetIndex(observer) {
	    var observers = this._observers;
	    if(!observers){
	      return -1;
	    }
	    var len = observers.length;
	    for (var i = 0; i < len; i++) {
	      if (observers[i]._target === observer) { return i; }
	    }
	    return -1;
	  }

	  // Attention, function return type now is array, always !
	  // It has zero elements if no any matches found and one or more
	  // elements (leafs) if there are matches
	  //
	  function searchListenerTree(handlers, type, tree, i, typeLength) {
	    if (!tree) {
	      return null;
	    }

	    if (i === 0) {
	      var kind = typeof type;
	      if (kind === 'string') {
	        var ns, n, l = 0, j = 0, delimiter = this.delimiter, dl = delimiter.length;
	        if ((n = type.indexOf(delimiter)) !== -1) {
	          ns = new Array(5);
	          do {
	            ns[l++] = type.slice(j, n);
	            j = n + dl;
	          } while ((n = type.indexOf(delimiter, j)) !== -1);

	          ns[l++] = type.slice(j);
	          type = ns;
	          typeLength = l;
	        } else {
	          type = [type];
	          typeLength = 1;
	        }
	      } else if (kind === 'object') {
	        typeLength = type.length;
	      } else {
	        type = [type];
	        typeLength = 1;
	      }
	    }

	    var listeners= null, branch, xTree, xxTree, isolatedBranch, endReached, currentType = type[i],
	        nextType = type[i + 1], branches, _listeners;

	    if (i === typeLength) {
	      //
	      // If at the end of the event(s) list and the tree has listeners
	      // invoke those listeners.
	      //

	      if(tree._listeners) {
	        if (typeof tree._listeners === 'function') {
	          handlers && handlers.push(tree._listeners);
	          listeners = [tree];
	        } else {
	          handlers && handlers.push.apply(handlers, tree._listeners);
	          listeners = [tree];
	        }
	      }
	    } else {

	      if (currentType === '*') {
	        //
	        // If the event emitted is '*' at this part
	        // or there is a concrete match at this patch
	        //
	        branches = ownKeys(tree);
	        n = branches.length;
	        while (n-- > 0) {
	          branch = branches[n];
	          if (branch !== '_listeners') {
	            _listeners = searchListenerTree(handlers, type, tree[branch], i + 1, typeLength);
	            if (_listeners) {
	              if (listeners) {
	                listeners.push.apply(listeners, _listeners);
	              } else {
	                listeners = _listeners;
	              }
	            }
	          }
	        }
	        return listeners;
	      } else if (currentType === '**') {
	        endReached = (i + 1 === typeLength || (i + 2 === typeLength && nextType === '*'));
	        if (endReached && tree._listeners) {
	          // The next element has a _listeners, add it to the handlers.
	          listeners = searchListenerTree(handlers, type, tree, typeLength, typeLength);
	        }

	        branches = ownKeys(tree);
	        n = branches.length;
	        while (n-- > 0) {
	          branch = branches[n];
	          if (branch !== '_listeners') {
	            if (branch === '*' || branch === '**') {
	              if (tree[branch]._listeners && !endReached) {
	                _listeners = searchListenerTree(handlers, type, tree[branch], typeLength, typeLength);
	                if (_listeners) {
	                  if (listeners) {
	                    listeners.push.apply(listeners, _listeners);
	                  } else {
	                    listeners = _listeners;
	                  }
	                }
	              }
	              _listeners = searchListenerTree(handlers, type, tree[branch], i, typeLength);
	            } else if (branch === nextType) {
	              _listeners = searchListenerTree(handlers, type, tree[branch], i + 2, typeLength);
	            } else {
	              // No match on this one, shift into the tree but not in the type array.
	              _listeners = searchListenerTree(handlers, type, tree[branch], i, typeLength);
	            }
	            if (_listeners) {
	              if (listeners) {
	                listeners.push.apply(listeners, _listeners);
	              } else {
	                listeners = _listeners;
	              }
	            }
	          }
	        }
	        return listeners;
	      } else if (tree[currentType]) {
	        listeners = searchListenerTree(handlers, type, tree[currentType], i + 1, typeLength);
	      }
	    }

	      xTree = tree['*'];
	    if (xTree) {
	      //
	      // If the listener tree will allow any match for this part,
	      // then recursively explore all branches of the tree
	      //
	      searchListenerTree(handlers, type, xTree, i + 1, typeLength);
	    }

	    xxTree = tree['**'];
	    if (xxTree) {
	      if (i < typeLength) {
	        if (xxTree._listeners) {
	          // If we have a listener on a '**', it will catch all, so add its handler.
	          searchListenerTree(handlers, type, xxTree, typeLength, typeLength);
	        }

	        // Build arrays of matching next branches and others.
	        branches= ownKeys(xxTree);
	        n= branches.length;
	        while(n-->0){
	          branch= branches[n];
	          if (branch !== '_listeners') {
	            if (branch === nextType) {
	              // We know the next element will match, so jump twice.
	              searchListenerTree(handlers, type, xxTree[branch], i + 2, typeLength);
	            } else if (branch === currentType) {
	              // Current node matches, move into the tree.
	              searchListenerTree(handlers, type, xxTree[branch], i + 1, typeLength);
	            } else {
	              isolatedBranch = {};
	              isolatedBranch[branch] = xxTree[branch];
	              searchListenerTree(handlers, type, {'**': isolatedBranch}, i + 1, typeLength);
	            }
	          }
	        }
	      } else if (xxTree._listeners) {
	        // We have reached the end and still on a '**'
	        searchListenerTree(handlers, type, xxTree, typeLength, typeLength);
	      } else if (xxTree['*'] && xxTree['*']._listeners) {
	        searchListenerTree(handlers, type, xxTree['*'], typeLength, typeLength);
	      }
	    }

	    return listeners;
	  }

	  function growListenerTree(type, listener, prepend) {
	    var len = 0, j = 0, i, delimiter = this.delimiter, dl= delimiter.length, ns;

	    if(typeof type==='string') {
	      if ((i = type.indexOf(delimiter)) !== -1) {
	        ns = new Array(5);
	        do {
	          ns[len++] = type.slice(j, i);
	          j = i + dl;
	        } while ((i = type.indexOf(delimiter, j)) !== -1);

	        ns[len++] = type.slice(j);
	      }else {
	        ns= [type];
	        len= 1;
	      }
	    }else {
	      ns= type;
	      len= type.length;
	    }

	    //
	    // Looks for two consecutive '**', if so, don't add the event at all.
	    //
	    if (len > 1) {
	      for (i = 0; i + 1 < len; i++) {
	        if (ns[i] === '**' && ns[i + 1] === '**') {
	          return;
	        }
	      }
	    }



	    var tree = this.listenerTree, name;

	    for (i = 0; i < len; i++) {
	      name = ns[i];

	      tree = tree[name] || (tree[name] = {});

	      if (i === len - 1) {
	        if (!tree._listeners) {
	          tree._listeners = listener;
	        } else {
	          if (typeof tree._listeners === 'function') {
	            tree._listeners = [tree._listeners];
	          }

	          if (prepend) {
	            tree._listeners.unshift(listener);
	          } else {
	            tree._listeners.push(listener);
	          }

	          if (
	              !tree._listeners.warned &&
	              this._maxListeners > 0 &&
	              tree._listeners.length > this._maxListeners
	          ) {
	            tree._listeners.warned = true;
	            logPossibleMemoryLeak.call(this, tree._listeners.length, name);
	          }
	        }
	        return true;
	      }
	    }

	    return true;
	  }

	  function collectTreeEvents(tree, events, root, asArray){
	     var branches= ownKeys(tree);
	     var i= branches.length;
	     var branch, branchName, path;
	     var hasListeners= tree['_listeners'];
	     var isArrayPath;

	     while(i-->0){
	         branchName= branches[i];

	         branch= tree[branchName];

	         if(branchName==='_listeners'){
	             path= root;
	         }else {
	             path = root ? root.concat(branchName) : [branchName];
	         }

	         isArrayPath= asArray || typeof branchName==='symbol';

	         hasListeners && events.push(isArrayPath? path : path.join(this.delimiter));

	         if(typeof branch==='object'){
	             collectTreeEvents.call(this, branch, events, path, isArrayPath);
	         }
	     }

	     return events;
	  }

	  function recursivelyGarbageCollect(root) {
	    var keys = ownKeys(root);
	    var i= keys.length;
	    var obj, key, flag;
	    while(i-->0){
	      key = keys[i];
	      obj = root[key];

	      if(obj){
	          flag= true;
	          if(key !== '_listeners' && !recursivelyGarbageCollect(obj)){
	             delete root[key];
	          }
	      }
	    }

	    return flag;
	  }

	  function Listener(emitter, event, listener){
	    this.emitter= emitter;
	    this.event= event;
	    this.listener= listener;
	  }

	  Listener.prototype.off= function(){
	    this.emitter.off(this.event, this.listener);
	    return this;
	  };

	  function setupListener(event, listener, options){
	      if (options === true) {
	        promisify = true;
	      } else if (options === false) {
	        async = true;
	      } else {
	        if (!options || typeof options !== 'object') {
	          throw TypeError('options should be an object or true');
	        }
	        var async = options.async;
	        var promisify = options.promisify;
	        var nextTick = options.nextTick;
	        var objectify = options.objectify;
	      }

	      if (async || nextTick || promisify) {
	        var _listener = listener;
	        var _origin = listener._origin || listener;

	        if (nextTick && !nextTickSupported) {
	          throw Error('process.nextTick is not supported');
	        }

	        if (promisify === undefined$1) {
	          promisify = listener.constructor.name === 'AsyncFunction';
	        }

	        listener = function () {
	          var args = arguments;
	          var context = this;
	          var event = this.event;

	          return promisify ? (nextTick ? Promise.resolve() : new Promise(function (resolve) {
	            _setImmediate(resolve);
	          }).then(function () {
	            context.event = event;
	            return _listener.apply(context, args)
	          })) : (nextTick ? process.nextTick : _setImmediate)(function () {
	            context.event = event;
	            _listener.apply(context, args);
	          });
	        };

	        listener._async = true;
	        listener._origin = _origin;
	      }

	    return [listener, objectify? new Listener(this, event, listener): this];
	  }

	  function EventEmitter(conf) {
	    this._events = {};
	    this._newListener = false;
	    this._removeListener = false;
	    this.verboseMemoryLeak = false;
	    configure.call(this, conf);
	  }

	  EventEmitter.EventEmitter2 = EventEmitter; // backwards compatibility for exporting EventEmitter property

	  EventEmitter.prototype.listenTo= function(target, events, options){
	    if(typeof target!=='object'){
	      throw TypeError('target musts be an object');
	    }

	    var emitter= this;

	    options = resolveOptions(options, {
	      on: undefined$1,
	      off: undefined$1,
	      reducers: undefined$1
	    }, {
	      on: functionReducer,
	      off: functionReducer,
	      reducers: objectFunctionReducer
	    });

	    function listen(events){
	      if(typeof events!=='object'){
	        throw TypeError('events must be an object');
	      }

	      var reducers= options.reducers;
	      var index= findTargetIndex.call(emitter, target);
	      var observer;

	      if(index===-1){
	        observer= new TargetObserver(emitter, target, options);
	      }else {
	        observer= emitter._observers[index];
	      }

	      var keys= ownKeys(events);
	      var len= keys.length;
	      var event;
	      var isSingleReducer= typeof reducers==='function';

	      for(var i=0; i<len; i++){
	        event= keys[i];
	        observer.subscribe(
	            event,
	            events[event] || event,
	            isSingleReducer ? reducers : reducers && reducers[event]
	        );
	      }
	    }

	    isArray(events)?
	        listen(toObject(events)) :
	        (typeof events==='string'? listen(toObject(events.split(/\s+/))): listen(events));

	    return this;
	  };

	  EventEmitter.prototype.stopListeningTo = function (target, event) {
	    var observers = this._observers;

	    if(!observers){
	      return false;
	    }

	    var i = observers.length;
	    var observer;
	    var matched= false;

	    if(target && typeof target!=='object'){
	      throw TypeError('target should be an object');
	    }

	    while (i-- > 0) {
	      observer = observers[i];
	      if (!target || observer._target === target) {
	        observer.unsubscribe(event);
	        matched= true;
	      }
	    }

	    return matched;
	  };

	  // By default EventEmitters will print a warning if more than
	  // 10 listeners are added to it. This is a useful default which
	  // helps finding memory leaks.
	  //
	  // Obviously not all Emitters should be limited to 10. This function allows
	  // that to be increased. Set to zero for unlimited.

	  EventEmitter.prototype.delimiter = '.';

	  EventEmitter.prototype.setMaxListeners = function(n) {
	    if (n !== undefined$1) {
	      this._maxListeners = n;
	      if (!this._conf) { this._conf = {}; }
	      this._conf.maxListeners = n;
	    }
	  };

	  EventEmitter.prototype.getMaxListeners = function() {
	    return this._maxListeners;
	  };

	  EventEmitter.prototype.event = '';

	  EventEmitter.prototype.once = function(event, fn, options) {
	    return this._once(event, fn, false, options);
	  };

	  EventEmitter.prototype.prependOnceListener = function(event, fn, options) {
	    return this._once(event, fn, true, options);
	  };

	  EventEmitter.prototype._once = function(event, fn, prepend, options) {
	    return this._many(event, 1, fn, prepend, options);
	  };

	  EventEmitter.prototype.many = function(event, ttl, fn, options) {
	    return this._many(event, ttl, fn, false, options);
	  };

	  EventEmitter.prototype.prependMany = function(event, ttl, fn, options) {
	    return this._many(event, ttl, fn, true, options);
	  };

	  EventEmitter.prototype._many = function(event, ttl, fn, prepend, options) {
	    var self = this;

	    if (typeof fn !== 'function') {
	      throw new Error('many only accepts instances of Function');
	    }

	    function listener() {
	      if (--ttl === 0) {
	        self.off(event, listener);
	      }
	      return fn.apply(this, arguments);
	    }

	    listener._origin = fn;

	    return this._on(event, listener, prepend, options);
	  };

	  EventEmitter.prototype.emit = function() {
	    var arguments$1 = arguments;

	    if (!this._events && !this._all) {
	      return false;
	    }

	    this._events || init.call(this);

	    var type = arguments[0], ns, wildcard= this.wildcard;
	    var args,l,i,j, containsSymbol;

	    if (type === 'newListener' && !this._newListener) {
	      if (!this._events.newListener) {
	        return false;
	      }
	    }

	    if (wildcard) {
	      ns= type;
	      if(type!=='newListener' && type!=='removeListener'){
	        if (typeof type === 'object') {
	          l = type.length;
	          if (symbolsSupported) {
	            for (i = 0; i < l; i++) {
	              if (typeof type[i] === 'symbol') {
	                containsSymbol = true;
	                break;
	              }
	            }
	          }
	          if (!containsSymbol) {
	            type = type.join(this.delimiter);
	          }
	        }
	      }
	    }

	    var al = arguments.length;
	    var handler;

	    if (this._all && this._all.length) {
	      handler = this._all.slice();

	      for (i = 0, l = handler.length; i < l; i++) {
	        this.event = type;
	        switch (al) {
	        case 1:
	          handler[i].call(this, type);
	          break;
	        case 2:
	          handler[i].call(this, type, arguments$1[1]);
	          break;
	        case 3:
	          handler[i].call(this, type, arguments$1[1], arguments$1[2]);
	          break;
	        default:
	          handler[i].apply(this, arguments$1);
	        }
	      }
	    }

	    if (wildcard) {
	      handler = [];
	      searchListenerTree.call(this, handler, ns, this.listenerTree, 0, l);
	    } else {
	      handler = this._events[type];
	      if (typeof handler === 'function') {
	        this.event = type;
	        switch (al) {
	        case 1:
	          handler.call(this);
	          break;
	        case 2:
	          handler.call(this, arguments[1]);
	          break;
	        case 3:
	          handler.call(this, arguments[1], arguments[2]);
	          break;
	        default:
	          args = new Array(al - 1);
	          for (j = 1; j < al; j++) { args[j - 1] = arguments$1[j]; }
	          handler.apply(this, args);
	        }
	        return true;
	      } else if (handler) {
	        // need to make copy of handlers because list can change in the middle
	        // of emit call
	        handler = handler.slice();
	      }
	    }

	    if (handler && handler.length) {
	      if (al > 3) {
	        args = new Array(al - 1);
	        for (j = 1; j < al; j++) { args[j - 1] = arguments$1[j]; }
	      }
	      for (i = 0, l = handler.length; i < l; i++) {
	        this.event = type;
	        switch (al) {
	        case 1:
	          handler[i].call(this);
	          break;
	        case 2:
	          handler[i].call(this, arguments$1[1]);
	          break;
	        case 3:
	          handler[i].call(this, arguments$1[1], arguments$1[2]);
	          break;
	        default:
	          handler[i].apply(this, args);
	        }
	      }
	      return true;
	    } else if (!this.ignoreErrors && !this._all && type === 'error') {
	      if (arguments[1] instanceof Error) {
	        throw arguments[1]; // Unhandled 'error' event
	      } else {
	        throw new Error("Uncaught, unspecified 'error' event.");
	      }
	    }

	    return !!this._all;
	  };

	  EventEmitter.prototype.emitAsync = function() {
	    var arguments$1 = arguments;

	    if (!this._events && !this._all) {
	      return false;
	    }

	    this._events || init.call(this);

	    var type = arguments[0], wildcard= this.wildcard, ns, containsSymbol;
	    var args,l,i,j;

	    if (type === 'newListener' && !this._newListener) {
	        if (!this._events.newListener) { return Promise.resolve([false]); }
	    }

	    if (wildcard) {
	      ns= type;
	      if(type!=='newListener' && type!=='removeListener'){
	        if (typeof type === 'object') {
	          l = type.length;
	          if (symbolsSupported) {
	            for (i = 0; i < l; i++) {
	              if (typeof type[i] === 'symbol') {
	                containsSymbol = true;
	                break;
	              }
	            }
	          }
	          if (!containsSymbol) {
	            type = type.join(this.delimiter);
	          }
	        }
	      }
	    }

	    var promises= [];

	    var al = arguments.length;
	    var handler;

	    if (this._all) {
	      for (i = 0, l = this._all.length; i < l; i++) {
	        this.event = type;
	        switch (al) {
	        case 1:
	          promises.push(this._all[i].call(this, type));
	          break;
	        case 2:
	          promises.push(this._all[i].call(this, type, arguments$1[1]));
	          break;
	        case 3:
	          promises.push(this._all[i].call(this, type, arguments$1[1], arguments$1[2]));
	          break;
	        default:
	          promises.push(this._all[i].apply(this, arguments$1));
	        }
	      }
	    }

	    if (wildcard) {
	      handler = [];
	      searchListenerTree.call(this, handler, ns, this.listenerTree, 0);
	    } else {
	      handler = this._events[type];
	    }

	    if (typeof handler === 'function') {
	      this.event = type;
	      switch (al) {
	      case 1:
	        promises.push(handler.call(this));
	        break;
	      case 2:
	        promises.push(handler.call(this, arguments[1]));
	        break;
	      case 3:
	        promises.push(handler.call(this, arguments[1], arguments[2]));
	        break;
	      default:
	        args = new Array(al - 1);
	        for (j = 1; j < al; j++) { args[j - 1] = arguments$1[j]; }
	        promises.push(handler.apply(this, args));
	      }
	    } else if (handler && handler.length) {
	      handler = handler.slice();
	      if (al > 3) {
	        args = new Array(al - 1);
	        for (j = 1; j < al; j++) { args[j - 1] = arguments$1[j]; }
	      }
	      for (i = 0, l = handler.length; i < l; i++) {
	        this.event = type;
	        switch (al) {
	        case 1:
	          promises.push(handler[i].call(this));
	          break;
	        case 2:
	          promises.push(handler[i].call(this, arguments$1[1]));
	          break;
	        case 3:
	          promises.push(handler[i].call(this, arguments$1[1], arguments$1[2]));
	          break;
	        default:
	          promises.push(handler[i].apply(this, args));
	        }
	      }
	    } else if (!this.ignoreErrors && !this._all && type === 'error') {
	      if (arguments[1] instanceof Error) {
	        return Promise.reject(arguments[1]); // Unhandled 'error' event
	      } else {
	        return Promise.reject("Uncaught, unspecified 'error' event.");
	      }
	    }

	    return Promise.all(promises);
	  };

	  EventEmitter.prototype.on = function(type, listener, options) {
	    return this._on(type, listener, false, options);
	  };

	  EventEmitter.prototype.prependListener = function(type, listener, options) {
	    return this._on(type, listener, true, options);
	  };

	  EventEmitter.prototype.onAny = function(fn) {
	    return this._onAny(fn, false);
	  };

	  EventEmitter.prototype.prependAny = function(fn) {
	    return this._onAny(fn, true);
	  };

	  EventEmitter.prototype.addListener = EventEmitter.prototype.on;

	  EventEmitter.prototype._onAny = function(fn, prepend){
	    if (typeof fn !== 'function') {
	      throw new Error('onAny only accepts instances of Function');
	    }

	    if (!this._all) {
	      this._all = [];
	    }

	    // Add the function to the event listener collection.
	    if(prepend){
	      this._all.unshift(fn);
	    }else {
	      this._all.push(fn);
	    }

	    return this;
	  };

	  EventEmitter.prototype._on = function(type, listener, prepend, options) {
	    if (typeof type === 'function') {
	      this._onAny(type, listener);
	      return this;
	    }

	    if (typeof listener !== 'function') {
	      throw new Error('on only accepts instances of Function');
	    }
	    this._events || init.call(this);

	    var returnValue= this, temp;

	    if (options !== undefined$1) {
	      temp = setupListener.call(this, type, listener, options);
	      listener = temp[0];
	      returnValue = temp[1];
	    }

	    // To avoid recursion in the case that type == "newListeners"! Before
	    // adding it to the listeners, first emit "newListeners".
	    if (this._newListener) {
	      this.emit('newListener', type, listener);
	    }

	    if (this.wildcard) {
	      growListenerTree.call(this, type, listener, prepend);
	      return returnValue;
	    }

	    if (!this._events[type]) {
	      // Optimize the case of one listener. Don't need the extra array object.
	      this._events[type] = listener;
	    } else {
	      if (typeof this._events[type] === 'function') {
	        // Change to array.
	        this._events[type] = [this._events[type]];
	      }

	      // If we've already got an array, just add
	      if(prepend){
	        this._events[type].unshift(listener);
	      }else {
	        this._events[type].push(listener);
	      }

	      // Check for listener leak
	      if (
	        !this._events[type].warned &&
	        this._maxListeners > 0 &&
	        this._events[type].length > this._maxListeners
	      ) {
	        this._events[type].warned = true;
	        logPossibleMemoryLeak.call(this, this._events[type].length, type);
	      }
	    }

	    return returnValue;
	  };

	  EventEmitter.prototype.off = function(type, listener) {
	    if (typeof listener !== 'function') {
	      throw new Error('removeListener only takes instances of Function');
	    }

	    var handlers,leafs=[];

	    if(this.wildcard) {
	      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
	      leafs = searchListenerTree.call(this, null, ns, this.listenerTree, 0);
	      if(!leafs) { return this; }
	    } else {
	      // does not use listeners(), so no side effect of creating _events[type]
	      if (!this._events[type]) { return this; }
	      handlers = this._events[type];
	      leafs.push({_listeners:handlers});
	    }

	    for (var iLeaf=0; iLeaf<leafs.length; iLeaf++) {
	      var leaf = leafs[iLeaf];
	      handlers = leaf._listeners;
	      if (isArray(handlers)) {

	        var position = -1;

	        for (var i = 0, length = handlers.length; i < length; i++) {
	          if (handlers[i] === listener ||
	            (handlers[i].listener && handlers[i].listener === listener) ||
	            (handlers[i]._origin && handlers[i]._origin === listener)) {
	            position = i;
	            break;
	          }
	        }

	        if (position < 0) {
	          continue;
	        }

	        if(this.wildcard) {
	          leaf._listeners.splice(position, 1);
	        }
	        else {
	          this._events[type].splice(position, 1);
	        }

	        if (handlers.length === 0) {
	          if(this.wildcard) {
	            delete leaf._listeners;
	          }
	          else {
	            delete this._events[type];
	          }
	        }
	        if (this._removeListener)
	          { this.emit("removeListener", type, listener); }

	        return this;
	      }
	      else if (handlers === listener ||
	        (handlers.listener && handlers.listener === listener) ||
	        (handlers._origin && handlers._origin === listener)) {
	        if(this.wildcard) {
	          delete leaf._listeners;
	        }
	        else {
	          delete this._events[type];
	        }
	        if (this._removeListener)
	          { this.emit("removeListener", type, listener); }
	      }
	    }

	    this.listenerTree && recursivelyGarbageCollect(this.listenerTree);

	    return this;
	  };

	  EventEmitter.prototype.offAny = function(fn) {
	    var i = 0, l = 0, fns;
	    if (fn && this._all && this._all.length > 0) {
	      fns = this._all;
	      for(i = 0, l = fns.length; i < l; i++) {
	        if(fn === fns[i]) {
	          fns.splice(i, 1);
	          if (this._removeListener)
	            { this.emit("removeListenerAny", fn); }
	          return this;
	        }
	      }
	    } else {
	      fns = this._all;
	      if (this._removeListener) {
	        for(i = 0, l = fns.length; i < l; i++)
	          { this.emit("removeListenerAny", fns[i]); }
	      }
	      this._all = [];
	    }
	    return this;
	  };

	  EventEmitter.prototype.removeListener = EventEmitter.prototype.off;

	  EventEmitter.prototype.removeAllListeners = function (type) {
	    if (type === undefined$1) {
	      !this._events || init.call(this);
	      return this;
	    }

	    if (this.wildcard) {
	      var leafs = searchListenerTree.call(this, null, type, this.listenerTree, 0), leaf, i;
	      if (!leafs) { return this; }
	      for (i = 0; i < leafs.length; i++) {
	        leaf = leafs[i];
	        leaf._listeners = null;
	      }
	      this.listenerTree && recursivelyGarbageCollect(this.listenerTree);
	    } else if (this._events) {
	      this._events[type] = null;
	    }
	    return this;
	  };

	  EventEmitter.prototype.listeners = function (type) {
	    var _events = this._events;
	    var keys, listeners, allListeners;
	    var i;
	    var listenerTree;

	    if (type === undefined$1) {
	      if (this.wildcard) {
	        throw Error('event name required for wildcard emitter');
	      }

	      if (!_events) {
	        return [];
	      }

	      keys = ownKeys(_events);
	      i = keys.length;
	      allListeners = [];
	      while (i-- > 0) {
	        listeners = _events[keys[i]];
	        if (typeof listeners === 'function') {
	          allListeners.push(listeners);
	        } else {
	          allListeners.push.apply(allListeners, listeners);
	        }
	      }
	      return allListeners;
	    } else {
	      if (this.wildcard) {
	        listenerTree= this.listenerTree;
	        if(!listenerTree) { return []; }
	        var handlers = [];
	        var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
	        searchListenerTree.call(this, handlers, ns, listenerTree, 0);
	        return handlers;
	      }

	      if (!_events) {
	        return [];
	      }

	      listeners = _events[type];

	      if (!listeners) {
	        return [];
	      }
	      return typeof listeners === 'function' ? [listeners] : listeners;
	    }
	  };

	  EventEmitter.prototype.eventNames = function(nsAsArray){
	    var _events= this._events;
	    return this.wildcard? collectTreeEvents.call(this, this.listenerTree, [], null, nsAsArray) : (_events? ownKeys(_events) : []);
	  };

	  EventEmitter.prototype.listenerCount = function(type) {
	    return this.listeners(type).length;
	  };

	  EventEmitter.prototype.hasListeners = function (type) {
	    if (this.wildcard) {
	      var handlers = [];
	      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
	      searchListenerTree.call(this, handlers, ns, this.listenerTree, 0);
	      return handlers.length > 0;
	    }

	    var _events = this._events;
	    var _all = this._all;

	    return !!(_all && _all.length || _events && (type === undefined$1 ? ownKeys(_events).length : _events[type]));
	  };

	  EventEmitter.prototype.listenersAny = function() {

	    if(this._all) {
	      return this._all;
	    }
	    else {
	      return [];
	    }

	  };

	  EventEmitter.prototype.waitFor = function (event, options) {
	    var self = this;
	    var type = typeof options;
	    if (type === 'number') {
	      options = {timeout: options};
	    } else if (type === 'function') {
	      options = {filter: options};
	    }

	    options= resolveOptions(options, {
	      timeout: 0,
	      filter: undefined$1,
	      handleError: false,
	      Promise: Promise,
	      overload: false
	    }, {
	      filter: functionReducer,
	      Promise: constructorReducer
	    });

	    return makeCancelablePromise(options.Promise, function (resolve, reject, onCancel) {
	      function listener() {
	        var filter= options.filter;
	        if (filter && !filter.apply(self, arguments)) {
	          return;
	        }
	        self.off(event, listener);
	        if (options.handleError) {
	          var err = arguments[0];
	          err ? reject(err) : resolve(toArray.apply(null, arguments).slice(1));
	        } else {
	          resolve(toArray.apply(null, arguments));
	        }
	      }

	      onCancel(function(){
	        self.off(event, listener);
	      });

	      self._on(event, listener, false);
	    }, {
	      timeout: options.timeout,
	      overload: options.overload
	    })
	  };

	  function once(emitter, name, options) {
	    options= resolveOptions(options, {
	      Promise: Promise,
	      timeout: 0,
	      overload: false
	    }, {
	      Promise: constructorReducer
	    });

	    var _Promise= options.Promise;

	    return makeCancelablePromise(_Promise, function(resolve, reject, onCancel){
	      var handler;
	      if (typeof emitter.addEventListener === 'function') {
	        handler=  function () {
	          resolve(toArray.apply(null, arguments));
	        };

	        onCancel(function(){
	          emitter.removeEventListener(name, handler);
	        });

	        emitter.addEventListener(
	            name,
	            handler,
	            {once: true}
	        );
	        return;
	      }

	      var eventListener = function(){
	        errorListener && emitter.removeListener('error', errorListener);
	        resolve(toArray.apply(null, arguments));
	      };

	      var errorListener;

	      if (name !== 'error') {
	        errorListener = function (err){
	          emitter.removeListener(name, eventListener);
	          reject(err);
	        };

	        emitter.once('error', errorListener);
	      }

	      onCancel(function(){
	        errorListener && emitter.removeListener('error', errorListener);
	        emitter.removeListener(name, eventListener);
	      });

	      emitter.once(name, eventListener);
	    }, {
	      timeout: options.timeout,
	      overload: options.overload
	    });
	  }

	  var prototype= EventEmitter.prototype;

	  Object.defineProperties(EventEmitter, {
	    defaultMaxListeners: {
	      get: function () {
	        return prototype._maxListeners;
	      },
	      set: function (n) {
	        if (typeof n !== 'number' || n < 0 || Number.isNaN(n)) {
	          throw TypeError('n must be a non-negative number')
	        }
	        prototype._maxListeners = n;
	      },
	      enumerable: true
	    },
	    once: {
	      value: once,
	      writable: true,
	      configurable: true
	    }
	  });

	  Object.defineProperties(prototype, {
	      _maxListeners: {
	          value: defaultMaxListeners,
	          writable: true,
	          configurable: true
	      },
	      _observers: {value: null, writable: true, configurable: true}
	  });

	  if (typeof undefined$1 === 'function' && undefined$1.amd) {
	     // AMD. Register as an anonymous module.
	    undefined$1(function() {
	      return EventEmitter;
	    });
	  } else {
	    // CommonJS
	    module.exports = EventEmitter;
	  }
	}(); 
} (eventemitter2, eventemitter2.exports));

var eventemitter2Exports = eventemitter2.exports;
var EventEmitter2 = /*@__PURE__*/getDefaultExportFromCjs(eventemitter2Exports);

/**
 * @fileOverview
 * @author Russell Toris - rctoris@wpi.edu
 */

var ImageMapClient = /*@__PURE__*/(function (EventEmitter2) {
  function ImageMapClient(options) {
    EventEmitter2.call(this);
    options = options || {};
    var ros = options.ros;
    var topic = options.topic || '/map_metadata';
    this.image = options.image;
    this.rootObject = options.rootObject || new createjs.Container();

    // create an empty shape to start with
    this.currentImage = new createjs.Shape();

    // subscribe to the topic
    var rosTopic = new ROSLIB.Topic({
      ros : ros,
      name : topic,
      messageType : 'nav_msgs/MapMetaData'
    });

    rosTopic.subscribe(function(message) {
      // we only need this once
      rosTopic.unsubscribe();

      // create the image
      this.currentImage = new ImageMap({
        message : message,
        image : this.image
      });
      this.rootObject.addChild(this.currentImage);

      this.emit('change');
    }.bind(this));
  }

  if ( EventEmitter2 ) ImageMapClient.__proto__ = EventEmitter2;
  ImageMapClient.prototype = Object.create( EventEmitter2 && EventEmitter2.prototype );
  ImageMapClient.prototype.constructor = ImageMapClient;

  return ImageMapClient;
}(EventEmitter2));

/**
 * @fileOverview
 * @author Russell Toris - rctoris@wpi.edu
 */

var OccupancyGrid = /*@__PURE__*/(function (superclass) {
  function OccupancyGrid(options) {
    options = options || {};
    var message = options.message;

    // internal drawing canvas
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');

    // set the size
    canvas.width = message.info.width;
    canvas.height = message.info.height;

    var imageData = context.createImageData(canvas.width, canvas.height);
    for ( var row = 0; row < canvas.height; row++) {
      for ( var col = 0; col < canvas.width; col++) {
        // determine the index into the map data
        var mapI = col + ((canvas.height - row - 1) * canvas.width);
        // determine the value
        var data = message.data[mapI];
        var val;
        if (data === 100) {
          val = 0;
        } else if (data === 0) {
          val = 255;
        } else {
          val = 127;
        }

        // determine the index into the image data array
        var i = (col + (row * canvas.width)) * 4;
        // r
        imageData.data[i] = val;
        // g
        imageData.data[++i] = val;
        // b
        imageData.data[++i] = val;
        // a
        imageData.data[++i] = 255;
      }
    }
    context.putImageData(imageData, 0, 0);

    // create the bitmap
    superclass.call(this, canvas);

    this.width = canvas.width;
    this.height = canvas.height;

    // save the metadata we need
    this.pose = new ROSLIB.Pose({
      position : message.info.origin.position,
      orientation : message.info.origin.orientation
    });

    // change Y direction
    this.y = -this.height * message.info.resolution;

    // scale the image
    this.scaleX = message.info.resolution;
    this.scaleY = message.info.resolution;
    this.width *= this.scaleX;
    this.height *= this.scaleY;

    // set the pose
    this.x += this.pose.position.x;
    this.y -= this.pose.position.y;
  }

  if ( superclass ) OccupancyGrid.__proto__ = superclass;
  OccupancyGrid.prototype = Object.create( superclass && superclass.prototype );
  OccupancyGrid.prototype.constructor = OccupancyGrid;

  return OccupancyGrid;
}(createjs.Bitmap));

/**
 * @fileOverview
 * @author Raffaello Bonghi - raffaello.bonghi@officinerobotiche.it
 */

var Grid = /*@__PURE__*/(function (superclass) {
  function Grid(options) {
      options = options || {};
      var size = options.size || 10;
      var cellSize = options.cellSize || 0.1;
      var lineWidth = options.lineWidth || 0.001;
      // draw the arrow
      var graphics = new createjs.Graphics();
      // line width
      graphics.setStrokeStyle(lineWidth*5);
      graphics.beginStroke(createjs.Graphics.getRGB(0, 0, 0));
      graphics.beginFill(createjs.Graphics.getRGB(255, 0, 0));
      graphics.moveTo(-size*cellSize, 0);
      graphics.lineTo(size*cellSize, 0);
      graphics.moveTo(0, -size*cellSize);
      graphics.lineTo(0, size*cellSize);
      graphics.endFill();
      graphics.endStroke();

      graphics.setStrokeStyle(lineWidth);
      graphics.beginStroke(createjs.Graphics.getRGB(0, 0, 0));
      graphics.beginFill(createjs.Graphics.getRGB(255, 0, 0));
      for (var i = -size; i <= size; i++) {
          graphics.moveTo(-size*cellSize, i * cellSize);
          graphics.lineTo(size*cellSize, i * cellSize);
          graphics.moveTo(i * cellSize, -size*cellSize);
          graphics.lineTo(i * cellSize, size*cellSize);
      }
      graphics.endFill();
      graphics.endStroke();
      // create the shape
      superclass.call(this, graphics);

  }

  if ( superclass ) Grid.__proto__ = superclass;
  Grid.prototype = Object.create( superclass && superclass.prototype );
  Grid.prototype.constructor = Grid;

  return Grid;
}(createjs.Shape));

/**
 * @fileOverview
 * @author Russell Toris - rctoris@wpi.edu
 */

var OccupancyGridClient = /*@__PURE__*/(function (EventEmitter2) {
  function OccupancyGridClient(options) {
    EventEmitter2.call(this);
    var that = this;
    options = options || {};
    var ros = options.ros;
    var topic = options.topic || '/map';
    this.continuous = options.continuous;
    this.rootObject = options.rootObject || new createjs.Container();

    // current grid that is displayed
    // create an empty shape to start with, so that the order remains correct.
    this.currentGrid = new createjs.Shape();
    this.rootObject.addChild(this.currentGrid);
    // work-around for a bug in easeljs -- needs a second object to render correctly
    this.rootObject.addChild(new Grid({size:1}));

    // subscribe to the topic
    var rosTopic = new ROSLIB.Topic({
      ros : ros,
      name : topic,
      messageType : 'nav_msgs/OccupancyGrid',
      compression : 'png'
    });

    rosTopic.subscribe(function(message) {
      // check for an old map
      var index = null;
      if (that.currentGrid) {
        index = that.rootObject.getChildIndex(that.currentGrid);
        that.rootObject.removeChild(that.currentGrid);
      }

      that.currentGrid = new OccupancyGrid({
        message : message
      });
      if (index !== null) {
        that.rootObject.addChildAt(that.currentGrid, index);
      }
      else {
        that.rootObject.addChild(that.currentGrid);
      }

      that.emit('change');

      // check if we should unsubscribe
      if (!that.continuous) {
        rosTopic.unsubscribe();
      }
    });
  }

  if ( EventEmitter2 ) OccupancyGridClient.__proto__ = EventEmitter2;
  OccupancyGridClient.prototype = Object.create( EventEmitter2 && EventEmitter2.prototype );
  OccupancyGridClient.prototype.constructor = OccupancyGridClient;

  return OccupancyGridClient;
}(EventEmitter2));

/**
 * @fileOverview
 * @author Jihoon Lee- jihoonlee.in@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

var OccupancyGridSrvClient = /*@__PURE__*/(function (EventEmitter2) {
  function OccupancyGridSrvClient(options) {
    EventEmitter2.call(this);
    var that = this;
    options = options || {};
    var ros = options.ros;
    var service = options.service || '/static_map';
    this.rootObject = options.rootObject || new createjs.Container();

    // current grid that is displayed
    this.currentGrid = null;

    // Setting up to the service
    var rosService = new ROSLIB.Service({
      ros : ros,
      name : service,
      serviceType : 'nav_msgs/GetMap',
      compression : 'png'
    });

    rosService.callService(new ROSLIB.ServiceRequest(),function(response) {
      // check for an old map
      if (that.currentGrid) {
        that.rootObject.removeChild(that.currentGrid);
      }

      that.currentGrid = new OccupancyGrid({
        message : response.map
      });
      that.rootObject.addChild(that.currentGrid);

      that.emit('change', that.currentGrid);
    });
  }

  if ( EventEmitter2 ) OccupancyGridSrvClient.__proto__ = EventEmitter2;
  OccupancyGridSrvClient.prototype = Object.create( EventEmitter2 && EventEmitter2.prototype );
  OccupancyGridSrvClient.prototype.constructor = OccupancyGridSrvClient;

  return OccupancyGridSrvClient;
}(EventEmitter2));

/**
 * @fileOverview
 * @author Bart van Vliet - bart@dobots.nl
 */

var ArrowShape = /*@__PURE__*/(function (superclass) {
  function ArrowShape(options) {
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
  	superclass.call(this, graphics);

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
  }

  if ( superclass ) ArrowShape.__proto__ = superclass;
  ArrowShape.prototype = Object.create( superclass && superclass.prototype );
  ArrowShape.prototype.constructor = ArrowShape;

  return ArrowShape;
}(createjs.Shape));

/**
 * @fileOverview
 * @author Russell Toris - rctoris@wpi.edu
 */

var NavigationArrow = /*@__PURE__*/(function (superclass) {
  function NavigationArrow(options) {
    var that = this;
    options = options || {};
    var size = options.size || 10;
    var strokeSize = options.strokeSize || 3;
    var strokeColor = options.strokeColor || createjs.Graphics.getRGB(0, 0, 0);
    var fillColor = options.fillColor || createjs.Graphics.getRGB(255, 0, 0);
    var pulse = options.pulse;

    // draw the arrow
    var graphics = new createjs.Graphics();
    // line width
    graphics.setStrokeStyle(strokeSize);
    graphics.moveTo(-size / 2.0, -size / 2.0);
    graphics.beginStroke(strokeColor);
    graphics.beginFill(fillColor);
    graphics.lineTo(size, 0);
    graphics.lineTo(-size / 2.0, size / 2.0);
    graphics.closePath();
    graphics.endFill();
    graphics.endStroke();

    // create the shape
    superclass.call(this, graphics);

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
  }

  if ( superclass ) NavigationArrow.__proto__ = superclass;
  NavigationArrow.prototype = Object.create( superclass && superclass.prototype );
  NavigationArrow.prototype.constructor = NavigationArrow;

  return NavigationArrow;
}(createjs.Shape));

/**
 * @fileOverview
 * @author Inigo Gonzalez - ingonza85@gmail.com
 */

var NavigationImage = /*@__PURE__*/(function (superclass) {
  function NavigationImage(options) {
    options = options || {};
    var size = options.size || 10;
    var image_url = options.image;
    var pulse = options.pulse;
    var alpha = options.alpha || 1;

    var originals = {};

    var image = new Image();

    superclass.call(this, image);

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

  }

  if ( superclass ) NavigationImage.__proto__ = superclass;
  NavigationImage.prototype = Object.create( superclass && superclass.prototype );
  NavigationImage.prototype.constructor = NavigationImage;

  return NavigationImage;
}(createjs.Bitmap));

/**
 * @fileOverview
 * @author Bart van Vliet - bart@dobots.nl
 */

var PathShape = /*@__PURE__*/(function (superclass) {
  function PathShape(options) {
  	options = options || {};
  	var path = options.path;
  	this.strokeSize = options.strokeSize || 3;
  	this.strokeColor = options.strokeColor || createjs.Graphics.getRGB(0, 0, 0);

  	// draw the line
  	this.graphics = new createjs.Graphics();

  	if (path !== null && typeof path !== 'undefined') {
  		this.graphics.setStrokeStyle(this.strokeSize);
  		this.graphics.beginStroke(this.strokeColor);
  		this.graphics.moveTo(path.poses[0].pose.position.x / this.scaleX, path.poses[0].pose.position.y / -this.scaleY);
  		for (var i=1; i<path.poses.length; ++i) {
  			this.graphics.lineTo(path.poses[i].pose.position.x / this.scaleX, path.poses[i].pose.position.y / -this.scaleY);
  		}
  		this.graphics.endStroke();
  	}

  	// create the shape
  	superclass.call(this, this.graphics);
  }

  if ( superclass ) PathShape.__proto__ = superclass;
  PathShape.prototype = Object.create( superclass && superclass.prototype );
  PathShape.prototype.constructor = PathShape;
  /**
   * Set the path to draw
   *
   * @param path of type nav_msgs/Path
   */
  PathShape.prototype.setPath = function setPath (path) {
  	this.graphics.clear();
  	if (path !== null && typeof path !== 'undefined') {
  		this.graphics.setStrokeStyle(this.strokeSize);
  		this.graphics.beginStroke(this.strokeColor);
  		this.graphics.moveTo(path.poses[0].pose.position.x / this.scaleX, path.poses[0].pose.position.y / -this.scaleY);
  		for (var i=1; i<path.poses.length; ++i) {
  			this.graphics.lineTo(path.poses[i].pose.position.x / this.scaleX, path.poses[i].pose.position.y / -this.scaleY);
  		}
  		this.graphics.endStroke();
  	}
  };

  return PathShape;
}(createjs.Shape));

/**
 * @fileOverview
 * @author Bart van Vliet - bart@dobots.nl
 */

var PolygonMarker = /*@__PURE__*/(function (superclass) {
  function PolygonMarker(options) {
  //  var that = this;
      superclass.call(this);
      options = options || {};
      this.lineSize = options.lineSize || 3;
      this.lineColor = options.lineColor || createjs.Graphics.getRGB(0, 0, 255, 0.66);
      this.pointSize = options.pointSize || 10;
      this.pointColor = options.pointColor || createjs.Graphics.getRGB(255, 0, 0, 0.66);
      this.fillColor = options.pointColor || createjs.Graphics.getRGB(0, 255, 0, 0.33);
      this.lineCallBack = options.lineCallBack;
      this.pointCallBack = options.pointCallBack;

      // Array of point shapes
  //  this.points = [];
      this.pointContainer = new createjs.Container();

      // Array of line shapes
  //  this.lines = [];
      this.lineContainer = new createjs.Container();

      this.fillShape = new createjs.Shape();

      // Container with all the lines and points
      this.addChild(this.fillShape);
      this.addChild(this.lineContainer);
      this.addChild(this.pointContainer);
  }

  if ( superclass ) PolygonMarker.__proto__ = superclass;
  PolygonMarker.prototype = Object.create( superclass && superclass.prototype );
  PolygonMarker.prototype.constructor = PolygonMarker;
  /**
   * Internal use only
   */
  PolygonMarker.prototype.createLineShape = function createLineShape (startPoint, endPoint) {
      var line = new createjs.Shape();
  //  line.graphics.setStrokeStyle(this.strokeSize);
  //  line.graphics.beginStroke(this.strokeColor);
  //  line.graphics.moveTo(startPoint.x, startPoint.y);
  //  line.graphics.lineTo(endPoint.x, endPoint.y);
      this.editLineShape(line, startPoint, endPoint);

      var that = this;
      line.addEventListener('mousedown', function(event) {
          if (that.lineCallBack !== null && typeof that.lineCallBack !== 'undefined') {
              that.lineCallBack('mousedown', event, that.lineContainer.getChildIndex(event.target));
          }
      });

      return line;
  };
  /**
   * Internal use only
   */
  PolygonMarker.prototype.editLineShape = function editLineShape (line, startPoint, endPoint) {
      line.graphics.clear();
      line.graphics.setStrokeStyle(this.lineSize);
      line.graphics.beginStroke(this.lineColor);
      line.graphics.moveTo(startPoint.x, startPoint.y);
      line.graphics.lineTo(endPoint.x, endPoint.y);
  };
  /**
   * Internal use only
   */
  PolygonMarker.prototype.createPointShape = function createPointShape (pos) {
      var point = new createjs.Shape();
      point.graphics.beginFill(this.pointColor);
      point.graphics.drawCircle(0, 0, this.pointSize);
      point.x = pos.x;
      point.y = -pos.y;

      var that = this;
      point.addEventListener('mousedown', function(event) {
          if (that.pointCallBack !== null && typeof that.pointCallBack !== 'undefined') {
              that.pointCallBack('mousedown', event, that.pointContainer.getChildIndex(event.target));
          }
      });

      return point;
  };
  /**
   * Adds a point to the polygon
   *
   * @param position of type ROSLIB.Vector3
   */
  PolygonMarker.prototype.addPoint = function addPoint (pos) {
      var point = this.createPointShape(pos);
      this.pointContainer.addChild(point);
      var numPoints = this.pointContainer.numChildren;

      // 0 points -> 1 point, 0 lines
      // 1 point  -> 2 points, lines: add line between previous and new point, add line between new point and first point
      // 2 points -> 3 points, 3 lines: change last line, add line between new point and first point
      // 3 points -> 4 points, 4 lines: change last line, add line between new point and first point
      // etc

      if (numPoints < 2) ;
      else if (numPoints < 3) {
          // Now 2 points: add line between previous and new point
          var line = this.createLineShape(this.pointContainer.getChildAt(numPoints-2), point);
          this.lineContainer.addChild(line);
      }
      if (numPoints > 2) {
          // Now 3 or more points: change last line
          this.editLineShape(this.lineContainer.getChildAt(numPoints-2), this.pointContainer.getChildAt(numPoints-2), point);
      }
      if (numPoints > 1) {
          // Now 2 or more points: add line between new point and first point
          var lineEnd = this.createLineShape(point, this.pointContainer.getChildAt(0));
          this.lineContainer.addChild(lineEnd);
      }

      this.drawFill();
  };
  /**
   * Removes a point from the polygon
   *
   * @param obj either an index (integer) or a point shape of the polygon
   */
  PolygonMarker.prototype.remPoint = function remPoint (obj) {
      var index;
  //  var point;
      if (obj instanceof createjs.Shape) {
          index = this.pointContainer.getChildIndex(obj);
  //      point = obj;
      }
      else {
          index = obj;
  //      point = this.pointContainer.getChildAt(index);
      }

      // 0 points -> 0 points, 0 lines
      // 1 point  -> 0 points, 0 lines
      // 2 points -> 1 point,  0 lines: remove all lines
      // 3 points -> 2 points, 2 lines: change line before point to remove, remove line after point to remove
      // 4 points -> 3 points, 3 lines: change line before point to remove, remove line after point to remove
      // etc

      var numPoints = this.pointContainer.numChildren;

      if (numPoints < 2) ;
      else if (numPoints < 3) {
          // 2 points: remove all lines
          this.lineContainer.removeAllChildren();
      }
      else {
          // 3 or more points: change line before point to remove, remove line after point to remove
          this.editLineShape(
              this.lineContainer.getChildAt((index-1+numPoints)%numPoints),
              this.pointContainer.getChildAt((index-1+numPoints)%numPoints),
              this.pointContainer.getChildAt((index+1)%numPoints)
          );
          this.lineContainer.removeChildAt(index);
      }
      this.pointContainer.removeChildAt(index);
  //  this.points.splice(index, 1);

      this.drawFill();
  };
  /**
   * Moves a point of the polygon
   *
   * @param obj either an index (integer) or a point shape of the polygon
   * @param position of type ROSLIB.Vector3
   */
  PolygonMarker.prototype.movePoint = function movePoint (obj, newPos) {
      var index;
      var point;
      if (obj instanceof createjs.Shape) {
          index = this.pointContainer.getChildIndex(obj);
          point = obj;
      }
      else {
          index = obj;
          point = this.pointContainer.getChildAt(index);
      }
      point.x = newPos.x;
      point.y = -newPos.y;

      var numPoints = this.pointContainer.numChildren;
      if (numPoints > 1) {
          // line before moved point
          var line1 = this.lineContainer.getChildAt((index-1+numPoints)%numPoints);
          this.editLineShape(line1, this.pointContainer.getChildAt((index-1+numPoints)%numPoints), point);

          // line after moved point
          var line2 = this.lineContainer.getChildAt(index);
          this.editLineShape(line2, point, this.pointContainer.getChildAt((index+1)%numPoints));
      }

      this.drawFill();
  };
  /**
   * Splits a line of the polygon: inserts a point at the center of the line
   *
   * @param obj either an index (integer) or a line shape of the polygon
   */
  PolygonMarker.prototype.splitLine = function splitLine (obj) {
      var index;
      var line;
      if (obj instanceof createjs.Shape) {
          index = this.lineContainer.getChildIndex(obj);
          line = obj;
      }
      else {
          index = obj;
          line = this.lineContainer.getChildAt(index);
      }
      var numPoints = this.pointContainer.numChildren;
      var xs = this.pointContainer.getChildAt(index).x;
      var ys = this.pointContainer.getChildAt(index).y;
      var xe = this.pointContainer.getChildAt((index+1)%numPoints).x;
      var ye = this.pointContainer.getChildAt((index+1)%numPoints).y;
      var xh = (xs+xe)/2.0;
      var yh = (ys+ye)/2.0;
      var pos = new ROSLIB.Vector3({ x:xh, y:-yh });

      // Add a point in the center of the line to split
      var point = this.createPointShape(pos);
      this.pointContainer.addChildAt(point, index+1);
      ++numPoints;

      // Add a line between the new point and the end of the line to split
      var lineNew = this.createLineShape(point, this.pointContainer.getChildAt((index+2)%numPoints));
      this.lineContainer.addChildAt(lineNew, index+1);

      // Set the endpoint of the line to split to the new point
      this.editLineShape(line, this.pointContainer.getChildAt(index), point);

      this.drawFill();
  };
  /**
   * Internal use only
   */
  PolygonMarker.prototype.drawFill = function drawFill () {
      var numPoints = this.pointContainer.numChildren;
      if (numPoints > 2) {
          var g = this.fillShape.graphics;
          g.clear();
          g.setStrokeStyle(0);
          g.beginStroke();
          g.beginFill(this.fillColor);
          g.moveTo(this.pointContainer.getChildAt(0).x, this.pointContainer.getChildAt(0).y);
          for (var i=1; i<numPoints; ++i) {
              g.lineTo(this.pointContainer.getChildAt(i).x, this.pointContainer.getChildAt(i).y);
          }
          g.closePath();
          g.endFill();
          g.endStroke();
      }
      else {
          this.fillShape.graphics.clear();
      }
  };

  return PolygonMarker;
}(createjs.Container));

/**
 * @fileOverview
 * @author Bart van Vliet - bart@dobots.nl
 */

var TraceShape = /*@__PURE__*/(function (superclass) {
  function TraceShape(options) {
  //	var that = this;
  	options = options || {};
  	var pose = options.pose;
  	this.strokeSize = options.strokeSize || 3;
  	this.strokeColor = options.strokeColor || createjs.Graphics.getRGB(0, 0, 0);
  	this.maxPoses = (options.maxPoses || options.maxPoses === 0) ? options.maxPoses : 100;
  	this.minDist = options.minDist || 0.05;

  	// Store minDist as the square of it
  	this.minDist = this.minDist*this.minDist;

  	// Array of the poses
  	// TODO: do we need this?
  	this.poses = [];

  	// Create the graphics
  	this.graphics = new createjs.Graphics();
  	this.graphics.setStrokeStyle(this.strokeSize);
  	this.graphics.beginStroke(this.strokeColor);

  	// Add first pose if given
  	if (pose !== null && typeof pose !== 'undefined') {
  		this.poses.push(pose);
  	}

  	// Create the shape
  	superclass.call(this, this.graphics);
  }

  if ( superclass ) TraceShape.__proto__ = superclass;
  TraceShape.prototype = Object.create( superclass && superclass.prototype );
  TraceShape.prototype.constructor = TraceShape;
  /**
   * Adds a pose to the trace and updates the graphics
   *
   * @param pose of type ROSLIB.Pose
   */
  TraceShape.prototype.addPose = function addPose (pose) {
  	var last = this.poses.length-1;
  	if (last < 0) {
  		this.poses.push(pose);
  		this.graphics.moveTo(pose.position.x / this.scaleX, pose.position.y / -this.scaleY);
  	}
  	else {
  		var prevX = this.poses[last].position.x;
  		var prevY = this.poses[last].position.y;
  		var dx = (pose.position.x - prevX);
  		var dy = (pose.position.y - prevY);
  		if (dx*dx + dy*dy > this.minDist) {
  			this.graphics.lineTo(pose.position.x / this.scaleX, pose.position.y / -this.scaleY);
  			this.poses.push(pose);
  		}
  	}
  	if (this.maxPoses > 0 && this.maxPoses < this.poses.length) {
  		this.popFront();
  	}
  };
  /**
   * Removes front pose and updates the graphics
   */
  TraceShape.prototype.popFront = function popFront () {
  	if (this.poses.length > 0) {
  		this.poses.shift();
  		// TODO: shift drawing instructions rather than doing it all over
  		this.graphics.clear();
  		this.graphics.setStrokeStyle(this.strokeSize);
  		this.graphics.beginStroke(this.strokeColor);
  		this.graphics.lineTo(this.poses[0].position.x / this.scaleX, this.poses[0].position.y / -this.scaleY);
  		for (var i=1; i<this.poses.length; ++i) {
  			this.graphics.lineTo(this.poses[i].position.x / this.scaleX, this.poses[i].position.y / -this.scaleY);
  		}
  	}
  };

  return TraceShape;
}(createjs.Shape));

/**
 * @fileOverview
 * @author Bart van Vliet - bart@dobots.nl
 */

var PanView = function PanView(options) {
  	options = options || {};
  	this.rootObject = options.rootObject;

  	// get a handle to the stage
  	if (this.rootObject instanceof createjs.Stage) {
  		this.stage = this.rootObject;
  	}
  	else {
  		this.stage = this.rootObject.getStage();
  	}

  	this.startPos = new ROSLIB.Vector3();
};

PanView.prototype.startPan = function startPan (startX, startY) {
  	this.startPos.x = startX;
  	this.startPos.y = startY;
};
PanView.prototype.pan = function pan (curX, curY) {
  	this.stage.x += curX - this.startPos.x;
  	this.startPos.x = curX;
  	this.stage.y += curY - this.startPos.y;
  	this.startPos.y = curY;
};

/**
 * @fileOverview
 * @author Russell Toris - rctoris@wpi.edu
 */

var Viewer = function Viewer(options) {
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
  createjs.Ticker.framerate = 30;
  createjs.Ticker.addEventListener('tick', this.scene);
};
/**
 * Add the given createjs object to the global scene in the viewer.
 *
 * @param object - the object to add
 */
Viewer.prototype.addObject = function addObject (object) {
  this.scene.addChild(object);
};
/**
 * Scale the scene to fit the given width and height into the current canvas.
 *
 * @param width - the width to scale to in meters
 * @param height - the height to scale to in meters
 */
Viewer.prototype.scaleToDimensions = function scaleToDimensions (width, height) {
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
Viewer.prototype.shift = function shift (x, y) {
  // save current offset
  this.scene.x_prev_shift = this.scene.x;
  this.scene.y_prev_shift = this.scene.y;

  // shift scene by scaling the desired offset
  this.scene.x -= (x * this.scene.scaleX);
  this.scene.y += (y * this.scene.scaleY);
};

/**
 * @fileOverview
 * @author Bart van Vliet - bart@dobots.nl
 */

var ZoomView = function ZoomView(options) {
  	options = options || {};
  	this.rootObject = options.rootObject;
  	this.minScale = options.minScale || 0.001;

  	// get a handle to the stage
  	if (this.rootObject instanceof createjs.Stage) {
  		this.stage = this.rootObject;
  	}
  	else {
  		this.stage = this.rootObject.getStage();
  	}

  	this.center = new ROSLIB.Vector3();
  	this.startShift = new ROSLIB.Vector3();
  	this.startScale = new ROSLIB.Vector3();
};

ZoomView.prototype.startZoom = function startZoom (centerX, centerY) {
  	this.center.x = centerX;
  	this.center.y = centerY;
  	this.startShift.x = this.stage.x;
  	this.startShift.y = this.stage.y;
  	this.startScale.x = this.stage.scaleX;
  	this.startScale.y = this.stage.scaleY;
};
ZoomView.prototype.zoom = function zoom (zoom$1) {
  	// Make sure scale doesn't become too small
  	if (this.startScale.x*zoom$1 < this.minScale) {
  		zoom$1 = this.minScale/this.startScale.x;
  	}
  	if (this.startScale.y*zoom$1 < this.minScale) {
  		zoom$1 = this.minScale/this.startScale.y;
  	}

  	this.stage.scaleX = this.startScale.x*zoom$1;
  	this.stage.scaleY = this.startScale.y*zoom$1;

  	this.stage.x = this.startShift.x - (this.center.x-this.startShift.x) * (this.stage.scaleX/this.startScale.x - 1);
  	this.stage.y = this.startShift.y - (this.center.y-this.startShift.y) * (this.stage.scaleY/this.startScale.y - 1);
};

export { ArrowShape, Grid, ImageMap, ImageMapClient, NavigationArrow, NavigationImage, OccupancyGrid, OccupancyGridClient, OccupancyGridSrvClient, PanView, PathShape, PolygonMarker, TraceShape, Viewer, ZoomView };

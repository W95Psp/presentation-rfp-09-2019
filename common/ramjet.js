(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
        typeof define === 'function' && define.amd ? define(factory) :
        global.ramjet = factory()
}(this, function () { 'use strict';

		      // for the sake of Safari, may it burn in hell
		      var BLACKLIST = ['length', 'parentRule'];

		      var styleKeys = undefined;

		      if (typeof CSS2Properties !== 'undefined') {
            		  // why hello Firefox
            		  styleKeys = Object.keys(CSS2Properties.prototype);
		      } else {
            		  styleKeys = Object.keys(document.createElement('div').style).filter(function (k) {
            		      return ! ~BLACKLIST.indexOf(k);
            		  });
		      }

		      var utils_styleKeys = styleKeys;

		      var svgns = 'http://www.w3.org/2000/svg';
		      var svg = undefined;
		      try {
            		  svg = document.createElementNS(svgns, 'svg');

            		  svg.style.position = 'fixed';
            		  svg.style.top = svg.style.left = '0';
            		  svg.style.width = svg.style.height = '100%';
            		  svg.style.overflow = 'visible';
            		  svg.style.pointerEvents = 'none';
            		  svg.setAttribute('class', 'mogrify-svg');
		      } catch (e) {
            		  console.log("The current browser doesn't support SVG");
		      }

		      var appendedSvg = false;

		      function appendSvg() {
            		  document.body.appendChild(svg);
            		  appendedSvg = true;
		      }

		      function cloneNode(node, depth, overrideClone) {
            		  var clone = overrideClone ? overrideClone(node, depth) : node.cloneNode();

            		  if (typeof clone === "undefined") {
            		      return;
            		  }

            		  var style = undefined;
            		  var len = undefined;
            		  var i = undefined;
            		  var clonedNode = undefined;

            		  if (node.nodeType === 1) {
            		      style = window.getComputedStyle(node);

            		      utils_styleKeys.forEach(function (prop) {
            			  clone.style[prop] = style[prop];
            		      });

            		      len = node.childNodes.length;
            		      for (i = 0; i < len; i += 1) {
            			  clonedNode = cloneNode(node.childNodes[i], depth + 1, overrideClone);
            			  if (clonedNode) {
            			      clone.appendChild(clonedNode);
            			  }
            		      }
            		  }

            		  return clone;
		      }

		      function wrapNode(node, destinationIsFixed, overrideClone, appendToBody) {
            		  var isSvg = node.namespaceURI === svgns;

            		  var _node$getBoundingClientRect = node.getBoundingClientRect();

			  
			  let dRatioX = node.parentElement.offsetWidth / node.parentElement.getBoundingClientRect().width;
			  let dRatioY = node.parentElement.offsetHeight / node.parentElement.getBoundingClientRect().height;
			  
            		  var left   = _node$getBoundingClientRect.left;
            		  var right  = _node$getBoundingClientRect.right;
            		  var top    = _node$getBoundingClientRect.top;
            		  var bottom = _node$getBoundingClientRect.bottom;

            		  var style = window.getComputedStyle(node);
            		  var clone = cloneNode(node, 0, overrideClone);

            		  var wrapper = {
            		      node: node, clone: clone, isSvg: isSvg,
            		      cx: (left + right) / 2,
            		      cy: (top + bottom) / 2,
            		      width: right - left,
            		      height: bottom - top,
            		      transform: null,
            		      borderRadius: null
            		  };

            		  if (isSvg) {
            		      var ctm = node.getScreenCTM();
            		      wrapper.transform = 'matrix(' + [ctm.a, ctm.b, ctm.c, ctm.d, ctm.e, ctm.f].join(',') + ')';
            		      wrapper.borderRadius = [0, 0, 0, 0];

            		      svg.appendChild(clone);
            		  } else {
            		      if (destinationIsFixed) {
            			  clone.style.position = 'fixed';
            			  clone.style.top = top - parseInt(style.marginTop, 10) + 'px';
            			  clone.style.left = left - parseInt(style.marginLeft, 10) + 'px';
            		      } else {
            			  var offsetParent = node.offsetParent;

            			  if (offsetParent === null || offsetParent === document.body || appendToBody) {
            			      // parent is fixed, or I want to append the node to the body
            			      // position relative to the document
            			      var docElem = document.documentElement;
            			      clone.style.position = 'absolute';
            			      clone.style.top = top + window.pageYOffset - docElem.clientTop - parseInt(style.marginTop, 10) + 'px';
            			      clone.style.left = left + window.pageXOffset - docElem.clientLeft - parseInt(style.marginLeft, 10) + 'px';
            			  } else {
            			      //position relative to the parent
            			      var offsetParentStyle = window.getComputedStyle(offsetParent);
            			      var offsetParentBcr = offsetParent.getBoundingClientRect();

            			      clone.style.position = 'absolute';
            			      clone.style.top = top - parseInt(style.marginTop, 10) - (offsetParentBcr.top - parseInt(offsetParentStyle.marginTop, 10)) + 'px';
            			      clone.style.left = left - parseInt(style.marginLeft, 10) - (offsetParentBcr.left - parseInt(offsetParentStyle.marginLeft, 10)) + 'px';
            			  }
            		      }

            		      wrapper.transform = ''; // TODO...?
            		      wrapper.borderRadius = [parseFloat(style.borderTopLeftRadius), parseFloat(style.borderTopRightRadius), parseFloat(style.borderBottomRightRadius), parseFloat(style.borderBottomLeftRadius)];

            		      if (appendToBody) {
            			  document.body.appendChild(clone);
            		      } else {
            			  node.parentNode.appendChild(clone);
            		      }
            		  }

            		  return wrapper;
		      }

		      function hideNode(node) {
            		  node.__ramjetOriginalTransition__ = node.style.transition;
            		  node.style.transition = '';

            		  node.style.opacity = 0;
		      }

		      function showNode(node) {
            		  node.style.transition = '';
            		  node.style.opacity = 1;

            		  if (node.__ramjetOriginalTransition__) {
            		      setTimeout(function () {
            			  node.style.transition = node.__ramjetOriginalTransition__;
            		      });
            		  }
		      }

		      function isNodeFixed(node) {
            		  while (node !== null) {
            		      if (window.getComputedStyle(node).position === "fixed") {
            			  return true;
            		      }
            		      node = node.namespaceURI === svgns ? node.parentNode : node.offsetParent;
            		  }
            		  return false;
		      }

		      var utils_getTransform = getTransform;

		      function getTransform(isSvg, cx, cy, dx, dy, dsx, dsy, t, t_scale) {
            		  var transform = isSvg ? "translate(" + cx + " " + cy + ") scale(" + (1 + t_scale * dsx) + " " + (1 + t_scale * dsy) + ") translate(" + -cx + " " + -cy + ") translate(" + t * dx + " " + t * dy + ")" : "translate(" + t * dx + "px," + t * dy + "px) scale(" + (1 + t_scale * dsx) + "," + (1 + t_scale * dsy) + ")";

            		  return transform;
		      }

		      var utils_getBorderRadius = getBorderRadius;

		      function getBorderRadius(a, b, dsx, dsy, t) {
            		  var sx = 1 + t * dsx;
            		  var sy = 1 + t * dsy;

            		  return a.map(function (from, i) {
            		      var to = b[i];

            		      var rx = (from + t * (to - from)) / sx;
            		      var ry = (from + t * (to - from)) / sy;

            		      return rx + "px " + ry + "px";
            		  });
		      }

		      function linear(pos) {
            		  return pos;
		      }

		      function easeIn(pos) {
            		  return Math.pow(pos, 3);
		      }

		      function easeOut(pos) {
            		  return Math.pow(pos - 1, 3) + 1;
		      }

		      function easeInOut(pos) {
            		  if ((pos /= 0.5) < 1) {
            		      return 0.5 * Math.pow(pos, 3);
            		  }

            		  return 0.5 * (Math.pow(pos - 2, 3) + 2);
		      }

		      var rAF = window.requestAnimationFrame || window.webkitRequestAnimationFrame || function (fn) {
                          return setTimeout(fn, 16);
		      };

		      var utils_rAF = rAF;

		      function transformers_TimerTransformer___classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

		      var transformers_TimerTransformer__TimerTransformer = function TimerTransformer(from, to, options) {
            		  transformers_TimerTransformer___classCallCheck(this, transformers_TimerTransformer__TimerTransformer);

            		  var dx = to.cx - from.cx;
            		  var dy = to.cy - from.cy;

            		  var dsxf = to.width / from.width - 1;
            		  var dsyf = to.height / from.height - 1;

            		  var dsxt = from.width / to.width - 1;
            		  var dsyt = from.height / to.height - 1;

            		  var startTime = Date.now();
            		  var duration = options.duration || 400;
            		  var easing = options.easing || linear;
            		  var easingScale = options.easingScale || easing;

            		  function tick() {
            		      var timeNow = Date.now();
            		      var elapsed = timeNow - startTime;

            		      if (elapsed > duration) {
            			  from.clone.parentNode.removeChild(from.clone);
            			  to.clone.parentNode.removeChild(to.clone);

            			  if (options.done) {
            			      options.done();
            			  }

            			  return;
            		      }

            		      var t = easing(elapsed / duration);
            		      var t_scale = easingScale(elapsed / duration);

            		      // opacity
            		      from.clone.style.opacity = 1 - t;
            		      to.clone.style.opacity = t;

            		      // border radius
            		      var fromBorderRadius = utils_getBorderRadius(from.borderRadius, to.borderRadius, dsxf, dsyf, t);
            		      var toBorderRadius = utils_getBorderRadius(to.borderRadius, from.borderRadius, dsxt, dsyt, 1 - t);

            		      applyBorderRadius(from.clone, fromBorderRadius);
            		      applyBorderRadius(to.clone, toBorderRadius);

            		      var cx = from.cx + dx * t;
            		      var cy = from.cy + dy * t;

            		      var fromTransform = utils_getTransform(from.isSvg, cx, cy, dx, dy, dsxf, dsyf, t, t_scale) + ' ' + from.transform;
            		      var toTransform = utils_getTransform(to.isSvg, cx, cy, -dx, -dy, dsxt, dsyt, 1 - t, 1 - t_scale) + ' ' + to.transform;

            		      if (from.isSvg) {
            			  from.clone.setAttribute('transform', fromTransform);
            		      } else {
            			  from.clone.style.transform = from.clone.style.webkitTransform = from.clone.style.msTransform = fromTransform;
            		      }

            		      if (to.isSvg) {
            			  to.clone.setAttribute('transform', toTransform);
            		      } else {
            			  to.clone.style.transform = to.clone.style.webkitTransform = to.clone.style.msTransform = toTransform;
            		      }

            		      utils_rAF(tick);
            		  }

            		  tick();
		      };

		      var transformers_TimerTransformer = transformers_TimerTransformer__TimerTransformer;

		      function applyBorderRadius(node, borderRadius) {
            		  node.style.borderTopLeftRadius = borderRadius[0];
            		  node.style.borderTopRightRadius = borderRadius[1];
            		  node.style.borderBottomRightRadius = borderRadius[2];
            		  node.style.borderBottomLeftRadius = borderRadius[3];
		      }

		      var div = document.createElement('div');

		      var keyframesSupported = true;
		      var TRANSFORM = undefined;
		      var KEYFRAMES = undefined;
		      var ANIMATION_DIRECTION = undefined;
		      var ANIMATION_DURATION = undefined;
		      var ANIMATION_ITERATION_COUNT = undefined;
		      var ANIMATION_NAME = undefined;
		      var ANIMATION_TIMING_FUNCTION = undefined;
		      var ANIMATION_END = undefined;

		      // We have to browser-sniff for IE11, because it was apparently written
		      // by a barrel of stoned monkeys - http://jsfiddle.net/rich_harris/oquLu2qL/

		      // http://stackoverflow.com/questions/17907445/how-to-detect-ie11
		      var isIe11 = !window.ActiveXObject && 'ActiveXObject' in window;

		      if (!isIe11 && ('transform' in div.style || 'webkitTransform' in div.style) && ('animation' in div.style || 'webkitAnimation' in div.style)) {
            		  keyframesSupported = true;

            		  TRANSFORM = 'transform' in div.style ? 'transform' : '-webkit-transform';

            		  if ('animation' in div.style) {
            		      KEYFRAMES = '@keyframes';

            		      ANIMATION_DIRECTION = 'animationDirection';
            		      ANIMATION_DURATION = 'animationDuration';
            		      ANIMATION_ITERATION_COUNT = 'animationIterationCount';
            		      ANIMATION_NAME = 'animationName';
            		      ANIMATION_TIMING_FUNCTION = 'animationTimingFunction';

            		      ANIMATION_END = 'animationend';
            		  } else {
            		      KEYFRAMES = '@-webkit-keyframes';

            		      ANIMATION_DIRECTION = 'webkitAnimationDirection';
            		      ANIMATION_DURATION = 'webkitAnimationDuration';
            		      ANIMATION_ITERATION_COUNT = 'webkitAnimationIterationCount';
            		      ANIMATION_NAME = 'webkitAnimationName';
            		      ANIMATION_TIMING_FUNCTION = 'webkitAnimationTimingFunction';

            		      ANIMATION_END = 'webkitAnimationEnd';
            		  }
		      } else {
            		  keyframesSupported = false;
		      }

		      function transformers_KeyframeTransformer___classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

		      var transformers_KeyframeTransformer__KeyframeTransformer = function KeyframeTransformer(from, to, options) {
            		  transformers_KeyframeTransformer___classCallCheck(this, transformers_KeyframeTransformer__KeyframeTransformer);

            		  var _getKeyframes = getKeyframes(from, to, options);

            		  var fromKeyframes = _getKeyframes.fromKeyframes;
            		  var toKeyframes = _getKeyframes.toKeyframes;

            		  var fromId = '_' + ~ ~(Math.random() * 1000000);
            		  var toId = '_' + ~ ~(Math.random() * 1000000);

            		  var css = KEYFRAMES + ' ' + fromId + ' { ' + fromKeyframes + ' } ' + KEYFRAMES + ' ' + toId + ' { ' + toKeyframes + ' }';
            		  var dispose = addCss(css);

            		  from.clone.style[ANIMATION_DIRECTION] = 'alternate';
            		  from.clone.style[ANIMATION_DURATION] = options.duration / 1000 + 's';
            		  from.clone.style[ANIMATION_ITERATION_COUNT] = 1;
            		  from.clone.style[ANIMATION_NAME] = fromId;
            		  from.clone.style[ANIMATION_TIMING_FUNCTION] = 'linear';

            		  to.clone.style[ANIMATION_DIRECTION] = 'alternate';
            		  to.clone.style[ANIMATION_DURATION] = options.duration / 1000 + 's';
            		  to.clone.style[ANIMATION_ITERATION_COUNT] = 1;
            		  to.clone.style[ANIMATION_NAME] = toId;
            		  to.clone.style[ANIMATION_TIMING_FUNCTION] = 'linear';

            		  var fromDone = undefined;
            		  var toDone = undefined;

            		  function done() {
            		      if (fromDone && toDone) {
            			  from.clone.parentNode.removeChild(from.clone);
            			  to.clone.parentNode.removeChild(to.clone);

            			  if (options.done) options.done();

            			  dispose();
            		      }
            		  }

            		  from.clone.addEventListener(ANIMATION_END, function () {
            		      fromDone = true;
            		      done();
            		  });

            		  to.clone.addEventListener(ANIMATION_END, function () {
            		      toDone = true;
            		      done();
            		  });
		      };

		      var transformers_KeyframeTransformer = transformers_KeyframeTransformer__KeyframeTransformer;

		      function addCss(css) {
            		  var styleElement = document.createElement('style');
            		  styleElement.type = 'text/css';

            		  var head = document.getElementsByTagName('head')[0];

            		  // Internet Exploder won't let you use styleSheet.innerHTML - we have to
            		  // use styleSheet.cssText instead
            		  var styleSheet = styleElement.styleSheet;

            		  if (styleSheet) {
            		      styleSheet.cssText = css;
            		  } else {
            		      styleElement.innerHTML = css;
            		  }

            		  head.appendChild(styleElement);

            		  return function () {
            		      return head.removeChild(styleElement);
            		  };
		      }

		      function getKeyframes(from, to, options) {
            		  var dx = to.cx - from.cx;
            		  var dy = to.cy - from.cy;

            		  var dsxf = to.width / from.width - 1;
            		  var dsyf = to.height / from.height - 1;

            		  var dsxt = from.width / to.width - 1;
            		  var dsyt = from.height / to.height - 1;

            		  var easing = options.easing || linear;
            		  var easingScale = options.easingScale || easing;

            		  var numFrames = options.duration / 50; // one keyframe per 50ms is probably enough... this may prove not to be the case though

            		  var fromKeyframes = [];
            		  var toKeyframes = [];
            		  var i;

            		  function addKeyframes(pc, t, t_scale) {
            		      var cx = from.cx + dx * t;
            		      var cy = from.cy + dy * t;

            		      var fromBorderRadius = utils_getBorderRadius(from.borderRadius, to.borderRadius, dsxf, dsyf, t);
            		      var toBorderRadius = utils_getBorderRadius(to.borderRadius, from.borderRadius, dsxt, dsyt, 1 - t);

            		      var fromTransform = utils_getTransform(false, cx, cy, dx, dy, dsxf, dsyf, t, t_scale) + ' ' + from.transform;
            		      var toTransform = utils_getTransform(false, cx, cy, -dx, -dy, dsxt, dsyt, 1 - t, 1 - t_scale) + ' ' + to.transform;

            		      fromKeyframes.push('\n\t\t\t' + pc + '% {\n\t\t\t\topacity: ' + (1 - t) + ';\n\t\t\t\tborder-top-left-radius: ' + fromBorderRadius[0] + ';\n\t\t\t\tborder-top-right-radius: ' + fromBorderRadius[1] + ';\n\t\t\t\tborder-bottom-right-radius: ' + fromBorderRadius[2] + ';\n\t\t\t\tborder-bottom-left-radius: ' + fromBorderRadius[3] + ';\n\t\t\t\t' + TRANSFORM + ': ' + fromTransform + ';\n\t\t\t}');

            		      toKeyframes.push('\n\t\t\t' + pc + '% {\n\t\t\t\topacity: ' + t + ';\n\t\t\t\tborder-top-left-radius: ' + toBorderRadius[0] + ';\n\t\t\t\tborder-top-right-radius: ' + toBorderRadius[1] + ';\n\t\t\t\tborder-bottom-right-radius: ' + toBorderRadius[2] + ';\n\t\t\t\tborder-bottom-left-radius: ' + toBorderRadius[3] + ';\n\t\t\t\t' + TRANSFORM + ': ' + toTransform + ';\n\t\t\t}');
            		  }

            		  for (i = 0; i < numFrames; i += 1) {
            		      var pc = 100 * (i / numFrames);
            		      var t = easing(i / numFrames);
            		      var t_scale = easingScale(i / numFrames);

            		      addKeyframes(pc, t, t_scale);
            		  }

            		  addKeyframes(100, 1, 1);

            		  fromKeyframes = fromKeyframes.join('\n');
            		  toKeyframes = toKeyframes.join('\n');

            		  return { fromKeyframes: fromKeyframes, toKeyframes: toKeyframes };
		      }

		      var ramjet = {
            		  transform: function (fromNode, toNode) {
            		      var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

            		      if (typeof options === 'function') {
            			  options = { done: options };
            		      }

            		      if (!('duration' in options)) {
            			  options.duration = 400;
            		      }

            		      var appendToBody = !!options.appendToBody;
            		      var destinationIsFixed = isNodeFixed(toNode);
            		      var from = wrapNode(fromNode, destinationIsFixed, options.overrideClone, appendToBody);
            		      var to = wrapNode(toNode, destinationIsFixed, options.overrideClone, appendToBody);

            		      if (from.isSvg || to.isSvg && !appendedSvg) {
            			  appendSvg();
            		      }

            		      if (!keyframesSupported || options.useTimer || from.isSvg || to.isSvg) {
            			  return new transformers_TimerTransformer(from, to, options);
            		      } else {
            			  return new transformers_KeyframeTransformer(from, to, options);
            		      }
            		  },

            		  hide: function () {
            		      for (var _len = arguments.length, nodes = Array(_len), _key = 0; _key < _len; _key++) {
            			  nodes[_key] = arguments[_key];
            		      }

            		      nodes.forEach(hideNode);
            		  },

            		  show: function () {
            		      for (var _len2 = arguments.length, nodes = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            			  nodes[_key2] = arguments[_key2];
            		      }

            		      nodes.forEach(showNode);
            		  },

            		  // expose some basic easing functions
            		  linear: linear, easeIn: easeIn, easeOut: easeOut, easeInOut: easeInOut
		      };

		      return ramjet;

		    }));

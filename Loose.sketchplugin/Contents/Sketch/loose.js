var that = this;
function run (key, context) {
  that.context = context;

var exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
var BASE_ARROW_SIZE = 8;
var ARROW_NAME_SUFFIX = "-LOOSE!";
var ARROW_START = "start";
var ARROW_END = "end";
var ARROW_START_NAME = "ArrowheadStart";
var ARROW_END_NAME = "ArrowheadEnd";

var createArrowhead = function createArrowhead(_ref) {
  var layer = _ref.layer,
      name = _ref.name,
      headPosition = _ref.headPosition,
      headType = _ref.headType,
      headScale = _ref.headScale;

  headPosition = typeof headPosition !== "undefined" ? headPosition : ARROW_END;
  headType = typeof headType !== "undefined" ? headType : "fill";
  headScale = typeof headScale !== "undefined" ? headScale : "default";

  var path = layer.bezierPathWithTransforms();
  var lineThickness = layer.style().borders().firstObject().thickness();
  var length = path.length();
  var scale = 1 + lineThickness / 5;

  var position = headPosition == ARROW_END ? length : 0;
  //line end
  var endPoint = path.pointOnPathAtLength(position);
  //nextpoint on path
  var arrowBase = headPosition == ARROW_END ? position - BASE_ARROW_SIZE : position + BASE_ARROW_SIZE;
  var linePoint = path.pointOnPathAtLength(arrowBase);
  var angle = 360 / (2 * Math.PI) * Math.atan2(linePoint.y - endPoint.y, linePoint.x - endPoint.x);

  var headPath = NSBezierPath.bezierPath();
  headPath.moveToPoint(NSMakePoint(0, BASE_ARROW_SIZE));
  headPath.lineToPoint(NSMakePoint(-BASE_ARROW_SIZE * 2, 0));
  headPath.lineToPoint(NSMakePoint(0, -BASE_ARROW_SIZE));
  headPath.closePath();

  var headShape = MSShapeGroup.shapeWithBezierPath(headPath);
  headShape.frame().setWidth(Math.floor(headShape.frame().width() * scale));
  headShape.frame().setHeight(Math.floor(headShape.frame().height() * scale));

  headShape.setRotation(-1 * angle);

  headShape.frame().setX(endPoint.x - headShape.frame().width() / 2);
  headShape.frame().setY(endPoint.y - headShape.frame().height() / 2);

  var fill = headShape.style().addStylePartOfType(0);
  fill.color = layer.style().borders().firstObject().color();
  if (!!name) {
    headShape.setName(name);
  }
  return headShape;
};

var groupAndResize = function groupAndResize(group, children) {
  group.addLayers(children);
  group.resizeToFitChildrenWithOption(0);
  return group;
};

var setupArrow = function setupArrow(doc, layer) {
  var parent = layer.parentGroup();
  var group = MSLayerGroup["new"]();
  parent.removeLayer(layer);
  parent.addLayers([group]);
  var name = layer.name();
  group.setName(name.indexOf(ARROW_NAME_SUFFIX) === -1 ? name + ARROW_NAME_SUFFIX : name);
  return groupAndResize(group, [layer]);
};

var createHead = function createHead(group, line) {
  var start = createArrowhead({
    layer: line,
    headPosition: "start",
    name: "ArrowheadStart"
  });
  groupAndResize(group, [start]);
};

var createNock = function createNock(group, line) {
  var end = createArrowhead({
    layer: line,
    headPosition: "end",
    name: "ArrowheadEnd"
  });
  groupAndResize(group, [end]);
};

var grabItems = function grabItems(group) {
  var start, end, line;
  group.layers().forEach(function (child) {
    if (child.name() == ARROW_START_NAME) {
      start = child;
    } else if (child.name() == ARROW_END_NAME) {
      end = child;
    } else {
      line = child;
    }
  });
  return { start: start, end: end, line: line };
};

var toggleArrows = function toggleArrows(group, head, nock) {
  var _grabItems = grabItems(group),
      start = _grabItems.start,
      end = _grabItems.end,
      line = _grabItems.line;

  if (head && nock) {
    group.removeLayer(start);
    group.removeLayer(end);
    if (!!start && !!end) {
      createNock(group, line);
    }
    if (!start && !!end) {
      createHead(group, line);
    }
    if (!start && !end) {
      createHead(group, line);
      createNock(group, line);
    }
    //if (!!start && !end)
    // remove both
  } else if (head && !nock) {
    group.removeLayer(end);
    if (!end) createNock(group, line);
  } else if (nock && !head) {
    group.removeLayer(start);
    if (!start) createHead(group, line);
  }
};

var isCompletShape = function isCompletShape(layer) {
  var path = layer.bezierPathWithTransforms();
  var start = path.pointOnPathAtLength(0);
  var end = path.pointOnPathAtLength(path.length());
  var startx = Math.floor(start.x);
  var starty = Math.floor(start.y);
  var endx = Math.floor(end.x);
  var endy = Math.floor(end.y);
  //lol can't math with floats for some reason.
  return startx === endx && starty === endy;
};

var arrowMaker = function arrowMaker(context, head, nock) {
  var doc = context.document;
  var selectedLayers = context.selection;
  var selectedCount = selectedLayers.count();

  var sketch = context.api();
  var document = sketch.selectedDocument;
  document.selectedLayers.clear();

  if (selectedCount == 0) {
    doc.showMessage("Oops, no selection.");
  } else {
    var arrows = [];
    for (var i = 0; i < selectedCount; i++) {
      var layer = selectedLayers[i];
      if (layer.isKindOfClass(MSShapeGroup)) {
        if (isCompletShape(layer)) {
          doc.showMessage("Skipping layer, I'll only add arrows to lines.");
        } else {
          var newArrow = setupArrow(doc, layer);
          toggleArrows(newArrow, head, nock);
          arrows.push(newArrow);
        }
      } else if (layer.isKindOfClass(MSLayerGroup)) {
        toggleArrows(layer, head, nock);
        arrows.push(layer);
      }
    }
    //push arrows to selection so you can keep toggeling + resize
    arrows.forEach(function (arrow) {
      document.layerWithID(arrow.objectID()).addToSelection();
    });
  }
};

var toggleTip = function toggleTip(context) {
  var nock = false;
  var head = true;
  arrowMaker(context, head, nock);
};

var toggleNock = function toggleNock(context) {
  var nock = true;
  var head = false;
  arrowMaker(context, head, nock);
};

var toggleBoth = function toggleBoth(context) {
  var nock = true;
  var head = true;
  arrowMaker(context, head, nock);
};

exports.toggleBoth = toggleBoth;
exports.toggleNock = toggleNock;
exports.toggleTip = toggleTip;
//toggleBoth(context);
//toggleTip(context);
//toggleNock(context);

/***/ })
/******/ ]);
  if (key === 'default' && typeof exports === 'function') {
    exports(context);
  } else {
    exports[key](context);
  }
}
that['toggleBoth'] = run.bind(this, 'toggleBoth');
that['onRun'] = run.bind(this, 'default');
that['toggleTip'] = run.bind(this, 'toggleTip');
that['toggleNock'] = run.bind(this, 'toggleNock')

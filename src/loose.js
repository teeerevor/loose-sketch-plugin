const BASE_ARROW_SIZE = 8;
const ARROW_NAME_SUFFIX = "-LOOSE!";
const ARROW_START = "start";
const ARROW_END = "end";
const ARROW_START_NAME = "ArrowheadStart";
const ARROW_END_NAME = "ArrowheadEnd";

const createArrowhead = ({
  layer,
  name,
  headPosition,
  headType,
  headScale
}) => {
  headPosition = typeof headPosition !== "undefined" ? headPosition : ARROW_END;
  headType = typeof headType !== "undefined" ? headType : "fill";
  headScale = typeof headScale !== "undefined" ? headScale : "default";

  var path = layer.bezierPathWithTransforms();
  const lineThickness = layer
    .style()
    .borders()
    .firstObject()
    .thickness();
  const length = path.length();
  const scale = 1 + lineThickness / 5;

  const position = headPosition == ARROW_END ? length : 0;
  //line end
  const endPoint = path.pointOnPathAtLength(position);
  //nextpoint on path
  const arrowBase =
    headPosition == ARROW_END
      ? position - BASE_ARROW_SIZE
      : position + BASE_ARROW_SIZE;
  const linePoint = path.pointOnPathAtLength(arrowBase);
  const angle =
    360 /
    (2 * Math.PI) *
    Math.atan2(linePoint.y - endPoint.y, linePoint.x - endPoint.x);

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
  fill.color = layer
    .style()
    .borders()
    .firstObject()
    .color();
  if (!!name) {
    headShape.setName(name);
  }
  return headShape;
};

const groupAndResize = (group, children) => {
  group.addLayers(children);
  group.resizeToFitChildrenWithOption(0);
  return group;
};

const createArrow = (doc, layer, arrowPosition, arrowType, arrowScale) => {
  var arrowheadStart = createArrowhead({
    layer,
    headPosition: ARROW_START,
    name: ARROW_START_NAME
  });

  var arrowheadEnd = createArrowhead({
    layer,
    headPosition: ARROW_END,
    name: ARROW_END_NAME
  });

  var parent = layer.parentGroup();
  var group = MSLayerGroup.new();
  parent.removeLayer(layer);
  parent.addLayers([group]);
  const name = layer.name();
  group.setName(
    name.indexOf(ARROW_NAME_SUFFIX) === -1 ? name + ARROW_NAME_SUFFIX : name
  );
  return groupAndResize(group, [layer, arrowheadStart, arrowheadEnd]);
};

const createHead = (group, line) => {
  const start = createArrowhead({
    layer: line,
    headPosition: "start",
    name: "ArrowheadStart"
  });
  groupAndResize(group, [start]);
};
const createNock = (group, line) => {
  const end = createArrowhead({
    layer: line,
    headPosition: "end",
    name: "ArrowheadEnd"
  });
  groupAndResize(group, [end]);
};
const grabItems = group => {
  var start, end, line;
  group.layers().forEach(child => {
    if (child.name() == ARROW_START_NAME) {
      start = child;
    } else if (child.name() == ARROW_END_NAME) {
      end = child;
    } else {
      line = child;
    }
  });
  return { start, end, line };
};

const toggleArrows = (group, head, nock) => {
  log('head='+head);
  log('nock='+nock);
  const { start, end, line } = grabItems(group);

  if (head && nock) {
    group.removeLayer(start);
    group.removeLayer(end);
    if (!!start && !!end) {
      createNock(group, line);
    }
    if (!start && !!end) {
      createHead(group, line);
    }
    if (!!start && !end) {
      createHead(group, line);
      createNock(group, line);
    }
  } else if (head && !nock) {
    group.removeLayer(end);
    if (!end)
      createNock(group, line);
  } else if (nock && !head) {
    group.removeLayer(start);
    if (!start)
      createHead(group, line);
  }
};

const isCompletShape = layer => {
  const path = layer.bezierPathWithTransforms();
  const start = path.pointOnPathAtLength(0);
  const end = path.pointOnPathAtLength(path.length());
  const startx = Math.floor(start.x);
  const starty = Math.floor(start.y);
  const endx = Math.floor(end.x);
  const endy = Math.floor(end.y);
  //lol can't math with floats for some reason.
  return startx === endx && starty === endy;
};

const arrowsWork = (context, head, nock) => {
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
          arrows.push(createArrow(doc, layer));
        }
      } else if (layer.isKindOfClass(MSLayerGroup)) {
        toggleArrows(layer, head, nock);
        arrows.push(layer);
      }
    }
    //push arrows to selection so you can keep toggeling + resize
    arrows.forEach(arrow => {
      document.layerWithID(arrow.objectID()).addToSelection();
    });
  }
};

var toggleTip = function(context) {
  const nock = false;
  const head = true;
  arrowsWork(context, head, nock);
};

var toggleNock = function(context) {
  const nock = true;
  const head = false;
  arrowsWork(context, head, nock);
};

var toggleBoth = function(context) {
  const nock = true;
  const head = true;
  arrowsWork(context, head, nock);
};

export {toggleBoth, toggleNock, toggleTip};
//toggleBoth(context);
//toggleTip(context);
//toggleNock(context);

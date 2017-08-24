//resize arrow scale up/down

const createArrowhead = (layer, headPosition, headType, headScale) => {
  log(layer.class());
  const baseArrowSize = 4
  headPosition = (typeof headPosition !== 'undefined') ?  headPosition : 'end';
  // arrowPosition - which end of path to attach arrowhead
  // 0=begin, 1=end of path, 2=both ends

  headType = (typeof headType !== 'undefined') ?  headType : 'fill';
  // arrowType - what shape arrowhead should be
  // 0=filled triangle

  headScale = (typeof headScale !== 'undefined') ?  headScale : 'default';
  // TBD pass in scale, allow for different ends for arrowhead

  //split line depending on how curvy it is, with at least 2 points
  var path = layer.bezierPathWithTransforms();
  const lineThickness = layer.style().borders().firstObject().thickness();
  const length = path.length();
  const scale = 1+(lineThickness/5);

  const position = headPosition == 'end' ? length : 0;
  //line end
  const endPoint = path.pointOnPathAtLength(position);
  //nextpoint on path
  const arrowBase = headPosition == 'end' ? position - baseArrowSize : position + baseArrowSize
  const linePoint = path.pointOnPathAtLength(arrowBase);
  const angle = 360/(2*Math.PI) * (Math.atan2(linePoint.y - endPoint.y, linePoint.x - endPoint.x));

  //0 - triangle as arrowhead
  //TBD: different shapes
  var headPath = NSBezierPath.bezierPath();
  headPath.moveToPoint(NSMakePoint(0,baseArrowSize));
  headPath.lineToPoint(NSMakePoint(-baseArrowSize*2,0));
  headPath.lineToPoint(NSMakePoint(0,-baseArrowSize));
  headPath.closePath();

  var headShape = MSShapeGroup.shapeWithBezierPath(headPath);
  headShape.frame().setWidth(Math.floor(headShape.frame().width()*scale));
  headShape.frame().setHeight(Math.floor(headShape.frame().height()*scale));

  //rotate
  headShape.setRotation(-1*angle);

  //move center to endpoint of line
  headShape.frame().setX(endPoint.x - headShape.frame().width()/2);
  headShape.frame().setY(endPoint.y - headShape.frame().height()/2);

  //color same as line
  var fill = headShape.style().addStylePartOfType(0);
  fill.color = layer.style().borders().firstObject().color();

  return headShape;
}


const createArrow = (doc, layer, arrowPosition, arrowType, arrowScale) => {
  var arrowheadStart = createArrowhead(layer, 'start')
  arrowheadStart.setName('ArrowheadStart');
  var arrowheadEnd = createArrowhead(layer, 'end')
  arrowheadEnd.setName('ArrowheadEnd');

  //add to layer and group it with path

  var parent = layer.parentGroup();
  var group = MSLayerGroup.new();
  parent.removeLayer(layer);
  parent.addLayers([group]);
  group.addLayers([layer, arrowheadStart, arrowheadEnd]);
  //group.adjustToFit();
  group.resizeToFitChildrenWithOption(0);
  if ((layer.name() == 'Line') || (layer.name() == 'Path')) {
    group.setName('Arrow');
  } else {
    group.setName(layer.name());
  }
  return group;
}

const toggleArrows = (group) => {
  var start, end;
  var children = group.children();
  for (var j = 0; j < children.count(); j++) {
    var child = children[j];
    if (child.name() == 'ArrowheadStart')
      start = child;
    if (child.name() == 'ArrowheadEnd')
      end = child;
  }
  if (end && start) {
    var startOpacity = start.style().contextSettings().opacity();
    var endOpacity = end.style().contextSettings().opacity();
    if(startOpacity == 1 && endOpacity == 1 ){
      start.style().contextSettings().setOpacity(0);
    }
    if(startOpacity == 0 && endOpacity == 1 ){
      end.style().contextSettings().setOpacity(0);
      start.style().contextSettings().setOpacity(1);
    }
    if(startOpacity == 1 && endOpacity == 0 ){
      end.style().contextSettings().setOpacity(1);
    }
  }
}
const isCompletShape = (layer) =>{
  const path = layer.bezierPathWithTransforms();
  const start = path.pointOnPathAtLength(0);
  const end = path.pointOnPathAtLength(path.length());
  const startx = Math.floor(start.x);
  const starty = Math.floor(start.y);
  const endx = Math.floor(end.x);
  const endy = Math.floor(end.y);
  //lol can't math with floats for some reason.
  return startx === endx && starty === endy;
}

const onRun = (context) => {
  var doc = context.document;
  var selectedLayers = context.selection;
  var selectedCount = selectedLayers.count();

  var sketch = context.api();
  var document = sketch.selectedDocument;
  document.selectedLayers.clear();

  if (selectedCount == 0) {
    doc.showMessage('Oops, no selection.');
  } else {
    var arrows = [];
    for (var i = 0; i < selectedCount; i++) {
      var layer = selectedLayers[i];
      if (layer.isKindOfClass(MSShapeGroup)){
        if(isCompletShape(layer)){
          doc.showMessage("Skipping layer, I'll only add arrows to lines.");
        } else {
          arrows.push(createArrow(doc, layer));
        }
      } else if (layer.isKindOfClass(MSLayerGroup)){
        toggleArrows(layer);
        arrows.push(layer);
      }
    }
    //add arrows to selection so you can keep hitting
    // cmd l to toggle arrowheads
    for (var i = 0; i < arrows.length; i++) {
      var arrow = arrows[i];
      document.layerWithID(arrow.objectID()).addToSelection();
    }
  }
}
onRun(context);

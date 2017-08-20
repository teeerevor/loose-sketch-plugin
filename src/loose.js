const createArrowhead = (layer, headPosition, headType, headScale) => {
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
  var count = path.elementCount()*2;

  //hacky way of avoiding weirdly angled arrowheads for tight curves
  //handle spirals by choosing the greater number
  if (count<50) {
    count=50;
  }
  var length = path.length();
  var step = length/count;

  //but also make sure a step is at minimum the arrowhead size
  var lineThickness = layer.style().borders()[0].thickness();

  context.document.showMessage("thickness = ( " + lineThickness + " )");
  var scale = 1+(lineThickness/5);
  if (step < (scale*7)) {
    step = scale*7;
  }

  var position = headPosition == 'end' ? length : 0;
  var endPoint = path.pointOnPathAtLength(position);
  var linePoint = path.pointOnPathAtLength(headPosition == 'end' ? position-step : position+step);
  var angle = 360/(2*Math.PI) * (Math.atan2(linePoint.y - endPoint.y, linePoint.x - endPoint.x));

  //0 - triangle as arrowhead
  //TBD: different shapes
  var headPath = NSBezierPath.bezierPath();
  headPath.moveToPoint(NSMakePoint(0,7));
  headPath.lineToPoint(NSMakePoint(-14,0));
  headPath.lineToPoint(NSMakePoint(0,-7));
  headPath.closePath();

  var headShape = MSShapeGroup.shapeWithBezierPath(headPath);

  //scale to lineweight
  //TBD: user input
  var scale = 1+(lineThickness/5);
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
        arrows.push(createArrow(doc, layer));
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

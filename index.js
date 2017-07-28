var vec3 = require('gl-vec3')
var Heap = require('heap')
var complex = require('simplicial-complex')

module.exports = function(cells, positions, threshold, maxIterations) {
  var scratch = new Array(3);
  var edges = complex.unique(complex.skeleton(cells, 1));
  var heap = new Heap((a, b) => b.squaredLength - a.squaredLength);
  edges.map(function(edge) {
    vec3.subtract(scratch, positions[edge[0]], positions[edge[1]]);
    heap.push({
      squaredLength: vec3.squaredLength(scratch),
      edge: edge
    });
  });

  if (threshold == null) {
    var meanEdgeLength = 0;
    heap.toArray().map(function(element) {
      meanEdgeLength += Math.sqrt(element.squaredLength);
    })
    meanEdgeLength /= heap.size();
    threshold = meanEdgeLength;
  }

  var squaredThreshold = threshold * threshold;
  var count = 0;
  while (true) {
    count += 1;
    if ((maxIterations != null) && (count > maxIterations)) {
      break;
    }

    var element = heap.pop();
    if (element.squaredLength < squaredThreshold) {
      break;
    }

    var edge = element.edge;
    vec3.add(scratch, positions[edge[0]], positions[edge[1]]);
    vec3.scale(scratch, scratch, 0.5);
    var newVertexIndex = positions.push(scratch.slice()) - 1;

    // normalization changes in-place
    var normalizedEdge = edge.slice();
    var incidence = complex.incidence(complex.normalize([normalizedEdge]), cells)[0];
    var cellsToBeDeleted = incidence;
    var edgesToBeAdded = new Set();
    incidence.map(function(cellIndex) {
      var cell = cells[cellIndex];
      var oppositeVertex = cell.find(function(index) {
        return !edge.includes(index);
      });

      if (typeof oppositeVertex == 'undefined') {
        throw `Degenerate cell in complex ${cell}, index ${cellIndex}`;
      }

      var newCells = [];
      for (var i = 0; i < 2; i++) {
        // preserve orientation
        var newCell = cell.slice();
        newCell[newCell.indexOf(edge[(i + 1) % 2])] = newVertexIndex;
        newCells.push(newCell);
      }
      newCells = complex.normalize(newCells);
      newCells.map(function(cell) {
        cells.push(cell);
      });

      var hypotenuse = [oppositeVertex, newVertexIndex];
      var halfA = [edge[0], newVertexIndex];
      var halfB = [edge[1], newVertexIndex];
      var newEdges = complex.normalize([hypotenuse, halfA, halfB]);
      newEdges.map(function(newEdge) {
        edgesToBeAdded.add(newEdge);
      });
    });

    edgesToBeAdded.forEach(function(newEdge) {
      vec3.subtract(scratch, positions[newEdge[0]], positions[newEdge[1]]);
      heap.push({
        squaredLength: vec3.squaredLength(scratch),
        edge: newEdge
      });
    });

    cellsToBeDeleted.sort().reverse().forEach(function(cellIndex) {
      cells.splice(cellIndex, 1);
    });
    complex.normalize(cells);
  }

  return {
    positions: positions,
    cells: cells
  };
}

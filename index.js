var vec3 = require('gl-vec3');
var Heap = require('heap');
var complex = require('simplicial-complex');

module.exports = function(cells, positions, threshold, maxIterations) {
  var scratch = new Array(3);
  var edges = complex.unique(complex.skeleton(cells, 1));
  var heap = new Heap((a, b) => b.squaredLength - a.squaredLength);
  edges.map(function(edge, i) {
    vec3.subtract(scratch, positions[edge[0]], positions[edge[1]]);
    heap.push({
      squaredLength: vec3.squaredLength(scratch),
      edge: edge,
      index: i
    });
  });

  if (threshold == null) {
    var meanEdgeLength = 0;
    heap.toArray().map(function(element) {
      meanEdgeLength += Math.sqrt(element.squaredLength);
    });
    meanEdgeLength /= heap.size();
    threshold = meanEdgeLength;
  }

  var incidence = complex.incidence(edges, cells);
  var cellsToBeDeleted = [];
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

    var edgesToBeAdded = [];
    var newCells = [];
    var newCellIndices = [];
    var edgesWithModifiedIncidence = [];
    incidence[element.index].map(function(cellIndex) {
      cellsToBeDeleted.push(cellIndex);
      var cell = cells[cellIndex];
      var oppositeVertex = cell.find(function(index) {
        return !edge.includes(index);
      });

      if (typeof oppositeVertex == 'undefined') {
        throw `Degenerate cell in complex ${cell}, index ${cellIndex}`;
      }

      for (var i = 0; i < 2; i++) {
        // preserve orientation
        var newCell = cell.slice();
        newCell[newCell.indexOf(edge[(i + 1) % 2])] = newVertexIndex;
        newCells.push(newCell);
        var newCellIndex = cells.push(newCell) - 1;
        newCellIndices.push(newCellIndex);
      }

      var hypotenuse = [oppositeVertex, newVertexIndex];
      var halfA = [edge[0], newVertexIndex];
      var halfB = [edge[1], newVertexIndex];
      [hypotenuse, halfA, halfB].map(function(newEdge) {
        edgesToBeAdded.push(newEdge);
      });
    });

    complex.unique(complex.normalize(edgesToBeAdded));
    var edgesWithModifiedIncidence = complex.unique(complex.skeleton(newCells, 1));
    var incidentCells = complex.incidence(edgesWithModifiedIncidence, newCells);
    edgesWithModifiedIncidence.map(function(modifiedEdge, i) {
      var edgeToCellIncidence = incidentCells[i].map(function(cellIndex) {
        return newCellIndices[cellIndex];
      });

      if (complex.findCell(edgesToBeAdded, modifiedEdge) >= 0) {
        var edgeIndex = incidence.push(edgeToCellIncidence) - 1;
        vec3.subtract(scratch, positions[modifiedEdge[0]], positions[modifiedEdge[1]]);
        edges.push(modifiedEdge);
        heap.push({
          squaredLength: vec3.squaredLength(scratch),
          edge: modifiedEdge,
          index: edgeIndex
        });
      } else {
        var edgeIndex = -1;
        for (var i = 0; i < edges.length; i++) {
          if ((modifiedEdge.indexOf(edges[i][0]) !== -1) &&
              (modifiedEdge.indexOf(edges[i][1]) !== -1)) {
            edgeIndex = i;
            break;
          }
        }

        if (edgeIndex === -1) {
          return;
        }

        edgeToCellIncidence.map(function(cell) {
          incidence[edgeIndex].push(cell);
        });

        incidence[edgeIndex] = incidence[edgeIndex].filter(function(cell) {
          return cellsToBeDeleted.indexOf(cell) === -1;
        });
      }
    });
  }

  cellsToBeDeleted.sort(function(a, b) {
    return b - a;
  }).map(function(cellIndex) {
    cells.splice(cellIndex, 1);
  });

  return {
    positions: positions,
    cells: cells
  };
}

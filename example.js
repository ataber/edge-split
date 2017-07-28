// var bunny = require('bunny');
var split = require('./index');
// var refined = split(bunny.cells, bunny.positions, 0.5, 100);

var cylinder = require('primitive-cylinder')(1, 1, 5, 4, 4);
var refined = split(cylinder.cells, cylinder.positions, null, 3);
var norms = require('normals').vertexNormals(refined.cells, refined.positions);
console.log(refined, norms)
var shell = require("mesh-viewer")();
shell.on("viewer-init", function() {
  mesh = shell.createMesh({
    positions: refined.positions,
    cells: refined.cells,
    vertexNormals: norms,
  })
});

shell.on("gl-render", function() {
  mesh.draw()
});

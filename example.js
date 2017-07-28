var bunny = require('bunny');
var split = require('./index');
var refined = split(bunny.cells, bunny.positions, null, 1000);

var regl = require('regl')()
var mat4 = require('gl-mat4')
var wire = require('gl-wireframe')
var camera = require('regl-camera')(regl, {
  center: [0, 0, 0],
  theta: Math.PI / 2,
  distance: 4
})

var drawWires = regl({
  vert: `
  precision mediump float;
  attribute vec3 position;
  uniform mat4 projection;
  uniform mat4 view;
  void main() {
    gl_Position = projection * view * vec4(position, 1.0);
  }
  `, frag: `
  precision mediump float;
  void main() {
    gl_FragColor = vec4(1.0);
  }
  `,
  attributes: {
    position: refined.positions,
  },
  elements: wire(refined.cells),
  primitive: 'lines'
})

var drawOuter = regl({
  vert: `
  precision mediump float;

  attribute vec3 position;
  uniform mat4 projection;
  uniform mat4 view;

  void main() {
    gl_Position = projection * view * vec4(position, 1.0);
  }
  `
  , frag: `
  precision mediump float;

  void main() {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
  }
  `,
  attributes: {
    position: refined.positions,
  },
  elements: refined.cells,
  primitive: 'triangles'
})

regl.frame(() => {
  regl.clear({
    color: [1, 1, 1, 1],
    depth: 1
  })
  camera(() => {
    drawWires({
      view: mat4.create()
    })
    drawOuter({
      view: mat4.create()
    })
  })
})

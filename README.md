# edge-split

[![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)

Mesh refinement via edge-splitting. Does not change the surface normals. This package is useful if you want to refine your tessellation in order to more finely sample some field, but still preserve sharp corners in your mesh.

## Usage

[![NPM](https://nodei.co/npm/edge-split.png)](https://www.npmjs.com/package/edge-split)

```javascript
var bunny          = require('bunny')
var split          = require('./index');
var refined        = split(bunny.positions, bunny.cells, 0.01, 1000);
console.log(refined) # <- {positions: [[0.5,0.2,0.1], ...], cells: [[0,1,2],...]}
```

`require("edge-split")(cells, positions[, edgeThreshold, maxIterations])`
----------------------------------------------------
This returns a simplicial complex that has maximum edge length less than `edgeThreshold`. By default, `edgeThreshold` is set to the mean edge length. By default it will split indefinitely, which can be customized by the `maxIterations` argument. Note: this function modifies `cells` and `positions` in-place, so create a copy before using if needed.

## Contributing

See [stackgl/contributing](https://github.com/stackgl/contributing) for details.

## License

MIT. See [LICENSE.md](http://github.com/ataber/mesh-simplify/blob/master/LICENSE.md) for details.

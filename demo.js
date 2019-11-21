const { AnimationLoop, Model, Buffer, setParameters } = require('@luma.gl/core')
const fit = require('canvas-fit')
const { GUI } = require('dat.gui')
const createCamera = require('3d-view-controls')
const mat4 = require('gl-mat4')
const { cities } = require('./data/cities.json')

// Create a canvas
const canvas = document.body.appendChild(document.createElement('canvas'))
canvas.setAttribute('id', 'demo-canvas')
window.addEventListener('resize', fit(canvas))

// Create some settings.
const settings = {
  pointSize: 3,
  pointColor: [64, 89, 114]
}
const gui = new GUI()
gui.add(settings, 'pointSize', 0, 60)
gui.addColor(settings, 'pointColor')

const VERTEX_SHADER = `\
uniform float pointSize;
uniform mat4 projection;
uniform mat4 view;

attribute vec2 lnglat;

vec3 getPosition(vec2 lnglat) {
  vec2 rads = radians(lnglat);
  return vec3(
    cos(rads.y) * sin(rads.x),
    sin(rads.y),
    cos(rads.y) * cos(rads.x)
  );
}

void main() {
  gl_PointSize = pointSize;
  gl_Position = projection * view * vec4(getPosition(lnglat), 1);
}
`
const FRAGMENT_SHADER = `\
uniform vec3 pointColor;

void main() {
  vec3 color = vec3(pointColor.r/255.0, pointColor.g/255.0, pointColor.b/255.0);
  gl_FragColor = vec4(color, 1);
}
`

const animationLoop = new AnimationLoop({
  debug: true,

  onInitialize ({ gl, canvas }) {
    // Set clearing parameters for GL context
    setParameters(gl, {
      clearColor: [0.13, 0.13, 0.13, 1],
      clearDepth: [1],
      depthTest: true,
      depthFunc: gl.LEQUAL,
      blendFunc: [gl.SRC_ALPHA, gl.ONE],
      blend: true
    })
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    // Set Camera
    const camera = createCamera(canvas)
    camera.lookAt([2, 2, 2], [0, 0, 0], [0, 1, 0])
    settings.view = camera.matrix
    settings.projection = mat4.perspective([], Math.PI / 4, canvas.width / canvas.height, 0.01, 100)

    // Get data
    const lnglats = cities.flatMap(c => c.lnglat)

    // Create a drawing model
    const earth = new Model(gl, {
      vs: VERTEX_SHADER,
      fs: FRAGMENT_SHADER,
      uniforms: settings,
      attributes: {
        lnglat: new Buffer(gl, new Float32Array(lnglats))
      },
      drawMode: gl.POINTS,
      vertexCount: lnglats.length / 2
    })

    // initial draw
    earth.draw()

    return { earth, camera }
  },

  onRender: function ({ gl, earth, camera }) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    camera.tick()
    camera.up = [0, 1, 0]
    settings.view = camera.matrix
    settings.projection = mat4.perspective([], Math.PI / 4, canvas.width / canvas.height, 0.01, 100)
    earth.setUniforms(settings).draw()
  }
})

animationLoop.start({ canvas: 'demo-canvas' })

const { AnimationLoop, Model, Buffer, setParameters } = require('@luma.gl/core')
const fit = require('canvas-fit')
const { GUI } = require('dat.gui')

// Create a canvas
const canvas = document.body.appendChild(document.createElement('canvas'))
canvas.setAttribute('id', 'demo-canvas')
window.addEventListener('resize', fit(canvas))

// Create some settings.
const settings = {
  pointSize: 10,
  pointColor: [64, 89, 114]
}
const gui = new GUI()
gui.add(settings, 'pointSize', 0, 60)
gui.addColor(settings, 'pointColor')

const VERTEX_SHADER = `\
uniform float pointSize;

attribute vec3 position;

void main() {
  gl_PointSize = pointSize;
  gl_Position = vec4(position, 1);
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

  onInitialize ({ gl, canvas, aspect }) {
    const positions = []
    let i = 1002
    while (i--) {
      positions.push(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      )
    }

    setParameters(gl, {
      clearColor: [0.13, 0.13, 0.13, 1],
      clearDepth: [1],
      depthTest: true,
      depthFunc: gl.LEQUAL
    })
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    const earth = new Model(gl, {
      vs: VERTEX_SHADER,
      fs: FRAGMENT_SHADER,
      uniforms: settings,
      attributes: {
        position: new Buffer(gl, new Float32Array(positions))
      },
      drawMode: gl.POINTS,
      vertexCount: positions.length / 3
    })
    earth.draw()
    return { earth }
  },

  onRender: function ({ gl, earth }) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    earth.setUniforms(settings).draw()
  }
})

animationLoop.start({ canvas: 'demo-canvas' })

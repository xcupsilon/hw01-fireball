import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
// @ts-ignore
import * as DAT from "dat.gui"
const Stats = require("stats-js")

const vert = require("./shaders/fireball.vs.glsl")
const frag = require("./shaders/fireball.fs.glsl")
const fragEnv = require("./shaders/envMap.fs.glsl")

// Matcaps
const flame = require("../public/static/textures/matcaps/flame.jpg").default
const redhalo = require("../public/static/textures/matcaps/redhalo.png").default
const blackhole = require("../public/static/textures/matcaps/void.png").default

// Texture used
const textureLoader = new THREE.TextureLoader()
const matcapTexture = textureLoader.load(redhalo)
const envTexture = textureLoader.load(blackhole)

// Controllable parameters
const parameters = {
  radius: 1, // Radius of the sphere
  subdivision: 512, // Subdivision of the sphere
  basecolor: "#000000", // Base color of the sphere
}

// Uniform variables on the shader
const uniforms = {
  uTime: { value: 0.0 },
  uColor: { value: new THREE.Color(0xffffff) },
  uTexture: { value: matcapTexture },
  uEnvTexture: { value: envTexture },
  uNoiseParams: { value: new THREE.Vector4(1, 0.1, 1.8, 0.07) },
  uEnvNoiseParams: { value: new THREE.Vector4(1.0, 0.1, 0.1, -0.1) },
}

function main() {
  // getting the canvas DOM element from our html
  const canvas = document.querySelector("canvas.webgl") as HTMLCanvasElement

  // Screen dimension
  const screen = {
    width: window.innerWidth,
    height: window.innerHeight,
  }

  // Cursor position
  const cursor = {
    x: 0,
    y: 0,
  }

  window.addEventListener("mousemove", (event) => {
    cursor.x = event.clientX / screen.width - 0.5 // -0.5 to 0.5
    cursor.y = -(event.clientY / screen.height - 0.5)
  })

  // Initial display for framerate
  const stats = Stats()
  stats.setMode(0)
  stats.domElement.style.position = "absolute"
  stats.domElement.style.left = "0px"
  stats.domElement.style.top = "0px"
  document.body.appendChild(stats.domElement)

  const scene = new THREE.Scene()

  // // matcap material, override later for shader
  // const matcap = new THREE.MeshMatcapMaterial()
  // matcap.matcap = matcapTexture

  // Material for fireball
  const fireball = new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms: uniforms,
    side: THREE.DoubleSide,
  })

  // Material for envmap
  const env = new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: fragEnv,
    uniforms: uniforms,
    side: THREE.BackSide, // render the inside of the sphere
  })

  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(
      parameters.radius,
      parameters.subdivision * 2,
      parameters.subdivision
    ),
    fireball
  )

  const envMap = new THREE.Mesh(new THREE.SphereGeometry(50, 512, 256), env)

  scene.add(mesh)
  scene.add(envMap)

  // Add GUI elements
  const gui = new DAT.GUI()
  gui
    .add(parameters, "radius", 0, 2)
    .name("Radius")
    .onChange(() => {
      mesh.geometry = new THREE.SphereGeometry(
        parameters.radius,
        parameters.subdivision * 2,
        parameters.subdivision
      )
    })

  gui
    .add(parameters, "subdivision", 64, 1024, 1)
    .name("Width Segments")
    .onChange(() => {
      mesh.geometry = new THREE.SphereGeometry(
        parameters.radius,
        parameters.subdivision * 2,
        parameters.subdivision
      )
    })

  // noise parameters
  const noiseParams = gui.addFolder("Noise Parameters")
  noiseParams.add(uniforms.uNoiseParams.value, "y", 0.1, 0.8).name("Amplitude")
  noiseParams.add(uniforms.uNoiseParams.value, "z", 1.5, 4).name("Frequency")
  noiseParams.add(uniforms.uNoiseParams.value, "x", 1, 2, 1).name("Octave")
  noiseParams
    .add(uniforms.uNoiseParams.value, "w", -0.1, 0.2)
    .name("Height Offset")

  gui
    .addColor(parameters, "basecolor")
    .name("Backgrond Color (Rec: go darkness)")

  // button that will reset the parameters to their default values
  gui
    .add({ reset: () => {} }, "reset")
    .name("Reset")
    .onChange(() => {
      parameters.basecolor = "#000000"
      parameters.radius = 1
      parameters.subdivision = 512

      noiseParams.__controllers[0].setValue(0.1)
      noiseParams.__controllers[1].setValue(2.0)
      noiseParams.__controllers[2].setValue(2.0)
      noiseParams.__controllers[3].setValue(0.05)

      mesh.geometry = new THREE.SphereGeometry(
        parameters.radius,
        parameters.subdivision * 2,
        parameters.subdivision
      )
      // mesh.material.color.set(parameters.basecolor)
    })

  // perspective camera
  const camera = new THREE.PerspectiveCamera(
    75,
    screen.width / screen.height,
    0.1,
    100
  )
  camera.position.z = 3
  scene.add(camera)

  // Controls
  const controls = new OrbitControls(camera, canvas)
  controls.enableDamping = true

  const renderer = new THREE.WebGLRenderer({ canvas: canvas })
  renderer.setSize(screen.width, screen.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  // Clock in Three.js
  const clock = new THREE.Clock()

  // This function will be called every frame
  function tick() {
    // update time uniform
    const elapsedTime = clock.getElapsedTime()

    stats.begin()
    // update material
    fireball.uniforms.uTime.value = elapsedTime
    fireball.uniforms.uColor.value = new THREE.Color(parameters.basecolor)

    controls.update()

    renderer.clear()
    renderer.render(scene, camera)

    stats.end()

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick)
  }

  window.addEventListener(
    "resize",
    function () {
      screen.width = window.innerWidth
      screen.height = window.innerHeight

      // Update camera aspect ratio and renderer size
      camera.aspect = screen.width / screen.height
      camera.updateProjectionMatrix()

      renderer.setSize(screen.width, screen.height)
    },
    false
  )

  // event listener for fullscreening if F is pressed
  window.addEventListener("keydown", function (event) {
    if (event.key === "f") {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        canvas.requestFullscreen()
      }
    }
  })

  renderer.setSize(screen.width, screen.height)
  // Start the render loop
  tick()
}

main()

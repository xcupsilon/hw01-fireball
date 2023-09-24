import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
// @ts-ignore
import * as DAT from "dat.gui"

const Stats = require("stats-js")

let worleyScale = 0.00006 // Scale for worley noise
let timeScale = 0.1 // Scale for time

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
  // Default object
  const mesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1, 6),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
  )
  scene.add(mesh)

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

  // Clock in Three.js
  const clock = new THREE.Clock()

  // // Set default color to red
  // lambert.setGeometryColor(new Float32Array([1, 0, 0, 1]))

  // // set the default scale for worley noise
  // lambert.setScale(new Float32Array([worleyScale, worleyScale, worleyScale, 1]))

  // This function will be called every frame
  function tick() {
    const elapsedTime = clock.getElapsedTime()

    // lambert.setTime(elapsedTime)
    controls.update()

    stats.begin()

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

  renderer.setSize(screen.width, screen.height)
  // Start the render loop
  tick()
}

main()

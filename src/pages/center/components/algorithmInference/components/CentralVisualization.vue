<template>
  <div ref="threejsRef" class="w-full h-full"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const threejsRef = ref<HTMLElement>()

let scene: any = null
let camera: any = null
let renderer: any = null
let cube: any = null
let outerCube: any = null
let particles: any = null
let animationId: number | null = null

onMounted(async () => {
  await initThreeJS()
})

onBeforeUnmount(() => {
  cleanup()
})

async function initThreeJS() {
  const container = threejsRef.value
  if (!container) return

  try {
    const THREE = await import('three')

    // 创建场景
    scene = new THREE.Scene()

    // 创建相机 - 使用正交相机获得更好的背景效果
    const aspect = container.clientWidth / container.clientHeight
    camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000)
    camera.position.z = 8

    // 创建渲染器
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)

    // 创建内层二十面体
    const geometry = new THREE.IcosahedronGeometry(2, 1)
    const material = new THREE.MeshBasicMaterial({
      color: 0x1B96FF,
      wireframe: true,
      transparent: true,
      opacity: 0.15
    })
    cube = new THREE.Mesh(geometry, material)
    scene.add(cube)

    // 创建外层线框
    const outerGeometry = new THREE.IcosahedronGeometry(2.5, 1)
    const outerMaterial = new THREE.MeshBasicMaterial({
      color: 0x00FFFF,
      wireframe: true,
      transparent: true,
      opacity: 0.08
    })
    outerCube = new THREE.Mesh(outerGeometry, outerMaterial)
    scene.add(outerCube)

    // 添加粒子效果
    addParticles(THREE)

    // 开始动画
    animate()

    // 监听窗口变化
    window.addEventListener('resize', onWindowResize)

  } catch (err) {
    console.error('Three.js 初始化失败:', err)
  }
}

function addParticles(THREE: any) {
  const particleCount = 100
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(particleCount * 3)

  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 15
    positions[i + 1] = (Math.random() - 0.5) * 15
    positions[i + 2] = (Math.random() - 0.5) * 10
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  const material = new THREE.PointsMaterial({
    color: 0x00FFFF,
    size: 0.03,
    transparent: true,
    opacity: 0.3
  })

  particles = new THREE.Points(geometry, material)
  scene.add(particles)
}

function animate() {
  animationId = requestAnimationFrame(animate)

  if (cube) {
    cube.rotation.x += 0.001
    cube.rotation.y += 0.002
  }

  if (outerCube) {
    outerCube.rotation.x -= 0.001
    outerCube.rotation.y -= 0.0015
  }

  if (particles) {
    particles.rotation.y += 0.0003
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera)
  }
}

function onWindowResize() {
  const container = threejsRef.value
  if (!container || !camera || !renderer) return

  const width = container.clientWidth
  const height = container.clientHeight

  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

function cleanup() {
  window.removeEventListener('resize', onWindowResize)

  if (animationId !== null) {
    cancelAnimationFrame(animationId)
  }

  if (renderer) {
    renderer.dispose()
    const container = threejsRef.value
    if (container && renderer.domElement && container.contains(renderer.domElement)) {
      container.removeChild(renderer.domElement)
    }
  }

  if (scene) {
    scene.traverse((object: any) => {
      if (object.geometry) object.geometry.dispose()
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((m: any) => m.dispose())
        } else {
          object.material.dispose()
        }
      }
    })
  }
}
</script>

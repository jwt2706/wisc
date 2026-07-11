import { useEffect, useRef } from 'react'
import * as THREE from 'three'

function createGlowTexture() {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Unable to create 2D context for glow texture.')
  }

  const gradient = context.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  )

  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.2, 'rgba(255,239,196,0.95)')
  gradient.addColorStop(0.45, 'rgba(255,164,87,0.55)')
  gradient.addColorStop(1, 'rgba(255,164,87,0)')

  context.fillStyle = gradient
  context.fillRect(0, 0, size, size)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true

  return texture
}

type Firefly = {
  sprite: THREE.Sprite
  baseAngle: number
  radius: number
  height: number
  speed: number
  wobble: number
}

type CampfireLobbySceneProps = {
  isPlaying?: boolean
}

export default function CampfireLobbyScene({
  isPlaying = false,
}: CampfireLobbySceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isPlayingRef = useRef(false)

  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])

  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return undefined
    }

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x08120f, 0.032)

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 120)
    camera.position.set(0, 5.2, 13.8)

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)

    const glowTexture = createGlowTexture()

    const ambient = new THREE.AmbientLight(0x6f877a, 0.75)
    scene.add(ambient)

    const moonLight = new THREE.DirectionalLight(0xb7d9ff, 0.7)
    moonLight.position.set(-8, 14, -6)
    scene.add(moonLight)

    const fireLight = new THREE.PointLight(0xff9b45, 7.5, 24, 2)
    fireLight.position.set(0, 1.25, 0)
    scene.add(fireLight)

    const emberLight = new THREE.PointLight(0xffcf8f, 2, 14, 2)
    emberLight.position.set(0, 0.35, 0)
    scene.add(emberLight)

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(25, 80),
      new THREE.MeshStandardMaterial({
        color: 0x09130f,
        roughness: 1,
        metalness: 0,
      }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.95
    scene.add(ground)

    const clearing = new THREE.Mesh(
      new THREE.CircleGeometry(11.5, 64),
      new THREE.MeshStandardMaterial({
        color: 0x0f2019,
        roughness: 1,
        metalness: 0,
      }),
    )
    clearing.rotation.x = -Math.PI / 2
    clearing.position.y = -0.94
    scene.add(clearing)

    const treeMaterial = new THREE.MeshStandardMaterial({
      color: 0x050b08,
      roughness: 1,
      metalness: 0,
    })
    const treePositions = [
      [-14, -1, -6],
      [-12, -1, 8],
      [-8, -1, -12],
      [-3, -1, 13],
      [6, -1, -11],
      [11, -1, 7],
      [13, -1, -2],
    ]

    treePositions.forEach(([x, y, z], index) => {
      const tree = new THREE.Group()
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.18, 1.2, 6),
        treeMaterial,
      )
      trunk.position.y = 0.2

      const canopy = new THREE.Mesh(
        new THREE.ConeGeometry(0.9 + index * 0.05, 2.4 + index * 0.1, 6),
        treeMaterial,
      )
      canopy.position.y = 1.4 + index * 0.03

      tree.add(trunk, canopy)
      tree.position.set(x, y, z)
      tree.rotation.y = (index * Math.PI) / 7
      tree.scale.setScalar(1 + index * 0.02)
      scene.add(tree)
    })

    const campfire = new THREE.Group()
    campfire.position.set(0, -0.04, 0)
    scene.add(campfire)

    const logMaterial = new THREE.MeshStandardMaterial({
      color: 0x4d3223,
      roughness: 1,
      metalness: 0,
    })

    const logGeometry = new THREE.CylinderGeometry(0.22, 0.3, 3.2, 10)
    const logA = new THREE.Mesh(logGeometry, logMaterial)
    logA.rotation.z = Math.PI / 2
    logA.rotation.y = Math.PI / 5
    logA.position.y = 0.1

    const logB = new THREE.Mesh(logGeometry, logMaterial)
    logB.rotation.z = Math.PI / 2
    logB.rotation.y = -Math.PI / 5
    logB.position.y = -0.05

    const logC = new THREE.Mesh(logGeometry, logMaterial)
    logC.rotation.z = Math.PI / 2
    logC.rotation.y = Math.PI / 2
    logC.position.y = -0.12

    campfire.add(logA, logB, logC)

    const emberCore = new THREE.Mesh(
      new THREE.ConeGeometry(0.82, 1.9, 10, 1),
      new THREE.MeshBasicMaterial({
        color: 0xffb15a,
        transparent: true,
        opacity: 0.8,
      }),
    )
    emberCore.position.y = 0.68
    campfire.add(emberCore)

    const fireGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture,
        color: 0xff9441,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    )
    fireGlow.scale.set(4.2, 4.2, 1)
    fireGlow.position.y = 1.1
    campfire.add(fireGlow)

    const emberRing = new THREE.Group()
    campfire.add(emberRing)

    const emberCount = 14

    for (let index = 0; index < emberCount; index += 1) {
      const ember = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: glowTexture,
          color: index % 2 === 0 ? 0xffd791 : 0xff9d51,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      )
      const angle = (index / emberCount) * Math.PI * 2

      ember.scale.setScalar(0.55 + (index % 3) * 0.08)
      ember.position.set(
        Math.cos(angle) * 0.65,
        0.85 + (index % 4) * 0.1,
        Math.sin(angle) * 0.65,
      )
      emberRing.add(ember)
    }

    const fogLayer = new THREE.Group()
    scene.add(fogLayer)

    const fogMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0xa8c4b4,
      transparent: true,
      opacity: 0.07,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    for (let index = 0; index < 8; index += 1) {
      const fogPatch = new THREE.Sprite(fogMaterial.clone())
      fogPatch.scale.set(22 + index * 1.6, 8 + index * 0.7, 1)
      fogPatch.position.set(
        Math.sin(index * 1.2) * 7,
        -0.1 + (index % 3) * 0.18,
        -6 + index * 2.2,
      )
      fogLayer.add(fogPatch)
    }

    const fireflies: Firefly[] = []
    const fireflyCount = 16

    for (let index = 0; index < fireflyCount; index += 1) {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: glowTexture,
          color: index % 4 === 0 ? 0xffe48f : 0xc7ff9b,
          transparent: true,
          opacity: 0.8,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      )
      sprite.scale.setScalar(0.22 + (index % 3) * 0.05)
      scene.add(sprite)

      fireflies.push({
        sprite,
        baseAngle: (index / fireflyCount) * Math.PI * 2,
        radius: 5.5 + (index % 5) * 0.65,
        height: 0.5 + (index % 4) * 0.48,
        speed: 0.14 + (index % 6) * 0.018,
        wobble: 0.45 + (index % 4) * 0.08,
      })
    }

    const smokeParticles = new THREE.BufferGeometry()
    const smokeCount = 30
    const smokePositions = new Float32Array(smokeCount * 3)

    for (let index = 0; index < smokeCount; index += 1) {
      const offset = index * 3
      smokePositions[offset] = (Math.random() - 0.5) * 0.55
      smokePositions[offset + 1] = 0.9 + Math.random() * 2.5
      smokePositions[offset + 2] = (Math.random() - 0.5) * 0.55
    }

    smokeParticles.setAttribute(
      'position',
      new THREE.BufferAttribute(smokePositions, 3),
    )

    const smoke = new THREE.Points(
      smokeParticles,
      new THREE.PointsMaterial({
        map: glowTexture,
        color: 0xa2b8ad,
        size: 0.28,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      }),
    )
    scene.add(smoke)

    const resize = () => {
      const width = container.clientWidth || window.innerWidth
      const height = container.clientHeight || window.innerHeight

      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
    }

    resize()

    window.addEventListener('resize', resize)

    const clock = new THREE.Clock()
    let animationFrame = window.requestAnimationFrame(animate)

    function animate() {
      const elapsed = clock.getElapsedTime()

      campfire.rotation.y = Math.sin(elapsed * 0.15) * 0.08
      emberCore.scale.setScalar(1 + Math.sin(elapsed * 6.2) * 0.04)
      fireGlow.scale.setScalar(4.2 + Math.sin(elapsed * 5.3) * 0.18)
      fireLight.intensity = 7.1 + Math.sin(elapsed * 7.8) * 1.05
      emberLight.intensity = 2.1 + Math.sin(elapsed * 6.5) * 0.25
      smoke.rotation.y = elapsed * 0.04

      const targetZ = isPlayingRef.current ? 8.8 : 13.8
      const targetY = isPlayingRef.current ? 4.35 : 5.2
      const targetX = isPlayingRef.current ? 0.08 : 0

      camera.position.x += (targetX + Math.sin(elapsed * 0.16) * 0.25 - camera.position.x) * 0.03
      camera.position.y += (targetY + Math.sin(elapsed * 0.22) * 0.05 - camera.position.y) * 0.03
      camera.position.z += (targetZ + Math.cos(elapsed * 0.11) * 0.18 - camera.position.z) * 0.035
      camera.lookAt(
        Math.sin(elapsed * 0.12) * 0.18,
        0.55 + Math.sin(elapsed * 0.18) * 0.04,
        0,
      )

      fireflies.forEach((firefly, index) => {
        const angle = firefly.baseAngle + elapsed * firefly.speed
        const radius = firefly.radius + Math.sin(elapsed * 0.9 + index) * 0.28
        const height = firefly.height + Math.sin(elapsed * 1.8 + index) * firefly.wobble

        firefly.sprite.position.set(
          Math.cos(angle) * radius,
          height + Math.max(0, Math.sin(elapsed * 1.3 + index) * 0.35),
          Math.sin(angle) * radius,
        )

        const pulse = 0.18 + Math.sin(elapsed * 5 + index) * 0.04
        firefly.sprite.scale.setScalar(pulse + 0.12)
      })

      const positions = smokeParticles.getAttribute('position') as THREE.BufferAttribute

      for (let index = 0; index < smokeCount; index += 1) {
        const offset = index * 3
        positions.array[offset] += Math.sin(elapsed * 0.24 + index) * 0.002
        positions.array[offset + 1] += 0.004 + (index % 4) * 0.0004
        positions.array[offset + 2] += Math.cos(elapsed * 0.2 + index) * 0.0015

        if (positions.array[offset + 1] > 4.4) {
          positions.array[offset] = (Math.random() - 0.5) * 0.65
          positions.array[offset + 1] = 0.95 + Math.random() * 1.1
          positions.array[offset + 2] = (Math.random() - 0.5) * 0.65
        }
      }

      positions.needsUpdate = true

      renderer.render(scene, camera)
      animationFrame = window.requestAnimationFrame(animate)
    }

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', resize)
      container.removeChild(renderer.domElement)
      glowTexture.dispose()
      renderer.dispose()
    }
  }, [])

  return <div ref={containerRef} aria-hidden="true" className="absolute inset-0" />
}
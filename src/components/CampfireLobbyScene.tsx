import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import {
  createCampfireCharacters,
  getCampfireCharacterVoiceAssignments,
} from '../lib/campfireCharacters'

const CHARACTER_LABELS = getCampfireCharacterVoiceAssignments()

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
  focusCharacterId?: string | null
  hiddenCharacterIds?: string[]
  characterSpeechById?: Record<string, string>
}

export default function CampfireLobbyScene({
  isPlaying = false,
  focusCharacterId = null,
  hiddenCharacterIds = [],
  characterSpeechById = {},
}: CampfireLobbySceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isPlayingRef = useRef(false)
  const focusCharacterIdRef = useRef<string | null>(null)
  const hiddenCharacterIdsRef = useRef<string[]>([])
  const characterSpeechByIdRef = useRef<Record<string, string>>({})
  const selectedSpeechCharacterIdRef = useRef<string | null>(null)
  const characterRigRef = useRef<ReturnType<typeof createCampfireCharacters> | null>(null)
  const cameraFrameRef = useRef({
    aspect: 1,
    framingOffset: 0,
    lobbyZ: 13.8,
    playZ: 8.8,
    lobbyY: 5.2,
    playY: 4.35,
    baseFov: 45,
  })

  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])

  useEffect(() => {
    focusCharacterIdRef.current = focusCharacterId
  }, [focusCharacterId])

  useEffect(() => {
    hiddenCharacterIdsRef.current = hiddenCharacterIds
  }, [hiddenCharacterIds])

  useEffect(() => {
    characterSpeechByIdRef.current = characterSpeechById
  }, [characterSpeechById])

  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return undefined
    }

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x08120f, 0.032)

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 120)
    camera.position.set(0, 5.2, 13.8)
    const cameraLookTarget = new THREE.Vector3(0, 0.55, 0)

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.display = 'block'
    container.appendChild(renderer.domElement)

    const labelLayer = document.createElement('div')
    labelLayer.style.position = 'absolute'
    labelLayer.style.inset = '0'
    labelLayer.style.pointerEvents = 'none'
    labelLayer.style.zIndex = '2'
    container.appendChild(labelLayer)

    const labelElements = new Map<string, { root: HTMLDivElement; speech: HTMLDivElement }>()
    CHARACTER_LABELS.forEach((character) => {
      const wrapper = document.createElement('div')
      wrapper.style.position = 'absolute'
      wrapper.style.left = '0'
      wrapper.style.top = '0'
      wrapper.style.transform = 'translate(-50%, -50%)'
      wrapper.style.display = 'flex'
      wrapper.style.flexDirection = 'column'
      wrapper.style.alignItems = 'center'
      wrapper.style.gap = '0.35rem'

      const speech = document.createElement('div')
      speech.style.maxWidth = '220px'
      speech.style.padding = '0.45rem 0.65rem'
      speech.style.borderRadius = '0.9rem'
      speech.style.border = '1px solid rgba(255, 238, 205, 0.44)'
      speech.style.background = 'rgba(9, 12, 10, 0.8)'
      speech.style.color = '#f8edd4'
      speech.style.fontSize = '11px'
      speech.style.fontWeight = '600'
      speech.style.lineHeight = '1.25'
      speech.style.textAlign = 'center'
      speech.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.38)'
      speech.style.backdropFilter = 'blur(3px)'
      speech.style.display = 'none'
      speech.style.pointerEvents = 'auto'
      speech.style.cursor = 'pointer'
      speech.style.transition = 'transform 180ms ease, box-shadow 180ms ease, background 180ms ease, max-width 180ms ease'
      speech.style.transformOrigin = '50% 100%'

      speech.addEventListener('click', (event) => {
        event.stopPropagation()
        selectedSpeechCharacterIdRef.current =
          selectedSpeechCharacterIdRef.current === character.characterId ? null : character.characterId
      })

      const nameTag = document.createElement('div')
      nameTag.textContent = character.label
      nameTag.style.padding = '0.2rem 0.55rem'
      nameTag.style.borderRadius = '999px'
      nameTag.style.border = '1px solid rgba(255, 238, 205, 0.52)'
      nameTag.style.background = 'rgba(8, 12, 10, 0.56)'
      nameTag.style.backdropFilter = 'blur(2px)'
      nameTag.style.color = '#f9eac8'
      nameTag.style.fontSize = '12px'
      nameTag.style.fontWeight = '700'
      nameTag.style.letterSpacing = '0.08em'
      nameTag.style.textTransform = 'uppercase'
      nameTag.style.textShadow = '0 0 8px rgba(0, 0, 0, 0.45)'
      nameTag.style.whiteSpace = 'nowrap'

      wrapper.appendChild(speech)
      wrapper.appendChild(nameTag)
      labelLayer.appendChild(wrapper)
      labelElements.set(character.characterId, { root: wrapper, speech })
    })

    const glowTexture = createGlowTexture()

    const ambient = new THREE.AmbientLight(0x6f877a, 0.75)
    scene.add(ambient)

    const moonLight = new THREE.DirectionalLight(0xb7d9ff, 0.7)
    moonLight.position.set(-8, 14, -6)
    scene.add(moonLight)

    const fireLight = new THREE.PointLight(0xff9b45, 6.2, 22, 2)
    fireLight.position.set(0, 1.05, 0)
    scene.add(fireLight)

    const emberLight = new THREE.PointLight(0xffcf8f, 1.6, 12, 2)
    emberLight.position.set(0, 0.25, 0)
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
      [-18, -1, -10],
      [-16, -1, -2],
      [-15, -1, 10],
      [-10, -1, -15],
      [-7, -1, 15],
      [-2, -1, -13],
      [4, -1, 14],
      [8, -1, -14],
      [12, -1, 10],
      [15, -1, -4],
      [17, -1, 6],
    ]

    treePositions.forEach(([x, y, z], index) => {
      const tree = new THREE.Group()
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.24, 1.6, 6),
        treeMaterial,
      )
      trunk.position.y = 0.2

      const canopy = new THREE.Mesh(
        new THREE.ConeGeometry(1.3 + index * 0.08, 3.2 + index * 0.14, 6),
        treeMaterial,
      )
      canopy.position.y = 1.9 + index * 0.04

      tree.add(trunk, canopy)
      tree.position.set(x, y, z)
      tree.rotation.y = (index * Math.PI) / 7
      tree.scale.setScalar(1.35 + index * 0.06)
      scene.add(tree)
    })

    const campfire = new THREE.Group()
    campfire.position.set(0, -0.04, 0)
    campfire.scale.setScalar(0.72)
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
    emberCore.position.y = 0.58
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
    fireGlow.scale.set(2.8, 2.8, 1)
    fireGlow.position.y = 0.8
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
      const bounds = container.getBoundingClientRect()
      const width = Math.max(1, Math.round(bounds.width || window.innerWidth))
      const height = Math.max(1, Math.round(bounds.height || window.innerHeight))
      const aspect = width / height

      // Keep the whole table in frame on narrower displays by slightly widening
      // FOV and pulling the camera back.
      const referenceAspect = 16 / 9
      const narrowness = THREE.MathUtils.clamp(referenceAspect / aspect, 0.82, 1.45)
      const framingOffset = (narrowness - 1) * 2.35

      cameraFrameRef.current = {
        aspect,
        framingOffset,
        lobbyZ: 13.8 + framingOffset,
        playZ: 8.8 + framingOffset * 0.95,
        lobbyY: 5.2 + framingOffset * 0.16,
        playY: 4.35 + framingOffset * 0.14,
        baseFov: 45 + framingOffset * 2.4,
      }

      camera.aspect = aspect
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
      renderer.setViewport(0, 0, width, height)
    }

    resize()

    window.addEventListener('resize', resize)
    const clearSpeechSelection = () => {
      selectedSpeechCharacterIdRef.current = null
    }
    window.addEventListener('click', clearSpeechSelection)
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)

    const clock = new THREE.Clock()

    function animate() {
      const elapsed = clock.getElapsedTime()

      if (isPlayingRef.current && !characterRigRef.current) {
        characterRigRef.current = createCampfireCharacters(scene)
        characterRigRef.current.setHiddenCharacterIds(hiddenCharacterIdsRef.current)
      } else if (!isPlayingRef.current && characterRigRef.current) {
        characterRigRef.current.dispose()
        characterRigRef.current = null
      }

      characterRigRef.current?.setHiddenCharacterIds(hiddenCharacterIdsRef.current)
      characterRigRef.current?.update(elapsed, camera)

      const hiddenSet = new Set(hiddenCharacterIdsRef.current)
      const bounds = containerRef.current?.getBoundingClientRect()
      const width = Math.max(1, bounds?.width ?? 1)
      const height = Math.max(1, bounds?.height ?? 1)

      CHARACTER_LABELS.forEach((character) => {
        const label = labelElements.get(character.characterId)
        const tag = label?.root
        const speech = label?.speech

        if (!tag || !characterRigRef.current || hiddenSet.has(character.characterId)) {
          if (tag) {
            tag.style.opacity = '0'
          }
          return
        }

        const worldPosition = characterRigRef.current.getCharacterPosition(character.characterId)

        if (!worldPosition) {
          tag.style.opacity = '0'
          return
        }

        if (speech) {
          const speechText = characterSpeechByIdRef.current[character.characterId]?.trim()
          if (speechText) {
            speech.textContent = speechText
            speech.style.display = 'block'

            const isSelected = selectedSpeechCharacterIdRef.current === character.characterId
            speech.style.maxWidth = isSelected ? '320px' : '220px'
            speech.style.background = isSelected ? 'rgba(14, 18, 16, 0.94)' : 'rgba(9, 12, 10, 0.8)'
            speech.style.boxShadow = isSelected
              ? '0 20px 46px rgba(0, 0, 0, 0.58)'
              : '0 10px 30px rgba(0, 0, 0, 0.38)'
            speech.style.transform = isSelected ? 'scale(1.2)' : 'scale(1)'
            tag.style.zIndex = isSelected ? '30' : '2'
          } else {
            speech.style.display = 'none'
            if (selectedSpeechCharacterIdRef.current === character.characterId) {
              selectedSpeechCharacterIdRef.current = null
            }
            tag.style.zIndex = '2'
          }
        }

        worldPosition.y += 1.7
        worldPosition.project(camera)

        // Hide tags when a character is outside the camera frustum.
        if (
          worldPosition.z < -1 ||
          worldPosition.z > 1 ||
          worldPosition.x < -1.1 ||
          worldPosition.x > 1.1 ||
          worldPosition.y < -1.15 ||
          worldPosition.y > 1.15
        ) {
          tag.style.opacity = '0'
          return
        }

        const screenX = (worldPosition.x * 0.5 + 0.5) * width
        const screenY = (-worldPosition.y * 0.5 + 0.5) * height

        tag.style.opacity = '1'
        tag.style.transform = `translate(-50%, -50%) translate(${screenX}px, ${screenY}px)`
      })

      campfire.rotation.y = Math.sin(elapsed * 0.15) * 0.08
      emberCore.scale.setScalar(1 + Math.sin(elapsed * 6.2) * 0.025)
      fireGlow.scale.setScalar(2.8 + Math.sin(elapsed * 5.3) * 0.1)
      fireLight.intensity = 5 + Math.sin(elapsed * 7.8)
      emberLight.intensity = 1.35 + Math.sin(elapsed * 6.5) * 0.15
      smoke.rotation.y = elapsed * 0.04

      const focusPosition = focusCharacterIdRef.current
        ? characterRigRef.current?.getCharacterPosition(focusCharacterIdRef.current)
        : null

      const { framingOffset, playZ, lobbyZ, playY, lobbyY, baseFov } = cameraFrameRef.current
      const targetX = 0
      const targetZ = isPlayingRef.current ? playZ : lobbyZ
      const targetY = isPlayingRef.current ? playY : lobbyY

      const desiredPosition = focusPosition
        ? new THREE.Vector3(
            focusPosition.x,
            focusPosition.y + 1.35 + framingOffset * 0.08,
            focusPosition.z + 2.75 + framingOffset * 0.85,
          )
        : new THREE.Vector3(
            targetX + Math.sin(elapsed * 0.16) * 0.25,
            targetY + Math.sin(elapsed * 0.22) * 0.05,
            targetZ + Math.cos(elapsed * 0.11) * 0.18,
          )

      const desiredLookAt = focusPosition
        ? new THREE.Vector3(focusPosition.x, focusPosition.y + 0.35, focusPosition.z)
        : new THREE.Vector3(
            Math.sin(elapsed * 0.12) * 0.18,
            0.55 + Math.sin(elapsed * 0.18) * 0.04,
            0,
          )

      camera.position.lerp(desiredPosition, focusPosition ? 0.06 : 0.03)
      cameraLookTarget.lerp(desiredLookAt, focusPosition ? 0.07 : 0.03)
      camera.lookAt(cameraLookTarget.x, cameraLookTarget.y, cameraLookTarget.z)

      const targetFov = focusPosition ? baseFov - 15 : baseFov
      camera.fov += (targetFov - camera.fov) * 0.06
      camera.updateProjectionMatrix()

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

    let animationFrame = window.requestAnimationFrame(animate)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('click', clearSpeechSelection)
      resizeObserver.disconnect()
      container.removeChild(labelLayer)
      container.removeChild(renderer.domElement)
      glowTexture.dispose()
      characterRigRef.current?.dispose()
      characterRigRef.current = null
      renderer.dispose()
    }
  }, [])

  return <div ref={containerRef} aria-hidden="true" className="absolute inset-0" />
}

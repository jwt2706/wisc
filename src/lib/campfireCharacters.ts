import * as THREE from 'three'
import characterSpriteSheet1 from '../assets/agent1.png'
import characterSpriteSheet2 from '../assets/agent2.png'
import characterSpriteSheet3 from '../assets/agent3.png'
import characterSpriteSheet4 from '../assets/agent4.png'
import characterSpriteSheet5 from '../assets/agent5.png'
import type { ElevenLabsCharacterType } from './elevenlabs'

export type CampfireCharacterVoiceAssignment = {
  characterId: string
  label: string
  voiceType: ElevenLabsCharacterType
  spriteSheet: string
}

type CharacterRig = {
  group: THREE.Group
  texture: THREE.Texture
  frameCount: number
  frameDuration: number
  framePhase: number
  baseX: number
  baseY: number
  baseZ: number
  bobSpeed: number
  bobAmount: number
  swayAmount: number
  shadow: THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>
  plane: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>
}

type CampfireCharactersHandle = {
  update: (elapsed: number, camera: THREE.Camera) => void
  dispose: () => void
}

const CAMPFIRE_CHARACTER_ROSTER: CampfireCharacterVoiceAssignment[] = [
  {
    characterId: 'violet',
    label: 'Violet',
    voiceType: 'voice_1',
    spriteSheet: characterSpriteSheet1,
  },
  {
    characterId: 'patrick',
    label: 'Patrick',
    voiceType: 'voice_2',
    spriteSheet: characterSpriteSheet2,
  },
  {
    characterId: 'calvin',
    label: 'Calvin',
    voiceType: 'voice_3',
    spriteSheet: characterSpriteSheet3,
  },
  {
    characterId: 'cinder',
    label: 'Cinder',
    voiceType: 'voice_4',
    spriteSheet: characterSpriteSheet4,
  },
  {
    characterId: 'steve',
    label: 'Steve',
    voiceType: 'voice_5',
    spriteSheet: characterSpriteSheet5,
  },
]

const CHARACTER_SPECS = [
  {
    frameDuration: 0.16,
    framePhase: 0,
    baseX: -3.2,
    baseY: -0.08,
    baseZ: -2.8,
    bobSpeed: 2.6,
    bobAmount: 0.04,
    swayAmount: 0.08,
  },
  {
    frameDuration: 0.18,
    framePhase: 1,
    baseX: -1.6,
    baseY: -0.1,
    baseZ: -3.5,
    bobSpeed: 2.9,
    bobAmount: 0.05,
    swayAmount: 0.06,
  },
  {
    frameDuration: 0.17,
    framePhase: 2,
    baseX: 0,
    baseY: -0.11,
    baseZ: -3.9,
    bobSpeed: 2.4,
    bobAmount: 0.045,
    swayAmount: 0.07,
  },
  {
    frameDuration: 0.19,
    framePhase: 3,
    baseX: 1.6,
    baseY: -0.09,
    baseZ: -3.45,
    bobSpeed: 2.8,
    bobAmount: 0.05,
    swayAmount: 0.06,
  },
  {
    frameDuration: 0.2,
    framePhase: 1,
    baseX: 3.1,
    baseY: -0.08,
    baseZ: -2.9,
    bobSpeed: 2.5,
    bobAmount: 0.04,
    swayAmount: 0.08,
  },
] as const

function configureTexture(texture: THREE.Texture) {
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.NearestFilter
  texture.magFilter = THREE.NearestFilter
  texture.generateMipmaps = false
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(1 / 4, 1)
  texture.offset.set(0, 0)
}

function createCharacterTexture(baseTexture: THREE.Texture) {
  const texture = baseTexture.clone()
  configureTexture(texture)
  return texture
}

function disposeCharacterRig(rig: CharacterRig) {
  rig.shadow.geometry.dispose()
  rig.shadow.material.dispose()
  rig.plane.geometry.dispose()
  rig.plane.material.dispose()
  rig.texture.dispose()
  rig.group.remove(rig.shadow, rig.plane)
}

export function createCampfireCharacters(scene: THREE.Scene): CampfireCharactersHandle {
  const baseTextures = CAMPFIRE_CHARACTER_ROSTER.map((character) => {
    const texture = new THREE.TextureLoader().load(character.spriteSheet)
    configureTexture(texture)
    return texture
  })

  const rigs: CharacterRig[] = CHARACTER_SPECS.map((spec, index) => {
    const group = new THREE.Group()
    const texture = createCharacterTexture(baseTextures[index])

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.5, 24),
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.26,
      }),
    )
    shadow.rotation.x = -Math.PI / 2
    shadow.position.y = -0.72
    shadow.scale.set(1.25, 0.72, 1)

    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(1.28, 1.28),
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.05,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    )
    plane.position.y = 0.12

    group.position.set(spec.baseX, spec.baseY, spec.baseZ)
    group.scale.setScalar(1.92 + index * 0.06)
    group.add(shadow, plane)
    scene.add(group)

    return {
      group,
      texture,
      frameCount: 4,
      frameDuration: spec.frameDuration,
      framePhase: spec.framePhase,
      baseX: spec.baseX,
      baseY: spec.baseY,
      baseZ: spec.baseZ,
      bobSpeed: spec.bobSpeed,
      bobAmount: spec.bobAmount,
      swayAmount: spec.swayAmount,
      shadow,
      plane,
    }
  })

  return {
    update: (elapsed, camera) => {
      rigs.forEach((rig, index) => {
        const frameIndex =
          (Math.floor(elapsed / rig.frameDuration) + rig.framePhase) % rig.frameCount

        rig.texture.repeat.set(1 / rig.frameCount, 1)
        rig.texture.offset.x = frameIndex / rig.frameCount
        rig.texture.offset.y = 0

        rig.group.position.x = rig.baseX + Math.sin(elapsed * rig.bobSpeed + index) * rig.swayAmount
        rig.group.position.y = rig.baseY + Math.sin(elapsed * rig.bobSpeed * 1.2 + index) * rig.bobAmount
        rig.group.position.z = rig.baseZ + Math.cos(elapsed * rig.bobSpeed * 0.9 + index) * (rig.swayAmount * 0.5)
        rig.group.lookAt(camera.position.x, rig.group.position.y + 0.35, camera.position.z)
      })
    },
    dispose: () => {
      rigs.forEach((rig) => {
        scene.remove(rig.group)
        disposeCharacterRig(rig)
      })
      baseTextures.forEach((texture) => texture.dispose())
    },
  }
}

export function getCampfireCharacterVoiceAssignments() {
  return CAMPFIRE_CHARACTER_ROSTER.map(({ characterId, label, voiceType }) => ({
    characterId,
    label,
    voiceType,
  }))
}
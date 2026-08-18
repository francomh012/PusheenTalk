import {
  ITEM_SIZE,
  PHASES,
  MIN_SPAWN_INTERVAL,
  SPAWN_RAMP,
  SINGLE_ITEM_PHASE_DURATION,
  BAD_CHANCE_BASE,
  BAD_CHANCE_MAX,
  BAD_CHANCE_RAMP_INTERVAL,
  BAD_CHANCE_RAMP_STEP,
  BASE_FALL_SPEED,
  MAX_FALL_SPEED,
  SPEED_RAMP,
  ROTATION_SPEED_MIN,
  ROTATION_SPEED_MAX,
} from './constants.js'
import { GOOD_KEYS, BAD_KEYS } from './foods.js'
import { Item } from './Item.js'

/**
 * Spawner.js
 * Porta food-drop-v2/src/core/Spawner.js sin cambios de balance — solo
 * recibe `scene` en vez de un `container` del DOM para poder instanciar
 * Items (que ahora crean Phaser.Image en vez de <img>).
 */
export class Spawner {
  constructor({ scene }) {
    this.scene = scene
    this.spawnTimer = 0
    this.currentPhaseIndex = -1
  }

  reset() {
    this.spawnTimer = 0
    this.currentPhaseIndex = -1
  }

  getPhaseIndex(t) {
    let idx = 0
    for (let i = 0; i < PHASES.length; i++) {
      if (t >= PHASES[i].startElapsed) idx = i
    }
    return idx
  }

  pickWeighted(elapsed) {
    const stepsElapsed = Math.max(0, elapsed - SINGLE_ITEM_PHASE_DURATION)
    const badChance = Math.min(
      BAD_CHANCE_MAX,
      BAD_CHANCE_BASE + Math.floor(stepsElapsed / BAD_CHANCE_RAMP_INTERVAL) * BAD_CHANCE_RAMP_STEP
    )
    const r = Math.random()
    if (r < badChance) return { kind: 'bad', key: BAD_KEYS[Math.floor(Math.random() * BAD_KEYS.length)] }
    return { kind: 'good', key: GOOD_KEYS[Math.floor(Math.random() * GOOD_KEYS.length)] }
  }

  /**
   * Avanza el timer de spawn y, si corresponde, crea y devuelve un Item nuevo.
   * Devuelve null si en este frame no hay que spawnear nada.
   */
  update(dt, elapsed, cw, itemsCount) {
    this.spawnTimer += dt

    const phaseIndex = this.getPhaseIndex(elapsed)
    if (phaseIndex !== this.currentPhaseIndex) {
      this.currentPhaseIndex = phaseIndex
      this.spawnTimer = 0
    }

    const phase = PHASES[this.currentPhaseIndex]
    let shouldSpawn = false

    if (phase.spawnInterval === null) {
      if (itemsCount === 0) {
        this.spawnTimer = 0
        shouldSpawn = true
      }
    } else {
      const spawnInterval = Math.max(
        MIN_SPAWN_INTERVAL,
        phase.spawnInterval - (elapsed - phase.startElapsed) * SPAWN_RAMP
      )
      if (this.spawnTimer >= spawnInterval) {
        this.spawnTimer = 0
        shouldSpawn = true
      }
    }

    if (!shouldSpawn) return null

    const { kind, key } = this.pickWeighted(elapsed)
    const x = Math.random() * (cw - ITEM_SIZE)
    const speed = Math.min(MAX_FALL_SPEED, BASE_FALL_SPEED + elapsed * SPEED_RAMP)
    const rotationSpeed = ROTATION_SPEED_MIN + Math.random() * (ROTATION_SPEED_MAX - ROTATION_SPEED_MIN)

    return new Item({ scene: this.scene, kind, key, x, speed, rotationSpeed })
  }
}

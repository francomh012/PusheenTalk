/**
 * constants.js
 * Valores de balance del minijuego, portados 1:1 desde food-drop-v2
 * (~/Proyectos/food-drop-v2), que usaba estas mismas unidades en píxeles
 * sobre un layout DOM. Se mantienen sin cambios porque el juego ya estaba
 * balanceado con estos números.
 */

// ---------- Sizes / hitboxes ----------

export const ITEM_SIZE = 151.2
export const ITEM_HITBOX_SIZE = ITEM_SIZE / 2
export const ITEM_HITBOX_OFFSET = (ITEM_SIZE - ITEM_HITBOX_SIZE) / 2

export const BASKET_WIDTH = 201.6
export const BASKET_HALF = BASKET_WIDTH / 2
export const BASKET_BOTTOM = 28
export const BASKET_HEIGHT = 168

export const BASKET_CATCH_WIDTH = ITEM_HITBOX_SIZE * 1.3
export const BASKET_CATCH_HALF = BASKET_CATCH_WIDTH / 2
export const CATCH_BAND = 107.52

// ---------- Rules ----------

export const MAX_FALLOS = 8

// ---------- Fall speed ----------

export const BASE_FALL_SPEED = 220 // px/s
export const MAX_FALL_SPEED = 420
export const SPEED_RAMP = 4 // px/s ganados por segundo transcurrido

// ---------- Spawn / phases ----------

export const MIN_SPAWN_INTERVAL = 0.35
export const SPAWN_RAMP = 0.025 // segundos recortados por segundo dentro de una fase
export const SINGLE_ITEM_PHASE_DURATION = 50 // s — también usado por la rampa de % de malos

// Fases progresivas de spawn. spawnInterval: null = modo "un ítem a la vez".
export const PHASES = [
  { startElapsed: 0, spawnInterval: null },
  { startElapsed: 50, spawnInterval: 1.5 },
  { startElapsed: 95, spawnInterval: 1.2 },
  { startElapsed: 135, spawnInterval: 1.0 },
  { startElapsed: 170, spawnInterval: 0.8 },
  { startElapsed: 200, spawnInterval: 0.6 },
]

// ---------- Bad-item chance progression ----------

export const BAD_CHANCE_BASE = 0.1
export const BAD_CHANCE_MAX = 0.4
export const BAD_CHANCE_RAMP_INTERVAL = 10 // s
export const BAD_CHANCE_RAMP_STEP = 0.02

// ---------- Rotation ----------

export const ROTATION_SPEED_MIN = 60 // deg/s
export const ROTATION_SPEED_MAX = 90 // deg/s

// ---------- Input ----------

export const KEY_MOVE_SPEED = 480 // px/s

// ---------- Container ----------

// food-drop-v2/style.css: #app { max-width: 480px; height: 100%/100dvh }
// El área de juego original nunca ocupaba más de 480px de ancho, aunque la
// pantalla fuera más ancha (quedaba centrada, con "letterbox" a los costados).
// El alto sí era el del viewport completo, sin tope.
export const CONTAINER_MAX_WIDTH = 480

// ---------- Colors ----------

export const COLORS = {
  bgTop: 0xfff0f5,
  bgBottom: 0xe8d5f5,
  text: '#5c3d2e',
  pinkPastel: 0xffb7c5,
  pinkPastelHover: 0xffcbd9,
  floor: 0xc4956a,
}

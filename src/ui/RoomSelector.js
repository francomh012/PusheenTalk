import Phaser from 'phaser'

const BUTTON_MAX_DIAMETER = 52
const BUTTON_GAP = 14
const TOP_MARGIN = 28 // separación del borde superior — deja aire para notch/cámara en mobile, dentro del área de pared
const BG_CIRCLE_COLOR = 0x000000
const BG_CIRCLE_ALPHA = 0.25
const ACTIVE_BORDER_COLOR = 0xffffff
const ACTIVE_BORDER_WIDTH = 3
const INACTIVE_ICON_ALPHA = 0.55
const ACTIVE_ICON_ALPHA = 1

/**
 * RoomSelector.js
 * Fila de botones circulares (íconos) para elegir habitación activa. Solo
 * presentación: no conoce el estado real del juego, solo emite
 * 'room:changed' por el EventBus cuando el jugador toca un ícono. Necesita
 * `scene` porque es quien crea los game objects que dibuja.
 *
 * El recorte circular ya viene horneado en los PNG de src/assets/icons/
 * (transparentes fuera del círculo) — no se enmascara en runtime. Phaser 4
 * deprecó GeometryMask en WebGL en favor de un sistema de filtros cuyo
 * bounding box no coincide con el tamaño visual deseado para sprites con
 * aspecto no cuadrado, así que hornear la máscara en el asset es más simple
 * y robusto que pelear con esa API.
 */
export class RoomSelector {
  /**
   * @param {import('phaser').Scene} scene
   * @param {import('../core/EventBus.js').EventBus} eventBus
   * @param {Array} rooms
   * @param {string} activeRoomId
   */
  constructor(scene, eventBus, rooms, activeRoomId) {
    this.scene = scene
    this.eventBus = eventBus
    this.rooms = rooms
    this.activeRoomId = activeRoomId
    this.entries = [] // { room, bg, icon, ring }

    this.build()
  }

  build() {
    this.entries = this.rooms.map((room) => {
      const bg = this.scene.add.circle(0, 0, BUTTON_MAX_DIAMETER / 2, BG_CIRCLE_COLOR, BG_CIRCLE_ALPHA)
      bg.on('pointerdown', () => this.select(room.id))

      const icon = this.scene.add.sprite(0, 0, room.iconKey)

      const ring = this.scene.add.circle(0, 0, BUTTON_MAX_DIAMETER / 2)
      ring.setFillStyle() // solo borde, sin relleno

      return { room, bg, icon, ring }
    })

    this.layout(this.scene.scale.width)
    this.refreshStyles()
  }

  /** Recalcula tamaño y posición de los botones para el ancho de pantalla dado. */
  layout(screenWidth) {
    const count = this.entries.length
    const diameter = Math.min(
      BUTTON_MAX_DIAMETER,
      (screenWidth - BUTTON_GAP * (count + 1)) / count
    )
    const totalWidth = diameter * count + BUTTON_GAP * (count - 1)
    let x = (screenWidth - totalWidth) / 2 + diameter / 2
    const y = TOP_MARGIN + diameter / 2
    const radius = diameter / 2

    this.entries.forEach(({ bg, icon, ring }) => {
      bg.setRadius(radius)
      bg.setPosition(x, y)
      // Circle usa origin centrado (0.5, 0.5) igual que Sprite: el hit area
      // se evalúa en espacio local top-left (Phaser le suma displayOriginX/Y
      // al punto antes de testear), así que el centro del hit area debe ir
      // en (radius, radius), no en (0, 0) — si no, ningún tap cae dentro.
      if (bg.input) {
        bg.input.hitArea.setTo(radius, radius, radius)
      } else {
        bg.setInteractive(
          new Phaser.Geom.Circle(radius, radius, radius),
          Phaser.Geom.Circle.Contains
        )
      }

      // El PNG ya es circular y cuadrado (1:1), así que basta con un
      // tamaño de despliegue uniforme — sin distorsión posible.
      icon.setDisplaySize(diameter, diameter)
      icon.setPosition(x, y)

      ring.setRadius(radius)
      ring.setPosition(x, y)

      x += diameter + BUTTON_GAP
    })
  }

  refreshStyles() {
    this.entries.forEach(({ room, icon, ring }) => {
      const isActive = room.id === this.activeRoomId
      icon.setAlpha(isActive ? ACTIVE_ICON_ALPHA : INACTIVE_ICON_ALPHA)
      ring.setStrokeStyle(isActive ? ACTIVE_BORDER_WIDTH : 0, ACTIVE_BORDER_COLOR)
    })
  }

  select(roomId) {
    if (roomId === this.activeRoomId) return
    this.activeRoomId = roomId
    this.refreshStyles()
    console.log('[RoomSelector] room:changed ->', roomId) // TODO: quitar una vez confirmado en el navegador
    this.eventBus.emit('room:changed', { roomId })
  }

  handleResize(screenWidth) {
    this.layout(screenWidth)
  }
}

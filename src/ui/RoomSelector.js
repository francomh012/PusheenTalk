const BUTTON_HEIGHT = 40
const BUTTON_MAX_WIDTH = 140
const BUTTON_GAP = 8
const TOP_MARGIN = 16
const INACTIVE_BG_COLOR = 0x000000
const INACTIVE_BG_ALPHA = 0.45
const ACTIVE_BG_ALPHA = 0.75
const ACTIVE_BORDER_COLOR = 0xffffff

/**
 * RoomSelector.js
 * Fila de botones para elegir habitación activa. Solo presentación: no
 * conoce el estado real del juego, solo emite 'room:changed' por el
 * EventBus cuando el jugador toca un botón. Necesita `scene` porque es
 * quien crea los game objects (rectángulos y texto) que dibuja.
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
    this.entries = [] // { room, bg, label }

    this.build()
  }

  build() {
    this.entries = this.rooms.map((room) => {
      const bg = this.scene.add.rectangle(0, 0, BUTTON_MAX_WIDTH, BUTTON_HEIGHT, INACTIVE_BG_COLOR)
      bg.on('pointerdown', () => this.select(room.id))

      const label = this.scene.add.text(0, 0, room.nombre, {
        fontFamily: 'sans-serif',
        fontSize: '14px',
        color: '#ffffff',
      })
      label.setOrigin(0.5)

      return { room, bg, label }
    })

    this.layout(this.scene.scale.width)
    this.refreshStyles()
  }

  /** Recalcula tamaño y posición de los botones para el ancho de pantalla dado. */
  layout(screenWidth) {
    const count = this.entries.length
    const buttonWidth = Math.min(
      BUTTON_MAX_WIDTH,
      (screenWidth - BUTTON_GAP * (count + 1)) / count
    )
    const totalWidth = buttonWidth * count + BUTTON_GAP * (count - 1)
    let x = (screenWidth - totalWidth) / 2 + buttonWidth / 2
    const y = TOP_MARGIN + BUTTON_HEIGHT / 2

    this.entries.forEach(({ bg, label }) => {
      bg.setSize(buttonWidth, BUTTON_HEIGHT)
      bg.setPosition(x, y)
      // El hit area de un Shape se fija al llamar setInteractive — si el
      // tamaño cambia después (resize), hay que actualizarlo a mano.
      if (bg.input) {
        bg.input.hitArea.setTo(0, 0, buttonWidth, BUTTON_HEIGHT)
      } else {
        bg.setInteractive({ useHandCursor: true })
      }

      label.setPosition(x, y)
      x += buttonWidth + BUTTON_GAP
    })
  }

  refreshStyles() {
    this.entries.forEach(({ room, bg }) => {
      const isActive = room.id === this.activeRoomId
      bg.setFillStyle(INACTIVE_BG_COLOR, isActive ? ACTIVE_BG_ALPHA : INACTIVE_BG_ALPHA)
      bg.setStrokeStyle(isActive ? 2 : 0, ACTIVE_BORDER_COLOR)
    })
  }

  select(roomId) {
    if (roomId === this.activeRoomId) return
    this.activeRoomId = roomId
    this.refreshStyles()
    this.eventBus.emit('room:changed', { roomId })
  }

  handleResize(screenWidth) {
    this.layout(screenWidth)
  }
}

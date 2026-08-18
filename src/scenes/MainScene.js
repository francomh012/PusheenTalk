import Phaser from 'phaser'
import { ROOMS, DEFAULT_ROOM_ID } from '../config/rooms.js'
import { RoomSelector } from '../ui/RoomSelector.js'

const PUSHEEN_TARGET_WIDTH = 240 // px fijo — tamaño visual consistente en cualquier dispositivo, no proporcional a la pantalla
const EDGE_MARGIN = 24 // px mínimos libres a cada lado; solo entra en juego en pantallas más angostas que el target + margen
const WALL_HEIGHT_RATIO = 0.7 // proporción de la altura que ocupa la pared; el resto es piso

/**
 * MainScene.js
 * Solo presentación: dibuja la habitación activa (pared + piso) y a
 * Pusheen, maneja input y tweens. No sabe nada de estado de juego más
 * allá de qué habitación mostrar — el cambio de habitación se recibe y
 * se comunica por el EventBus, no por referencias directas.
 */
export class MainScene extends Phaser.Scene {
  /** @param {import('../core/EventBus.js').EventBus} eventBus */
  constructor(eventBus) {
    super('MainScene')
    this.eventBus = eventBus
    this.roomBackground = null
    this.activeRoomId = DEFAULT_ROOM_ID
    this.roomSelector = null
    this.pusheenSprite = null
    this.baseScale = 1
    this.idleTween = null
  }

  create() {
    const { width, height } = this.scale

    // Se agrega primero para quedar detrás de todo lo demás (orden de inserción = orden de render).
    this.roomBackground = this.add.graphics()
    this.drawRoomBackground(width, height)

    const sprite = this.add.sprite(width / 2, height / 2, 'pusheen')

    this.baseScale = this.computeBaseScale(width, sprite.width)
    sprite.setScale(this.baseScale)

    sprite.setInteractive({ useHandCursor: true }) // hit area = bounding box del sprite; el PNG está recortado a su contenido real, así que coincide con lo que se ve
    sprite.on('pointerdown', () => this.handlePoke())

    this.pusheenSprite = sprite

    this.startIdleAnimation()

    this.roomSelector = new RoomSelector(this, this.eventBus, ROOMS, this.activeRoomId)

    this.playButton = this.buildPlayButton()
    this.refreshPlayButtonVisibility()

    this.eventBus.on('room:changed', ({ roomId }) => this.handleRoomChanged(roomId))

    this.scale.on('resize', this.handleResize, this)
  }

  /** Botón "Jugar" — solo visible en la habitación "juegos", lanza FoodDropScene. */
  buildPlayButton() {
    const container = this.add.container(0, 0)
    const bg = this.add
      .rectangle(0, 0, 160, 48, 0xffb7c5)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
    const label = this.add
      .text(0, 0, 'JUGAR', {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#5c3d2e',
      })
      .setOrigin(0.5)

    bg.on('pointerover', () => bg.setFillStyle(0xffcbd9))
    bg.on('pointerout', () => bg.setFillStyle(0xffb7c5))
    bg.on('pointerdown', () => this.scene.start('FoodDropScene'))

    container.add([bg, label])
    this.positionPlayButton(container, this.scale.width, this.scale.height)
    return container
  }

  positionPlayButton(container, screenWidth, screenHeight) {
    container.setPosition(screenWidth / 2, screenHeight * WALL_HEIGHT_RATIO + 40)
  }

  refreshPlayButtonVisibility() {
    this.playButton.setVisible(this.activeRoomId === 'juegos')
  }

  /** Dibuja la pared (arriba) y el piso (abajo) de la habitación activa. */
  drawRoomBackground(screenWidth, screenHeight) {
    const room = ROOMS.find((r) => r.id === this.activeRoomId)
    const wallHeight = screenHeight * WALL_HEIGHT_RATIO
    const floorHeight = screenHeight - wallHeight

    this.roomBackground.clear()
    this.roomBackground.fillStyle(room.colorPared, 1)
    this.roomBackground.fillRect(0, 0, screenWidth, wallHeight)
    this.roomBackground.fillStyle(room.colorPiso, 1)
    this.roomBackground.fillRect(0, wallHeight, screenWidth, floorHeight)
  }

  handleRoomChanged(roomId) {
    this.activeRoomId = roomId
    this.drawRoomBackground(this.scale.width, this.scale.height)
    this.refreshPlayButtonVisibility()
  }

  /**
   * Ancho objetivo fijo en px (no proporcional a this.scale.width): un %
   * de pantalla crece con el ancho, así que en laptop/desktop terminaba
   * mucho más grande en píxeles absolutos que en mobile aunque el % fuera
   * el mismo. Con un target fijo, Pusheen mide igual en cualquier
   * dispositivo — solo se reduce si la pantalla es más angosta que el
   * target + margen, para no cortarse en mobile muy chico.
   */
  computeBaseScale(screenWidth, textureWidth) {
    const targetWidth = Math.min(PUSHEEN_TARGET_WIDTH, screenWidth - EDGE_MARGIN * 2)
    return targetWidth / textureWidth
  }

  handlePoke() {
    this.tweens.killTweensOf(this.pusheenSprite)

    this.tweens.add({
      targets: this.pusheenSprite,
      scaleX: this.baseScale * 0.8,
      scaleY: this.baseScale * 1.2,
      duration: 90,
      yoyo: true,
      ease: 'Quad.easeOut',
      onComplete: () => this.startIdleAnimation(),
    })

    this.eventBus.emit('pusheen:poke', {
      x: this.pusheenSprite.x,
      y: this.pusheenSprite.y,
    })
  }

  startIdleAnimation() {
    this.idleTween = this.tweens.add({
      targets: this.pusheenSprite,
      scaleX: this.baseScale * 1.03,
      scaleY: this.baseScale * 0.97,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }

  handleResize(gameSize) {
    if (!this.pusheenSprite) return

    this.drawRoomBackground(gameSize.width, gameSize.height)

    if (this.roomSelector) {
      this.roomSelector.handleResize(gameSize.width)
    }

    if (this.playButton) {
      this.positionPlayButton(this.playButton, gameSize.width, gameSize.height)
    }

    this.baseScale = this.computeBaseScale(gameSize.width, this.pusheenSprite.width)

    // Snap directo en vez de tween: evitamos pelear con el tween de idle
    // que sigue corriendo apuntando a la escala vieja.
    this.tweens.killTweensOf(this.pusheenSprite)
    this.pusheenSprite.setScale(this.baseScale)
    this.pusheenSprite.setPosition(gameSize.width / 2, gameSize.height / 2)
    this.startIdleAnimation()
  }
}

import Phaser from 'phaser'

const PUSHEEN_TARGET_WIDTH = 240 // px fijo — tamaño visual consistente en cualquier dispositivo, no proporcional a la pantalla
const EDGE_MARGIN = 24 // px mínimos libres a cada lado; solo entra en juego en pantallas más angostas que el target + margen

/**
 * MainScene.js
 * Solo presentación: dibuja el fondo y a Pusheen, maneja input y tweens.
 * No sabe nada de estado de juego — al detectar el poke, avisa por el
 * EventBus y deja que Pusheen.js (entities) decida qué significa.
 */
export class MainScene extends Phaser.Scene {
  /** @param {import('../core/EventBus.js').EventBus} eventBus */
  constructor(eventBus) {
    super('MainScene')
    this.eventBus = eventBus
    this.background = null
    this.pusheenSprite = null
    this.baseScale = 1
    this.idleTween = null
  }

  create() {
    const { width, height } = this.scale

    // Se agrega primero para quedar detrás de Pusheen (orden de inserción = orden de render).
    const background = this.add.image(width / 2, height / 2, 'bedroom-bg')
    this.background = background
    this.applyCoverScale(background, width, height)

    const sprite = this.add.sprite(width / 2, height / 2, 'pusheen')

    this.baseScale = this.computeBaseScale(width, sprite.width)
    sprite.setScale(this.baseScale)

    sprite.setInteractive({ useHandCursor: true }) // hit area = bounding box del sprite; el PNG está recortado a su contenido real, así que coincide con lo que se ve
    sprite.on('pointerdown', () => this.handlePoke())

    this.pusheenSprite = sprite

    this.startIdleAnimation()

    this.scale.on('resize', this.handleResize, this)
  }

  /**
   * Escala "cover": cubre toda la pantalla sin distorsionar proporciones,
   * recortando el sobrante. Se usa el mayor de los dos ratios (ancho y
   * alto) para que ningún lado quede con espacio vacío.
   */
  applyCoverScale(image, screenWidth, screenHeight) {
    const coverScale = Math.max(screenWidth / image.width, screenHeight / image.height)
    image.setScale(coverScale)
    image.setPosition(screenWidth / 2, screenHeight / 2)
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

    if (this.background) {
      this.applyCoverScale(this.background, gameSize.width, gameSize.height)
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

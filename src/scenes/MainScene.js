import Phaser from 'phaser'

const PUSHEEN_WIDTH_RATIO = 0.45 // proporción de this.scale.width que ocupa Pusheen, en cualquier dispositivo
const PUSHEEN_MAX_WIDTH = 640 // tope en px — cerca de la resolución nativa del PNG (675px), evita upscale/blur en pantallas muy anchas
const EDGE_MARGIN = 24 // px mínimos libres a cada lado, para que nunca se corte en pantallas angostas

/**
 * MainScene.js
 * Solo presentación: dibuja a Pusheen, maneja input y tweens. No sabe nada
 * de estado de juego — al detectar el poke, avisa por el EventBus y deja
 * que Pusheen.js (entities) decida qué significa.
 */
export class MainScene extends Phaser.Scene {
  /** @param {import('../core/EventBus.js').EventBus} eventBus */
  constructor(eventBus) {
    super('MainScene')
    this.eventBus = eventBus
    this.pusheenSprite = null
    this.baseScale = 1
    this.idleTween = null
  }

  create() {
    const { width, height } = this.scale

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
   * El ancho objetivo es siempre una proporción de this.scale.width (no del
   * tamaño original del PNG), así el sprite se ve igual de grande en
   * cualquier dispositivo. Se acota con un tope absoluto (evita upscale más
   * allá de la resolución nativa en pantallas muy anchas) y con un margen
   * de borde (evita que se corte en pantallas angostas).
   */
  computeBaseScale(screenWidth, textureWidth) {
    let targetWidth = screenWidth * PUSHEEN_WIDTH_RATIO
    targetWidth = Math.min(targetWidth, PUSHEEN_MAX_WIDTH)
    targetWidth = Math.min(targetWidth, screenWidth - EDGE_MARGIN * 2)

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

    this.baseScale = this.computeBaseScale(gameSize.width, this.pusheenSprite.width)

    // Snap directo en vez de tween: evitamos pelear con el tween de idle
    // que sigue corriendo apuntando a la escala vieja.
    this.tweens.killTweensOf(this.pusheenSprite)
    this.pusheenSprite.setScale(this.baseScale)
    this.pusheenSprite.setPosition(gameSize.width / 2, gameSize.height / 2)
    this.startIdleAnimation()
  }
}

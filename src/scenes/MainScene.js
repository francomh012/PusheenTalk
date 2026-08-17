import Phaser from 'phaser'

const PUSHEEN_TARGET_WIDTH = 240 // px fijo — tamaño visual consistente en cualquier dispositivo, no proporcional a la pantalla
const EDGE_MARGIN = 24 // px mínimos libres a cada lado; solo entra en juego en pantallas más angostas que el target + margen

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

    this.baseScale = this.computeBaseScale(gameSize.width, this.pusheenSprite.width)

    // Snap directo en vez de tween: evitamos pelear con el tween de idle
    // que sigue corriendo apuntando a la escala vieja.
    this.tweens.killTweensOf(this.pusheenSprite)
    this.pusheenSprite.setScale(this.baseScale)
    this.pusheenSprite.setPosition(gameSize.width / 2, gameSize.height / 2)
    this.startIdleAnimation()
  }
}

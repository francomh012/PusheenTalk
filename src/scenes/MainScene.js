import Phaser from 'phaser'

const MOBILE_BREAKPOINT = 700 // px, lado menor de pantalla — por debajo de esto se considera mobile
const PUSHEEN_WIDTH_RATIO_MOBILE = 0.95 // proporción del lado menor en mobile — grande, el margen de seguridad la recorta si hace falta
const PUSHEEN_WIDTH_RATIO_DESKTOP = 0.62 // proporción del lado menor en desktop
const PUSHEEN_MAX_WIDTH = 480 // tope en px para que no quede gigante en pantallas grandes
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

    this.baseScale = this.computeBaseScale(width, height, sprite.width)
    sprite.setScale(this.baseScale)

    sprite.setInteractive({ useHandCursor: true }) // hit area = bounding box del sprite, se ajusta sola con el scale actual en cada evento de puntero
    sprite.on('pointerdown', () => this.handlePoke())

    this.pusheenSprite = sprite

    this.startIdleAnimation()

    this.scale.on('resize', this.handleResize, this)
  }

  /**
   * El ancho objetivo se calcula sobre el lado menor de la pantalla (no un
   * px fijo). En mobile usa una proporción mucho mayor para que Pusheen se
   * vea prominente; en desktop una proporción menor con tope absoluto para
   * que no quede gigante en pantallas anchas. En todos los casos se acota
   * contra el ancho real de pantalla menos un margen, para que nunca se
   * corte en los bordes de pantallas angostas.
   */
  computeBaseScale(screenWidth, screenHeight, textureWidth) {
    const minDimension = Math.min(screenWidth, screenHeight)
    const isMobile = minDimension < MOBILE_BREAKPOINT
    const ratio = isMobile ? PUSHEEN_WIDTH_RATIO_MOBILE : PUSHEEN_WIDTH_RATIO_DESKTOP

    let targetWidth = minDimension * ratio
    if (!isMobile) {
      targetWidth = Math.min(targetWidth, PUSHEEN_MAX_WIDTH)
    }
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

    this.baseScale = this.computeBaseScale(
      gameSize.width,
      gameSize.height,
      this.pusheenSprite.width
    )

    // Snap directo en vez de tween: evitamos pelear con el tween de idle
    // que sigue corriendo apuntando a la escala vieja.
    this.tweens.killTweensOf(this.pusheenSprite)
    this.pusheenSprite.setScale(this.baseScale)
    this.pusheenSprite.setPosition(gameSize.width / 2, gameSize.height / 2)
    this.startIdleAnimation()
  }
}

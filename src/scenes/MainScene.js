import Phaser from 'phaser'

const PUSHEEN_RADIUS = 90
const PUSHEEN_COLOR = 0xf5f0e6

/**
 * MainScene.js
 * Solo presentación: dibuja el placeholder de Pusheen, maneja input y
 * tweens. No sabe nada de estado de juego — al detectar el poke, avisa
 * por el EventBus y deja que Pusheen.js (entities) decida qué significa.
 */
export class MainScene extends Phaser.Scene {
  /** @param {import('../core/EventBus.js').EventBus} eventBus */
  constructor(eventBus) {
    super('MainScene')
    this.eventBus = eventBus
    this.pusheenGraphic = null
    this.idleTween = null
  }

  create() {
    const { width, height } = this.scale

    const graphics = this.add.graphics()
    graphics.fillStyle(PUSHEEN_COLOR, 1)
    graphics.fillCircle(0, 0, PUSHEEN_RADIUS) // se dibuja centrado en el origen del objeto para que escale desde el centro
    graphics.setPosition(width / 2, height / 2)
    graphics.setInteractive(
      new Phaser.Geom.Circle(0, 0, PUSHEEN_RADIUS),
      Phaser.Geom.Circle.Contains
    )
    graphics.input.cursor = 'pointer'
    graphics.on('pointerdown', () => this.handlePoke())

    this.pusheenGraphic = graphics

    this.startIdleAnimation()

    this.scale.on('resize', this.handleResize, this)
  }

  handlePoke() {
    this.tweens.killTweensOf(this.pusheenGraphic)

    this.tweens.add({
      targets: this.pusheenGraphic,
      scaleX: 0.8,
      scaleY: 1.2,
      duration: 90,
      yoyo: true,
      ease: 'Quad.easeOut',
      onComplete: () => this.startIdleAnimation(),
    })

    this.eventBus.emit('pusheen:poke', {
      x: this.pusheenGraphic.x,
      y: this.pusheenGraphic.y,
    })
  }

  startIdleAnimation() {
    this.idleTween = this.tweens.add({
      targets: this.pusheenGraphic,
      scaleX: 1.03,
      scaleY: 0.97,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }

  handleResize(gameSize) {
    if (!this.pusheenGraphic) return
    this.pusheenGraphic.setPosition(gameSize.width / 2, gameSize.height / 2)
  }
}

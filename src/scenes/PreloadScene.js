import Phaser from 'phaser'
import pusheenSprite from '../assets/sprites/pusheen.png'
import bedroomBg from '../assets/backgrounds/habitacion.jpg'

/**
 * PreloadScene.js
 * Escena de carga. Los assets definitivos se cargan acá antes de pasar
 * a MainScene.
 */
export class PreloadScene extends Phaser.Scene {
  /** @param {import('../core/EventBus.js').EventBus} eventBus */
  constructor(eventBus) {
    super('PreloadScene')
    this.eventBus = eventBus
  }

  preload() {
    this.load.image('pusheen', pusheenSprite)
    this.load.image('bedroom-bg', bedroomBg)
  }

  create() {
    this.scene.start('MainScene')
  }
}

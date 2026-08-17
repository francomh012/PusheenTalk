import Phaser from 'phaser'
import pusheenSprite from '../assets/sprites/pusheen.png'

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
  }

  create() {
    this.scene.start('MainScene')
  }
}

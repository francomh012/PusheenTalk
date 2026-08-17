import Phaser from 'phaser'

/**
 * PreloadScene.js
 * Escena de carga. Todavía sin assets reales — cuando existan sprites/audio
 * definitivos, sus llamadas a this.load.* van acá, antes de pasar a MainScene.
 */
export class PreloadScene extends Phaser.Scene {
  /** @param {import('../core/EventBus.js').EventBus} eventBus */
  constructor(eventBus) {
    super('PreloadScene')
    this.eventBus = eventBus
  }

  preload() {
    // placeholder: sin assets todavía
  }

  create() {
    this.scene.start('MainScene')
  }
}

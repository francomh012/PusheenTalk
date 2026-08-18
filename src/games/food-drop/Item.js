import { ITEM_SIZE, ITEM_HITBOX_SIZE, ITEM_HITBOX_OFFSET } from './constants.js'

/**
 * Item.js
 * Comida que cae. Porta food-drop-v2/src/entities/Item.js: ahí la posición
 * se manejaba como top-left (x,y) + CSS transform sobre un <img>; acá se
 * mantiene el mismo sistema de coordenadas top-left para reusar getHitbox()
 * / getVisualBottom() sin cambios, y se refleja en un Phaser.Image con
 * origin (0,0) en vez de mover un elemento del DOM.
 */
export class Item {
  constructor({ scene, kind, key, x, speed, rotationSpeed }) {
    this.kind = kind
    this.x = x
    this.y = -ITEM_SIZE
    this.speed = speed
    this.rotation = 0
    this.rotationSpeed = rotationSpeed
    this.done = false

    this.sprite = scene.add.image(x, this.y, key)
    this.sprite.setOrigin(0, 0)
    this.sprite.setDisplaySize(ITEM_SIZE, ITEM_SIZE)
  }

  update(dt) {
    this.y += this.speed * dt
    this.rotation += this.rotationSpeed * dt
    this.sprite.setPosition(this.x, this.y)
    this.sprite.setAngle(this.rotation)
  }

  getHitbox() {
    const top = this.y + ITEM_HITBOX_OFFSET
    return {
      top,
      bottom: top + ITEM_HITBOX_SIZE,
      centerX: this.x + ITEM_SIZE / 2,
    }
  }

  getVisualBottom() {
    return this.y + ITEM_SIZE
  }

  pop() {
    this.sprite.scene.tweens.add({
      targets: this.sprite,
      scale: this.sprite.scale * 1.8,
      alpha: 0,
      duration: 180,
      ease: 'Quad.easeOut',
      onComplete: () => this.sprite.destroy(),
    })
  }

  remove() {
    this.sprite.destroy()
  }
}

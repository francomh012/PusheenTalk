import { ITEM_SIZE, ITEM_HITBOX_SIZE, ITEM_HITBOX_OFFSET } from './constants.js'
import { containFit } from './containFit.js'

/**
 * Item.js
 * Comida que cae. Porta food-drop-v2/src/entities/Item.js: ahí la posición
 * se manejaba como top-left (x,y) de una caja lógica de ITEM_SIZE x ITEM_SIZE
 * (ese sistema de coordenadas se mantiene sin cambios para reusar
 * getHitbox()/getVisualBottom() tal cual — la física no se toca).
 *
 * La imagen dentro de esa caja usa origin (0.5, 0.5) + containFit en vez de
 * setDisplaySize(ITEM_SIZE, ITEM_SIZE): así replica `object-fit: contain`
 * (los PNG son 2816x1536, no cuadrados, y CSS los ajustaba sin deformarlos)
 * y además hace que la rotación gire sobre el centro del ítem, igual que
 * `transform: rotate()` en CSS (que rota sobre transform-origin 50% 50% por
 * defecto) — con origin (0,0) rotaba sobre la esquina, distinto al original.
 */
export class Item {
  constructor({ container, kind, key, x, speed, rotationSpeed }) {
    this.kind = kind
    this.x = x
    this.y = -ITEM_SIZE
    this.speed = speed
    this.rotation = 0
    this.rotationSpeed = rotationSpeed
    this.done = false

    this.sprite = container.scene.add.image(0, 0, key)
    this.sprite.setOrigin(0.5, 0.5)
    const { width, height } = containFit(ITEM_SIZE, ITEM_SIZE, this.sprite.width, this.sprite.height)
    this.sprite.setDisplaySize(width, height)
    container.add(this.sprite)

    this.render()
  }

  update(dt) {
    this.y += this.speed * dt
    this.rotation += this.rotationSpeed * dt
    this.render()
  }

  render() {
    this.sprite.setPosition(this.x + ITEM_SIZE / 2, this.y + ITEM_SIZE / 2)
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

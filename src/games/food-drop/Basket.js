import { BASKET_WIDTH, BASKET_HALF, BASKET_BOTTOM, BASKET_HEIGHT } from './constants.js'
import { clamp } from './physics.js'
import { containFit } from './containFit.js'

/**
 * Basket.js
 * Porta food-drop-v2/src/entities/Basket.js. `offset` sigue siendo el
 * desplazamiento en px desde el centro horizontal — se mantiene ese sistema
 * (en vez de usar sprite.x directo) para poder reusar getTopY/getCenterX
 * y la lógica de clamp tal cual estaban. getTopY/getCenterX (la "caja" de
 * colisión, BASKET_WIDTH x BASKET_HEIGHT) no cambian: solo se ajusta cómo
 * se dibuja la imagen adentro.
 *
 * `#basket img { object-fit: contain }` en el original centra la imagen
 * dentro de esa caja sin deformarla (canasta.png es 2816x1536, no
 * cuadrada) — por eso origin (0.5, 0.5) + containFit en vez de
 * setDisplaySize(BASKET_WIDTH, BASKET_HEIGHT), que la estiraría.
 */
export class Basket {
  constructor(sprite) {
    this.sprite = sprite
    this.sprite.setOrigin(0.5, 0.5)
    const { width, height } = containFit(BASKET_WIDTH, BASKET_HEIGHT, sprite.width, sprite.height)
    this.sprite.setDisplaySize(width, height)
    this.offset = 0
    this.cw = 0
    this.ch = 0
  }

  setContainerSize(cw, ch) {
    this.cw = cw
    this.ch = ch
    this.render()
  }

  maxOffset() {
    return this.cw / 2 - BASKET_HALF
  }

  setOffset(v) {
    this.offset = clamp(v, -this.maxOffset(), this.maxOffset())
    this.render()
  }

  moveBy(delta) {
    this.setOffset(this.offset + delta)
  }

  clampToBounds() {
    this.setOffset(this.offset)
  }

  render() {
    this.sprite.setPosition(this.getCenterX(), this.ch - BASKET_BOTTOM - BASKET_HEIGHT / 2)
  }

  getTopY(ch) {
    return ch - BASKET_BOTTOM - BASKET_HEIGHT
  }

  getCenterX() {
    return this.cw / 2 + this.offset
  }
}

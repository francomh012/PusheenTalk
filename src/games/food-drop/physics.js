import { CATCH_BAND, BASKET_CATCH_HALF } from './constants.js'

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v))
}

/** @param {{getHitbox: () => {top:number,bottom:number,centerX:number}}} item */
export function checkCatch(item, basket, ch) {
  const hb = item.getHitbox()
  const basketTopY = basket.getTopY(ch)
  if (hb.bottom < basketTopY || hb.top > basketTopY + CATCH_BAND) return false
  const basketCenterX = basket.getCenterX()
  return Math.abs(hb.centerX - basketCenterX) < BASKET_CATCH_HALF
}

export function isOffScreen(item, ch) {
  return item.getVisualBottom() > ch
}

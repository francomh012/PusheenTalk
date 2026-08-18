/**
 * containFit.js
 * Replica `object-fit: contain` (usado en food-drop-v2/style.css para
 * `.item` y `#basket img`): ajusta una textura dentro de una caja de
 * boxW x boxH preservando su aspect ratio nativo, en vez de estirarla.
 * Los PNG de este juego son todos 2816x1536 (ratio 1.833) — no cuadrados —
 * así que sin este cálculo `setDisplaySize(boxW, boxH)` los deforma.
 */
export function containFit(boxW, boxH, texW, texH) {
  const scale = Math.min(boxW / texW, boxH / texH)
  return { width: texW * scale, height: texH * scale }
}

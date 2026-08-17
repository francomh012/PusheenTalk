/**
 * rooms.js
 * Definición de las habitaciones disponibles. Por ahora solo colores planos
 * (pared/piso) — cuando haya fondos reales por habitación, cada entrada
 * puede sumar una key de textura de fondo sin tocar el resto del sistema.
 */
export const ROOMS = [
  {
    id: 'juegos',
    nombre: 'Juegos',
    colorPared: 0xcdeac0, // verde pastel
    colorPiso: 0xfff3b0, // amarillo pastel
    iconKey: 'icon-juegos',
  },
  {
    id: 'dormitorio',
    nombre: 'Dormitorio',
    colorPared: 0xc7d2f0, // azul pastel
    colorPiso: 0xe0d4f7, // lila pastel
    iconKey: 'icon-dormitorio',
  },
  {
    id: 'cocina',
    nombre: 'Cocina',
    colorPared: 0xffd9a0, // naranja pastel
    colorPiso: 0xfff1e0, // crema pastel
    iconKey: 'icon-cocina',
  },
  {
    id: 'bano',
    nombre: 'Baño',
    colorPared: 0xcdeef5, // celeste pastel
    colorPiso: 0xffffff, // blanco
    iconKey: 'icon-bano',
  },
]

export const DEFAULT_ROOM_ID = ROOMS[0].id

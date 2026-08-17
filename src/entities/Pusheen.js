/**
 * Pusheen.js
 * Estado y comportamiento del personaje, desacoplado del render. No conoce
 * Phaser ni la escena — solo el EventBus. MainScene dispara 'pusheen:poke'
 * cuando el jugador interactúa; esta clase decide qué significa eso para
 * el estado del personaje y lo comunica de vuelta emitiendo eventos propios.
 */
export class Pusheen {
  /** @param {import('../core/EventBus.js').EventBus} eventBus */
  constructor(eventBus) {
    this.eventBus = eventBus
    this.pokeCount = 0
    this.mood = 'neutral'

    this.eventBus.on('pusheen:poke', () => this.handlePoke())
  }

  handlePoke() {
    this.pokeCount += 1
    this.eventBus.emit('pusheen:state-changed', {
      pokeCount: this.pokeCount,
      mood: this.mood,
    })
  }
}

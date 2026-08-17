/**
 * EventBus.js
 * Pub/sub minimalista. Es el único canal de comunicación entre core, entities,
 * scenes y ui — ningún módulo importa directamente a otro para hablarle.
 */
export class EventBus {
  constructor() {
    this.listeners = new Map()
  }

  /** @param {string} event @param {(payload: any) => void} callback */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event).add(callback)
    return () => this.off(event, callback) // permite: const unsub = bus.on(...)
  }

  off(event, callback) {
    this.listeners.get(event)?.delete(callback)
  }

  emit(event, payload) {
    this.listeners.get(event)?.forEach((callback) => callback(payload))
  }
}

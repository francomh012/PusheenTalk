import Phaser from 'phaser'
import './style.css'

import { EventBus } from './core/EventBus.js'
import { Pusheen } from './entities/Pusheen.js'
import { PreloadScene } from './scenes/PreloadScene.js'
import { MainScene } from './scenes/MainScene.js'
import { FoodDropScene } from './games/food-drop/FoodDropScene.js'

const eventBus = new EventBus()

// La entidad se instancia por sus efectos (escucha el bus) y no se referencia
// directamente después — el estado se consulta o notifica siempre vía eventos.
const pusheen = new Pusheen(eventBus) // eslint-disable-line no-unused-vars

const preloadScene = new PreloadScene(eventBus)
const mainScene = new MainScene(eventBus)
const foodDropScene = new FoodDropScene(eventBus)

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game-container',
  transparent: true,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: '100%',
    height: '100%',
  },
  scene: [preloadScene, mainScene, foodDropScene],
})

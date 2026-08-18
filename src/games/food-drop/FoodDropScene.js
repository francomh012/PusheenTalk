import Phaser from 'phaser'
import { MAX_FALLOS, KEY_MOVE_SPEED, COLORS } from './constants.js'
import { Basket } from './Basket.js'
import { Spawner } from './Spawner.js'
import { clamp, checkCatch, isOffScreen } from './physics.js'

const TEXT_COLOR = COLORS.text
const FLOOR_HEIGHT = 100

/**
 * FoodDropScene.js
 * Minijuego "Food Drop", portado desde el proyecto standalone food-drop-v2
 * (DOM + CSS) a una Phaser.Scene dentro de PusheenTalk. Se lanza desde la
 * habitación "juegos" en MainScene (this.scene.start('FoodDropScene')) y
 * vuelve a MainScene al salir o desde el botón de cerrar. La lógica de
 * juego (Basket/Spawner/physics) es una traducción directa del original.
 */
export class FoodDropScene extends Phaser.Scene {
  /** @param {import('../../core/EventBus.js').EventBus} eventBus */
  constructor(eventBus) {
    super('FoodDropScene')
    this.eventBus = eventBus
  }

  create() {
    const { width, height } = this.scale

    this.state = 'start' // start | playing | gameover
    this.cw = 0
    this.ch = 0
    this.elapsed = 0
    this.items = []
    this.dragging = false
    this.keysDown = new Set()
    this.score = 0
    this.fallos = 0

    this.background = this.add.graphics()

    this.floor = this.add.graphics()

    const basketSprite = this.add.image(0, 0, 'food-drop-basket')
    this.basket = new Basket(basketSprite)

    this.spawner = new Spawner({ scene: this })

    this.scoreText = this.add.text(20, 16, '', {
      fontFamily: 'sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: TEXT_COLOR,
      backgroundColor: '#ffffffdd',
      padding: { x: 16, y: 8 },
    })
    this.fallosText = this.add.text(20, 56, '', {
      fontFamily: 'sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: TEXT_COLOR,
      backgroundColor: '#ffffffdd',
      padding: { x: 16, y: 8 },
    })

    this.exitButton = this.add
      .text(0, 20, '✕', {
        fontFamily: 'sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
        color: TEXT_COLOR,
        backgroundColor: '#ffffffdd',
        padding: { x: 12, y: 6 },
      })
      .setInteractive({ useHandCursor: true })
    this.exitButton.on('pointerdown', () => this.exitToMain())

    this.startOverlay = this.buildOverlay('Pusheen Snack Catch', 'JUGAR', () => this.start())
    this.gameOverOverlay = this.buildOverlay('Game Over', 'JUGAR DE NUEVO', () => this.start())
    this.gameOverOverlay.setVisible(false)

    this.bindInput()
    this.handleResize({ width, height })
    this.updateHud()

    this.scale.on('resize', this.handleResize, this)
    this.events.once('shutdown', () => this.scale.off('resize', this.handleResize, this))
  }

  buildOverlay(title, buttonLabel, onPress) {
    const container = this.add.container(0, 0)

    const dim = this.add.rectangle(0, 0, 10, 10, 0xffb6c1, 0.92).setOrigin(0.5)
    const titleText = this.add
      .text(0, -40, title, {
        fontFamily: 'sans-serif',
        fontSize: '30px',
        fontStyle: 'bold',
        color: TEXT_COLOR,
      })
      .setOrigin(0.5)
    const scoreText = this.add
      .text(0, 4, '', {
        fontFamily: 'sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        color: TEXT_COLOR,
      })
      .setOrigin(0.5)

    const button = this.add
      .rectangle(0, 50, 220, 54, 0xffb7c5)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
    const buttonText = this.add
      .text(0, 50, buttonLabel, {
        fontFamily: 'sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
        color: TEXT_COLOR,
      })
      .setOrigin(0.5)

    button.on('pointerover', () => button.setFillStyle(0xffcbd9))
    button.on('pointerout', () => button.setFillStyle(0xffb7c5))
    button.on('pointerdown', onPress)

    container.add([dim, titleText, scoreText, button, buttonText])
    container.dim = dim
    container.scoreText = scoreText
    return container
  }

  layoutOverlay(container, width, height) {
    container.dim.setSize(width, height)
    container.setPosition(width / 2, height / 2)
  }

  start() {
    this.hud = { score: 0, fallos: 0 }
    this.score = 0
    this.fallos = 0
    this.elapsed = 0
    this.spawner.reset()
    this.basket.setOffset(0)
    this.items.forEach((item) => item.remove())
    this.items = []
    this.startOverlay.setVisible(false)
    this.gameOverOverlay.setVisible(false)
    this.state = 'playing'
    this.updateHud()
  }

  exitToMain() {
    this.items.forEach((item) => item.remove())
    this.items = []
    this.scene.start('MainScene')
  }

  gameOver() {
    this.state = 'gameover'
    this.gameOverOverlay.scoreText.setText(`Puntaje: ${this.score}`)
    this.gameOverOverlay.setVisible(true)
  }

  updateHud() {
    this.scoreText.setText(`Puntos: ${this.score}`)
    this.fallosText.setText(`Fallos: ${this.fallos} / ${MAX_FALLOS}`)
  }

  update(time, deltaMs) {
    if (this.state !== 'playing') return
    const dt = Math.min(deltaMs / 1000, 0.05)
    this.elapsed += dt

    const newItem = this.spawner.update(dt, this.elapsed, this.cw, this.items.length)
    if (newItem) this.items.push(newItem)

    const dir =
      (this.keysDown.has('ArrowRight') ? 1 : 0) - (this.keysDown.has('ArrowLeft') ? 1 : 0)
    if (dir !== 0) {
      this.basket.moveBy(dir * KEY_MOVE_SPEED * dt)
    }

    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i]
      if (item.done) {
        this.items.splice(i, 1)
        continue
      }
      item.update(dt)

      if (checkCatch(item, this.basket, this.ch)) {
        item.done = true
        if (item.kind === 'bad') {
          item.pop()
          this.gameOver()
          continue
        }
        this.score += 1
        this.updateHud()
        item.pop()
        continue
      }

      if (isOffScreen(item, this.ch)) {
        item.remove()
        this.items.splice(i, 1)
        if (item.kind === 'good') {
          this.fallos += 1
          this.updateHud()
          if (this.fallos >= MAX_FALLOS) this.gameOver()
        }
      }
    }
  }

  bindInput() {
    this.input.keyboard.on('keydown-LEFT', () => this.keysDown.add('ArrowLeft'))
    this.input.keyboard.on('keydown-RIGHT', () => this.keysDown.add('ArrowRight'))
    this.input.keyboard.on('keyup-LEFT', () => this.keysDown.delete('ArrowLeft'))
    this.input.keyboard.on('keyup-RIGHT', () => this.keysDown.delete('ArrowRight'))

    const pointerToOffset = (x) =>
      clamp(x - this.cw / 2, -this.basket.maxOffset(), this.basket.maxOffset())

    this.input.on('pointerdown', (pointer) => {
      if (this.state !== 'playing') return
      this.dragging = true
      this.basket.setOffset(pointerToOffset(pointer.x))
    })
    this.input.on('pointermove', (pointer) => {
      if (this.state !== 'playing' || !this.dragging) return
      this.basket.setOffset(pointerToOffset(pointer.x))
    })
    this.input.on('pointerup', () => {
      this.dragging = false
    })
  }

  handleResize(gameSize) {
    const width = gameSize.width
    const height = gameSize.height
    this.cw = width
    this.ch = height

    this.background.clear()
    this.background.fillGradientStyle(COLORS.bgTop, COLORS.bgTop, COLORS.bgBottom, COLORS.bgBottom, 1)
    this.background.fillRect(0, 0, width, height)

    this.floor.clear()
    this.floor.fillStyle(COLORS.floor, 1)
    this.floor.fillRoundedRect(0, height - FLOOR_HEIGHT, width, FLOOR_HEIGHT, { tl: 12, tr: 12, bl: 0, br: 0 })

    this.basket.setContainerSize(width, height)
    this.basket.clampToBounds()

    this.exitButton.setPosition(width - this.exitButton.width - 20, 20)

    this.layoutOverlay(this.startOverlay, width, height)
    this.layoutOverlay(this.gameOverOverlay, width, height)
  }
}

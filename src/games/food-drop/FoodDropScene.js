import Phaser from 'phaser'
import { MAX_FALLOS, KEY_MOVE_SPEED, COLORS, CONTAINER_MAX_WIDTH } from './constants.js'
import { Basket } from './Basket.js'
import { Spawner } from './Spawner.js'
import { clamp, checkCatch, isOffScreen } from './physics.js'

const TEXT_COLOR = COLORS.text
const FLOOR_HEIGHT = 100
// food-drop-v2/style.css: body { font-family: Poppins; text-transform: uppercase;
// letter-spacing: 0.12em; font-weight: 700 }. Phaser no tiene text-transform, así
// que el texto se pasa en mayúsculas ya armado; letterSpacing se calcula en px
// a partir del tamaño de fuente para replicar el 0.12em original.
const FONT_FAMILY = 'Poppins, sans-serif'
const LETTER_SPACING_EM = 0.12

function uiTextStyle(fontSizePx, extra = {}) {
  return {
    fontFamily: FONT_FAMILY,
    fontSize: `${fontSizePx}px`,
    fontStyle: 'bold',
    color: TEXT_COLOR,
    letterSpacing: fontSizePx * LETTER_SPACING_EM,
    ...extra,
  }
}

/**
 * FoodDropScene.js
 * Minijuego "Pusheen Snack Catch", portado desde el proyecto standalone
 * food-drop-v2 (DOM + CSS) a una Phaser.Scene dentro de PusheenTalk. Se
 * lanza desde la habitación "juegos" en MainScene (this.scene.start
 * ('FoodDropScene')) y vuelve a MainScene al salir o desde el botón de
 * cerrar.
 *
 * Migración fiel: toda la lógica (Basket/Spawner/Item/physics) es una
 * traducción 1:1 del original, mismos valores de constants.js. El único
 * cambio de layout real es que el área jugable se limita a
 * CONTAINER_MAX_WIDTH (480px, igual que `#app { max-width: 480px }` en
 * food-drop-v2/style.css) centrada, con "letterbox" a los costados en vez
 * de estirar a lo ancho de toda la pantalla — así el juego se ve y siente
 * igual que en el navegador standalone en cualquier ancho de pantalla.
 * `this.cw`/`this.ch` son ese ancho/alto acotados (el mismo cw/ch que
 * usaba el juego original), no el tamaño total del canvas.
 */
export class FoodDropScene extends Phaser.Scene {
  /** @param {import('../../core/EventBus.js').EventBus} eventBus */
  constructor(eventBus) {
    super('FoodDropScene')
    this.eventBus = eventBus
  }

  create() {
    this.state = 'start' // start | playing | gameover
    this.cw = 0
    this.ch = 0
    this.offsetX = 0
    this.elapsed = 0
    this.items = []
    this.dragging = false
    this.keysDown = new Set()
    this.score = 0
    this.fallos = 0

    // Todo el juego vive dentro de este container, que se posiciona en
    // offsetX para quedar centrado y acotado a CONTAINER_MAX_WIDTH. Fuera
    // de él el canvas queda transparente (Phaser.Game usa transparent:
    // true) y se ve el fondo negro de <body> — el letterbox.
    this.gameContainer = this.add.container(0, 0)

    this.background = this.add.graphics()
    this.floor = this.add.graphics()
    this.fallingLayer = this.add.container(0, 0)

    const basketSprite = this.add.image(0, 0, 'food-drop-basket')
    this.basket = new Basket(basketSprite)

    this.spawner = new Spawner({ container: this.fallingLayer })

    this.scoreText = this.add.text(
      20,
      16,
      '',
      uiTextStyle(20, { backgroundColor: '#ffffffdd', padding: { x: 16, y: 8 } })
    )
    this.fallosText = this.add.text(
      20,
      56,
      '',
      uiTextStyle(18, { backgroundColor: '#ffffffdd', padding: { x: 16, y: 8 } })
    )

    this.exitButton = this.add
      .text(0, 20, '✕', uiTextStyle(22, { backgroundColor: '#ffffffdd', padding: { x: 12, y: 6 } }))
      .setInteractive({ useHandCursor: true })
    this.exitButton.on('pointerdown', () => this.exitToMain())

    this.startOverlay = this.buildOverlay('PUSHEEN SNACK CATCH', 'JUGAR', () => this.start())
    this.gameOverOverlay = this.buildOverlay('GAME OVER', 'JUGAR DE NUEVO', () => this.start())
    this.gameOverOverlay.setVisible(false)

    // Orden = orden de pintado (igual que el orden del DOM original):
    // falling-layer, floor, basket, luego HUD y overlays por encima de todo.
    this.gameContainer.add([
      this.background,
      this.fallingLayer,
      this.floor,
      basketSprite,
      this.scoreText,
      this.fallosText,
      this.exitButton,
      this.startOverlay,
      this.gameOverOverlay,
    ])

    this.bindInput()
    this.handleResize(this.scale)
    this.updateHud()

    this.scale.on('resize', this.handleResize, this)
    this.events.once('shutdown', () => this.scale.off('resize', this.handleResize, this))
  }

  /**
   * food-drop-v2 style.css .overlay/.card: fondo rosa semitransparente
   * (`rgba(255,182,193,0.92)`) cubriendo toda el área de juego, con una
   * tarjeta blanca redondeada (max-width 320px, padding 32px 28px,
   * border-radius 24px) centrada adentro. El título es un <h1> que envuelve
   * en varias líneas dentro de esa tarjeta (por eso wordWrap acá) — sin la
   * tarjeta ni el wrap, un título largo como "PUSHEEN SNACK CATCH" se salía
   * de la pantalla.
   */
  buildOverlay(title, buttonLabel, onPress) {
    const CARD_WIDTH = 320
    const CARD_HEIGHT = 280
    const CARD_PADDING_X = 28

    const container = this.add.container(0, 0)

    const dim = this.add.rectangle(0, 0, 10, 10, 0xffb6c1, 0.92).setOrigin(0.5)

    const card = this.add.graphics()
    card.fillStyle(0xffffff, 1)
    card.fillRoundedRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, 24)

    const titleText = this.add
      .text(0, -74, title, {
        ...uiTextStyle(30, { letterSpacing: 30 * 0.15 }), // .overlay h1 pisa letter-spacing a 0.15em
        align: 'center',
        wordWrap: { width: CARD_WIDTH - CARD_PADDING_X * 2 },
      })
      .setOrigin(0.5)
    const scoreText = this.add.text(0, 6, '', uiTextStyle(20)).setOrigin(0.5) // #final-score: 20px

    const button = this.add
      .rectangle(0, 88, 220, 54, 0xffb7c5)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
    const buttonText = this.add.text(0, 88, buttonLabel, uiTextStyle(17)).setOrigin(0.5)

    button.on('pointerover', () => button.setFillStyle(0xffcbd9))
    button.on('pointerout', () => button.setFillStyle(0xffb7c5))
    button.on('pointerdown', onPress)

    container.add([dim, card, titleText, scoreText, button, buttonText])
    container.dim = dim
    container.scoreText = scoreText
    return container
  }

  layoutOverlay(container, playWidth, playHeight) {
    container.dim.setSize(playWidth, playHeight)
    container.setPosition(playWidth / 2, playHeight / 2)
  }

  start() {
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
    this.gameOverOverlay.scoreText.setText(`PUNTAJE: ${this.score}`)
    this.gameOverOverlay.setVisible(true)
  }

  updateHud() {
    this.scoreText.setText(`PUNTOS: ${this.score}`)
    this.fallosText.setText(`FALLOS: ${this.fallos} / ${MAX_FALLOS}`)
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

    // pointer.x es coordenada global del canvas; se resta offsetX para
    // llevarla al espacio local del gameContainer (0..cw), igual que el
    // original hacía con `clientX - rect.left` sobre el propio #game-area.
    const pointerToOffset = (globalX) => {
      const x = globalX - this.offsetX
      return clamp(x - this.cw / 2, -this.basket.maxOffset(), this.basket.maxOffset())
    }

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
    const screenWidth = gameSize.width
    const screenHeight = gameSize.height

    // Ancho acotado a CONTAINER_MAX_WIDTH (igual que #app { max-width:
    // 480px }), alto igual al de la pantalla completa (igual que height:
    // 100dvh original, sin tope) — ver comentario de clase.
    const playWidth = Math.min(screenWidth, CONTAINER_MAX_WIDTH)
    const playHeight = screenHeight
    this.offsetX = (screenWidth - playWidth) / 2
    this.cw = playWidth
    this.ch = playHeight

    this.gameContainer.setPosition(this.offsetX, 0)

    this.background.clear()
    this.background.fillGradientStyle(COLORS.bgTop, COLORS.bgTop, COLORS.bgBottom, COLORS.bgBottom, 1)
    this.background.fillRect(0, 0, playWidth, playHeight)

    this.floor.clear()
    this.floor.fillStyle(COLORS.floor, 1)
    this.floor.fillRoundedRect(0, playHeight - FLOOR_HEIGHT, playWidth, FLOOR_HEIGHT, {
      tl: 12,
      tr: 12,
      bl: 0,
      br: 0,
    })

    this.basket.setContainerSize(playWidth, playHeight)
    this.basket.clampToBounds()

    this.exitButton.setPosition(playWidth - this.exitButton.width - 20, 20)

    this.layoutOverlay(this.startOverlay, playWidth, playHeight)
    this.layoutOverlay(this.gameOverOverlay, playWidth, playHeight)
  }
}

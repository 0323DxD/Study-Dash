/**
 * GameManager.js — Coordinates the Phaser game engine with Study Dash.
 * Manages game startup, scene transitions, and custom reviewer question injection.
 */

import BootScene from './BootScene.js';
import GameScene from './GameScene.js';
import GameOverScene from './GameOverScene.js';

class GameManager {
  constructor() {
    this.game = null;
    this.isInitialized = false;
  }

  /**
   * Initializes or returns the active Phaser.Game instance.
   */
  init() {
    if (this.game) return this.game;

    const container = document.getElementById('game-container');
    const width = container ? container.clientWidth || 400 : 400;
    const height = container ? container.clientHeight || 700 : 700;

    const config = {
      type: Phaser.AUTO,
      parent: 'game-container',
      width: Math.min(width, 480),
      height: Math.min(height, 800),
      backgroundColor: '#141428',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      },
      scene: [BootScene, GameScene, GameOverScene]
    };

    this.game = new Phaser.Game(config);
    this.isInitialized = true;
    console.log('[GameManager] Phaser Game initialized.');
    return this.game;
  }

  /**
   * Starts a game run with optional mode and filter.
   */
  startGame(mode = 'endless', filter = {}) {
    const container = document.getElementById('game-container');
    if (container) {
      container.classList.add('active');
      container.setAttribute('aria-hidden', 'false');
    }

    if (!this.game) {
      this.init();
    } else {
      const activeScene = this.game.scene.getScene('GameScene');
      if (activeScene) {
        this.game.scene.stop('GameOverScene');
        this.game.scene.start('GameScene', { mode, filter });
      }
    }
  }

  /**
   * Stops running game and hides game container.
   */
  stopGame() {
    const container = document.getElementById('game-container');
    if (container) {
      container.classList.remove('active');
      container.setAttribute('aria-hidden', 'true');
    }
    if (this.game) {
      this.game.scene.stop('GameScene');
      this.game.scene.stop('GameOverScene');
    }
  }
}

export const gameManager = new GameManager();
export default gameManager;


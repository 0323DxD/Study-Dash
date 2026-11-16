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

    const config = {
      type: Phaser.AUTO,
      parent: 'game-container',
      width: 480,
      height: 800,
      backgroundColor: '#0a0c16',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 480,
        height: 800
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
    window.__studyDashStartData = { mode, filter };

    const container = document.getElementById('game-container');
    if (container) {
      container.classList.add('active');
      container.setAttribute('aria-hidden', 'false');
    }

    if (!this.game) {
      this.init();
    } else {
      this.game.scene.stop('GameOverScene');
      this.game.scene.stop('GameScene');
      this.game.scene.start('GameScene', { mode, filter });
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


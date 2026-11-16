/**
 * GameOverScene.js — Game Over summary screen for Study Dash.
 * Displays final score, coins collected, distance, high score checks,
 * and options to play again or return to study dashboard.
 */

import { DB } from '../db.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  async init(data) {
    this.finalScore = data?.score || 0;
    this.finalCoins = data?.coins || 0;
    this.finalDistance = data?.distance || 0;
    this.finalStreak = data?.streak || 0;

    // Persist score
    try {
      await DB.add('gameScores', {
        score: this.finalScore,
        coins: this.finalCoins,
        distance: this.finalDistance,
        date: new Date().toISOString(),
        mode: 'endless'
      });
    } catch (err) {
      console.warn('[GameOverScene] Failed to save score:', err);
    }
  }

  create() {
    const { width, height } = this.scale;

    // Background backdrop
    this.add.rectangle(width / 2, height / 2, width, height, 0x0f0f1e, 0.95);

    // Game Over Title
    this.add.text(width / 2, height * 0.18, 'GAME OVER', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '32px',
      fontWeight: '900',
      color: '#e94560'
    }).setOrigin(0.5);

    // Summary Card
    const cardY = height * 0.42;
    const card = this.add.rectangle(width / 2, cardY, width * 0.85, 230, 0x1f1f38)
      .setStrokeStyle(2, 0x3f3d56);

    this.add.text(width / 2, cardY - 80, 'RUN SUMMARY', {
      fontFamily: 'system-ui',
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#a0a0b0'
    }).setOrigin(0.5);

    // Score
    this.add.text(width / 2, cardY - 45, `${this.finalScore} PTS`, {
      fontFamily: 'system-ui',
      fontSize: '28px',
      fontWeight: '900',
      color: '#ffd166'
    }).setOrigin(0.5);

    // Distance & Coins stats
    this.add.text(width / 2, cardY + 5, `🏃 Distance: ${this.finalDistance} m`, {
      fontFamily: 'system-ui',
      fontSize: '16px',
      fontWeight: '600',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(width / 2, cardY + 35, `🪙 Coins Earned: ${this.finalCoins}`, {
      fontFamily: 'system-ui',
      fontSize: '16px',
      fontWeight: '600',
      color: '#ffd166'
    }).setOrigin(0.5);

    this.add.text(width / 2, cardY + 65, `🔥 Best Streak: ${this.finalStreak}`, {
      fontFamily: 'system-ui',
      fontSize: '15px',
      fontWeight: '600',
      color: '#ffbe0b'
    }).setOrigin(0.5);

    // Play Again Button
    const playAgainBtn = this.add.rectangle(width / 2, height * 0.68, width * 0.85, 48, 0x4361ee)
      .setInteractive({ useHandCursor: true });
    this.add.text(width / 2, height * 0.68, 'PLAY AGAIN 🔄', {
      fontFamily: 'system-ui',
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    playAgainBtn.on('pointerdown', () => {
      this.scene.start('GameScene');
    });

    // Review Mistakes / Dashboard Button
    const menuBtn = this.add.rectangle(width / 2, height * 0.77, width * 0.85, 48, 0x2b2b4c)
      .setInteractive({ useHandCursor: true });
    this.add.text(width / 2, height * 0.77, 'STUDY DASHBOARD 📚', {
      fontFamily: 'system-ui',
      fontSize: '15px',
      fontWeight: '600',
      color: '#ffffff'
    }).setOrigin(0.5);

    menuBtn.on('pointerdown', () => {
      // Hide game container and return to HTML dashboard
      const gc = document.getElementById('game-container');
      if (gc) gc.classList.remove('active');
      window.location.hash = '#home';
    });
  }
}


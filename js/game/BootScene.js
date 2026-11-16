/**
 * BootScene.js — Procedural Asset Generator for Study Dash.
 * Uses Phaser.Graphics to create all player sprites, obstacles, coins, and powerups in memory.
 * No external images needed — 100% offline, lightweight, and fast!
 */

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Everything generated procedurally in create()
  }

  create() {
    this.createPlayerTextures();
    this.createObstacleTextures();
    this.createCoinTexture();
    this.createPowerupTextures();
    this.createEnvironmentTextures();

    console.log('[BootScene] All procedural textures generated successfully.');
    this.scene.start('GameScene');
  }

  createPlayerTextures() {
    // 1. Normal Running Player (36x56)
    const gRun = this.make.graphics({ x: 0, y: 0, add: false });
    // Shadow
    gRun.fillStyle(0x000000, 0.25);
    gRun.fillEllipse(18, 52, 28, 8);
    // Body / Hoodie
    gRun.fillStyle(0x4361ee, 1);
    gRun.fillRoundedRect(6, 18, 24, 26, 6);
    // Head / Cap
    gRun.fillStyle(0xffbe0b, 1);
    gRun.fillCircle(18, 12, 10);
    gRun.fillStyle(0xf72585, 1);
    gRun.fillRect(10, 4, 18, 6); // Cap visor
    // Face details
    gRun.fillStyle(0x222222, 1);
    gRun.fillCircle(22, 12, 2); // Eye
    // Shoes
    gRun.fillStyle(0xffffff, 1);
    gRun.fillRoundedRect(6, 44, 10, 8, 3);
    gRun.fillRoundedRect(20, 44, 10, 8, 3);
    gRun.generateTexture('player_run', 36, 56);
    gRun.destroy();

    // 2. Sliding Player (52x28 - squashed)
    const gSlide = this.make.graphics({ x: 0, y: 0, add: false });
    gSlide.fillStyle(0x000000, 0.25);
    gSlide.fillEllipse(26, 26, 46, 8);
    gSlide.fillStyle(0x4361ee, 1);
    gSlide.fillRoundedRect(8, 8, 36, 16, 6);
    gSlide.fillStyle(0xffbe0b, 1);
    gSlide.fillCircle(40, 14, 8);
    gSlide.fillStyle(0xffffff, 1);
    gSlide.fillRoundedRect(2, 12, 10, 8, 3);
    gSlide.generateTexture('player_slide', 52, 28);
    gSlide.destroy();

    // 3. Jumping Player (36x56 - legs outstretched)
    const gJump = this.make.graphics({ x: 0, y: 0, add: false });
    gJump.fillStyle(0x4361ee, 1);
    gJump.fillRoundedRect(6, 14, 24, 26, 6);
    gJump.fillStyle(0xffbe0b, 1);
    gJump.fillCircle(18, 10, 10);
    gJump.fillStyle(0xf72585, 1);
    gJump.fillRect(10, 2, 18, 6);
    gJump.fillStyle(0xffffff, 1);
    gJump.fillRoundedRect(4, 40, 10, 10, 3);
    gJump.fillRoundedRect(22, 40, 10, 10, 3);
    gJump.generateTexture('player_jump', 36, 56);
    gJump.destroy();
  }

  createObstacleTextures() {
    // 1. High Barrier (Jump over or change lane) - 64x44
    const gBarrier = this.make.graphics({ x: 0, y: 0, add: false });
    gBarrier.fillStyle(0x000000, 0.25);
    gBarrier.fillEllipse(32, 42, 60, 6);
    // Posts
    gBarrier.fillStyle(0x333333, 1);
    gBarrier.fillRect(6, 6, 8, 36);
    gBarrier.fillRect(50, 6, 8, 36);
    // Barrier Bar (Yellow & Black stripes)
    gBarrier.fillStyle(0xfb8500, 1);
    gBarrier.fillRoundedRect(2, 8, 60, 18, 4);
    gBarrier.fillStyle(0x111111, 1);
    gBarrier.fillRect(12, 8, 10, 18);
    gBarrier.fillRect(32, 8, 10, 18);
    gBarrier.fillRect(52, 8, 6, 18);
    gBarrier.generateTexture('obs_barrier', 64, 44);
    gBarrier.destroy();

    // 2. Low Barrier (Must slide under or change lane) - 70x32
    const gLow = this.make.graphics({ x: 0, y: 0, add: false });
    // High support arches
    gLow.fillStyle(0x4a4e69, 1);
    gLow.fillRect(4, 2, 8, 28);
    gLow.fillRect(58, 2, 8, 28);
    // Overhead beam
    gLow.fillStyle(0xe63946, 1);
    gLow.fillRoundedRect(2, 2, 66, 12, 3);
    // Danger stripe
    gLow.fillStyle(0xffffff, 1);
    gLow.fillRect(16, 4, 8, 8);
    gLow.fillRect(34, 4, 8, 8);
    gLow.fillRect(52, 4, 8, 8);
    gLow.generateTexture('obs_low_barrier', 70, 32);
    gLow.destroy();

    // 3. Traffic Cone (Dodge left/right) - 32x38
    const gCone = this.make.graphics({ x: 0, y: 0, add: false });
    gCone.fillStyle(0x000000, 0.25);
    gCone.fillEllipse(16, 36, 28, 6);
    // Base
    gCone.fillStyle(0x222222, 1);
    gCone.fillRect(4, 30, 24, 6);
    // Cone Body (Orange)
    gCone.fillStyle(0xff5400, 1);
    gCone.fillTriangle(16, 4, 6, 30, 26, 30);
    // White Reflective Stripe
    gCone.fillStyle(0xffffff, 1);
    gCone.fillRect(10, 16, 12, 5);
    gCone.generateTexture('obs_cone', 32, 38);
    gCone.destroy();
  }

  createCoinTexture() {
    const gCoin = this.make.graphics({ x: 0, y: 0, add: false });
    // Outer glow / edge
    gCoin.fillStyle(0xffb703, 1);
    gCoin.fillCircle(14, 14, 13);
    // Inner gold
    gCoin.fillStyle(0xffd166, 1);
    gCoin.fillCircle(14, 14, 10);
    // Star center
    gCoin.fillStyle(0xffb703, 1);
    gCoin.fillCircle(14, 14, 4);
    gCoin.generateTexture('coin', 28, 28);
    gCoin.destroy();
  }

  createPowerupTextures() {
    // 1. Shield Power-up (Blue Hexagon)
    const gShield = this.make.graphics({ x: 0, y: 0, add: false });
    gShield.fillStyle(0x00b4d8, 1);
    gShield.fillCircle(16, 16, 15);
    gShield.fillStyle(0xffffff, 1);
    gShield.fillCircle(16, 16, 8);
    gShield.fillStyle(0x0077b6, 1);
    gShield.fillCircle(16, 16, 4);
    gShield.generateTexture('pw_shield', 32, 32);
    gShield.destroy();

    // 2. Coin Magnet (Red U-shape)
    const gMag = this.make.graphics({ x: 0, y: 0, add: false });
    gMag.fillStyle(0xe63946, 1);
    gMag.fillRoundedRect(4, 4, 24, 24, 6);
    gMag.fillStyle(0x1a1a2e, 1);
    gMag.fillRect(10, 10, 12, 18);
    // Silver tips
    gMag.fillStyle(0xcccccc, 1);
    gMag.fillRect(4, 20, 6, 8);
    gMag.fillRect(22, 20, 6, 8);
    gMag.generateTexture('pw_magnet', 32, 32);
    gMag.destroy();

    // 3. 2X Multiplier (Gold Badge)
    const g2x = this.make.graphics({ x: 0, y: 0, add: false });
    g2x.fillStyle(0x7209b7, 1);
    g2x.fillCircle(16, 16, 15);
    g2x.fillStyle(0xffd166, 1);
    g2x.fillRect(8, 12, 16, 8);
    g2x.generateTexture('pw_multiplier', 32, 32);
    g2x.destroy();
  }

  createEnvironmentTextures() {
    // Lane track line
    const gLine = this.make.graphics({ x: 0, y: 0, add: false });
    gLine.fillStyle(0xffffff, 0.3);
    gLine.fillRect(0, 0, 4, 40);
    gLine.generateTexture('lane_line', 4, 40);
    gLine.destroy();

    // Track surface
    const gTrack = this.make.graphics({ x: 0, y: 0, add: false });
    gTrack.fillStyle(0x1e1e38, 1);
    gTrack.fillRect(0, 0, 360, 600);
    gTrack.generateTexture('track_surface', 360, 600);
    gTrack.destroy();
  }
}


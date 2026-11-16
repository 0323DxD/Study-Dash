/**
 * BootScene.js — Procedural Vector Asset Generator for Study Dash.
 * Creates Subway Surfers-style trains, barriers, overhead clearance arches,
 * runner sprites, coins, power-ups, and track decorations.
 * Zero external images needed — 100% offline, lightweight, and fast!
 */

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    this.createPlayerTextures();
    this.createTrainTextures();
    this.createObstacleTextures();
    this.createCheckpointArchTexture();
    this.createCoinTextures();
    this.createPowerupTextures();
    this.createEnvironmentTextures();

    console.log('[BootScene] Subway Surfers runner textures generated.');
    this.scene.start('GameScene', window.__studyDashStartData || { mode: 'endless' });
  }

  createPlayerTextures() {
    // 1. Running Frame 1 (Left stride) — 40x60
    const gRun1 = this.make.graphics({ x: 0, y: 0, add: false });
    // Shadow
    gRun1.fillStyle(0x000000, 0.3);
    gRun1.fillEllipse(20, 56, 32, 8);
    // Body / Hoodie (Sporty Blue)
    gRun1.fillStyle(0x3a0ca3, 1);
    gRun1.fillRoundedRect(8, 18, 24, 26, 6);
    // Chest stripe (Neon Cyan)
    gRun1.fillStyle(0x4cc9f0, 1);
    gRun1.fillRect(10, 24, 20, 5);
    // Head & Cap (Neon Red/Pink Cap)
    gRun1.fillStyle(0xffbe0b, 1);
    gRun1.fillCircle(20, 12, 10);
    gRun1.fillStyle(0xf72585, 1);
    gRun1.fillRoundedRect(10, 4, 20, 7, 3);
    gRun1.fillRect(18, 7, 10, 4); // Visor
    // Eye
    gRun1.fillStyle(0x1a1a2e, 1);
    gRun1.fillCircle(24, 12, 2);
    // Sneakers (Left leg forward, right leg back)
    gRun1.fillStyle(0xffffff, 1);
    gRun1.fillRoundedRect(6, 44, 11, 9, 3);
    gRun1.fillRoundedRect(22, 41, 11, 9, 3);
    gRun1.fillStyle(0xf72585, 1);
    gRun1.fillRect(6, 49, 11, 4); // Sole
    gRun1.fillRect(22, 46, 11, 4);
    gRun1.generateTexture('player_run_1', 40, 60);
    gRun1.destroy();

    // 2. Running Frame 2 (Right stride) — 40x60
    const gRun2 = this.make.graphics({ x: 0, y: 0, add: false });
    gRun2.fillStyle(0x000000, 0.3);
    gRun2.fillEllipse(20, 56, 32, 8);
    gRun2.fillStyle(0x3a0ca3, 1);
    gRun2.fillRoundedRect(8, 17, 24, 26, 6);
    gRun2.fillStyle(0x4cc9f0, 1);
    gRun2.fillRect(10, 23, 20, 5);
    gRun2.fillStyle(0xffbe0b, 1);
    gRun2.fillCircle(20, 11, 10);
    gRun2.fillStyle(0xf72585, 1);
    gRun2.fillRoundedRect(10, 3, 20, 7, 3);
    gRun2.fillRect(18, 6, 10, 4);
    gRun2.fillStyle(0x1a1a2e, 1);
    gRun2.fillCircle(24, 11, 2);
    // Inverted legs
    gRun2.fillStyle(0xffffff, 1);
    gRun2.fillRoundedRect(6, 41, 11, 9, 3);
    gRun2.fillRoundedRect(22, 44, 11, 9, 3);
    gRun2.fillStyle(0xf72585, 1);
    gRun2.fillRect(6, 46, 11, 4);
    gRun2.fillRect(22, 49, 11, 4);
    gRun2.generateTexture('player_run_2', 40, 60);
    gRun2.destroy();

    // 3. Sliding Player (Squashed low to slide under overhead barriers) — 56x32
    const gSlide = this.make.graphics({ x: 0, y: 0, add: false });
    gSlide.fillStyle(0x000000, 0.35);
    gSlide.fillEllipse(28, 28, 52, 8);
    // Torso sliding horizontal
    gSlide.fillStyle(0x3a0ca3, 1);
    gSlide.fillRoundedRect(10, 10, 38, 15, 5);
    gSlide.fillStyle(0x4cc9f0, 1);
    gSlide.fillRect(12, 14, 34, 4);
    // Head on front
    gSlide.fillStyle(0xffbe0b, 1);
    gSlide.fillCircle(45, 16, 8);
    gSlide.fillStyle(0xf72585, 1);
    gSlide.fillRoundedRect(40, 9, 12, 6, 2);
    // Sneakers trailing
    gSlide.fillStyle(0xffffff, 1);
    gSlide.fillRoundedRect(2, 14, 10, 8, 2);
    gSlide.generateTexture('player_slide', 56, 32);
    gSlide.destroy();

    // 4. Jumping Player (Arms up, knees bent) — 40x60
    const gJump = this.make.graphics({ x: 0, y: 0, add: false });
    gJump.fillStyle(0x3a0ca3, 1);
    gJump.fillRoundedRect(8, 14, 24, 26, 6);
    gJump.fillStyle(0x4cc9f0, 1);
    gJump.fillRect(10, 20, 20, 5);
    gJump.fillStyle(0xffbe0b, 1);
    gJump.fillCircle(20, 8, 10);
    gJump.fillStyle(0xf72585, 1);
    gJump.fillRoundedRect(10, 1, 20, 7, 3);
    gJump.fillRect(18, 4, 10, 4);
    // Extended legs
    gJump.fillStyle(0xffffff, 1);
    gJump.fillRoundedRect(4, 38, 11, 12, 3);
    gJump.fillRoundedRect(24, 38, 11, 12, 3);
    gJump.generateTexture('player_jump', 40, 60);
    gJump.destroy();
  }

  createTrainTextures() {
    // Red Subway Train Car (76x140) — spans entire lane width!
    const gTrainRed = this.make.graphics({ x: 0, y: 0, add: false });
    gTrainRed.fillStyle(0x000000, 0.4);
    gTrainRed.fillRoundedRect(2, 6, 72, 134, 8);
    gTrainRed.fillStyle(0xd90429, 1);
    gTrainRed.fillRoundedRect(4, 4, 68, 130, 8);
    gTrainRed.fillStyle(0xef233c, 1);
    gTrainRed.fillRoundedRect(8, 8, 60, 20, 4);
    gTrainRed.fillStyle(0x101026, 1);
    gTrainRed.fillRoundedRect(10, 32, 56, 26, 4);
    // Headlights
    gTrainRed.fillStyle(0xffea00, 1);
    gTrainRed.fillCircle(18, 66, 6);
    gTrainRed.fillCircle(58, 66, 6);
    gTrainRed.fillStyle(0xffffff, 1);
    gTrainRed.fillCircle(18, 66, 3);
    gTrainRed.fillCircle(58, 66, 3);
    // Grill
    gTrainRed.fillStyle(0x2b2d42, 1);
    gTrainRed.fillRoundedRect(8, 76, 60, 18, 3);
    gTrainRed.fillStyle(0x8d99ae, 1);
    for (let i = 12; i < 64; i += 8) {
      gTrainRed.fillRect(i, 80, 4, 10);
    }
    // Danger Stripes at bottom
    gTrainRed.fillStyle(0xffbe0b, 1);
    gTrainRed.fillRect(6, 98, 64, 8);
    gTrainRed.fillStyle(0x111111, 1);
    for (let i = 8; i < 68; i += 12) {
      gTrainRed.fillRect(i, 98, 6, 8);
    }
    // Side windows
    gTrainRed.fillStyle(0x8d99ae, 1);
    gTrainRed.fillRect(8, 110, 12, 18);
    gTrainRed.fillRect(28, 110, 20, 18);
    gTrainRed.fillRect(56, 110, 12, 18);
    gTrainRed.generateTexture('train_red', 76, 140);
    gTrainRed.destroy();

    // Blue Metro Train Car (76x140)
    const gTrainBlue = this.make.graphics({ x: 0, y: 0, add: false });
    gTrainBlue.fillStyle(0x000000, 0.4);
    gTrainBlue.fillRoundedRect(2, 6, 72, 134, 8);
    gTrainBlue.fillStyle(0x0077b6, 1);
    gTrainBlue.fillRoundedRect(4, 4, 68, 130, 8);
    gTrainBlue.fillStyle(0x0096c7, 1);
    gTrainBlue.fillRoundedRect(8, 8, 60, 20, 4);
    gTrainBlue.fillStyle(0x03045e, 1);
    gTrainBlue.fillRoundedRect(10, 32, 56, 26, 4);
    gTrainBlue.fillStyle(0x48cae4, 1);
    gTrainBlue.fillCircle(18, 66, 6);
    gTrainBlue.fillCircle(58, 66, 6);
    gTrainBlue.fillStyle(0xffffff, 1);
    gTrainBlue.fillCircle(18, 66, 3);
    gTrainBlue.fillCircle(58, 66, 3);
    gTrainBlue.fillStyle(0x023e8a, 1);
    gTrainBlue.fillRoundedRect(8, 76, 60, 18, 3);
    gTrainBlue.fillStyle(0x90e0ef, 1);
    for (let i = 12; i < 64; i += 8) {
      gTrainBlue.fillRect(i, 80, 4, 10);
    }
    gTrainBlue.fillStyle(0xffbe0b, 1);
    gTrainBlue.fillRect(6, 98, 64, 8);
    gTrainBlue.fillStyle(0x111111, 1);
    for (let i = 8; i < 68; i += 12) {
      gTrainBlue.fillRect(i, 98, 6, 8);
    }
    gTrainBlue.generateTexture('train_blue', 76, 140);
    gTrainBlue.destroy();
  }

  createObstacleTextures() {
    // 1. High Road Barrier (Must jump or switch lane) — 72x48
    const gBarrier = this.make.graphics({ x: 0, y: 0, add: false });
    gBarrier.fillStyle(0x000000, 0.3);
    gBarrier.fillEllipse(36, 44, 68, 8);
    gBarrier.fillStyle(0x222222, 1);
    gBarrier.fillRect(6, 12, 10, 32);
    gBarrier.fillRect(56, 12, 10, 32);
    gBarrier.fillStyle(0xffbe0b, 1);
    gBarrier.fillCircle(11, 8, 6);
    gBarrier.fillCircle(61, 8, 6);
    gBarrier.fillStyle(0xffb703, 1);
    gBarrier.fillRoundedRect(2, 14, 68, 20, 3);
    gBarrier.fillStyle(0x1a1a2e, 1);
    for (let x = 6; x < 68; x += 14) {
      gBarrier.fillRect(x, 14, 7, 20);
    }
    gBarrier.generateTexture('obs_barrier', 72, 48);
    gBarrier.destroy();

    // 2. Low Clearance Arch (Must SLIDE under or switch lane) — 80x42
    const gLow = this.make.graphics({ x: 0, y: 0, add: false });
    gLow.fillStyle(0x343a40, 1);
    gLow.fillRect(2, 0, 8, 42);
    gLow.fillRect(70, 0, 8, 42);
    gLow.fillStyle(0xe63946, 1);
    gLow.fillRoundedRect(0, 0, 80, 14, 3);
    gLow.fillStyle(0xffffff, 1);
    for (let x = 6; x < 76; x += 14) {
      gLow.fillRect(x, 2, 7, 10);
    }
    gLow.fillStyle(0x111111, 1);
    gLow.fillRect(24, 2, 32, 10);
    gLow.fillStyle(0xadb5bd, 1);
    gLow.fillRect(16, 14, 2, 8);
    gLow.fillRect(62, 14, 2, 8);
    gLow.generateTexture('obs_low_barrier', 80, 42);
    gLow.destroy();

    // 3. Traffic Cone — 34x38
    const gCone = this.make.graphics({ x: 0, y: 0, add: false });
    gCone.fillStyle(0x000000, 0.3);
    gCone.fillEllipse(17, 35, 30, 6);
    gCone.fillStyle(0x111111, 1);
    gCone.fillRect(4, 30, 26, 6);
    gCone.fillStyle(0xfb8500, 1);
    gCone.fillTriangle(17, 4, 6, 30, 28, 30);
    gCone.fillStyle(0xffffff, 1);
    gCone.fillRect(10, 16, 14, 5);
    gCone.generateTexture('obs_cone', 34, 38);
    gCone.destroy();
  }

  createCheckpointArchTexture() {
    // Giant Glowing Question Checkpoint Arch spanning all 3 lanes (260x80)
    const gArch = this.make.graphics({ x: 0, y: 0, add: false });
    gArch.fillStyle(0x4361ee, 0.25);
    gArch.fillRoundedRect(0, 0, 260, 80, 12);
    gArch.fillStyle(0x1a1a2e, 0.9);
    gArch.fillRoundedRect(10, 10, 240, 40, 8);
    gArch.lineStyle(3, 0x00f5d4, 1);
    gArch.strokeRoundedRect(10, 10, 240, 40, 8);
    gArch.fillStyle(0xffea00, 1);
    gArch.fillCircle(24, 30, 8);
    gArch.fillCircle(236, 30, 8);
    gArch.fillStyle(0x00f5d4, 1);
    gArch.fillCircle(130, 30, 14);
    gArch.fillStyle(0x1a1a2e, 1);
    gArch.fillCircle(130, 30, 8);
    gArch.fillStyle(0x3f37c9, 1);
    gArch.fillRect(12, 50, 14, 30);
    gArch.fillRect(234, 50, 14, 30);
    gArch.generateTexture('checkpoint_arch', 260, 80);
    gArch.destroy();
  }

  createCoinTextures() {
    const gCoin1 = this.make.graphics({ x: 0, y: 0, add: false });
    gCoin1.fillStyle(0xffb703, 1);
    gCoin1.fillCircle(14, 14, 13);
    gCoin1.fillStyle(0xffd166, 1);
    gCoin1.fillCircle(14, 14, 10);
    gCoin1.fillStyle(0xffb703, 1);
    gCoin1.fillCircle(14, 14, 4);
    gCoin1.generateTexture('coin_1', 28, 28);
    gCoin1.destroy();

    const gCoin2 = this.make.graphics({ x: 0, y: 0, add: false });
    gCoin2.fillStyle(0xffb703, 1);
    gCoin2.fillEllipse(14, 14, 18, 26);
    gCoin2.fillStyle(0xffd166, 1);
    gCoin2.fillEllipse(14, 14, 12, 20);
    gCoin2.generateTexture('coin_2', 28, 28);
    gCoin2.destroy();
  }

  createPowerupTextures() {
    // 1. Shield Power-up — 36x36
    const gShield = this.make.graphics({ x: 0, y: 0, add: false });
    gShield.fillStyle(0x00b4d8, 1);
    gShield.fillCircle(18, 18, 17);
    gShield.fillStyle(0x90e0ef, 1);
    gShield.fillCircle(18, 18, 11);
    gShield.fillStyle(0xffffff, 1);
    gShield.fillCircle(18, 18, 5);
    gShield.generateTexture('pw_shield', 36, 36);
    gShield.destroy();

    // 2. Coin Magnet — 36x36
    const gMag = this.make.graphics({ x: 0, y: 0, add: false });
    gMag.fillStyle(0xe63946, 1);
    gMag.fillRoundedRect(4, 4, 28, 28, 6);
    gMag.fillStyle(0x1a1a2e, 1);
    gMag.fillRect(11, 11, 14, 21);
    gMag.fillStyle(0xe9ecef, 1);
    gMag.fillRect(4, 22, 7, 10);
    gMag.fillRect(25, 22, 7, 10);
    gMag.generateTexture('pw_magnet', 36, 36);
    gMag.destroy();

    // 3. 2X Multiplier — 36x36
    const g2x = this.make.graphics({ x: 0, y: 0, add: false });
    g2x.fillStyle(0x7209b7, 1);
    g2x.fillCircle(18, 18, 17);
    g2x.fillStyle(0xffbe0b, 1);
    g2x.fillCircle(18, 18, 12);
    g2x.fillStyle(0x1a1a2e, 1);
    g2x.fillRect(10, 14, 16, 8);
    g2x.generateTexture('pw_multiplier', 36, 36);
    g2x.destroy();

    // 4. Extra Life Heart — 36x36
    const gHeart = this.make.graphics({ x: 0, y: 0, add: false });
    gHeart.fillStyle(0xf72585, 1);
    gHeart.fillCircle(12, 14, 8);
    gHeart.fillCircle(24, 14, 8);
    gHeart.fillTriangle(4, 16, 32, 16, 18, 30);
    gHeart.generateTexture('pw_heart', 36, 36);
    gHeart.destroy();
  }

  createEnvironmentTextures() {
    const gTie = this.make.graphics({ x: 0, y: 0, add: false });
    gTie.fillStyle(0x4a4e69, 1);
    gTie.fillRect(0, 0, 60, 10);
    gTie.fillStyle(0x22223b, 1);
    gTie.fillRect(0, 10, 60, 2);
    gTie.fillStyle(0xadb5bd, 1);
    gTie.fillRect(8, 0, 4, 10);
    gTie.fillRect(48, 0, 4, 10);
    gTie.generateTexture('rail_tie', 60, 12);
    gTie.destroy();

    const gWall = this.make.graphics({ x: 0, y: 0, add: false });
    gWall.fillStyle(0x1e1e38, 1);
    gWall.fillRect(0, 0, 48, 80);
    gWall.fillStyle(0x2b2b4c, 1);
    gWall.fillRect(6, 10, 16, 20);
    gWall.fillRect(26, 10, 16, 20);
    gWall.fillRect(6, 44, 16, 20);
    gWall.fillRect(26, 44, 16, 20);
    gWall.fillStyle(0xffd166, 0.7);
    gWall.fillRect(8, 12, 12, 16);
    gWall.fillRect(28, 46, 12, 16);
    gWall.generateTexture('city_wall', 48, 80);
    gWall.destroy();
  }
}

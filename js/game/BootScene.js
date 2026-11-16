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
    // 1. Soft Floor Contact Shadow — 48x16
    const gShadow = this.make.graphics({ x: 0, y: 0, add: false });
    gShadow.fillStyle(0x000000, 0.45);
    gShadow.fillEllipse(24, 8, 46, 14);
    gShadow.fillStyle(0x000000, 0.25);
    gShadow.fillEllipse(24, 8, 32, 9);
    gShadow.generateTexture('lib_floor_shadow', 48, 16);
    gShadow.destroy();

    // 2. Horizon End-of-Corridor Doors & Lockers — 180x90
    const gHorizon = this.make.graphics({ x: 0, y: 0, add: false });
    // Corridor back wall
    gHorizon.fillStyle(0x181a29, 1);
    gHorizon.fillRect(0, 0, 180, 90);

    // School Lockers (Left & Right)
    gHorizon.fillStyle(0x2a324b, 1);
    gHorizon.fillRect(4, 18, 38, 72);
    gHorizon.fillRect(138, 18, 38, 72);
    // Locker slots and handles
    gHorizon.fillStyle(0x1c2233, 1);
    for (let lx of [12, 24, 146, 158]) {
      gHorizon.fillRect(lx, 24, 8, 2);
      gHorizon.fillRect(lx, 28, 8, 2);
      gHorizon.fillRect(lx, 32, 8, 2);
      gHorizon.fillRect(lx + 4, 46, 2, 8); // handle
    }

    // Double Campus Doors (Center)
    gHorizon.fillStyle(0x3e2723, 1); // Dark mahogany outer architrave
    gHorizon.fillRect(48, 14, 84, 76);
    // Left & right door leafs
    gHorizon.fillStyle(0x4e342e, 1);
    gHorizon.fillRect(52, 18, 36, 72);
    gHorizon.fillRect(92, 18, 36, 72);
    // Door glass panels with glowing interior light
    gHorizon.fillStyle(0xffe082, 0.85);
    gHorizon.fillRect(58, 26, 24, 34);
    gHorizon.fillRect(98, 26, 24, 34);
    gHorizon.fillStyle(0xfff8e1, 0.95);
    gHorizon.fillRect(62, 30, 16, 26);
    gHorizon.fillRect(102, 30, 16, 26);
    // Brass push bars
    gHorizon.fillStyle(0xd7ccc8, 1);
    gHorizon.fillRect(54, 58, 32, 3);
    gHorizon.fillRect(94, 58, 32, 3);

    // Overhead Banner "STUDY DASH RUN"
    gHorizon.fillStyle(0x0f111a, 0.9);
    gHorizon.fillRect(36, 2, 108, 12);
    gHorizon.lineStyle(1, 0x4cc9f0, 0.7);
    gHorizon.strokeRect(36, 2, 108, 12);
    gHorizon.fillStyle(0x4cc9f0, 1);
    gHorizon.fillRect(40, 6, 100, 4); // Banner accent strip
    gHorizon.generateTexture('lib_horizon_door', 180, 90);
    gHorizon.destroy();

    // 3. Bookshelf Left — 72x120
    const gShelfL = this.make.graphics({ x: 0, y: 0, add: false });
    // Wood frame
    gShelfL.fillStyle(0x2d1b11, 1);
    gShelfL.fillRect(0, 0, 72, 120);
    gShelfL.fillStyle(0x422819, 1);
    gShelfL.fillRect(2, 2, 68, 116);
    // 3 Shelves
    const bookColors = [0xd90429, 0x0077b6, 0x2d6a4f, 0xffb703, 0x7209b7, 0xf72585, 0xe0e1dd, 0x3a0ca3];
    for (let shelf = 0; shelf < 3; shelf++) {
      const sy = 8 + shelf * 38;
      // Shelf recess shadow
      gShelfL.fillStyle(0x1a0f0a, 1);
      gShelfL.fillRect(6, sy, 60, 32);
      // Books
      let bx = 8;
      let cIdx = shelf * 3;
      while (bx < 62) {
        const bw = Phaser.Math.Between(5, 9);
        const bh = Phaser.Math.Between(22, 30);
        const color = bookColors[cIdx % bookColors.length];
        cIdx++;
        gShelfL.fillStyle(color, 1);
        gShelfL.fillRect(bx, sy + 32 - bh, bw, bh);
        // Spine highlight
        gShelfL.fillStyle(0xffffff, 0.25);
        gShelfL.fillRect(bx + 1, sy + 32 - bh, 1, bh);
        // Gold foil line
        if (bh > 26) {
          gShelfL.fillStyle(0xffd166, 0.8);
          gShelfL.fillRect(bx + 1, sy + 32 - bh + 6, bw - 2, 2);
        }
        bx += bw + 1;
      }
      // Wooden shelf ledge
      gShelfL.fillStyle(0x5c3822, 1);
      gShelfL.fillRect(4, sy + 32, 64, 4);
    }
    gShelfL.generateTexture('lib_bookshelf_left', 72, 120);
    gShelfL.destroy();

    // 4. Bookshelf Right (Slightly varied book sequence) — 72x120
    const gShelfR = this.make.graphics({ x: 0, y: 0, add: false });
    gShelfR.fillStyle(0x2d1b11, 1);
    gShelfR.fillRect(0, 0, 72, 120);
    gShelfR.fillStyle(0x422819, 1);
    gShelfR.fillRect(2, 2, 68, 116);
    for (let shelf = 0; shelf < 3; shelf++) {
      const sy = 8 + shelf * 38;
      gShelfR.fillStyle(0x1a0f0a, 1);
      gShelfR.fillRect(6, sy, 60, 32);
      let bx = 8;
      let cIdx = (shelf + 2) * 4;
      while (bx < 62) {
        const bw = Phaser.Math.Between(5, 9);
        const bh = Phaser.Math.Between(22, 30);
        const color = bookColors[cIdx % bookColors.length];
        cIdx++;
        gShelfR.fillStyle(color, 1);
        gShelfR.fillRect(bx, sy + 32 - bh, bw, bh);
        gShelfR.fillStyle(0xffffff, 0.25);
        gShelfR.fillRect(bx + 1, sy + 32 - bh, 1, bh);
        if (bh > 25) {
          gShelfR.fillStyle(0xffd166, 0.8);
          gShelfR.fillRect(bx + 1, sy + 32 - bh + 8, bw - 2, 2);
        }
        bx += bw + 1;
      }
      gShelfR.fillStyle(0x5c3822, 1);
      gShelfR.fillRect(4, sy + 32, 64, 4);
    }
    gShelfR.generateTexture('lib_bookshelf_right', 72, 120);
    gShelfR.destroy();

    // 5. Overhead Ceiling Archway with Pendant Chandelier — 240x50
    const gArch = this.make.graphics({ x: 0, y: 0, add: false });
    // Arch Beam
    gArch.fillStyle(0x1e202f, 1);
    gArch.fillRect(0, 0, 240, 16);
    gArch.fillStyle(0x3e2723, 1);
    gArch.fillRect(0, 16, 240, 6);
    // Suspended cord
    gArch.fillStyle(0xb08968, 1);
    gArch.fillRect(119, 22, 2, 14);
    // Pendant Lamp fixture
    gArch.fillStyle(0x7f4f24, 1);
    gArch.fillTriangle(108, 42, 132, 42, 120, 34);
    // Glowing lamp bulb
    gArch.fillStyle(0xffe066, 0.95);
    gArch.fillCircle(120, 44, 6);
    gArch.fillStyle(0xffffff, 1);
    gArch.fillCircle(120, 44, 3);
    gArch.generateTexture('lib_ceiling_arch', 240, 50);
    gArch.destroy();

    // 6. Textured Academic Carpet Runner Tile — 300x80
    const gFloor = this.make.graphics({ x: 0, y: 0, add: false });
    gFloor.fillStyle(0x131522, 1);
    gFloor.fillRect(0, 0, 300, 80);
    // Runner border strips
    gFloor.fillStyle(0x22273d, 1);
    gFloor.fillRect(6, 0, 4, 80);
    gFloor.fillRect(290, 0, 4, 80);
    // Subtle diamond academic pattern
    gFloor.lineStyle(1, 0x1f2336, 0.6);
    for (let x = 20; x < 280; x += 40) {
      gFloor.strokeRect(x, 10, 20, 20);
      gFloor.strokeRect(x + 20, 40, 20, 20);
    }
    // Faint math/study doodle watermarks
    gFloor.fillStyle(0x2a3048, 0.45);
    // Pi doodle
    gFloor.fillRect(50, 25, 12, 2);
    gFloor.fillRect(52, 27, 2, 8);
    gFloor.fillRect(58, 27, 2, 8);
    // Sigma doodle
    gFloor.fillRect(140, 25, 10, 2);
    gFloor.fillRect(140, 33, 10, 2);
    // Book icon doodle
    gFloor.fillRect(220, 26, 14, 10);
    gFloor.fillStyle(0x131522, 1);
    gFloor.fillRect(226, 26, 2, 10);
    gFloor.generateTexture('lib_floor_tile', 300, 80);
    gFloor.destroy();

    // Fallbacks for legacy keys
    const gTie = this.make.graphics({ x: 0, y: 0, add: false });
    gTie.fillStyle(0x2a324b, 1);
    gTie.fillRect(0, 0, 60, 8);
    gTie.generateTexture('rail_tie', 60, 8);
    gTie.destroy();

    const gWall = this.make.graphics({ x: 0, y: 0, add: false });
    gWall.fillStyle(0x1e1e38, 1);
    gWall.fillRect(0, 0, 48, 80);
    gWall.generateTexture('city_wall', 48, 80);
    gWall.destroy();
  }
}

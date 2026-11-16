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
    this.createThemedObstacleTextures();
    this.createTrainTextures();
    this.createObstacleTextures();
    this.createCheckpointArchTexture();
    this.createTriviaGateTextures();
    this.createEducationalCollectibleTextures();
    this.createCoinTextures();
    this.createPowerupTextures();
    this.createParticleTextures();
    this.createEnvironmentTextures();

    console.log('[BootScene] Study Dash 2.5D visual assets generated.');
    this.scene.start('GameScene', window.__studyDashStartData || { mode: 'endless' });
  }

  createPlayerTextures() {
    // Student Runner: Brown hair, glasses, brown backpack, white shirt, blue jeans, sneakers.
    // 1. Running Frame 1 (Left stride forward) — 44x64
    const gRun1 = this.make.graphics({ x: 0, y: 0, add: false });
    // Left Leg forward, Right Leg back
    gRun1.fillStyle(0x233d4d, 1); // Jeans
    gRun1.fillRoundedRect(9, 40, 11, 16, 3);
    gRun1.fillRoundedRect(24, 38, 11, 14, 3);
    // Sneakers (White with red/black sole)
    gRun1.fillStyle(0xffffff, 1);
    gRun1.fillRoundedRect(7, 52, 13, 9, 3);
    gRun1.fillRoundedRect(24, 48, 13, 9, 3);
    gRun1.fillStyle(0xd90429, 1);
    gRun1.fillRect(7, 58, 13, 3);
    gRun1.fillRect(24, 54, 13, 3);
    // Torso / White Polo
    gRun1.fillStyle(0xf8f9fa, 1);
    gRun1.fillRoundedRect(10, 20, 24, 23, 5);
    // Leather Brown Backpack on Back (Central with straps)
    gRun1.fillStyle(0x7f4f24, 1);
    gRun1.fillRoundedRect(13, 22, 18, 20, 5);
    gRun1.fillStyle(0x582f0e, 1); // Front pouch
    gRun1.fillRoundedRect(15, 28, 14, 12, 3);
    gRun1.fillStyle(0xffd166, 1); // Brass zipper
    gRun1.fillRect(17, 28, 10, 2);
    // Shoulder straps
    gRun1.fillStyle(0x582f0e, 1);
    gRun1.fillRect(11, 22, 3, 14);
    gRun1.fillRect(30, 22, 3, 14);
    // Head & Neck
    gRun1.fillStyle(0xfec89a, 1); // Skin
    gRun1.fillRect(19, 14, 6, 7);
    gRun1.fillCircle(22, 13, 10);
    // Brown Curly/Styled Hair
    gRun1.fillStyle(0x5c3822, 1);
    gRun1.fillCircle(22, 10, 11);
    gRun1.fillCircle(17, 10, 6);
    gRun1.fillCircle(27, 10, 6);
    gRun1.fillCircle(22, 6, 6);
    // Spectacles frame arms visible from side/angle
    gRun1.fillStyle(0x1a1a2e, 1);
    gRun1.fillRect(29, 12, 4, 2);
    // Arms swinging (Left arm back, Right arm forward)
    gRun1.fillStyle(0xf8f9fa, 1); // Shirt sleeves
    gRun1.fillRoundedRect(6, 21, 6, 10, 2);
    gRun1.fillRoundedRect(32, 22, 6, 10, 2);
    gRun1.fillStyle(0xfec89a, 1); // Hands
    gRun1.fillCircle(9, 32, 4);
    gRun1.fillCircle(35, 33, 4);
    gRun1.generateTexture('player_run_1', 44, 64);
    gRun1.destroy();

    // 2. Running Frame 2 (Passing stride, slight squash & bounce) — 44x64
    const gRun2 = this.make.graphics({ x: 0, y: 0, add: false });
    gRun2.fillStyle(0x233d4d, 1);
    gRun2.fillRoundedRect(11, 41, 10, 15, 3);
    gRun2.fillRoundedRect(23, 41, 10, 15, 3);
    gRun2.fillStyle(0xffffff, 1);
    gRun2.fillRoundedRect(10, 53, 12, 8, 3);
    gRun2.fillRoundedRect(22, 53, 12, 8, 3);
    gRun2.fillStyle(0xd90429, 1);
    gRun2.fillRect(10, 58, 12, 3);
    gRun2.fillRect(22, 58, 12, 3);
    gRun2.fillStyle(0xf8f9fa, 1);
    gRun2.fillRoundedRect(10, 21, 24, 23, 5);
    gRun2.fillStyle(0x7f4f24, 1);
    gRun2.fillRoundedRect(13, 23, 18, 20, 5);
    gRun2.fillStyle(0x582f0e, 1);
    gRun2.fillRoundedRect(15, 29, 14, 12, 3);
    gRun2.fillStyle(0xffd166, 1);
    gRun2.fillRect(17, 29, 10, 2);
    gRun2.fillStyle(0x582f0e, 1);
    gRun2.fillRect(11, 23, 3, 14);
    gRun2.fillRect(30, 23, 3, 14);
    gRun2.fillStyle(0xfec89a, 1);
    gRun2.fillRect(19, 15, 6, 7);
    gRun2.fillCircle(22, 14, 10);
    gRun2.fillStyle(0x5c3822, 1);
    gRun2.fillCircle(22, 11, 11);
    gRun2.fillCircle(17, 11, 6);
    gRun2.fillCircle(27, 11, 6);
    gRun2.fillCircle(22, 7, 6);
    gRun2.fillStyle(0x1a1a2e, 1);
    gRun2.fillRect(29, 13, 4, 2);
    gRun2.fillStyle(0xf8f9fa, 1);
    gRun2.fillRoundedRect(7, 22, 6, 10, 2);
    gRun2.fillRoundedRect(31, 22, 6, 10, 2);
    gRun2.fillStyle(0xfec89a, 1);
    gRun2.fillCircle(10, 33, 4);
    gRun2.fillCircle(34, 33, 4);
    gRun2.generateTexture('player_run_2', 44, 64);
    gRun2.destroy();

    // 3. Running Frame 3 (Right stride forward) — 44x64
    const gRun3 = this.make.graphics({ x: 0, y: 0, add: false });
    // Inverted legs: Right forward, Left back
    gRun3.fillStyle(0x233d4d, 1);
    gRun3.fillRoundedRect(9, 38, 11, 14, 3);
    gRun3.fillRoundedRect(24, 40, 11, 16, 3);
    gRun3.fillStyle(0xffffff, 1);
    gRun3.fillRoundedRect(7, 48, 13, 9, 3);
    gRun3.fillRoundedRect(24, 52, 13, 9, 3);
    gRun3.fillStyle(0xd90429, 1);
    gRun3.fillRect(7, 54, 13, 3);
    gRun3.fillRect(24, 58, 13, 3);
    gRun3.fillStyle(0xf8f9fa, 1);
    gRun3.fillRoundedRect(10, 20, 24, 23, 5);
    gRun3.fillStyle(0x7f4f24, 1);
    gRun3.fillRoundedRect(13, 22, 18, 20, 5);
    gRun3.fillStyle(0x582f0e, 1);
    gRun3.fillRoundedRect(15, 28, 14, 12, 3);
    gRun3.fillStyle(0xffd166, 1);
    gRun3.fillRect(17, 28, 10, 2);
    gRun3.fillStyle(0x582f0e, 1);
    gRun3.fillRect(11, 22, 3, 14);
    gRun3.fillRect(30, 22, 3, 14);
    gRun3.fillStyle(0xfec89a, 1);
    gRun3.fillRect(19, 14, 6, 7);
    gRun3.fillCircle(22, 13, 10);
    gRun3.fillStyle(0x5c3822, 1);
    gRun3.fillCircle(22, 10, 11);
    gRun3.fillCircle(17, 10, 6);
    gRun3.fillCircle(27, 10, 6);
    gRun3.fillCircle(22, 6, 6);
    gRun3.fillStyle(0x1a1a2e, 1);
    gRun3.fillRect(29, 12, 4, 2);
    // Inverted arms
    gRun3.fillStyle(0xf8f9fa, 1);
    gRun3.fillRoundedRect(6, 22, 6, 10, 2);
    gRun3.fillRoundedRect(32, 21, 6, 10, 2);
    gRun3.fillStyle(0xfec89a, 1);
    gRun3.fillCircle(9, 33, 4);
    gRun3.fillCircle(35, 32, 4);
    gRun3.generateTexture('player_run_3', 44, 64);
    gRun3.destroy();

    // 4. Running Frame 4 (Passing stride 2) — 44x64
    const gRun4 = this.make.graphics({ x: 0, y: 0, add: false });
    gRun4.fillStyle(0x233d4d, 1);
    gRun4.fillRoundedRect(10, 40, 10, 15, 3);
    gRun4.fillRoundedRect(24, 40, 10, 15, 3);
    gRun4.fillStyle(0xffffff, 1);
    gRun4.fillRoundedRect(9, 52, 12, 8, 3);
    gRun4.fillRoundedRect(23, 52, 12, 8, 3);
    gRun4.fillStyle(0xd90429, 1);
    gRun4.fillRect(9, 57, 12, 3);
    gRun4.fillRect(23, 57, 12, 3);
    gRun4.fillStyle(0xf8f9fa, 1);
    gRun4.fillRoundedRect(10, 20, 24, 23, 5);
    gRun4.fillStyle(0x7f4f24, 1);
    gRun4.fillRoundedRect(13, 22, 18, 20, 5);
    gRun4.fillStyle(0x582f0e, 1);
    gRun4.fillRoundedRect(15, 28, 14, 12, 3);
    gRun4.fillStyle(0xffd166, 1);
    gRun4.fillRect(17, 28, 10, 2);
    gRun4.fillStyle(0x582f0e, 1);
    gRun4.fillRect(11, 22, 3, 14);
    gRun4.fillRect(30, 22, 3, 14);
    gRun4.fillStyle(0xfec89a, 1);
    gRun4.fillRect(19, 14, 6, 7);
    gRun4.fillCircle(22, 13, 10);
    gRun4.fillStyle(0x5c3822, 1);
    gRun4.fillCircle(22, 10, 11);
    gRun4.fillCircle(17, 10, 6);
    gRun4.fillCircle(27, 10, 6);
    gRun4.fillCircle(22, 6, 6);
    gRun4.fillStyle(0x1a1a2e, 1);
    gRun4.fillRect(29, 12, 4, 2);
    gRun4.fillStyle(0xf8f9fa, 1);
    gRun4.fillRoundedRect(7, 21, 6, 10, 2);
    gRun4.fillRoundedRect(31, 21, 6, 10, 2);
    gRun4.fillStyle(0xfec89a, 1);
    gRun4.fillCircle(10, 32, 4);
    gRun4.fillCircle(34, 32, 4);
    gRun4.generateTexture('player_run_4', 44, 64);
    gRun4.destroy();

    // 5. Sliding Player (Low athletic slide) — 58x34
    const gSlide = this.make.graphics({ x: 0, y: 0, add: false });
    // Extended jeans horizontal
    gSlide.fillStyle(0x233d4d, 1);
    gSlide.fillRoundedRect(6, 18, 38, 12, 4);
    // Sneakers leading out front
    gSlide.fillStyle(0xffffff, 1);
    gSlide.fillRoundedRect(40, 16, 15, 10, 3);
    gSlide.fillStyle(0xd90429, 1);
    gSlide.fillRect(40, 23, 15, 3);
    // Upper body reclined low
    gSlide.fillStyle(0xf8f9fa, 1);
    gSlide.fillRoundedRect(10, 10, 24, 16, 4);
    // Backpack resting low
    gSlide.fillStyle(0x7f4f24, 1);
    gSlide.fillRoundedRect(6, 8, 16, 16, 4);
    // Head low
    gSlide.fillStyle(0xfec89a, 1);
    gSlide.fillCircle(28, 8, 8);
    gSlide.fillStyle(0x5c3822, 1);
    gSlide.fillCircle(27, 6, 8);
    gSlide.fillStyle(0x1a1a2e, 1);
    gSlide.fillRect(32, 6, 4, 2);
    gSlide.generateTexture('player_slide', 58, 34);
    gSlide.destroy();

    // 6. Jumping Player (Airborne with tucked knees) — 44x64
    const gJump = this.make.graphics({ x: 0, y: 0, add: false });
    // Tucked legs
    gJump.fillStyle(0x233d4d, 1);
    gJump.fillRoundedRect(8, 32, 12, 14, 4);
    gJump.fillRoundedRect(24, 32, 12, 14, 4);
    gJump.fillStyle(0xffffff, 1);
    gJump.fillRoundedRect(8, 44, 12, 8, 3);
    gJump.fillRoundedRect(24, 44, 12, 8, 3);
    gJump.fillStyle(0xd90429, 1);
    gJump.fillRect(8, 49, 12, 3);
    gJump.fillRect(24, 49, 12, 3);
    // Torso & backpack lifted
    gJump.fillStyle(0xf8f9fa, 1);
    gJump.fillRoundedRect(10, 14, 24, 22, 5);
    gJump.fillStyle(0x7f4f24, 1);
    gJump.fillRoundedRect(13, 15, 18, 19, 5);
    gJump.fillStyle(0x582f0e, 1);
    gJump.fillRoundedRect(15, 20, 14, 11, 3);
    // Head
    gJump.fillStyle(0xfec89a, 1);
    gJump.fillCircle(22, 9, 9);
    gJump.fillStyle(0x5c3822, 1);
    gJump.fillCircle(22, 7, 10);
    gJump.fillCircle(17, 7, 5);
    gJump.fillCircle(27, 7, 5);
    // Arms spread for flight balance
    gJump.fillStyle(0xf8f9fa, 1);
    gJump.fillRoundedRect(3, 14, 8, 12, 3);
    gJump.fillRoundedRect(33, 14, 8, 12, 3);
    gJump.fillStyle(0xfec89a, 1);
    gJump.fillCircle(7, 26, 4);
    gJump.fillCircle(37, 26, 4);
    gJump.generateTexture('player_jump', 44, 64);
    gJump.destroy();

    // 7. Stumble / Hit Player Frame — 44x64
    const gHit = this.make.graphics({ x: 0, y: 0, add: false });
    gHit.fillStyle(0x233d4d, 1);
    gHit.fillRoundedRect(7, 42, 12, 14, 3);
    gHit.fillRoundedRect(25, 42, 12, 14, 3);
    gHit.fillStyle(0xffffff, 1);
    gHit.fillRoundedRect(6, 53, 13, 8, 3);
    gHit.fillRoundedRect(25, 53, 13, 8, 3);
    gHit.fillStyle(0xf8f9fa, 1);
    gHit.fillRoundedRect(10, 20, 24, 22, 5);
    gHit.fillStyle(0x7f4f24, 1);
    gHit.fillRoundedRect(13, 21, 18, 19, 5);
    gHit.fillStyle(0xfec89a, 1);
    gHit.fillCircle(22, 12, 9);
    gHit.fillStyle(0x5c3822, 1);
    gHit.fillCircle(22, 10, 10);
    // Flailing arms
    gHit.fillStyle(0xfec89a, 1);
    gHit.fillCircle(5, 16, 5);
    gHit.fillCircle(39, 16, 5);
    // Dizzy stars
    gHit.fillStyle(0xffbe0b, 1);
    gHit.fillCircle(14, 4, 3);
    gHit.fillCircle(30, 4, 3);
    gHit.generateTexture('player_hit', 44, 64);
    gHit.destroy();
  }

  createThemedObstacleTextures() {
    // 1. Stacked Textbooks (High Ground Obstacle — JUMP or DODGE) — 66x54
    const gStack = this.make.graphics({ x: 0, y: 0, add: false });
    // Book 1 (Bottom, thick Navy Blue)
    gStack.fillStyle(0x1d3557, 1);
    gStack.fillRoundedRect(4, 38, 58, 14, 3);
    gStack.fillStyle(0xf1faee, 1); // White page edges
    gStack.fillRect(10, 41, 50, 8);
    gStack.fillStyle(0x1d3557, 1);
    gStack.fillRect(4, 38, 7, 14); // Spine
    gStack.fillStyle(0xffd166, 1); // Gold foil stripe
    gStack.fillRect(5, 44, 4, 2);

    // Book 2 (Crimson Medical Encyclopedia)
    gStack.fillStyle(0x9b2226, 1);
    gStack.fillRoundedRect(7, 26, 52, 13, 3);
    gStack.fillStyle(0xffeedd, 1);
    gStack.fillRect(12, 29, 45, 7);
    gStack.fillStyle(0x9b2226, 1);
    gStack.fillRect(7, 26, 6, 13);
    // Red bookmark ribbon hanging down
    gStack.fillStyle(0xe63946, 1);
    gStack.fillRect(48, 36, 4, 10);

    // Book 3 (Forest Green Science Volume)
    gStack.fillStyle(0x2d6a4f, 1);
    gStack.fillRoundedRect(9, 15, 48, 12, 3);
    gStack.fillStyle(0xf1faee, 1);
    gStack.fillRect(14, 18, 41, 6);
    gStack.fillStyle(0x2d6a4f, 1);
    gStack.fillRect(9, 15, 6, 12);

    // Book 4 (Top, Open Violet Literature Book)
    gStack.fillStyle(0x5a189a, 1);
    gStack.fillRoundedRect(14, 5, 38, 11, 3);
    gStack.fillStyle(0xffeedd, 1);
    gStack.fillRect(18, 7, 32, 6);
    gStack.fillStyle(0x5a189a, 1);
    gStack.fillRect(14, 5, 5, 11);
    gStack.fillStyle(0xffbe0b, 1);
    gStack.fillCircle(33, 9, 2);
    gStack.generateTexture('obs_bookstack', 66, 54);
    gStack.destroy();

    // 2. Heavy Library Book Cart (MUST DODGE LEFT/RIGHT — Cannot Jump or Slide) — 76x104
    const gCart = this.make.graphics({ x: 0, y: 0, add: false });
    // Steel Cart Frame
    gCart.fillStyle(0x2b2d42, 1);
    gCart.fillRoundedRect(4, 10, 68, 86, 6);
    gCart.fillStyle(0x4a4e69, 1);
    gCart.fillRect(8, 14, 60, 78);

    // Left & Right Handle Rails
    gCart.fillStyle(0x8d99ae, 1);
    gCart.fillRect(2, 4, 6, 80);
    gCart.fillRect(68, 4, 6, 80);
    gCart.fillRect(2, 4, 12, 6);
    gCart.fillRect(62, 4, 12, 6);

    // Top Shelf Books
    const colors = [0xd90429, 0x0077b6, 0x2d6a4f, 0xffb703, 0x7209b7, 0xf72585];
    let bx = 11;
    let ci = 0;
    while (bx < 64) {
      const bw = Phaser.Math.Between(5, 8);
      const bh = Phaser.Math.Between(24, 30);
      gCart.fillStyle(colors[ci % colors.length], 1);
      gCart.fillRect(bx, 48 - bh, bw, bh);
      gCart.fillStyle(0xffffff, 0.3);
      gCart.fillRect(bx + 1, 48 - bh, 1, bh);
      bx += bw + 1;
      ci++;
    }
    // Shelf divider bar
    gCart.fillStyle(0x2b2d42, 1);
    gCart.fillRect(6, 48, 64, 5);

    // Bottom Shelf Books
    bx = 11;
    while (bx < 64) {
      const bw = Phaser.Math.Between(5, 8);
      const bh = Phaser.Math.Between(24, 30);
      gCart.fillStyle(colors[ci % colors.length], 1);
      gCart.fillRect(bx, 84 - bh, bw, bh);
      gCart.fillStyle(0xffffff, 0.3);
      gCart.fillRect(bx + 1, 84 - bh, 1, bh);
      bx += bw + 1;
      ci++;
    }

    // Hazard warning bumper bar at base
    gCart.fillStyle(0xffbe0b, 1);
    gCart.fillRect(6, 86, 64, 8);
    gCart.fillStyle(0x111111, 1);
    for (let x = 8; x < 68; x += 12) {
      gCart.fillRect(x, 86, 6, 8);
    }

    // Caster Wheels
    gCart.fillStyle(0x1a1a2e, 1);
    gCart.fillCircle(14, 98, 6);
    gCart.fillCircle(62, 98, 6);
    gCart.fillStyle(0x8d99ae, 1);
    gCart.fillCircle(14, 98, 3);
    gCart.fillCircle(62, 98, 3);
    gCart.generateTexture('obs_cart', 76, 104);
    gCart.destroy();

    // 3. Overhead Library Caution Banner (Low Clearance — MUST SLIDE or DODGE) — 86x46
    const gLowBanner = this.make.graphics({ x: 0, y: 0, add: false });
    // Hanging metal suspension rods
    gLowBanner.fillStyle(0x6c757d, 1);
    gLowBanner.fillRect(6, 0, 4, 46);
    gLowBanner.fillRect(76, 0, 4, 46);
    // Overhead clearance bar
    gLowBanner.fillStyle(0x1f2438, 1);
    gLowBanner.fillRoundedRect(0, 4, 86, 20, 4);
    // Yellow hazard stripes
    gLowBanner.fillStyle(0xffbe0b, 1);
    for (let x = 4; x < 82; x += 14) {
      gLowBanner.fillTriangle(x, 4, x + 7, 4, x + 12, 24);
      gLowBanner.fillTriangle(x, 4, x + 5, 24, x + 12, 24);
    }
    // "SLIDE" label backing & text bar
    gLowBanner.fillStyle(0xd90429, 1);
    gLowBanner.fillRoundedRect(22, 7, 42, 14, 3);
    gLowBanner.fillStyle(0xffffff, 1);
    gLowBanner.fillRect(26, 13, 34, 3); // White indicator bar
    gLowBanner.generateTexture('obs_low_sign', 86, 46);
    gLowBanner.destroy();

    // 4. Yellow Caution "WET FLOOR" Sign (Ground Obstacle — JUMP or DODGE) — 38x44
    const gWet = this.make.graphics({ x: 0, y: 0, add: false });
    // Triangular pyramid sign
    gWet.fillStyle(0xffbe0b, 1);
    gWet.fillTriangle(19, 4, 4, 40, 34, 40);
    gWet.fillStyle(0xfb8500, 1);
    gWet.fillRect(4, 38, 30, 4);
    // Warning symbol: Black triangle with slipping figure
    gWet.lineStyle(2, 0x111111, 1);
    gWet.strokeTriangle(19, 14, 10, 32, 28, 32);
    gWet.fillStyle(0x111111, 1);
    gWet.fillCircle(19, 21, 2); // Head
    gWet.fillRect(17, 24, 4, 6); // Torso slipping
    gWet.generateTexture('obs_wetfloor', 38, 44);
    gWet.destroy();

    // 5. Classroom Study Desk (Ground Obstacle — JUMP or DODGE) — 70x50
    const gDesk = this.make.graphics({ x: 0, y: 0, add: false });
    // Wooden desktop
    gDesk.fillStyle(0x7f4f24, 1);
    gDesk.fillRoundedRect(4, 16, 62, 12, 3);
    gDesk.fillStyle(0x936639, 1);
    gDesk.fillRect(6, 18, 58, 4);
    // Steel legs
    gDesk.fillStyle(0x495057, 1);
    gDesk.fillRect(10, 28, 5, 22);
    gDesk.fillRect(55, 28, 5, 22);
    // Laptop on desk
    gDesk.fillStyle(0xced4da, 1);
    gDesk.fillRoundedRect(22, 8, 26, 10, 2);
    gDesk.fillStyle(0x4cc9f0, 1); // Glowing screen
    gDesk.fillRect(24, 10, 22, 6);
    gDesk.generateTexture('obs_desk', 70, 50);
    gDesk.destroy();
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

  createTriviaGateTextures() {
    // 1. In-World Trivia Gate Archway (104x92 px per lane)
    const gGate = this.make.graphics({ x: 0, y: 0, add: false });
    // Left & Right Stone Academic Columns
    gGate.fillStyle(0x282c3f, 1);
    gGate.fillRoundedRect(2, 6, 14, 82, 3);
    gGate.fillRoundedRect(88, 6, 14, 82, 3);
    gGate.fillStyle(0x3e4460, 1);
    gGate.fillRect(4, 8, 10, 80);
    gGate.fillRect(90, 8, 10, 80);
    // Column capital & plinths
    gGate.fillStyle(0x5a6285, 1);
    gGate.fillRect(0, 4, 18, 6);
    gGate.fillRect(86, 4, 18, 6);
    gGate.fillRect(0, 84, 18, 8);
    gGate.fillRect(86, 84, 18, 8);

    // Top Signboard Beam
    gGate.fillStyle(0x131625, 0.95);
    gGate.fillRoundedRect(4, 2, 96, 32, 5);
    gGate.lineStyle(2, 0x4cc9f0, 0.9);
    gGate.strokeRoundedRect(4, 2, 96, 32, 5);

    // Glowing Gold Top Arch Crown
    gGate.fillStyle(0xffd166, 1);
    gGate.fillRoundedRect(36, 0, 32, 6, 2);

    // Hazard Plinth Stripes
    gGate.fillStyle(0xffbe0b, 1);
    gGate.fillRect(2, 86, 14, 4);
    gGate.fillRect(88, 86, 14, 4);
    gGate.generateTexture('gate_arch', 104, 92);
    gGate.destroy();

    // 2. Gateway Energy Curtain Shimmer (76x54)
    const gCurtain = this.make.graphics({ x: 0, y: 0, add: false });
    gCurtain.fillStyle(0x00f5d4, 0.28);
    gCurtain.fillRect(0, 0, 76, 54);
    gCurtain.lineStyle(1.5, 0x90e0ef, 0.6);
    for (let y = 6; y < 54; y += 12) {
      gCurtain.strokeLineShape(new Phaser.Geom.Line(4, y, 72, y));
    }
    // Center chevron passing indicator
    gCurtain.lineStyle(2.5, 0xffffff, 0.7);
    gCurtain.strokeLineShape(new Phaser.Geom.Line(28, 22, 38, 30));
    gCurtain.strokeLineShape(new Phaser.Geom.Line(38, 30, 48, 22));
    gCurtain.generateTexture('gate_curtain', 76, 54);
    gCurtain.destroy();

    // 3. Thematic Outer Prop: Oversized Leather Encyclopedia (48x76)
    const gBigBook = this.make.graphics({ x: 0, y: 0, add: false });
    gBigBook.fillStyle(0x1a0f0a, 0.4);
    gBigBook.fillEllipse(24, 72, 44, 8);
    // Leather Spine & Cover
    gBigBook.fillStyle(0x7b1113, 1); // Rich dark burgundy
    gBigBook.fillRoundedRect(6, 4, 36, 68, 4);
    gBigBook.fillStyle(0x9b2226, 1);
    gBigBook.fillRect(10, 6, 30, 64);
    // Gold Spine Ribs & Embossed Laurel
    gBigBook.fillStyle(0xffd166, 1);
    gBigBook.fillRect(6, 12, 6, 2);
    gBigBook.fillRect(6, 26, 6, 2);
    gBigBook.fillRect(6, 40, 6, 2);
    gBigBook.fillRect(6, 54, 6, 2);
    gBigBook.fillCircle(25, 34, 8);
    gBigBook.fillStyle(0x9b2226, 1);
    gBigBook.fillCircle(25, 34, 5);
    gBigBook.generateTexture('prop_oversized_book', 48, 76);
    gBigBook.destroy();

    // 4. Thematic Outer Prop: Banker's Lamp / Campus Lantern (32x80)
    const gLamp = this.make.graphics({ x: 0, y: 0, add: false });
    // Pedestal
    gLamp.fillStyle(0x343a40, 1);
    gLamp.fillRect(10, 56, 12, 24);
    gLamp.fillRect(6, 76, 20, 4);
    // Brass curved stem
    gLamp.fillStyle(0xd4af37, 1);
    gLamp.fillRect(14, 28, 4, 28);
    // Emerald Green Glass Shade
    gLamp.fillStyle(0x2d6a4f, 1);
    gLamp.fillRoundedRect(2, 18, 28, 14, 4);
    // Amber/Gold warm light glow
    gLamp.fillStyle(0xffe066, 0.95);
    gLamp.fillCircle(16, 32, 8);
    gLamp.fillStyle(0xffffff, 1);
    gLamp.fillCircle(16, 32, 4);
    gLamp.generateTexture('prop_desk_lamp', 32, 80);
    gLamp.destroy();
  }

  createEducationalCollectibleTextures() {
    // 1. A+ Exam Certificate Paper (Matching reference mockup!) — 38x46
    const gAplus = this.make.graphics({ x: 0, y: 0, add: false });
    // Outer golden radiant aura
    gAplus.fillStyle(0xffbe0b, 0.35);
    gAplus.fillRoundedRect(1, 1, 36, 44, 6);
    gAplus.fillStyle(0xffd166, 0.65);
    gAplus.fillRoundedRect(3, 3, 32, 40, 4);

    // Parchment Certificate Paper Body
    gAplus.fillStyle(0xfffdf0, 1);
    gAplus.fillRoundedRect(5, 5, 28, 36, 3);
    gAplus.lineStyle(1.5, 0xd4a373, 1);
    gAplus.strokeRoundedRect(7, 7, 24, 32, 2);

    // Bold Red "A+" Stamp at top
    // Letter 'A'
    gAplus.fillStyle(0xd90429, 1);
    gAplus.fillRect(12, 11, 3, 9); // Left stroke
    gAplus.fillRect(18, 11, 3, 9); // Right stroke
    gAplus.fillRect(13, 11, 7, 3); // Top bar
    gAplus.fillRect(13, 15, 7, 2); // Crossbar
    // Plus sign '+'
    gAplus.fillRect(22, 14, 5, 2); // Horizontal
    gAplus.fillRect(23.5, 12.5, 2, 5); // Vertical

    // Certificate Coursework Lines
    gAplus.fillStyle(0xa0aab2, 1);
    gAplus.fillRect(9, 23, 20, 1.5);
    gAplus.fillRect(9, 26, 16, 1.5);
    gAplus.fillRect(9, 29, 20, 1.5);

    // Golden Rosette Medal Ribbon at bottom
    gAplus.fillStyle(0xd90429, 1);
    gAplus.fillTriangle(15, 34, 18, 40, 19, 34); // Ribbon tails
    gAplus.fillTriangle(23, 34, 20, 40, 19, 34);
    gAplus.fillStyle(0xffb703, 1);
    gAplus.fillCircle(19, 34, 4); // Medal rosette
    gAplus.fillStyle(0xffffff, 1);
    gAplus.fillCircle(19, 34, 1.5);
    gAplus.generateTexture('col_aplus', 38, 46);
    gAplus.destroy();

    // 2. Floating Golden Knowledge Book — 34x36
    const gBook = this.make.graphics({ x: 0, y: 0, add: false });
    // Book Cover (Royal Blue & Gold trim)
    gBook.fillStyle(0x0077b6, 1);
    gBook.fillRoundedRect(3, 4, 28, 28, 4);
    gBook.fillStyle(0xffd166, 1); // Gold spine & corner trims
    gBook.fillRect(3, 4, 6, 28);
    gBook.lineStyle(1.5, 0xffd166, 1);
    gBook.strokeRoundedRect(5, 6, 24, 24, 2);
    // White page block
    gBook.fillStyle(0xf8f9fa, 1);
    gBook.fillRect(28, 6, 3, 24);
    // Gold Star Emblem on Cover
    gBook.fillStyle(0xffbe0b, 1);
    gBook.fillCircle(18, 18, 5);
    gBook.fillStyle(0xffffff, 1);
    gBook.fillCircle(18, 18, 2);
    // Satin red bookmark ribbon dangling below
    gBook.fillStyle(0xd90429, 1);
    gBook.fillRect(16, 30, 4, 5);
    gBook.generateTexture('col_book', 34, 36);
    gBook.destroy();

    // 3. 5-Point Knowledge Star — 32x32
    const gStar = this.make.graphics({ x: 0, y: 0, add: false });
    gStar.fillStyle(0xffb703, 0.4);
    gStar.fillCircle(16, 16, 15);
    gStar.fillStyle(0xffd166, 1);
    gStar.fillCircle(16, 16, 11);
    gStar.fillStyle(0xffffff, 1);
    // 4 diamond star points
    gStar.fillTriangle(16, 2, 13, 16, 19, 16);
    gStar.fillTriangle(16, 30, 13, 16, 19, 16);
    gStar.fillTriangle(2, 16, 16, 13, 16, 19);
    gStar.fillTriangle(30, 16, 16, 13, 16, 19);
    gStar.fillCircle(16, 16, 4);
    gStar.generateTexture('col_star', 32, 32);
    gStar.destroy();
  }

  createParticleTextures() {
    // 1. Star Sparkle Particle — 14x14
    const gSpark = this.make.graphics({ x: 0, y: 0, add: false });
    gSpark.fillStyle(0xffd166, 1);
    gSpark.fillTriangle(7, 0, 5, 7, 9, 7);
    gSpark.fillTriangle(7, 14, 5, 7, 9, 7);
    gSpark.fillTriangle(0, 7, 7, 5, 7, 9);
    gSpark.fillTriangle(14, 7, 7, 5, 7, 9);
    gSpark.fillStyle(0xffffff, 1);
    gSpark.fillCircle(7, 7, 2);
    gSpark.generateTexture('part_sparkle', 14, 14);
    gSpark.destroy();

    // 2. Dust Puff Particle — 16x16
    const gDust = this.make.graphics({ x: 0, y: 0, add: false });
    gDust.fillStyle(0xffffff, 0.65);
    gDust.fillCircle(8, 8, 7);
    gDust.fillStyle(0xe9ecef, 0.85);
    gDust.fillCircle(8, 8, 4);
    gDust.generateTexture('part_dust', 16, 16);
    gDust.destroy();
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

/**
 * GameScene.js — 2.5D University Campus / Library Run for STUDY DASH.
 * Features 3 perspective-converging lanes, vanishing point depth, dynamic object scaling,
 * library bookshelf corridor, contact shadows, Subway Surfers-style lane dodging/jumping/sliding,
 * collectible runs, and seamlessly integrated Question Checkpoints.
 */

import TouchControls from './TouchControls.js';
import { GameQuestionService } from '../services/GameQuestionService.js';
import { sounds } from './SoundEffects.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });

    // Perspective & Coordinate System Constants (Fixed 480x800 Canvas)
    this.CANVAS_WIDTH = 480;
    this.CANVAS_HEIGHT = 800;
    this.VANISHING_X = 240;
    this.HORIZON_Y = 220;
    this.PLAYER_BASE_Y = 670;
    this.W_LANE_HORIZON = 28; // Lane width at vanishing horizon
    this.W_LANE_BASE = 112;    // Lane width at player baseline (128, 240, 352)
    this.MIN_SCALE = 0.28;     // Distant scale factor at horizon
  }

  init(data) {
    this.gameMode = data?.mode || 'endless';
    this.filter = data?.filter || {};
    this.questions = data?.questions || [];
    this.currentQuestionIndex = 0;

    // Running state
    this.currentLane = 1; // 0: Left, 1: Center, 2: Right
    this.laneX = [
      this.getLaneX(0, this.PLAYER_BASE_Y),
      this.getLaneX(1, this.PLAYER_BASE_Y),
      this.getLaneX(2, this.PLAYER_BASE_Y)
    ];

    this.isJumping = false;
    this.isSliding = false;
    this.isInvincible = false;
    this.lives = 3;

    // Movement & Speed
    this.speed = 400;
    this.baseSpeed = 400;
    this.maxSpeed = 780;
    this.score = 0;
    this.coins = 0;
    this.distance = 0;
    this.streak = 0;
    this.runAnimTimer = 0;
    this.runFrame = 1;

    // Power-ups
    this.powerups = {
      shield: false,
      magnet: false,
      multiplier: false
    };

    // Mode-specific rules
    this.timeAttackRemaining = 60;
    this.examGoal = 10;
    this.examAnswered = 0;

    // Checkpoint & Game states
    this.isQuestionActive = false;
    this.isGameOver = false;
    this.nextQuestionDistance = 120; // Checkpoint every ~180-240m

    // Environment animation trackers
    this.floorOffset = 0;
    this.shelfScroll = 0;
  }

  // ────────────────────────────────────────────────────────────
  // PERSPECTIVE PROJECTION MATHEMATICS
  // ────────────────────────────────────────────────────────────

  /**
   * Returns normalized depth progress t:
   * 0.0 at Horizon (y = 220), 1.0 at Player Baseline (y = 670).
   */
  getDepthProgress(y) {
    return Phaser.Math.Clamp((y - this.HORIZON_Y) / (this.PLAYER_BASE_Y - this.HORIZON_Y), 0, 1.35);
  }

  /**
   * Calculates perspective-converging X for given lane (0, 1, 2) at vertical position y.
   */
  getLaneX(laneIndex, y) {
    const t = this.getDepthProgress(y);
    const laneWidth = this.W_LANE_HORIZON + t * (this.W_LANE_BASE - this.W_LANE_HORIZON);
    const offset = laneIndex - 1; // -1: Left, 0: Center, 1: Right
    return this.VANISHING_X + offset * laneWidth;
  }

  /**
   * Returns scale factor S that grows from MIN_SCALE at horizon to 1.0 at baseline.
   */
  getDepthScale(y) {
    const t = this.getDepthProgress(y);
    return Phaser.Math.Clamp(this.MIN_SCALE + t * (1.0 - this.MIN_SCALE), this.MIN_SCALE, 1.25);
  }

  // ────────────────────────────────────────────────────────────
  // SCENE CREATION
  // ────────────────────────────────────────────────────────────

  async create() {
    const width = this.CANVAS_WIDTH;
    const height = this.CANVAS_HEIGHT;

    // 1. Perspective Corridor & University Library Environment
    this.createEnvironment(width, height);

    // 2. Dynamic Entity Groups (All support perspective scaling)
    this.activeObstacles = [];
    this.activeCoins = [];
    this.activePowerups = [];
    this.activeArches = [];

    // 3. Player & Ground Contact Shadow
    const startX = this.getLaneX(1, this.PLAYER_BASE_Y);
    this.playerShadow = this.add.image(startX, this.PLAYER_BASE_Y + 28, 'lib_floor_shadow')
      .setScale(1.1, 0.85)
      .setAlpha(0.55)
      .setDepth(this.PLAYER_BASE_Y - 1);

    this.player = this.add.sprite(startX, this.PLAYER_BASE_Y, 'player_run_1')
      .setDepth(this.PLAYER_BASE_Y);

    // Shield Aura
    this.shieldAura = this.add.circle(startX, this.PLAYER_BASE_Y - 10, 36, 0x00b4d8, 0.35)
      .setStrokeStyle(2.5, 0x90e0ef)
      .setDepth(this.PLAYER_BASE_Y + 1)
      .setVisible(false);

    // Magnet Sparks Aura
    this.magnetAura = this.add.circle(startX, this.PLAYER_BASE_Y - 10, 30, 0xe63946, 0.25)
      .setStrokeStyle(2, 0xffbe0b)
      .setDepth(this.PLAYER_BASE_Y + 1)
      .setVisible(false);

    // 4. Input & Controls
    this.touchControls = new TouchControls(this);
    this.setupInputHandlers();

    // 5. Mobile HUD
    this.createHUD(width, height);

    // 6. Spawning Timers (Spawn into 2.5D perspective queue)
    this.spawnerTimer = this.time.addEvent({
      delay: 1400,
      callback: this.spawnTraffic,
      callbackScope: this,
      loop: true
    });

    this.coinTimer = this.time.addEvent({
      delay: 1100,
      callback: this.spawnCoins,
      callbackScope: this,
      loop: true
    });

    this.powerupTimer = this.time.addEvent({
      delay: 16000,
      callback: this.spawnPowerup,
      callbackScope: this,
      loop: true
    });

    // Time Attack clock
    if (this.gameMode === 'timeAttack') {
      this.timeAttackTimer = this.time.addEvent({
        delay: 1000,
        callback: () => {
          if (!this.isQuestionActive && !this.isGameOver) {
            this.timeAttackRemaining--;
            if (this.timeAttackRemaining <= 0) {
              this.triggerGameOver();
            }
          }
        },
        loop: true
      });
    }

    // 7. Fetch Reviewer Questions
    if (this.questions.length === 0) {
      this.questions = await GameQuestionService.getQuestionsForGame(this.gameMode, this.filter);
    }
  }

  // ────────────────────────────────────────────────────────────
  // ENVIRONMENT & 2.5D PERSPECTIVE RENDERING
  // ────────────────────────────────────────────────────────────

  createEnvironment(width, height) {
    // A. Ceiling / Hallway Upper Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0c16).setDepth(0);

    // Upper hallway wall
    this.add.rectangle(width / 2, this.HORIZON_Y / 2, width, this.HORIZON_Y, 0x111322).setDepth(1);

    // B. Horizon Doors & Lockers ("STUDY DASH RUN" Header)
    this.horizonDoor = this.add.image(this.VANISHING_X, this.HORIZON_Y - 40, 'lib_horizon_door')
      .setOrigin(0.5, 0.5)
      .setDepth(2);

    // C. Dynamic Floor Graphics (Trapezoid floor, converging lane dividers & scrolling tiles)
    this.floorGraphics = this.add.graphics().setDepth(3);

    // D. Left & Right Bookshelf Walls (Scrolling Perspective Segments)
    this.shelfSegments = [];
    const numShelves = 5;
    for (let i = 0; i < numShelves; i++) {
      const p = i / numShelves;
      const leftShelf = this.add.image(0, 0, 'lib_bookshelf_left').setOrigin(1, 0.5);
      const rightShelf = this.add.image(0, 0, 'lib_bookshelf_right').setOrigin(0, 0.5);
      this.shelfSegments.push({ p, left: leftShelf, right: rightShelf });
    }

    // E. Overhead Ceiling Archways with Pendant Lamps
    this.overheadArches = [];
    for (let i = 0; i < 2; i++) {
      const arch = this.add.image(this.VANISHING_X, 0, 'lib_ceiling_arch')
        .setOrigin(0.5, 0)
        .setDepth(95);
      this.overheadArches.push({ p: i * 0.5, sprite: arch });
    }

    // Draw initial floor
    this.renderPerspectiveFloor();
  }

  renderPerspectiveFloor() {
    const g = this.floorGraphics;
    g.clear();

    const w = this.CANVAS_WIDTH;
    const h = this.CANVAS_HEIGHT;
    const hy = this.HORIZON_Y;
    const vx = this.VANISHING_X;

    // Floor boundary coordinates (Trapezoid)
    const topW = (this.W_LANE_HORIZON * 3) + 20; // ~104px
    const botW = (this.W_LANE_BASE * 3) + 70;    // ~406px
    const topLeftX = vx - topW / 2;
    const topRightX = vx + topW / 2;
    const botLeftX = vx - botW / 2;
    const botRightX = vx + botW / 2;

    // 1. Trapezoid Carpet Floor
    g.fillStyle(0x131524, 1);
    g.beginPath();
    g.moveTo(topLeftX, hy);
    g.lineTo(topRightX, hy);
    g.lineTo(botRightX, h);
    g.lineTo(botLeftX, h);
    g.closePath();
    g.fillPath();

    // Floor Border Trims (Wood baseboard lines)
    g.lineStyle(3, 0x422819, 0.85);
    g.strokeLineShape(new Phaser.Geom.Line(topLeftX, hy, botLeftX, h));
    g.strokeLineShape(new Phaser.Geom.Line(topRightX, hy, botRightX, h));

    // 2. Transverse Scrolling Floor Slats (Giving high-speed 3D forward sensation)
    const numSlats = 8;
    g.lineStyle(1.5, 0x22273f, 0.7);
    for (let i = 0; i < numSlats; i++) {
      let p = (this.floorOffset + i / numSlats) % 1;
      // Exponential / non-linear distribution for realistic perspective
      const pExp = Math.pow(p, 1.8);
      const slatY = hy + pExp * (h - hy);
      const curHalfW = (topW / 2) + pExp * ((botW - topW) / 2);

      g.strokeLineShape(new Phaser.Geom.Line(vx - curHalfW, slatY, vx + curHalfW, slatY));

      // Subtle academic watermarks on alternating slats
      if (i % 2 === 0 && pExp > 0.3) {
        g.fillStyle(0x272d47, 0.45 * pExp);
        g.fillCircle(vx, slatY, 4 * pExp);
      }
    }

    // 3. Converging Lane Separator Lines (Dashed Glowing Lines)
    // Lane boundaries are halfway between lanes
    const divLeftHorizonX = vx - this.W_LANE_HORIZON * 0.5;
    const divRightHorizonX = vx + this.W_LANE_HORIZON * 0.5;
    const divLeftBaseX = vx - this.W_LANE_BASE * 0.5;
    const divRightBaseX = vx + this.W_LANE_BASE * 0.5;

    // Perspective dashes
    const dashSteps = 16;
    for (let step = 0; step < dashSteps; step++) {
      if (step % 2 === 0) continue; // Skip alternate segments for dashed lane feel
      const t1 = Math.pow(step / dashSteps, 1.5);
      const t2 = Math.pow((step + 0.8) / dashSteps, 1.5);

      const y1 = hy + t1 * (h - hy);
      const y2 = hy + t2 * (h - hy);

      const lX1 = divLeftHorizonX + t1 * (divLeftBaseX - divLeftHorizonX);
      const lX2 = divLeftHorizonX + t2 * (divLeftBaseX - divLeftHorizonX);
      const rX1 = divRightHorizonX + t1 * (divRightBaseX - divRightHorizonX);
      const rX2 = divRightHorizonX + t2 * (divRightBaseX - divRightHorizonX);

      const alpha = 0.3 + 0.6 * t1;
      const lineWidth = 1.5 + 2.5 * t1;

      // Glowing Cyan/Gold Lane Marks
      g.lineStyle(lineWidth, 0x4cc9f0, alpha);
      g.strokeLineShape(new Phaser.Geom.Line(lX1, y1, lX2, y2));
      g.strokeLineShape(new Phaser.Geom.Line(rX1, y1, rX2, y2));
    }
  }

  // ────────────────────────────────────────────────────────────
  // MOBILE HUD
  // ────────────────────────────────────────────────────────────

  createHUD(width, height) {
    this.hudContainer = this.add.container(0, 0).setDepth(200);

    // Top HUD Bar Glassmorphism
    const hudBar = this.add.rectangle(width / 2, 38, width, 76, 0x090b14, 0.88);
    this.hudContainer.add(hudBar);

    // Score & Distance (Top Left)
    this.scoreText = this.add.text(20, 16, '0 PTS', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '18px',
      fontWeight: '900',
      color: '#ffffff'
    });
    this.distText = this.add.text(20, 40, '0 M', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '13px',
      fontWeight: '700',
      color: '#00f5d4'
    });
    this.hudContainer.add([this.scoreText, this.distText]);

    // Center Info (Streak or Timer)
    this.centerHUDText = this.add.text(width / 2, 28, '', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '15px',
      fontWeight: 'bold',
      color: '#ffbe0b'
    }).setOrigin(0.5);
    this.hudContainer.add(this.centerHUDText);

    // Coins & Lives (Top Right)
    this.coinsText = this.add.text(width - 110, 18, '🪙 0', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '16px',
      fontWeight: '800',
      color: '#ffd166'
    });

    this.heartsText = this.add.text(width - 20, 18, '❤️❤️❤️', {
      fontFamily: 'system-ui',
      fontSize: '14px'
    }).setOrigin(1, 0);

    // Pause Button
    const pauseBtn = this.add.rectangle(width - 34, 48, 34, 24, 0x242840, 0.9)
      .setInteractive({ useHandCursor: true });
    const pauseLabel = this.add.text(width - 34, 48, '⏸', {
      fontFamily: 'system-ui',
      fontSize: '12px'
    }).setOrigin(0.5);

    pauseBtn.on('pointerdown', () => this.togglePauseMenu());

    this.hudContainer.add([this.coinsText, this.heartsText, pauseBtn, pauseLabel]);
  }

  // ────────────────────────────────────────────────────────────
  // CONTROLS & LANE SWITCHING
  // ────────────────────────────────────────────────────────────

  setupInputHandlers() {
    this.events.on('swipeLeft', () => this.changeLane(-1));
    this.events.on('swipeRight', () => this.changeLane(1));
    this.events.on('swipeUp', () => this.jump());
    this.events.on('swipeDown', () => this.slide());

    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-LEFT', () => this.changeLane(-1));
      this.input.keyboard.on('keydown-A', () => this.changeLane(-1));
      this.input.keyboard.on('keydown-RIGHT', () => this.changeLane(1));
      this.input.keyboard.on('keydown-D', () => this.changeLane(1));
      this.input.keyboard.on('keydown-UP', () => this.jump());
      this.input.keyboard.on('keydown-W', () => this.jump());
      this.input.keyboard.on('keydown-SPACE', () => this.jump());
      this.input.keyboard.on('keydown-DOWN', () => this.slide());
      this.input.keyboard.on('keydown-S', () => this.slide());
    }
  }

  changeLane(direction) {
    if (this.isGameOver || this.isQuestionActive) return;
    const newLane = Phaser.Math.Clamp(this.currentLane + direction, 0, 2);
    if (newLane === this.currentLane) return;

    this.currentLane = newLane;
    const targetX = this.getLaneX(this.currentLane, this.PLAYER_BASE_Y);

    // Snappy, polished lane switch tween with subtle lean
    this.tweens.add({
      targets: [this.player, this.playerShadow, this.shieldAura, this.magnetAura],
      x: targetX,
      duration: 130,
      ease: 'Cubic.easeOut'
    });
  }

  jump() {
    if (this.isGameOver || this.isQuestionActive || this.isJumping) return;
    this.isJumping = true;
    sounds.playJump();

    this.player.setTexture('player_jump');

    // Arc jump — player rises, shadow stays on the floor and shrinks
    this.tweens.add({
      targets: this.player,
      y: this.PLAYER_BASE_Y - 95,
      duration: 290,
      ease: 'Sine.easeOut',
      yoyo: true,
      onComplete: () => {
        this.isJumping = false;
        if (!this.isSliding) {
          this.player.setTexture(`player_run_${this.runFrame}`);
        }
        this.player.y = this.PLAYER_BASE_Y;
      }
    });

    // Shadow scaling & fading on elevation
    this.tweens.add({
      targets: this.playerShadow,
      scaleX: 0.6,
      scaleY: 0.45,
      alpha: 0.22,
      duration: 290,
      yoyo: true
    });
  }

  slide() {
    if (this.isGameOver || this.isQuestionActive) return;

    // Fast-drop if in air
    if (this.isJumping) {
      this.tweens.killTweensOf(this.player);
      this.isJumping = false;
      this.player.y = this.PLAYER_BASE_Y;
      this.playerShadow.setScale(1.1, 0.85);
      this.playerShadow.setAlpha(0.55);
    }

    if (this.isSliding) return;
    this.isSliding = true;
    sounds.playSlide();

    this.player.setTexture('player_slide');
    this.player.y = this.PLAYER_BASE_Y + 12;

    this.time.delayedCall(700, () => {
      this.isSliding = false;
      if (!this.isJumping) {
        this.player.setTexture(`player_run_${this.runFrame}`);
        this.player.y = this.PLAYER_BASE_Y;
      }
    });
  }

  // ────────────────────────────────────────────────────────────
  // 2.5D OBJECT SPAWNING & RECYCLING
  // ────────────────────────────────────────────────────────────

  spawnTraffic() {
    if (this.isGameOver || this.isQuestionActive) return;

    // Check if approaching Question Checkpoint
    if (this.distance >= this.nextQuestionDistance - 25 && this.activeArches.length === 0) {
      this.spawnCheckpointArch();
      return;
    }

    const lane = Phaser.Math.Between(0, 2);
    const spawnY = this.HORIZON_Y + 10;
    const startX = this.getLaneX(lane, spawnY);
    const scale = this.getDepthScale(spawnY);

    const roll = Phaser.Math.Between(0, 100);
    let key = 'obs_barrier';
    let obsType = 'barrier';
    let shadowOffsetY = 16;

    if (roll < 32) {
      key = Math.random() > 0.5 ? 'train_red' : 'train_blue';
      obsType = 'train';
      shadowOffsetY = 40;
    } else if (roll < 58) {
      key = 'obs_barrier';
      obsType = 'barrier';
      shadowOffsetY = 18;
    } else if (roll < 82) {
      key = 'obs_low_barrier';
      obsType = 'low';
      shadowOffsetY = 14;
    } else {
      key = 'obs_cone';
      obsType = 'cone';
      shadowOffsetY = 10;
    }

    // Floor Contact Shadow
    const shadow = this.add.image(startX, spawnY + shadowOffsetY * scale, 'lib_floor_shadow')
      .setScale(scale)
      .setAlpha(0.2)
      .setDepth(Math.floor(spawnY) - 1);

    // Entity Sprite
    const sprite = this.add.sprite(startX, spawnY, key)
      .setScale(scale)
      .setDepth(Math.floor(spawnY));

    this.activeObstacles.push({
      sprite,
      shadow,
      lane,
      obsType,
      shadowOffsetY,
      y: spawnY
    });
  }

  spawnCheckpointArch() {
    const spawnY = this.HORIZON_Y + 8;
    const scale = this.getDepthScale(spawnY);

    const shadow = this.add.image(this.VANISHING_X, spawnY + 20 * scale, 'lib_floor_shadow')
      .setScale(scale * 2.2, scale)
      .setAlpha(0.2)
      .setDepth(Math.floor(spawnY) - 1);

    const sprite = this.add.sprite(this.VANISHING_X, spawnY, 'checkpoint_arch')
      .setScale(scale)
      .setDepth(Math.floor(spawnY));

    this.activeArches.push({
      sprite,
      shadow,
      y: spawnY
    });
  }

  spawnCoins() {
    if (this.isGameOver || this.isQuestionActive) return;

    const lane = Phaser.Math.Between(0, 2);
    const count = Phaser.Math.Between(3, 5);

    for (let i = 0; i < count; i++) {
      const spawnY = this.HORIZON_Y + 10 - (i * 32);
      const scale = this.getDepthScale(Math.max(this.HORIZON_Y, spawnY));
      const startX = this.getLaneX(lane, Math.max(this.HORIZON_Y, spawnY));

      const shadow = this.add.image(startX, spawnY + 12 * scale, 'lib_floor_shadow')
        .setScale(scale * 0.7, scale * 0.5)
        .setAlpha(0.2)
        .setDepth(10);

      const sprite = this.add.sprite(startX, spawnY, 'coin_1')
        .setScale(scale)
        .setDepth(11);

      this.activeCoins.push({
        sprite,
        shadow,
        lane,
        y: spawnY
      });
    }
  }

  spawnPowerup() {
    if (this.isGameOver || this.isQuestionActive) return;

    const lane = Phaser.Math.Between(0, 2);
    const spawnY = this.HORIZON_Y + 10;
    const scale = this.getDepthScale(spawnY);
    const startX = this.getLaneX(lane, spawnY);

    const list = ['pw_shield', 'pw_magnet', 'pw_multiplier', 'pw_heart'];
    const chosen = Phaser.Utils.Array.GetRandom(list);

    const shadow = this.add.image(startX, spawnY + 14 * scale, 'lib_floor_shadow')
      .setScale(scale * 0.8, scale * 0.6)
      .setAlpha(0.2)
      .setDepth(Math.floor(spawnY) - 1);

    const sprite = this.add.sprite(startX, spawnY, chosen)
      .setScale(scale)
      .setDepth(Math.floor(spawnY));

    this.activePowerups.push({
      sprite,
      shadow,
      lane,
      powerupType: chosen,
      y: spawnY
    });
  }

  // ────────────────────────────────────────────────────────────
  // UPDATE LOOP & DEPTH TRANSFORMATIONS
  // ────────────────────────────────────────────────────────────

  update(time, delta) {
    if (this.isGameOver || this.isQuestionActive) return;

    const deltaSec = delta / 1000;

    // Running Bob Animation
    this.runAnimTimer += delta;
    if (!this.isJumping && !this.isSliding && this.runAnimTimer > 125) {
      this.runAnimTimer = 0;
      this.runFrame = this.runFrame === 1 ? 2 : 1;
      this.player.setTexture(`player_run_${this.runFrame}`);
    }

    // Distance & Score progression
    const distDelta = Math.round(this.speed * deltaSec * 0.12);
    this.distance += distDelta;
    this.score += Math.round(12 * deltaSec * (this.powerups.multiplier ? 2 : 1));

    // Dynamic speed progression
    this.speed = Math.min(this.baseSpeed + this.distance * 0.28, this.maxSpeed);

    // 1. Scroll Floor & Bookshelf Walls
    this.floorOffset = (this.floorOffset + (this.speed * deltaSec * 0.0016)) % 1;
    this.renderPerspectiveFloor();

    // Scroll bookshelf wall columns along corridor boundaries
    const hy = this.HORIZON_Y;
    const h = this.CANVAS_HEIGHT;
    const vx = this.VANISHING_X;
    const topW = (this.W_LANE_HORIZON * 3) + 20;
    const botW = (this.W_LANE_BASE * 3) + 70;

    this.shelfSegments.forEach(seg => {
      seg.p = (seg.p + (this.speed * deltaSec * 0.0012)) % 1;
      const pExp = Math.pow(seg.p, 1.4);
      const curY = hy + pExp * (h - hy);
      const curHalfW = (topW / 2) + pExp * ((botW - topW) / 2);
      const scale = this.getDepthScale(curY);

      seg.left.setPosition(vx - curHalfW - 2, curY);
      seg.left.setScale(scale * 1.15);
      seg.left.setDepth(Math.floor(curY) + 2);

      seg.right.setPosition(vx + curHalfW + 2, curY);
      seg.right.setScale(scale * 1.15);
      seg.right.setDepth(Math.floor(curY) + 2);
    });

    // Scroll overhead archways
    this.overheadArches.forEach(item => {
      item.p = (item.p + (this.speed * deltaSec * 0.0009)) % 1;
      const pExp = Math.pow(item.p, 1.5);
      const curY = (hy - 30) + pExp * (this.PLAYER_BASE_Y - hy);
      const scale = this.getDepthScale(curY);

      item.sprite.setPosition(vx, curY);
      item.sprite.setScale(scale * 1.3, scale);
      item.sprite.setAlpha(Math.min(1, pExp * 2));
    });

    // 2. Update Obstacles
    for (let i = this.activeObstacles.length - 1; i >= 0; i--) {
      const obs = this.activeObstacles[i];
      const t = this.getDepthProgress(obs.y);
      const visualSpeed = this.speed * (0.35 + 0.95 * t);
      obs.y += visualSpeed * deltaSec;

      const curX = this.getLaneX(obs.lane, obs.y);
      const curScale = this.getDepthScale(obs.y);
      const depth = Math.floor(obs.y);

      obs.sprite.setPosition(curX, obs.y);
      obs.sprite.setScale(curScale);
      obs.sprite.setDepth(depth);

      obs.shadow.setPosition(curX, obs.y + obs.shadowOffsetY * curScale);
      obs.shadow.setScale(curScale * 1.2, curScale * 0.85);
      obs.shadow.setAlpha(0.55 * Math.min(1, t + 0.25));
      obs.shadow.setDepth(depth - 1);

      // Fair, responsive collision detection in strike zone
      if (Math.abs(obs.y - this.PLAYER_BASE_Y) < 36 && obs.lane === this.currentLane) {
        if (!this.isInvincible && !this.isGameOver) {
          const dodgedBarrier = (obs.obsType === 'barrier' && this.isJumping);
          const dodgedLow = (obs.obsType === 'low' && this.isSliding);

          if (!dodgedBarrier && !dodgedLow) {
            obs.sprite.destroy();
            obs.shadow.destroy();
            this.activeObstacles.splice(i, 1);
            this.processDamage(obs);
            continue;
          }
        }
      }

      // Cleanup past screen
      if (obs.y > this.CANVAS_HEIGHT + 70) {
        obs.sprite.destroy();
        obs.shadow.destroy();
        this.activeObstacles.splice(i, 1);
      }
    }

    // 3. Update Coins (and Magnet Pull)
    for (let i = this.activeCoins.length - 1; i >= 0; i--) {
      const coin = this.activeCoins[i];
      const t = this.getDepthProgress(coin.y);
      const visualSpeed = this.speed * (0.35 + 0.95 * t);
      coin.y += visualSpeed * deltaSec;

      let curX = this.getLaneX(coin.lane, coin.y);

      // Magnet pull toward player
      if (this.powerups.magnet && coin.y > this.HORIZON_Y + 40) {
        const pX = this.player.x;
        const pY = this.PLAYER_BASE_Y;
        const dist = Phaser.Math.Distance.Between(curX, coin.y, pX, pY);
        if (dist < 260) {
          curX = Phaser.Math.Linear(curX, pX, 0.16);
          coin.y = Phaser.Math.Linear(coin.y, pY, 0.16);
        }
      }

      const curScale = this.getDepthScale(coin.y);
      const depth = Math.floor(coin.y);

      coin.sprite.setPosition(curX, coin.y);
      coin.sprite.setScale(curScale);
      coin.sprite.setDepth(depth);

      coin.shadow.setPosition(curX, coin.y + 12 * curScale);
      coin.shadow.setScale(curScale * 0.9, curScale * 0.6);
      coin.shadow.setAlpha(0.45 * Math.min(1, t + 0.2));
      coin.shadow.setDepth(depth - 1);

      // Coin Collection Check
      const inLane = (coin.lane === this.currentLane) || (this.powerups.magnet && Math.abs(curX - this.player.x) < 40);
      if (inLane && Math.abs(coin.y - this.PLAYER_BASE_Y) < 35) {
        coin.sprite.destroy();
        coin.shadow.destroy();
        this.activeCoins.splice(i, 1);
        this.collectCoin();
        continue;
      }

      if (coin.y > this.CANVAS_HEIGHT + 50) {
        coin.sprite.destroy();
        coin.shadow.destroy();
        this.activeCoins.splice(i, 1);
      }
    }

    // 4. Update Powerups
    for (let i = this.activePowerups.length - 1; i >= 0; i--) {
      const pu = this.activePowerups[i];
      const t = this.getDepthProgress(pu.y);
      const visualSpeed = this.speed * (0.35 + 0.95 * t);
      pu.y += visualSpeed * deltaSec;

      const curX = this.getLaneX(pu.lane, pu.y);
      const curScale = this.getDepthScale(pu.y);
      const depth = Math.floor(pu.y);

      pu.sprite.setPosition(curX, pu.y);
      pu.sprite.setScale(curScale);
      pu.sprite.setDepth(depth);

      pu.shadow.setPosition(curX, pu.y + 14 * curScale);
      pu.shadow.setScale(curScale * 1.1, curScale * 0.7);
      pu.shadow.setAlpha(0.5 * Math.min(1, t + 0.2));
      pu.shadow.setDepth(depth - 1);

      if (pu.lane === this.currentLane && Math.abs(pu.y - this.PLAYER_BASE_Y) < 35) {
        const type = pu.powerupType;
        pu.sprite.destroy();
        pu.shadow.destroy();
        this.activePowerups.splice(i, 1);
        this.collectPowerup(type);
        continue;
      }

      if (pu.y > this.CANVAS_HEIGHT + 50) {
        pu.sprite.destroy();
        pu.shadow.destroy();
        this.activePowerups.splice(i, 1);
      }
    }

    // 5. Update Checkpoint Arches
    for (let i = this.activeArches.length - 1; i >= 0; i--) {
      const arch = this.activeArches[i];
      const t = this.getDepthProgress(arch.y);
      const visualSpeed = this.speed * (0.35 + 0.95 * t);
      arch.y += visualSpeed * deltaSec;

      const curScale = this.getDepthScale(arch.y);
      const depth = Math.floor(arch.y);

      arch.sprite.setPosition(this.VANISHING_X, arch.y);
      arch.sprite.setScale(curScale);
      arch.sprite.setDepth(depth);

      arch.shadow.setPosition(this.VANISHING_X, arch.y + 20 * curScale);
      arch.shadow.setScale(curScale * 2.2, curScale * 0.9);
      arch.shadow.setAlpha(0.5 * Math.min(1, t + 0.2));
      arch.shadow.setDepth(depth - 1);

      if (Math.abs(arch.y - this.PLAYER_BASE_Y) < 35) {
        arch.sprite.destroy();
        arch.shadow.destroy();
        this.activeArches.splice(i, 1);
        this.triggerQuestionCheckpoint();
        continue;
      }

      if (arch.y > this.CANVAS_HEIGHT + 80) {
        arch.sprite.destroy();
        arch.shadow.destroy();
        this.activeArches.splice(i, 1);
      }
    }

    // Anchor auras to player position
    this.shieldAura.setPosition(this.player.x, this.player.y - 10);
    this.magnetAura.setPosition(this.player.x, this.player.y - 10);

    // Update HUD
    this.scoreText.setText(`${this.score} PTS`);
    this.distText.setText(`${this.distance} M`);
    this.coinsText.setText(`🪙 ${this.coins}`);
    this.heartsText.setText('❤️'.repeat(Math.max(0, this.lives)));

    if (this.gameMode === 'timeAttack') {
      this.centerHUDText.setText(`⏱️ ${this.timeAttackRemaining}s`);
    } else if (this.gameMode === 'examChallenge') {
      this.centerHUDText.setText(`📝 ${this.examAnswered}/${this.examGoal}`);
    } else if (this.streak >= 3) {
      this.centerHUDText.setText(`🔥 ${this.streak} Streak!`);
    } else {
      this.centerHUDText.setText('');
    }
  }

  // ────────────────────────────────────────────────────────────
  // GAMEPLAY ACTIONS & DAMAGE
  // ────────────────────────────────────────────────────────────

  collectCoin() {
    sounds.playCoin();
    const multiplier = this.powerups.multiplier ? 2 : 1;
    this.coins += 1 * multiplier;
    this.score += 15 * multiplier;

    // Small pop text
    const pop = this.add.text(this.player.x, this.player.y - 30, `+${1 * multiplier}`, {
      fontFamily: 'system-ui',
      fontSize: '15px',
      fontWeight: 'bold',
      color: '#ffd166'
    }).setOrigin(0.5).setDepth(150);

    this.tweens.add({
      targets: pop,
      y: pop.y - 25,
      alpha: 0,
      duration: 380,
      onComplete: () => pop.destroy()
    });
  }

  collectPowerup(type) {
    sounds.playPowerup();

    if (type === 'pw_shield') {
      this.powerups.shield = true;
      this.shieldAura.setVisible(true);
      this.time.delayedCall(12000, () => {
        this.powerups.shield = false;
        this.shieldAura.setVisible(false);
      });
    } else if (type === 'pw_magnet') {
      this.powerups.magnet = true;
      this.magnetAura.setVisible(true);
      this.time.delayedCall(10000, () => {
        this.powerups.magnet = false;
        this.magnetAura.setVisible(false);
      });
    } else if (type === 'pw_multiplier') {
      this.powerups.multiplier = true;
      this.time.delayedCall(10000, () => {
        this.powerups.multiplier = false;
      });
    } else if (type === 'pw_heart') {
      this.lives = Math.min(3, this.lives + 1);
    }

    this.cameras.main.flash(200, 100, 200, 255);
  }

  processDamage(obs) {
    if (this.powerups.shield) {
      this.powerups.shield = false;
      this.shieldAura.setVisible(false);
      this.cameras.main.flash(250, 0, 180, 255);
      return;
    }

    sounds.playHit();
    this.lives--;
    this.cameras.main.shake(220, 0.02);
    this.cameras.main.flash(220, 255, 0, 0);

    if (this.lives <= 0) {
      this.triggerGameOver();
      return;
    }

    // Invincibility flicker
    this.isInvincible = true;
    this.tweens.add({
      targets: this.player,
      alpha: 0.25,
      duration: 100,
      yoyo: true,
      repeat: 6,
      onComplete: () => {
        this.player.alpha = 1;
        this.isInvincible = false;
      }
    });
  }

  // ────────────────────────────────────────────────────────────
  // QUESTION CHECKPOINTS & OVERLAY
  // ────────────────────────────────────────────────────────────

  triggerQuestionCheckpoint() {
    this.isQuestionActive = true;
    this.nextQuestionDistance += Phaser.Math.Between(180, 240);

    const question = this.questions[this.currentQuestionIndex % this.questions.length];
    this.currentQuestionIndex++;

    this.renderQuestionOverlay(question);
  }

  renderQuestionOverlay(question) {
    const width = this.CANVAS_WIDTH;
    const height = this.CANVAS_HEIGHT;

    this.qContainer = this.add.container(0, 0).setDepth(300);

    // Backdrop
    const backdrop = this.add.rectangle(width / 2, height / 2, width, height, 0x070913, 0.88);
    this.qContainer.add(backdrop);

    // Question Card Panel
    const panelWidth = 430;
    const panelHeight = 510;
    const panel = this.add.rectangle(width / 2, height / 2, panelWidth, panelHeight, 0x16182e)
      .setStrokeStyle(3, 0x4361ee);
    this.qContainer.add(panel);

    // Badge Title
    const badge = this.add.text(width / 2, height / 2 - panelHeight / 2 + 30, '📚 LEARNING CHECKPOINT', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '15px',
      fontWeight: 'bold',
      color: '#00f5d4'
    }).setOrigin(0.5);
    this.qContainer.add(badge);

    // Timer (15 seconds)
    let timeLeft = 15;
    const timerText = this.add.text(width / 2 + panelWidth / 2 - 38, height / 2 - panelHeight / 2 + 30, `⏱️ 15s`, {
      fontFamily: 'system-ui',
      fontSize: '13px',
      fontWeight: 'bold',
      color: '#ffbe0b'
    }).setOrigin(0.5);
    this.qContainer.add(timerText);

    const countdown = this.time.addEvent({
      delay: 1000,
      repeat: 14,
      callback: () => {
        timeLeft--;
        timerText.setText(`⏱️ ${timeLeft}s`);
        if (timeLeft <= 0) {
          this.handleAnswer(question, false, null, explanationText, feedbackText, choiceBtns);
        }
      }
    });

    // Question Text
    const qText = this.add.text(width / 2, height / 2 - panelHeight / 2 + 80, question.text, {
      fontFamily: 'system-ui',
      fontSize: '16px',
      fontWeight: '600',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: panelWidth - 40 }
    }).setOrigin(0.5, 0);
    this.qContainer.add(qText);

    // Feedback & Explanation Texts
    const feedbackText = this.add.text(width / 2, height / 2 + panelHeight / 2 - 90, '', {
      fontFamily: 'system-ui',
      fontSize: '16px',
      fontWeight: 'bold',
      align: 'center'
    }).setOrigin(0.5);
    this.qContainer.add(feedbackText);

    const explanationText = this.add.text(width / 2, height / 2 + panelHeight / 2 - 50, '', {
      fontFamily: 'system-ui',
      fontSize: '12px',
      color: '#ced4da',
      align: 'center',
      wordWrap: { width: panelWidth - 40 }
    }).setOrigin(0.5);
    this.qContainer.add(explanationText);

    // Answer Buttons
    const choiceBtns = [];
    const startY = height / 2 - panelHeight / 2 + 180;
    const btnHeight = 44;
    const btnGap = 12;

    question.choices.forEach((choice, idx) => {
      const btnY = startY + idx * (btnHeight + btnGap);
      const bg = this.add.rectangle(width / 2, btnY, panelWidth - 40, btnHeight, 0x242848)
        .setStrokeStyle(1.5, 0x3d4370)
        .setInteractive({ useHandCursor: true });

      const label = this.add.text(width / 2, btnY, choice.text, {
        fontFamily: 'system-ui',
        fontSize: '14px',
        fontWeight: '500',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: panelWidth - 60 }
      }).setOrigin(0.5);

      bg.on('pointerdown', () => {
        countdown.remove();
        choiceBtns.forEach(b => b.bg.disableInteractive());
        this.handleAnswer(question, choice.isCorrect, bg, explanationText, feedbackText, choiceBtns);
      });

      choiceBtns.push({ bg, label, isCorrect: choice.isCorrect });
      this.qContainer.add([bg, label]);
    });
  }

  handleAnswer(question, isCorrect, clickedBg, explanationText, feedbackText, choiceBtns) {
    GameQuestionService.recordAnswer(question.id, isCorrect, this.gameMode);

    if (this.gameMode === 'examChallenge') {
      this.examAnswered++;
    }

    if (isCorrect) {
      sounds.playCorrect();
      if (clickedBg) clickedBg.setFillStyle(0x38b000);
      feedbackText.setText('✅ Correct! Speed Boost! +50 pts').setColor('#38b000');
      this.score += 50;
      this.coins += 3;
      this.streak++;

      if (this.gameMode === 'timeAttack') {
        this.timeAttackRemaining += 6;
      }

      this.cameras.main.flash(200, 56, 176, 0);
      this.time.delayedCall(1200, () => this.resumeRunning());
    } else {
      sounds.playWrong();
      if (clickedBg) clickedBg.setFillStyle(0xd90429);

      choiceBtns.forEach(b => {
        if (b.isCorrect) b.bg.setFillStyle(0x38b000);
      });

      feedbackText.setText('❌ Incorrect').setColor('#d90429');
      explanationText.setText(`💡 ${question.explanation}`);
      this.streak = 0;
      this.cameras.main.flash(200, 217, 4, 41);

      this.time.delayedCall(3000, () => this.resumeRunning());
    }
  }

  resumeRunning() {
    if (this.qContainer) {
      this.qContainer.destroy();
      this.qContainer = null;
    }

    if (this.gameMode === 'examChallenge' && this.examAnswered >= this.examGoal) {
      this.triggerGameOver(true);
      return;
    }

    this.isQuestionActive = false;
  }

  togglePauseMenu() {
    this.scene.pause();
    window.dispatchEvent(new CustomEvent('study-dash-pause-game'));
  }

  triggerGameOver(completedExam = false) {
    this.isGameOver = true;

    // Clear active perspective elements
    this.activeObstacles.forEach(o => { o.sprite.destroy(); o.shadow.destroy(); });
    this.activeCoins.forEach(c => { c.sprite.destroy(); c.shadow.destroy(); });
    this.activePowerups.forEach(p => { p.sprite.destroy(); p.shadow.destroy(); });
    this.activeArches.forEach(a => { a.sprite.destroy(); a.shadow.destroy(); });

    this.activeObstacles = [];
    this.activeCoins = [];
    this.activePowerups = [];
    this.activeArches = [];

    this.scene.start('GameOverScene', {
      score: this.score,
      coins: this.coins,
      distance: this.distance,
      streak: this.streak,
      mode: this.gameMode,
      completedExam
    });
  }
}

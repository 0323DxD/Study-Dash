/**
 * GameScene.js — 2.5D University Campus / Library Run for STUDY DASH.
 * Features:
 * - 3 perspective-converging lanes, vanishing point depth, dynamic object scaling
 * - University library corridor with high bookshelves and horizon doors
 * - State-controlled delta-time player animations (Run 4-frame, Jump, Slide, Lane Tilt, Landing Squash, Hit Stumble)
 * - Themed educational obstacles (Stacked Textbooks, Study Desks, Low Clearance Sign, Heavy Library Book Cart, Wet Floor Cones)
 * - Educational collectibles (A+ Certificate Papers, Golden Knowledge Books, Knowledge Stars, Study Medals)
 * - IN-WORLD TRIVIA GATES: Suspends obstacles, slides Giant Question Banner, spawns 3 physical answer gates in perspective across Left/Center/Right lanes, with real-time lane collision & feedback!
 * - Floating & shimmering collectible physics, particle sparkle bursts, and landing dust puffs
 * - Dynamic HUD punch animations and mode support
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
    this.isLanding = false;
    this.lives = 3;

    // Movement & Speed
    this.speed = 400;
    this.baseSpeed = 400;
    this.maxSpeed = 780;
    this.score = 0;
    this.coins = 0;
    this.distance = 0;
    this.streak = 0;

    // Delta-Time Animation States
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

    // In-World Trivia Gates State
    this.isTriviaPhase = false;
    this.triviaResolved = false;
    this.triviaGates = [];
    this.triviaProps = [];
    this.triviaQuestion = null;
    this.questionBannerContainer = null;
    this.nextQuestionDistance = 140; // First trivia gate at ~140m

    this.isGameOver = false;

    // Environment animation trackers
    this.floorOffset = 0;
    this.shelfScroll = 0;
  }

  // ────────────────────────────────────────────────────────────
  // PERSPECTIVE PROJECTION MATHEMATICS
  // ────────────────────────────────────────────────────────────

  getDepthProgress(y) {
    return Phaser.Math.Clamp((y - this.HORIZON_Y) / (this.PLAYER_BASE_Y - this.HORIZON_Y), 0, 1.35);
  }

  getLaneX(laneIndex, y) {
    const t = this.getDepthProgress(y);
    const laneWidth = this.W_LANE_HORIZON + t * (this.W_LANE_BASE - this.W_LANE_HORIZON);
    const offset = laneIndex - 1; // -1: Left, 0: Center, 1: Right
    return this.VANISHING_X + offset * laneWidth;
  }

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

    // 2. Dynamic Entity Groups
    this.activeObstacles = [];
    this.activeCollectibles = [];
    this.activePowerups = [];
    this.activeArches = [];

    // 3. Player & Ground Contact Shadow
    const startX = this.getLaneX(1, this.PLAYER_BASE_Y);
    this.playerShadow = this.add.image(startX, this.PLAYER_BASE_Y + 28, 'lib_floor_shadow')
      .setScale(1.15, 0.85)
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

    // 6. Spawning Timers (Themed Obstacles & Educational Collectibles)
    this.spawnerTimer = this.time.addEvent({
      delay: 1400,
      callback: this.spawnTraffic,
      callbackScope: this,
      loop: true
    });

    this.collectibleTimer = this.time.addEvent({
      delay: 1100,
      callback: this.spawnCollectibles,
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
          if (!this.isGameOver) {
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
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0c16).setDepth(0);
    this.add.rectangle(width / 2, this.HORIZON_Y / 2, width, this.HORIZON_Y, 0x111322).setDepth(1);

    this.horizonDoor = this.add.image(this.VANISHING_X, this.HORIZON_Y - 40, 'lib_horizon_door')
      .setOrigin(0.5, 0.5)
      .setDepth(2);

    this.floorGraphics = this.add.graphics().setDepth(3);

    this.shelfSegments = [];
    const numShelves = 5;
    for (let i = 0; i < numShelves; i++) {
      const p = i / numShelves;
      const leftShelf = this.add.image(0, 0, 'lib_bookshelf_left').setOrigin(1, 0.5);
      const rightShelf = this.add.image(0, 0, 'lib_bookshelf_right').setOrigin(0, 0.5);
      this.shelfSegments.push({ p, left: leftShelf, right: rightShelf });
    }

    this.overheadArches = [];
    for (let i = 0; i < 2; i++) {
      const arch = this.add.image(this.VANISHING_X, 0, 'lib_ceiling_arch')
        .setOrigin(0.5, 0)
        .setDepth(95);
      this.overheadArches.push({ p: i * 0.5, sprite: arch });
    }

    this.renderPerspectiveFloor();
  }

  renderPerspectiveFloor() {
    const g = this.floorGraphics;
    g.clear();

    const w = this.CANVAS_WIDTH;
    const h = this.CANVAS_HEIGHT;
    const hy = this.HORIZON_Y;
    const vx = this.VANISHING_X;

    const topW = (this.W_LANE_HORIZON * 3) + 20;
    const botW = (this.W_LANE_BASE * 3) + 70;
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

    g.lineStyle(3, 0x422819, 0.85);
    g.strokeLineShape(new Phaser.Geom.Line(topLeftX, hy, botLeftX, h));
    g.strokeLineShape(new Phaser.Geom.Line(topRightX, hy, botRightX, h));

    // 2. Transverse Scrolling Floor Slats
    const numSlats = 8;
    g.lineStyle(1.5, 0x22273f, 0.7);
    for (let i = 0; i < numSlats; i++) {
      let p = (this.floorOffset + i / numSlats) % 1;
      const pExp = Math.pow(p, 1.8);
      const slatY = hy + pExp * (h - hy);
      const curHalfW = (topW / 2) + pExp * ((botW - topW) / 2);

      g.strokeLineShape(new Phaser.Geom.Line(vx - curHalfW, slatY, vx + curHalfW, slatY));

      if (i % 2 === 0 && pExp > 0.3) {
        g.fillStyle(0x272d47, 0.45 * pExp);
        g.fillCircle(vx, slatY, 4 * pExp);
      }
    }

    // 3. Converging Lane Separator Lines
    const divLeftHorizonX = vx - this.W_LANE_HORIZON * 0.5;
    const divRightHorizonX = vx + this.W_LANE_HORIZON * 0.5;
    const divLeftBaseX = vx - this.W_LANE_BASE * 0.5;
    const divRightBaseX = vx + this.W_LANE_BASE * 0.5;

    const dashSteps = 16;
    for (let step = 0; step < dashSteps; step++) {
      if (step % 2 === 0) continue;
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

      g.lineStyle(lineWidth, 0x4cc9f0, alpha);
      g.strokeLineShape(new Phaser.Geom.Line(lX1, y1, lX2, y2));
      g.strokeLineShape(new Phaser.Geom.Line(rX1, y1, rX2, y2));
    }
  }

  // ────────────────────────────────────────────────────────────
  // MOBILE HUD & PUNCH ANIMATIONS
  // ────────────────────────────────────────────────────────────

  createHUD(width, height) {
    this.hudContainer = this.add.container(0, 0).setDepth(200);

    const hudBar = this.add.rectangle(width / 2, 38, width, 76, 0x090b14, 0.88);
    this.hudContainer.add(hudBar);

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

    this.centerHUDText = this.add.text(width / 2, 28, '', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '15px',
      fontWeight: 'bold',
      color: '#ffbe0b'
    }).setOrigin(0.5);
    this.hudContainer.add(this.centerHUDText);

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

    const pauseBtn = this.add.rectangle(width - 34, 48, 34, 24, 0x242840, 0.9)
      .setInteractive({ useHandCursor: true });
    const pauseLabel = this.add.text(width - 34, 48, '⏸', {
      fontFamily: 'system-ui',
      fontSize: '12px'
    }).setOrigin(0.5);

    pauseBtn.on('pointerdown', () => this.togglePauseMenu());

    this.hudContainer.add([this.coinsText, this.heartsText, pauseBtn, pauseLabel]);
  }

  punchHUD(target) {
    if (!target) return;
    this.tweens.killTweensOf(target);
    target.setScale(1);
    this.tweens.add({
      targets: target,
      scaleX: 1.25,
      scaleY: 1.25,
      duration: 80,
      yoyo: true,
      ease: 'Back.easeOut'
    });
  }

  shakeHearts() {
    this.tweens.killTweensOf(this.heartsText);
    this.heartsText.setAlpha(1);
    this.tweens.add({
      targets: this.heartsText,
      x: this.heartsText.x + 8,
      duration: 50,
      yoyo: true,
      repeat: 4,
      ease: 'Quad.easeInOut'
    });
  }

  // ────────────────────────────────────────────────────────────
  // CONTROLS & STATE-CONTROLLED CHARACTER ANIMATIONS
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
    if (this.isGameOver) return;
    const newLane = Phaser.Math.Clamp(this.currentLane + direction, 0, 2);
    if (newLane === this.currentLane) return;

    this.currentLane = newLane;
    const targetX = this.getLaneX(this.currentLane, this.PLAYER_BASE_Y);

    const tilt = direction < 0 ? -0.16 : 0.16;
    this.tweens.add({
      targets: this.player,
      rotation: tilt,
      duration: 70,
      yoyo: true,
      ease: 'Sine.easeOut',
      onComplete: () => { this.player.rotation = 0; }
    });

    this.tweens.add({
      targets: [this.player, this.playerShadow, this.shieldAura, this.magnetAura],
      x: targetX,
      duration: 130,
      ease: 'Cubic.easeOut'
    });
  }

  jump() {
    if (this.isGameOver || this.isJumping) return;
    this.isJumping = true;
    sounds.playJump();

    this.player.setTexture('player_jump');

    this.tweens.add({
      targets: this.player,
      y: this.PLAYER_BASE_Y - 95,
      duration: 290,
      ease: 'Sine.easeOut',
      yoyo: true,
      onComplete: () => {
        this.isJumping = false;
        this.player.y = this.PLAYER_BASE_Y;

        this.createDustPuff(this.player.x, this.PLAYER_BASE_Y + 24);
        this.isLanding = true;

        this.tweens.add({
          targets: this.player,
          scaleX: 1.25,
          scaleY: 0.78,
          duration: 75,
          yoyo: true,
          ease: 'Quad.easeOut',
          onComplete: () => {
            this.player.setScale(1);
            this.isLanding = false;
            if (!this.isSliding) {
              this.player.setTexture(`player_run_${this.runFrame}`);
            }
          }
        });
      }
    });

    this.tweens.add({
      targets: this.playerShadow,
      scaleX: 0.58,
      scaleY: 0.42,
      alpha: 0.22,
      duration: 290,
      yoyo: true
    });
  }

  slide() {
    if (this.isGameOver) return;

    if (this.isJumping) {
      this.tweens.killTweensOf(this.player);
      this.isJumping = false;
      this.player.y = this.PLAYER_BASE_Y;
      this.playerShadow.setScale(1.15, 0.85);
      this.playerShadow.setAlpha(0.55);
    }

    if (this.isSliding) return;
    this.isSliding = true;
    sounds.playSlide();

    this.player.setTexture('player_slide');
    this.player.y = this.PLAYER_BASE_Y + 12;

    this.createDustPuff(this.player.x - 14, this.PLAYER_BASE_Y + 22);
    this.createDustPuff(this.player.x + 14, this.PLAYER_BASE_Y + 22);

    this.time.delayedCall(700, () => {
      this.isSliding = false;
      if (!this.isJumping) {
        this.player.setTexture(`player_run_${this.runFrame}`);
        this.player.y = this.PLAYER_BASE_Y;
      }
    });
  }

  // ────────────────────────────────────────────────────────────
  // THEMED OBSTACLES & EDUCATIONAL COLLECTIBLES SPAWNING
  // ────────────────────────────────────────────────────────────

  spawnTraffic() {
    if (this.isGameOver || this.isTriviaPhase) return;

    const lane = Phaser.Math.Between(0, 2);
    const spawnY = this.HORIZON_Y + 10;
    const startX = this.getLaneX(lane, spawnY);
    const scale = this.getDepthScale(spawnY);

    const roll = Phaser.Math.Between(0, 100);
    let key = 'obs_bookstack';
    let actionNeeded = 'jump';
    let shadowOffsetY = 18;

    if (roll < 32) {
      key = 'obs_cart';
      actionNeeded = 'dodge';
      shadowOffsetY = 38;
    } else if (roll < 58) {
      key = 'obs_bookstack';
      actionNeeded = 'jump';
      shadowOffsetY = 18;
    } else if (roll < 78) {
      key = 'obs_low_sign';
      actionNeeded = 'slide';
      shadowOffsetY = 16;
    } else if (roll < 90) {
      key = 'obs_desk';
      actionNeeded = 'jump';
      shadowOffsetY = 16;
    } else {
      key = 'obs_wetfloor';
      actionNeeded = 'jump';
      shadowOffsetY = 12;
    }

    const shadow = this.add.image(startX, spawnY + shadowOffsetY * scale, 'lib_floor_shadow')
      .setScale(scale)
      .setAlpha(0.2)
      .setDepth(Math.floor(spawnY) - 1);

    const sprite = this.add.sprite(startX, spawnY, key)
      .setScale(scale)
      .setDepth(Math.floor(spawnY));

    this.activeObstacles.push({
      sprite,
      shadow,
      lane,
      actionNeeded,
      shadowOffsetY,
      y: spawnY
    });
  }

  spawnCollectibles() {
    if (this.isGameOver || this.isTriviaPhase) return;

    const lane = Phaser.Math.Between(0, 2);
    const count = Phaser.Math.Between(3, 5);

    const typeRoll = Phaser.Math.Between(0, 100);
    let itemType = 'coin';
    let textureKey = 'coin_1';

    if (typeRoll < 35) {
      itemType = 'aplus';
      textureKey = 'col_aplus';
    } else if (typeRoll < 65) {
      itemType = 'book';
      textureKey = 'col_book';
    } else if (typeRoll < 85) {
      itemType = 'star';
      textureKey = 'col_star';
    } else {
      itemType = 'coin';
      textureKey = 'coin_1';
    }

    const spawnBaseTime = this.time.now;

    for (let i = 0; i < count; i++) {
      const spawnY = this.HORIZON_Y + 10 - (i * 34);
      const scale = this.getDepthScale(Math.max(this.HORIZON_Y, spawnY));
      const startX = this.getLaneX(lane, Math.max(this.HORIZON_Y, spawnY));

      const shadow = this.add.image(startX, spawnY + 14 * scale, 'lib_floor_shadow')
        .setScale(scale * 0.8, scale * 0.5)
        .setAlpha(0.2)
        .setDepth(10);

      const sprite = this.add.sprite(startX, spawnY, textureKey)
        .setScale(scale)
        .setDepth(11);

      this.activeCollectibles.push({
        sprite,
        shadow,
        lane,
        itemType,
        spawnTime: spawnBaseTime + (i * 180),
        y: spawnY
      });
    }
  }

  spawnPowerup() {
    if (this.isGameOver || this.isTriviaPhase) return;

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
  // IN-WORLD TRIVIA GATES MECHANIC (PHASE 3)
  // ────────────────────────────────────────────────────────────

  /**
   * Triggers the In-World Trivia Phase:
   * 1. Pauses regular obstacle and coin spawners to provide a clear runway.
   * 2. Slides down the Giant Question Banner at the top of the screen.
   * 3. Spawns 3 physical answer gates side-by-side in Left, Center, and Right lanes.
   */
  triggerQuestionPhase() {
    if (this.isTriviaPhase || this.isGameOver) return;
    this.isTriviaPhase = true;
    this.triviaResolved = false;

    // 1. Suspend normal obstacle & coin spawning
    this.spawnerTimer.paused = true;
    this.collectibleTimer.paused = true;

    // 2. Fetch question
    if (this.questions.length === 0) {
      this.isTriviaPhase = false;
      this.spawnerTimer.paused = false;
      this.collectibleTimer.paused = false;
      return;
    }

    const question = this.questions[this.currentQuestionIndex % this.questions.length];
    this.currentQuestionIndex++;
    this.triviaQuestion = question;

    // 3. Display Giant Question Banner
    this.showGiantQuestionBanner(question);

    // 4. Give player a clear section of empty track, then spawn Trivia Gates at horizon
    this.time.delayedCall(1200, () => {
      if (!this.isGameOver) {
        this.spawnTriviaGates(question);
      }
    });
  }

  showGiantQuestionBanner(question) {
    if (this.questionBannerContainer) {
      this.questionBannerContainer.destroy();
    }

    const width = this.CANVAS_WIDTH;
    this.questionBannerContainer = this.add.container(width / 2, -140).setDepth(260);

    // Banner Glassmorphic Card
    const card = this.add.rectangle(0, 0, width - 28, 116, 0x0c0f1e, 0.94)
      .setStrokeStyle(2.5, 0x4cc9f0, 0.95);

    // Category / Header Tag
    const tag = this.add.text(0, -38, '🎯 TRIVIA CHECKPOINT — RUN INTO THE CORRECT LANE!', {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '11px',
      fontWeight: '900',
      color: '#00f5d4'
    }).setOrigin(0.5);

    // Giant Question Text
    const qText = this.add.text(0, 4, question.text, {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '15px',
      fontWeight: 'bold',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: width - 56 }
    }).setOrigin(0.5);

    this.questionBannerContainer.add([card, tag, qText]);

    // Slide down smoothly
    this.tweens.add({
      targets: this.questionBannerContainer,
      y: 78,
      duration: 380,
      ease: 'Back.easeOut'
    });
  }

  spawnTriviaGates(question) {
    // Formulate 3 distinct choices: 1 correct, 2 distractors
    let correctChoice = question.choices.find(c => c.isCorrect) || { text: 'Correct' };
    let distractors = question.choices.filter(c => !c.isCorrect);

    if (distractors.length < 2) {
      distractors.push({ text: 'None of the above', isCorrect: false });
      distractors.push({ text: 'All of the above', isCorrect: false });
    }

    const wrong1 = distractors[0];
    const wrong2 = distractors[1];

    // Randomly assign which lane (0: Left, 1: Center, 2: Right) holds the correct answer
    const lanes = [0, 1, 2];
    const correctLane = Phaser.Utils.Array.GetRandom(lanes);
    const otherLanes = lanes.filter(l => l !== correctLane);

    const laneAssignments = {};
    laneAssignments[correctLane] = { text: correctChoice.text, isCorrect: true };
    laneAssignments[otherLanes[0]] = { text: wrong1.text, isCorrect: false };
    laneAssignments[otherLanes[1]] = { text: wrong2.text, isCorrect: false };

    const spawnY = this.HORIZON_Y + 8;
    const scale = this.getDepthScale(spawnY);
    const letters = ['A', 'B', 'C'];

    this.triviaGates = [];

    // Spawn 3 Gates side-by-side across all 3 lanes
    for (let lane = 0; lane < 3; lane++) {
      const startX = this.getLaneX(lane, spawnY);
      const choiceData = laneAssignments[lane];

      // Ground Contact Shadow
      const shadow = this.add.image(startX, spawnY + 28 * scale, 'lib_floor_shadow')
        .setScale(scale * 1.6, scale * 0.9)
        .setAlpha(0.3)
        .setDepth(Math.floor(spawnY) - 1);

      // Gate Arch
      const arch = this.add.sprite(startX, spawnY, 'gate_arch')
        .setScale(scale)
        .setDepth(Math.floor(spawnY));

      // Gateway Energy Curtain
      const curtain = this.add.sprite(startX, spawnY + 16 * scale, 'gate_curtain')
        .setScale(scale)
        .setDepth(Math.floor(spawnY) + 1);

      // Truncate long text for gate signboard
      let displayStr = choiceData.text;
      if (displayStr.length > 16) {
        displayStr = displayStr.substring(0, 14) + '..';
      }

      // Gate Signboard Label
      const text = this.add.text(startX, spawnY - 14 * scale, `[${letters[lane]}] ${displayStr}`, {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '12px',
        fontWeight: '900',
        color: '#ffffff',
        align: 'center'
      }).setOrigin(0.5).setScale(scale).setDepth(Math.floor(spawnY) + 2);

      this.triviaGates.push({
        lane,
        letter: letters[lane],
        choiceText: choiceData.text,
        isCorrect: choiceData.isCorrect,
        arch,
        curtain,
        text,
        shadow,
        y: spawnY
      });
    }

    // Spawn Thematic Outer Props (Framing the trivia gates at hallway edges)
    this.triviaProps = [];
    const vx = this.VANISHING_X;
    const p1 = this.add.sprite(vx - 70, spawnY, 'prop_oversized_book').setScale(scale).setDepth(Math.floor(spawnY) - 1);
    const p2 = this.add.sprite(vx + 70, spawnY, 'prop_desk_lamp').setScale(scale).setDepth(Math.floor(spawnY) - 1);
    this.triviaProps.push({ sprite: p1, side: -1, y: spawnY }, { sprite: p2, side: 1, y: spawnY });
  }

  resolveTriviaGateCollision() {
    const chosenGate = this.triviaGates.find(g => g.lane === this.currentLane);
    const isCorrect = chosenGate ? chosenGate.isCorrect : false;

    // Record answer in database service
    if (this.triviaQuestion) {
      GameQuestionService.recordAnswer(this.triviaQuestion.id, isCorrect, this.gameMode);
    }

    if (this.gameMode === 'examChallenge') {
      this.examAnswered++;
    }

    if (isCorrect) {
      // ── HITTING THE CORRECT GATE ──
      sounds.playCorrect();

      // Confetti & Star Sparkle Bursts
      this.createSparkleBurst(this.player.x, this.player.y - 15, 0x00f5d4);
      this.createSparkleBurst(this.player.x + 20, this.player.y - 25, 0xffd166);
      this.createSparkleBurst(this.player.x - 20, this.player.y - 25, 0xffbe0b);

      // Score bonus, coins, streak
      const multiplier = this.powerups.multiplier ? 2 : 1;
      this.score += 100 * multiplier;
      this.coins += 5 * multiplier;
      this.streak++;

      this.punchHUD(this.scoreText);
      this.punchHUD(this.coinsText);

      if (this.gameMode === 'timeAttack') {
        this.timeAttackRemaining += 8;
      }

      // Floating Feedback Pop
      const pop = this.add.text(this.player.x, this.player.y - 35, '✨ PERFECT! +100 PTS', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '17px',
        fontWeight: '900',
        color: '#00f5d4'
      }).setOrigin(0.5).setDepth(200);

      this.tweens.add({
        targets: pop,
        y: pop.y - 35,
        alpha: 0,
        duration: 500,
        ease: 'Cubic.easeOut',
        onComplete: () => pop.destroy()
      });

      // Smooth pass-through: Gate flashes radiant green and curtain vanishes
      if (chosenGate && chosenGate.curtain) {
        chosenGate.curtain.setTint(0x38b000);
        this.tweens.add({
          targets: [chosenGate.curtain, chosenGate.text],
          alpha: 0,
          duration: 180
        });
      }

    } else {
      // ── HITTING AN INCORRECT GATE ──
      sounds.playWrong();
      sounds.playHit();

      this.lives--;
      this.streak = 0;
      this.shakeHearts();

      this.cameras.main.shake(240, 0.025);
      this.cameras.main.flash(240, 255, 0, 0);

      // Stumble animation & red tint
      this.player.setTexture('player_hit');
      this.player.setTint(0xff3333);

      const correctGate = this.triviaGates.find(g => g.isCorrect);
      const correctMsg = correctGate ? `Lane [${correctGate.letter}] ${correctGate.choiceText}` : 'Other Lane';

      const pop = this.add.text(this.player.x, this.player.y - 35, `❌ WRONG LANE! Correct: ${correctMsg}`, {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '14px',
        fontWeight: '900',
        color: '#ff4d6d',
        wordWrap: { width: 340 }
      }).setOrigin(0.5).setDepth(200);

      this.tweens.add({
        targets: pop,
        y: pop.y - 35,
        alpha: 0,
        duration: 700,
        ease: 'Cubic.easeOut',
        onComplete: () => pop.destroy()
      });

      if (this.lives <= 0) {
        this.triggerGameOver();
        return;
      }

      // Invincibility recovery
      this.isInvincible = true;
      this.tweens.add({
        targets: this.player,
        alpha: 0.25,
        duration: 100,
        yoyo: true,
        repeat: 6,
        onComplete: () => {
          this.player.alpha = 1;
          this.player.clearTint();
          this.player.setTexture(`player_run_${this.runFrame}`);
          this.isInvincible = false;
        }
      });
    }

    // Slide Question Banner up and off-screen
    if (this.questionBannerContainer) {
      this.tweens.add({
        targets: this.questionBannerContainer,
        y: -140,
        duration: 350,
        ease: 'Cubic.easeIn',
        onComplete: () => {
          if (this.questionBannerContainer) {
            this.questionBannerContainer.destroy();
            this.questionBannerContainer = null;
          }
        }
      });
    }

    // Check Exam Goal
    if (this.gameMode === 'examChallenge' && this.examAnswered >= this.examGoal) {
      this.time.delayedCall(800, () => this.triggerGameOver(true));
    }
  }

  // ────────────────────────────────────────────────────────────
  // VISUAL PARTICLES & EFFECTS (60 FPS POOLED SYSTEM)
  // ────────────────────────────────────────────────────────────

  createSparkleBurst(x, y, tint = 0xffd166) {
    const count = 8;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = Phaser.Math.Between(70, 160);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 35;

      const p = this.add.image(x, y, 'part_sparkle')
        .setScale(Phaser.Math.FloatBetween(0.8, 1.3))
        .setTint(tint)
        .setDepth(180);

      this.tweens.add({
        targets: p,
        x: p.x + vx * 0.35,
        y: p.y + vy * 0.35,
        scale: 0.1,
        alpha: 0,
        duration: 360,
        ease: 'Cubic.easeOut',
        onComplete: () => p.destroy()
      });
    }
  }

  createDustPuff(x, y) {
    for (let i = 0; i < 3; i++) {
      const p = this.add.image(x + Phaser.Math.Between(-12, 12), y + Phaser.Math.Between(-4, 4), 'part_dust')
        .setScale(Phaser.Math.FloatBetween(0.5, 0.9))
        .setAlpha(0.65)
        .setDepth(this.PLAYER_BASE_Y - 1);

      this.tweens.add({
        targets: p,
        scale: 1.4,
        alpha: 0,
        duration: 260,
        ease: 'Quad.easeOut',
        onComplete: () => p.destroy()
      });
    }
  }

  // ────────────────────────────────────────────────────────────
  // UPDATE LOOP & DEPTH TRANSFORMATIONS
  // ────────────────────────────────────────────────────────────

  update(time, delta) {
    if (this.isGameOver) return;

    const deltaSec = delta / 1000;

    // Running Bob Animation
    this.runAnimTimer += delta;
    if (!this.isJumping && !this.isSliding && !this.isLanding && this.runAnimTimer > 115) {
      this.runAnimTimer = 0;
      this.runFrame = (this.runFrame % 4) + 1;
      this.player.setTexture(`player_run_${this.runFrame}`);

      const bob = (this.runFrame === 2 || this.runFrame === 4) ? -2 : 0;
      this.player.y = this.PLAYER_BASE_Y + bob;
    }

    // Distance & Score progression
    const distDelta = Math.round(this.speed * deltaSec * 0.12);
    this.distance += distDelta;
    this.score += Math.round(12 * deltaSec * (this.powerups.multiplier ? 2 : 1));

    // Dynamic speed progression
    this.speed = Math.min(this.baseSpeed + this.distance * 0.28, this.maxSpeed);

    // Question Checkpoint Trigger
    if (this.distance >= this.nextQuestionDistance && !this.isTriviaPhase) {
      this.triggerQuestionPhase();
    }

    // 1. Scroll Floor & Bookshelf Walls
    this.floorOffset = (this.floorOffset + (this.speed * deltaSec * 0.0016)) % 1;
    this.renderPerspectiveFloor();

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

    this.overheadArches.forEach(item => {
      item.p = (item.p + (this.speed * deltaSec * 0.0009)) % 1;
      const pExp = Math.pow(item.p, 1.5);
      const curY = (hy - 30) + pExp * (this.PLAYER_BASE_Y - hy);
      const scale = this.getDepthScale(curY);

      item.sprite.setPosition(vx, curY);
      item.sprite.setScale(scale * 1.3, scale);
      item.sprite.setAlpha(Math.min(1, pExp * 2));
    });

    // 2. Update In-World Trivia Gates in 2.5D Perspective
    if (this.triviaGates.length > 0) {
      const t = this.getDepthProgress(this.triviaGates[0].y);
      const visualSpeed = this.speed * (0.35 + 0.95 * t);
      const dy = visualSpeed * deltaSec;

      for (let i = 0; i < this.triviaGates.length; i++) {
        const gate = this.triviaGates[i];
        gate.y += dy;

        const curX = this.getLaneX(gate.lane, gate.y);
        const curScale = this.getDepthScale(gate.y);
        const depth = Math.floor(gate.y);

        gate.arch.setPosition(curX, gate.y);
        gate.arch.setScale(curScale);
        gate.arch.setDepth(depth);

        gate.curtain.setPosition(curX, gate.y + 16 * curScale);
        gate.curtain.setScale(curScale);
        gate.curtain.setDepth(depth + 1);

        gate.text.setPosition(curX, gate.y - 14 * curScale);
        gate.text.setScale(curScale);
        gate.text.setDepth(depth + 2);

        gate.shadow.setPosition(curX, gate.y + 28 * curScale);
        gate.shadow.setScale(curScale * 1.6, curScale * 0.9);
        gate.shadow.setAlpha(0.55 * Math.min(1, t + 0.25));
        gate.shadow.setDepth(depth - 1);
      }

      // Update Thematic Outer Props
      this.triviaProps.forEach(prop => {
        prop.y += dy;
        const curScale = this.getDepthScale(prop.y);
        const curProgress = this.getDepthProgress(prop.y);
        const curHalfW = (topW / 2) + curProgress * ((botW - topW) / 2);
        const pX = vx + prop.side * (curHalfW + 36 * curScale);

        prop.sprite.setPosition(pX, prop.y);
        prop.sprite.setScale(curScale * 1.2);
        prop.sprite.setDepth(Math.floor(prop.y));
      });

      // Check Gate Hitbox Collision at Player Baseline
      if (this.triviaGates[0].y >= this.PLAYER_BASE_Y - 26 && !this.triviaResolved) {
        this.triviaResolved = true;
        this.resolveTriviaGateCollision();
      }

      // Cleanup Trivia Gates past canvas & resume normal spawning
      if (this.triviaGates[0].y > this.CANVAS_HEIGHT + 90) {
        this.triviaGates.forEach(g => {
          g.arch.destroy();
          g.curtain.destroy();
          g.text.destroy();
          g.shadow.destroy();
        });
        this.triviaProps.forEach(p => p.sprite.destroy());

        this.triviaGates = [];
        this.triviaProps = [];
        this.isTriviaPhase = false;

        // Resume standard endless runner spawning
        this.spawnerTimer.paused = false;
        this.collectibleTimer.paused = false;
        this.nextQuestionDistance = this.distance + Phaser.Math.Between(180, 260);
      }
    }

    // 3. Update Standard Obstacles
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
      obs.shadow.setScale(curScale * 1.25, curScale * 0.85);
      obs.shadow.setAlpha(0.55 * Math.min(1, t + 0.25));
      obs.shadow.setDepth(depth - 1);

      if (Math.abs(obs.y - this.PLAYER_BASE_Y) < 36 && obs.lane === this.currentLane) {
        if (!this.isInvincible && !this.isGameOver) {
          const dodgedJump = (obs.actionNeeded === 'jump' && this.isJumping);
          const dodgedSlide = (obs.actionNeeded === 'slide' && this.isSliding);

          if (!dodgedJump && !dodgedSlide) {
            obs.sprite.destroy();
            obs.shadow.destroy();
            this.activeObstacles.splice(i, 1);
            this.processDamage(obs);
            continue;
          }
        }
      }

      if (obs.y > this.CANVAS_HEIGHT + 70) {
        obs.sprite.destroy();
        obs.shadow.destroy();
        this.activeObstacles.splice(i, 1);
      }
    }

    // 4. Update Educational Collectibles
    for (let i = this.activeCollectibles.length - 1; i >= 0; i--) {
      const col = this.activeCollectibles[i];
      const coin = col;
      const t = this.getDepthProgress(col.y);
      const visualSpeed = this.speed * (0.35 + 0.95 * t);
      col.y += visualSpeed * deltaSec;

      let curX = this.getLaneX(col.lane, col.y);

      const bobY = Math.sin((time * 0.005) + col.spawnTime * 0.01) * 5 * Math.min(1, t + 0.2);
      const renderY = col.y + bobY;
      col.sprite.rotation = Math.sin((time * 0.004) + col.spawnTime * 0.01) * 0.08;

      if (this.powerups.magnet && col.y > this.HORIZON_Y + 40) {
        const pX = this.player.x;
        const pY = this.PLAYER_BASE_Y;
        const dist = Phaser.Math.Distance.Between(curX, col.y, pX, pY);
        if (dist < 260) {
          curX = Phaser.Math.Linear(curX, pX, 0.18);
          col.y = Phaser.Math.Linear(col.y, pY, 0.18);
        }
      }

      const curScale = this.getDepthScale(col.y);
      const depth = Math.floor(col.y);

      col.sprite.setPosition(curX, renderY);
      col.sprite.setScale(curScale);
      col.sprite.setDepth(depth);

      col.shadow.setPosition(curX, col.y + 14 * curScale);
      coin.shadow = col.shadow;
      col.shadow.setScale(curScale * 0.95, curScale * 0.6);
      col.shadow.setAlpha(0.45 * Math.min(1, t + 0.2));
      col.shadow.setDepth(depth - 1);

      const inLane = (col.lane === this.currentLane) || (this.powerups.magnet && Math.abs(curX - this.player.x) < 42);
      if (inLane && Math.abs(col.y - this.PLAYER_BASE_Y) < 36) {
        col.sprite.destroy();
        col.shadow.destroy();
        this.activeCollectibles.splice(i, 1);
        this.collectCollectible(col);
        continue;
      }

      if (col.y > this.CANVAS_HEIGHT + 50) {
        col.sprite.destroy();
        col.shadow.destroy();
        this.activeCollectibles.splice(i, 1);
      }
    }

    // 5. Update Powerups
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

    // Anchor auras to player
    this.shieldAura.setPosition(this.player.x, this.player.y - 10);
    this.magnetAura.setPosition(this.player.x, this.player.y - 10);

    // Update HUD Text
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
  // GAMEPLAY ACTIONS & EDUCATIONAL ITEM COLLECTION
  // ────────────────────────────────────────────────────────────

  collectCollectible(item) {
    sounds.playCoin();
    const multiplier = this.powerups.multiplier ? 2 : 1;

    let pts = 15;
    let earnedCoins = 1;
    let popLabel = `+${15 * multiplier}`;
    let popColor = '#ffd166';
    let sparkleColor = 0xffd166;

    if (item.itemType === 'aplus') {
      pts = 50;
      earnedCoins = 3;
      popLabel = `A+ PERFECT! +${50 * multiplier}`;
      popColor = '#00f5d4';
      sparkleColor = 0x4cc9f0;
      this.streak++;
    } else if (item.itemType === 'book') {
      pts = 25;
      earnedCoins = 2;
      popLabel = `+${25 * multiplier} PTS`;
      popColor = '#ffd166';
      sparkleColor = 0xffbe0b;
    } else if (item.itemType === 'star') {
      pts = 20;
      earnedCoins = 1;
      popLabel = `+${20 * multiplier}`;
      popColor = '#ffea00';
      sparkleColor = 0xffffff;
    }

    this.coins += earnedCoins * multiplier;
    this.score += pts * multiplier;

    this.createSparkleBurst(this.player.x, this.player.y - 15, sparkleColor);
    this.punchHUD(this.scoreText);
    this.punchHUD(this.coinsText);

    const pop = this.add.text(this.player.x, this.player.y - 30, popLabel, {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: item.itemType === 'aplus' ? '16px' : '14px',
      fontWeight: '900',
      color: popColor
    }).setOrigin(0.5).setDepth(190);

    this.tweens.add({
      targets: pop,
      y: pop.y - 32,
      alpha: 0,
      duration: 450,
      ease: 'Cubic.easeOut',
      onComplete: () => pop.destroy()
    });
  }

  collectPowerup(type) {
    sounds.playPowerup();
    this.createSparkleBurst(this.player.x, this.player.y - 15, 0x00f5d4);

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
      this.punchHUD(this.heartsText);
    }

    this.cameras.main.flash(200, 100, 200, 255);
  }

  processDamage(obs) {
    if (this.powerups.shield) {
      this.powerups.shield = false;
      this.shieldAura.setVisible(false);
      this.createSparkleBurst(this.player.x, this.player.y, 0x00b4d8);
      this.cameras.main.flash(250, 0, 180, 255);
      return;
    }

    sounds.playHit();
    this.lives--;
    this.cameras.main.shake(220, 0.02);
    this.cameras.main.flash(220, 255, 0, 0);

    this.shakeHearts();
    this.player.setTexture('player_hit');
    this.player.setTint(0xff3333);

    if (this.lives <= 0) {
      this.triggerGameOver();
      return;
    }

    this.isInvincible = true;
    this.tweens.add({
      targets: this.player,
      alpha: 0.25,
      duration: 100,
      yoyo: true,
      repeat: 6,
      onComplete: () => {
        this.player.alpha = 1;
        this.player.clearTint();
        this.player.setTexture(`player_run_${this.runFrame}`);
        this.isInvincible = false;
      }
    });
  }

  togglePauseMenu() {
    this.scene.pause();
    window.dispatchEvent(new CustomEvent('study-dash-pause-game'));
  }

  triggerGameOver(completedExam = false) {
    this.isGameOver = true;

    if (this.questionBannerContainer) {
      this.questionBannerContainer.destroy();
      this.questionBannerContainer = null;
    }

    this.activeObstacles.forEach(o => { o.sprite.destroy(); o.shadow.destroy(); });
    this.activeCollectibles.forEach(c => { c.sprite.destroy(); c.shadow.destroy(); });
    this.activePowerups.forEach(p => { p.sprite.destroy(); p.shadow.destroy(); });
    this.activeArches.forEach(a => { a.sprite.destroy(); a.shadow.destroy(); });
    this.triviaGates.forEach(g => { g.arch.destroy(); g.curtain.destroy(); g.text.destroy(); g.shadow.destroy(); });
    this.triviaProps.forEach(p => p.sprite.destroy());

    this.activeObstacles = [];
    this.activeCollectibles = [];
    this.activePowerups = [];
    this.activeArches = [];
    this.triviaGates = [];
    this.triviaProps = [];

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

/**
 * GameScene.js — Real-Time Subway Surfers-style Endless Runner for STUDY DASH.
 * Features 3-lane continuous running, Subway trains, high barriers, low slide arches,
 * coin runs, power-ups, audio effects, and integrated Question Checkpoints.
 */

import TouchControls from './TouchControls.js';
import { GameQuestionService } from '../services/GameQuestionService.js';
import { sounds } from './SoundEffects.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this.gameMode = data?.mode || 'endless';
    this.filter = data?.filter || {};
    this.questions = data?.questions || [];
    this.currentQuestionIndex = 0;

    // Running state
    this.currentLane = 1; // 0: Left, 1: Center, 2: Right
    this.laneX = [0, 0, 0];
    this.playerBaseY = 0;
    this.isJumping = false;
    this.isSliding = false;
    this.isInvincible = false;
    this.lives = 3;

    // Movement & Speed
    this.speed = 380;
    this.baseSpeed = 380;
    this.maxSpeed = 750;
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
    this.nextQuestionDistance = 120; // Checkpoint every ~180-220m
  }

  async create() {
    const { width, height } = this.scale;

    // 3 Distinct Lanes
    this.laneWidth = Math.min(width * 0.28, 120);
    const centerX = width / 2;
    this.laneX = [
      centerX - this.laneWidth,
      centerX,
      centerX + this.laneWidth
    ];
    this.playerBaseY = height - 120;

    // 1. Perspective Track & Parallax Environment
    this.createEnvironment(width, height);

    // 2. Physics Groups
    this.obstacles = this.physics.add.group();
    this.trainGroup = this.physics.add.group();
    this.coinGroup = this.physics.add.group();
    this.powerupGroup = this.physics.add.group();
    this.checkpointArchGroup = this.physics.add.group();

    // 3. Player & Shadow
    this.playerShadow = this.add.ellipse(this.laneX[1], this.playerBaseY + 26, 34, 10, 0x000000, 0.35);

    this.player = this.physics.add.sprite(this.laneX[1], this.playerBaseY, 'player_run_1');
    this.player.setCollideWorldBounds(false);
    this.player.body.setSize(24, 46);
    this.player.body.setOffset(8, 7);

    // Shield Aura
    this.shieldAura = this.add.circle(this.player.x, this.player.y, 34, 0x00b4d8, 0.35);
    this.shieldAura.setStrokeStyle(2.5, 0x90e0ef);
    this.shieldAura.setVisible(false);

    // Magnet Sparks Aura
    this.magnetAura = this.add.circle(this.player.x, this.player.y, 28, 0xe63946, 0.2);
    this.magnetAura.setStrokeStyle(2, 0xffbe0b);
    this.magnetAura.setVisible(false);

    // 4. Input & Controls
    this.touchControls = new TouchControls(this);
    this.setupInputHandlers();

    // 5. Collisions & Overlaps
    this.physics.add.overlap(this.player, this.coinGroup, this.collectCoin, null, this);
    this.physics.add.overlap(this.player, this.powerupGroup, this.collectPowerup, null, this);
    this.physics.add.overlap(this.player, this.obstacles, this.hitObstacle, null, this);
    this.physics.add.overlap(this.player, this.trainGroup, this.hitTrain, null, this);
    this.physics.add.overlap(this.player, this.checkpointArchGroup, this.reachCheckpointArch, null, this);

    // 6. Mobile HUD
    this.createHUD(width, height);

    // 7. Spawning Timers
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
      delay: 15000,
      callback: this.spawnPowerup,
      callbackScope: this,
      loop: true
    });

    // Time Attack 1s clock
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

    // 8. Fetch Questions
    if (this.questions.length === 0) {
      this.questions = await GameQuestionService.getQuestionsForGame(this.gameMode, this.filter);
    }
  }

  createEnvironment(width, height) {
    // Sky / City Backdrop
    this.bg = this.add.rectangle(width / 2, height / 2, width, height, 0x0f1123);

    // Side Buildings / Walls (Left & Right)
    this.sideWalls = [];
    const trackWidth = this.laneWidth * 3.3;
    const trackLeft = width / 2 - trackWidth / 2;
    const trackRight = width / 2 + trackWidth / 2;

    for (let y = -80; y < height + 160; y += 80) {
      const leftWall = this.add.sprite(trackLeft - 24, y, 'city_wall');
      const rightWall = this.add.sprite(trackRight + 24, y, 'city_wall');
      rightWall.setFlipX(true);
      this.sideWalls.push(leftWall, rightWall);
    }

    // Ballast / Track Roadbed
    this.trackBed = this.add.rectangle(width / 2, height / 2, trackWidth, height, 0x1b1c2e);
    this.trackBed.setStrokeStyle(4, 0x3d405b);

    // Railway Ties (Horizontal crossbeams)
    this.ties = [];
    for (let y = -40; y < height + 80; y += 50) {
      const tieL = this.add.sprite(this.laneX[0], y, 'rail_tie');
      const tieC = this.add.sprite(this.laneX[1], y, 'rail_tie');
      const tieR = this.add.sprite(this.laneX[2], y, 'rail_tie');
      this.ties.push(tieL, tieC, tieR);
    }

    // Rails (Steel vertical lines)
    const railOffset = 20;
    [0, 1, 2].forEach(lane => {
      const x = this.laneX[lane];
      const r1 = this.add.rectangle(x - railOffset, height / 2, 3, height, 0xadb5bd, 0.4);
      const r2 = this.add.rectangle(x + railOffset, height / 2, 3, height, 0xadb5bd, 0.4);
    });
  }

  createHUD(width, height) {
    this.hudContainer = this.add.container(0, 0).setDepth(100);

    // Top HUD Bar Glassmorphism
    const hudBar = this.add.rectangle(width / 2, 36, width, 72, 0x0a0c16, 0.85);
    this.hudContainer.add(hudBar);

    // Score & Distance (Top Left)
    this.scoreText = this.add.text(18, 16, '0 pts', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#ffffff'
    });
    this.distText = this.add.text(18, 38, '0 m', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      fontWeight: '600',
      color: '#00f5d4'
    });
    this.hudContainer.add([this.scoreText, this.distText]);

    // Center Info (Streak or Mode Clock)
    this.centerHUDText = this.add.text(width / 2, 26, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#ffbe0b'
    }).setOrigin(0.5);
    this.hudContainer.add(this.centerHUDText);

    // Coins (Top Right)
    this.coinsText = this.add.text(width - 100, 18, '🪙 0', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#ffd166'
    });

    // Lives
    this.heartsText = this.add.text(width - 18, 18, '❤️❤️❤️', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px'
    }).setOrigin(1, 0);

    // Pause Button
    const pauseBtn = this.add.rectangle(width - 32, 46, 32, 22, 0x2b2d42, 0.8)
      .setInteractive({ useHandCursor: true });
    const pauseLabel = this.add.text(width - 32, 46, '⏸', {
      fontFamily: 'system-ui',
      fontSize: '12px'
    }).setOrigin(0.5);

    pauseBtn.on('pointerdown', () => this.togglePauseMenu());

    this.hudContainer.add([this.coinsText, this.heartsText, pauseBtn, pauseLabel]);
  }

  setupInputHandlers() {
    // Touch Swipes
    this.events.on('swipeLeft', () => this.changeLane(-1));
    this.events.on('swipeRight', () => this.changeLane(1));
    this.events.on('swipeUp', () => this.jump());
    this.events.on('swipeDown', () => this.slide());

    // Keyboard Fallbacks
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

  changeLane(direction) {
    if (this.isGameOver || this.isQuestionActive) return;
    const newLane = Phaser.Math.Clamp(this.currentLane + direction, 0, 2);
    if (newLane === this.currentLane) return;

    this.currentLane = newLane;
    const targetX = this.laneX[this.currentLane];

    // Snappy lane switch tween
    this.tweens.add({
      targets: [this.player, this.playerShadow, this.shieldAura, this.magnetAura],
      x: targetX,
      duration: 140,
      ease: 'Cubic.easeOut'
    });
  }

  jump() {
    if (this.isGameOver || this.isQuestionActive || this.isJumping) return;
    this.isJumping = true;
    sounds.playJump();

    this.player.setTexture('player_jump');

    // Arc jump
    this.tweens.add({
      targets: this.player,
      y: this.playerBaseY - 95,
      duration: 300,
      ease: 'Sine.easeOut',
      yoyo: true,
      onComplete: () => {
        this.isJumping = false;
        if (!this.isSliding) {
          this.player.setTexture(`player_run_${this.runFrame}`);
        }
        this.player.y = this.playerBaseY;
      }
    });

    // Shadow scaling
    this.tweens.add({
      targets: this.playerShadow,
      scaleX: 0.55,
      scaleY: 0.55,
      alpha: 0.15,
      duration: 300,
      yoyo: true
    });
  }

  slide() {
    if (this.isGameOver || this.isQuestionActive) return;

    // Fast-drop if in air
    if (this.isJumping) {
      this.tweens.killTweensOf(this.player);
      this.isJumping = false;
      this.player.y = this.playerBaseY;
      this.playerShadow.setScale(1);
      this.playerShadow.setAlpha(0.35);
    }

    if (this.isSliding) return;
    this.isSliding = true;
    sounds.playSlide();

    this.player.setTexture('player_slide');
    this.player.body.setSize(52, 22);
    this.player.body.setOffset(2, 8);
    this.player.y = this.playerBaseY + 14;

    this.time.delayedCall(700, () => {
      this.isSliding = false;
      if (!this.isJumping) {
        this.player.setTexture(`player_run_${this.runFrame}`);
        this.player.body.setSize(24, 46);
        this.player.body.setOffset(8, 7);
        this.player.y = this.playerBaseY;
      }
    });
  }

  spawnTraffic() {
    if (this.isGameOver || this.isQuestionActive) return;

    // If approaching a Question Checkpoint, spawn Checkpoint Arch instead of random obstacle!
    if (this.distance >= this.nextQuestionDistance - 25 && this.checkpointArchGroup.countActive() === 0) {
      this.spawnCheckpointArch();
      return;
    }

    const lane = Phaser.Math.Between(0, 2);
    const x = this.laneX[lane];

    // Obstacle types: 0: Train car, 1: High barrier, 2: Low slide arch, 3: Cone
    const roll = Phaser.Math.Between(0, 100);

    if (roll < 32) {
      // Subway Train Car! (Dodge left/right)
      const trainKey = Math.random() > 0.5 ? 'train_red' : 'train_blue';
      const train = this.trainGroup.create(x, -160, trainKey);
      train.setVelocityY(this.speed * 0.95);
      train.body.setSize(train.width * 0.9, train.height * 0.9);
      train.setImmovable(true);
    } else if (roll < 58) {
      // High Road Barrier (Jump over or dodge)
      const barrier = this.obstacles.create(x, -60, 'obs_barrier');
      barrier.obsType = 'barrier';
      barrier.setVelocityY(this.speed);
      barrier.body.setSize(barrier.width * 0.85, barrier.height * 0.65);
      barrier.setImmovable(true);
    } else if (roll < 82) {
      // Low Clearance Arch (Must SLIDE or dodge)
      const low = this.obstacles.create(x, -60, 'obs_low_barrier');
      low.obsType = 'low';
      low.setVelocityY(this.speed);
      low.body.setSize(low.width * 0.85, 20); // Top beam hitbox
      low.body.setOffset(6, 4);
      low.setImmovable(true);
    } else {
      // Traffic Cone
      const cone = this.obstacles.create(x, -50, 'obs_cone');
      cone.obsType = 'cone';
      cone.setVelocityY(this.speed);
      cone.body.setSize(cone.width * 0.8, cone.height * 0.7);
      cone.setImmovable(true);
    }
  }

  spawnCheckpointArch() {
    const { width } = this.scale;
    const arch = this.checkpointArchGroup.create(width / 2, -100, 'checkpoint_arch');
    arch.setVelocityY(this.speed);
    arch.body.setSize(arch.width, 40);
  }

  spawnCoins() {
    if (this.isGameOver || this.isQuestionActive) return;

    const lane = Phaser.Math.Between(0, 2);
    const x = this.laneX[lane];
    const count = Phaser.Math.Between(2, 5);

    for (let i = 0; i < count; i++) {
      const coin = this.coinGroup.create(x, -50 - (i * 38), 'coin_1');
      coin.setVelocityY(this.speed);
      coin.body.setCircle(13);
    }
  }

  spawnPowerup() {
    if (this.isGameOver || this.isQuestionActive) return;

    const lane = Phaser.Math.Between(0, 2);
    const x = this.laneX[lane];
    const list = ['pw_shield', 'pw_magnet', 'pw_multiplier', 'pw_heart'];
    const chosen = Phaser.Utils.Array.GetRandom(list);

    const pu = this.powerupGroup.create(x, -60, chosen);
    pu.powerupType = chosen;
    pu.setVelocityY(this.speed);
    pu.body.setCircle(16);
  }

  collectCoin(player, coin) {
    coin.destroy();
    sounds.playCoin();

    const multiplier = this.powerups.multiplier ? 2 : 1;
    this.coins += 1 * multiplier;
    this.score += 15 * multiplier;

    // Small pop text
    const pop = this.add.text(player.x, player.y - 20, `+${1 * multiplier}`, {
      fontFamily: 'system-ui',
      fontSize: '15px',
      fontWeight: 'bold',
      color: '#ffd166'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: pop,
      y: pop.y - 30,
      alpha: 0,
      duration: 400,
      onComplete: () => pop.destroy()
    });
  }

  collectPowerup(player, pu) {
    const type = pu.powerupType;
    pu.destroy();
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

  hitObstacle(player, obs) {
    if (this.isInvincible || this.isGameOver) return;

    // Check jump/slide dodges
    if (obs.obsType === 'barrier' && this.isJumping) return;
    if (obs.obsType === 'low' && this.isSliding) return;

    this.processDamage(obs);
  }

  hitTrain(player, train) {
    if (this.isInvincible || this.isGameOver) return;
    // Trains cannot be jumped over or slid under
    this.processDamage(train);
  }

  processDamage(entity) {
    entity.destroy();

    // Shield protection
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

  reachCheckpointArch(player, arch) {
    arch.destroy();
    this.triggerQuestionCheckpoint();
  }

  update(time, delta) {
    if (this.isGameOver || this.isQuestionActive) return;

    const deltaSec = delta / 1000;

    // Animated Running Cycle (bob between run_1 and run_2)
    this.runAnimTimer += delta;
    if (!this.isJumping && !this.isSliding && this.runAnimTimer > 130) {
      this.runAnimTimer = 0;
      this.runFrame = this.runFrame === 1 ? 2 : 1;
      this.player.setTexture(`player_run_${this.runFrame}`);
    }

    // Distance & Score progression
    const distDelta = Math.round(this.speed * deltaSec * 0.12);
    this.distance += distDelta;
    this.score += Math.round(12 * deltaSec * (this.powerups.multiplier ? 2 : 1));

    // Increase speed dynamically as player survives longer
    this.speed = Math.min(this.baseSpeed + this.distance * 0.28, this.maxSpeed);

    // Scroll railway ties
    this.ties.forEach(tie => {
      tie.y += this.speed * deltaSec;
      if (tie.y > this.scale.height + 40) tie.y = -40;
    });

    // Scroll side city walls
    this.sideWalls.forEach(wall => {
      wall.y += this.speed * deltaSec * 0.85;
      if (wall.y > this.scale.height + 60) wall.y = -60;
    });

    // Update Obstacles & Trains
    this.obstacles.getChildren().forEach(obs => {
      obs.setVelocityY(this.speed);
      if (obs.y > this.scale.height + 80) obs.destroy();
    });

    this.trainGroup.getChildren().forEach(train => {
      train.setVelocityY(this.speed * 0.95);
      if (train.y > this.scale.height + 160) train.destroy();
    });

    // Checkpoint arch
    this.checkpointArchGroup.getChildren().forEach(arch => {
      arch.setVelocityY(this.speed);
      if (arch.y > this.scale.height + 100) arch.destroy();
    });

    // Coins & Magnet pull
    this.coinGroup.getChildren().forEach(coin => {
      if (this.powerups.magnet) {
        const dist = Phaser.Math.Distance.Between(coin.x, coin.y, this.player.x, this.player.y);
        if (dist < 260) {
          this.physics.moveToObject(coin, this.player, 550);
          return;
        }
      }
      coin.setVelocityY(this.speed);
      if (coin.y > this.scale.height + 50) coin.destroy();
    });

    // Powerups
    this.powerupGroup.getChildren().forEach(pu => {
      pu.setVelocityY(this.speed);
      if (pu.y > this.scale.height + 50) pu.destroy();
    });

    // Anchor auras to player position
    this.shieldAura.setPosition(this.player.x, this.player.y);
    this.magnetAura.setPosition(this.player.x, this.player.y);

    // Update HUD Text
    this.scoreText.setText(`${this.score} pts`);
    this.distText.setText(`${this.distance} m`);
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

  triggerQuestionCheckpoint() {
    this.isQuestionActive = true;
    this.nextQuestionDistance += Phaser.Math.Between(180, 240);

    // Slow world to slow-motion during question
    this.obstacles.setVelocityY(0);
    this.trainGroup.setVelocityY(0);
    this.coinGroup.setVelocityY(0);
    this.powerupGroup.setVelocityY(0);
    this.checkpointArchGroup.setVelocityY(0);

    const question = this.questions[this.currentQuestionIndex % this.questions.length];
    this.currentQuestionIndex++;

    this.renderQuestionOverlay(question);
  }

  renderQuestionOverlay(question) {
    const { width, height } = this.scale;

    this.qContainer = this.add.container(0, 0).setDepth(200);

    // Backdrop
    const backdrop = this.add.rectangle(width / 2, height / 2, width, height, 0x070913, 0.88);
    this.qContainer.add(backdrop);

    // Question Card Panel
    const panelWidth = Math.min(width * 0.94, 430);
    const panelHeight = Math.min(height * 0.76, 510);
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
        this.timeAttackRemaining += 6; // Extra time on correct!
      }

      this.cameras.main.flash(200, 56, 176, 0);

      this.time.delayedCall(1200, () => this.resumeRunning());
    } else {
      sounds.playWrong();
      if (clickedBg) clickedBg.setFillStyle(0xd90429);

      // Highlight correct option
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

    this.obstacles.setVelocityY(0);
    this.trainGroup.setVelocityY(0);
    this.coinGroup.setVelocityY(0);
    this.powerupGroup.setVelocityY(0);

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

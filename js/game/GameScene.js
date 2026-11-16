/**
 * GameScene.js — Main Endless Runner Gameplay for STUDY DASH.
 * Features 3-lane Subway Surfers-style movement (Jump, Slide, Lane Change),
 * obstacles, coins, power-ups, smooth parallax backgrounds, and in-game educational question gates!
 */

import TouchControls from './TouchControls.js';
import { GameQuestionService } from '../services/GameQuestionService.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this.gameMode = data?.mode || 'endless';
    this.filter = data?.filter || {};
    this.questions = data?.questions || [];
    this.currentQuestionIndex = 0;

    // Player state
    this.currentLane = 1; // 0: Left, 1: Center, 2: Right
    this.laneX = [0, 0, 0];
    this.playerBaseY = 0;
    this.isJumping = false;
    this.isSliding = false;
    this.isInvincible = false;
    this.lives = 3;

    // Progression
    this.score = 0;
    this.coins = 0;
    this.distance = 0;
    this.streak = 0;
    this.speed = 360; // Pixels per second
    this.baseSpeed = 360;
    this.maxSpeed = 700;

    // Active power-ups
    this.powerups = {
      shield: false,
      magnet: false,
      multiplier: false
    };

    // Game flags
    this.isQuestionActive = false;
    this.isGameOver = false;
    this.nextQuestionDistance = 150; // First question after 150m, then every 200m
  }

  async create() {
    const { width, height } = this.scale;

    // Define lane positions
    this.laneWidth = Math.min(width * 0.28, 120);
    const centerX = width / 2;
    this.laneX = [
      centerX - this.laneWidth,
      centerX,
      centerX + this.laneWidth
    ];
    this.playerBaseY = height - 120;

    // 1. Scrolling Backgrounds & Environment
    this.createEnvironment(width, height);

    // 2. Physics Groups
    this.obstacles = this.physics.add.group();
    this.coinGroup = this.physics.add.group();
    this.powerupGroup = this.physics.add.group();

    // 3. Player Sprite & Shadow
    this.playerShadow = this.add.ellipse(this.laneX[1], this.playerBaseY + 24, 32, 10, 0x000000, 0.3);

    this.player = this.physics.add.sprite(this.laneX[1], this.playerBaseY, 'player_run');
    this.player.setCollideWorldBounds(false);
    this.player.body.setSize(26, 46);
    this.player.body.setOffset(5, 5);

    // Shield Aura (initially invisible)
    this.shieldAura = this.add.circle(this.player.x, this.player.y, 30, 0x00b4d8, 0.35);
    this.shieldAura.setStrokeStyle(2, 0x90e0ef);
    this.shieldAura.setVisible(false);

    // 4. Input Controls
    this.touchControls = new TouchControls(this);
    this.setupInputHandlers();

    // 5. Collisions & Overlaps
    this.physics.add.overlap(this.player, this.coinGroup, this.collectCoin, null, this);
    this.physics.add.overlap(this.player, this.powerupGroup, this.collectPowerup, null, this);
    this.physics.add.overlap(this.player, this.obstacles, this.hitObstacle, null, this);

    // 6. HUD Elements (In-Game Overlay)
    this.createHUD(width, height);

    // 7. Spawning Timers
    this.obstacleTimer = this.time.addEvent({
      delay: 1500,
      callback: this.spawnObstacleRow,
      callbackScope: this,
      loop: true
    });

    this.coinTimer = this.time.addEvent({
      delay: 1200,
      callback: this.spawnCoins,
      callbackScope: this,
      loop: true
    });

    this.powerupTimer = this.time.addEvent({
      delay: 14000,
      callback: this.spawnPowerup,
      callbackScope: this,
      loop: true
    });

    // 8. Load questions if not provided
    if (this.questions.length === 0) {
      this.questions = await GameQuestionService.getQuestionsForGame(this.gameMode, this.filter);
    }
  }

  createEnvironment(width, height) {
    // Background sky gradient
    this.bg = this.add.rectangle(width / 2, height / 2, width, height, 0x141428);

    // Track Surface
    const trackWidth = this.laneWidth * 3.2;
    this.track = this.add.rectangle(width / 2, height / 2, trackWidth, height, 0x1e1e38);
    this.track.setStrokeStyle(3, 0x3f3d56);

    // Scrolling Lane Dividers
    this.laneDividers = [];
    const divLeftX = width / 2 - this.laneWidth / 2;
    const divRightX = width / 2 + this.laneWidth / 2;

    for (let y = -40; y < height + 80; y += 60) {
      const d1 = this.add.rectangle(divLeftX, y, 4, 30, 0xffffff, 0.25);
      const d2 = this.add.rectangle(divRightX, y, 4, 30, 0xffffff, 0.25);
      this.laneDividers.push(d1, d2);
    }
  }

  createHUD(width, height) {
    this.hudContainer = this.add.container(0, 0).setDepth(100);

    // Top banner backdrop
    const banner = this.add.rectangle(width / 2, 35, width, 70, 0x0f0f1e, 0.75);
    this.hudContainer.add(banner);

    // Score Text
    this.scoreText = this.add.text(20, 24, '0 pts', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#ffffff'
    });
    this.hudContainer.add(this.scoreText);

    // Distance Text
    this.distText = this.add.text(width / 2, 24, '0 m', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '18px',
      fontWeight: '600',
      color: '#00f5d4'
    }).setOrigin(0.5, 0);
    this.hudContainer.add(this.distText);

    // Coins Text
    this.coinsText = this.add.text(width - 90, 24, '🪙 0', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#ffd166'
    });
    this.hudContainer.add(this.coinsText);

    // Hearts / Lives
    this.heartsText = this.add.text(width - 20, 24, '❤️❤️❤️', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px'
    }).setOrigin(1, 0);
    this.hudContainer.add(this.heartsText);

    // Streak Banner
    this.streakBanner = this.add.text(width / 2, 60, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      fontWeight: 'bold',
      color: '#ffbe0b'
    }).setOrigin(0.5, 0);
    this.hudContainer.add(this.streakBanner);
  }

  setupInputHandlers() {
    // Touch Swipe Events
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

    // Smooth lane transition
    this.tweens.add({
      targets: [this.player, this.playerShadow, this.shieldAura],
      x: targetX,
      duration: 160,
      ease: 'Cubic.easeOut'
    });
  }

  jump() {
    if (this.isGameOver || this.isQuestionActive || this.isJumping) return;
    this.isJumping = true;
    this.player.setTexture('player_jump');

    // Arc jump tween
    this.tweens.add({
      targets: this.player,
      y: this.playerBaseY - 90,
      duration: 280,
      ease: 'Sine.easeOut',
      yoyo: true,
      onComplete: () => {
        this.isJumping = false;
        if (!this.isSliding) {
          this.player.setTexture('player_run');
        }
        this.player.y = this.playerBaseY;
      }
    });

    // Squash shadow during jump
    this.tweens.add({
      targets: this.playerShadow,
      scaleX: 0.6,
      scaleY: 0.6,
      alpha: 0.15,
      duration: 280,
      yoyo: true
    });
  }

  slide() {
    if (this.isGameOver || this.isQuestionActive || this.isSliding) return;
    this.isSliding = true;
    this.player.setTexture('player_slide');
    this.player.body.setSize(48, 22);
    this.player.body.setOffset(2, 6);
    this.player.y = this.playerBaseY + 12;

    this.time.delayedCall(650, () => {
      this.isSliding = false;
      if (!this.isJumping) {
        this.player.setTexture('player_run');
        this.player.body.setSize(26, 46);
        this.player.body.setOffset(5, 5);
        this.player.y = this.playerBaseY;
      }
    });
  }

  spawnObstacleRow() {
    if (this.isGameOver || this.isQuestionActive) return;

    const laneIndex = Phaser.Math.Between(0, 2);
    const x = this.laneX[laneIndex];

    // 0: High barrier, 1: Low barrier, 2: Cone
    const type = Phaser.Math.Between(0, 2);
    let key = 'obs_barrier';
    let obsType = 'barrier';

    if (type === 1) {
      key = 'obs_low_barrier';
      obsType = 'low';
    } else if (type === 2) {
      key = 'obs_cone';
      obsType = 'cone';
    }

    const obs = this.obstacles.create(x, -50, key);
    obs.obsType = obsType;
    obs.setVelocityY(this.speed);
    obs.setImmovable(true);
    obs.body.setSize(obs.width * 0.85, obs.height * 0.75);
  }

  spawnCoins() {
    if (this.isGameOver || this.isQuestionActive) return;

    const laneIndex = Phaser.Math.Between(0, 2);
    const x = this.laneX[laneIndex];
    const count = Phaser.Math.Between(2, 4);

    for (let i = 0; i < count; i++) {
      const coin = this.coinGroup.create(x, -40 - (i * 35), 'coin');
      coin.setVelocityY(this.speed);
      coin.body.setCircle(12);
    }
  }

  spawnPowerup() {
    if (this.isGameOver || this.isQuestionActive) return;

    const laneIndex = Phaser.Math.Between(0, 2);
    const x = this.laneX[laneIndex];
    const powerups = ['pw_shield', 'pw_magnet', 'pw_multiplier'];
    const chosen = Phaser.Utils.Array.GetRandom(powerups);

    const pu = this.powerupGroup.create(x, -50, chosen);
    pu.powerupType = chosen;
    pu.setVelocityY(this.speed);
    pu.body.setCircle(14);
  }

  collectCoin(player, coin) {
    coin.destroy();
    const multiplier = this.powerups.multiplier ? 2 : 1;
    this.coins += 1 * multiplier;
    this.score += 15 * multiplier;

    // Small pop text animation
    const pop = this.add.text(player.x, player.y - 20, `+${1 * multiplier}`, {
      fontFamily: 'system-ui',
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#ffd166'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: pop,
      y: pop.y - 30,
      alpha: 0,
      duration: 500,
      onComplete: () => pop.destroy()
    });
  }

  collectPowerup(player, pu) {
    const type = pu.powerupType;
    pu.destroy();

    if (type === 'pw_shield') {
      this.powerups.shield = true;
      this.shieldAura.setVisible(true);
      this.time.delayedCall(12000, () => {
        this.powerups.shield = false;
        this.shieldAura.setVisible(false);
      });
    } else if (type === 'pw_magnet') {
      this.powerups.magnet = true;
      this.time.delayedCall(10000, () => {
        this.powerups.magnet = false;
      });
    } else if (type === 'pw_multiplier') {
      this.powerups.multiplier = true;
      this.time.delayedCall(10000, () => {
        this.powerups.multiplier = false;
      });
    }

    this.cameras.main.flash(200, 100, 200, 255);
  }

  hitObstacle(player, obs) {
    if (this.isInvincible || this.isGameOver) return;

    // Check dodge conditions
    if (obs.obsType === 'barrier' && this.isJumping) return;
    if (obs.obsType === 'low' && this.isSliding) return;

    // Shield protection
    if (this.powerups.shield) {
      this.powerups.shield = false;
      this.shieldAura.setVisible(false);
      obs.destroy();
      this.cameras.main.flash(250, 0, 180, 255);
      return;
    }

    // Normal damage
    obs.destroy();
    this.lives--;
    this.cameras.main.shake(200, 0.015);
    this.cameras.main.flash(200, 255, 0, 0);

    if (this.lives <= 0) {
      this.triggerGameOver();
      return;
    }

    // Brief invincibility after hit
    this.isInvincible = true;
    this.tweens.add({
      targets: this.player,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 6,
      onComplete: () => {
        this.player.alpha = 1;
        this.isInvincible = false;
      }
    });
  }

  update(time, delta) {
    if (this.isGameOver || this.isQuestionActive) return;

    const deltaSec = delta / 1000;

    // Update distance & score
    this.distance += Math.round(this.speed * deltaSec * 0.1);
    this.score += Math.round(10 * deltaSec * (this.powerups.multiplier ? 2 : 1));

    // Increase speed slightly over time
    this.speed = Math.min(this.baseSpeed + this.distance * 0.35, this.maxSpeed);

    // Scroll Lane Dividers
    this.laneDividers.forEach(d => {
      d.y += this.speed * deltaSec;
      if (d.y > this.scale.height + 40) {
        d.y = -40;
      }
    });

    // Update Obstacles speed & cleanup
    this.obstacles.getChildren().forEach(obs => {
      obs.setVelocityY(this.speed);
      if (obs.y > this.scale.height + 60) obs.destroy();
    });

    // Update Coins speed & Magnet pull
    this.coinGroup.getChildren().forEach(coin => {
      if (this.powerups.magnet) {
        const dist = Phaser.Math.Distance.Between(coin.x, coin.y, this.player.x, this.player.y);
        if (dist < 220) {
          this.physics.moveToObject(coin, this.player, 450);
          return;
        }
      }
      coin.setVelocityY(this.speed);
      if (coin.y > this.scale.height + 40) coin.destroy();
    });

    // Update Power-ups
    this.powerupGroup.getChildren().forEach(pu => {
      pu.setVelocityY(this.speed);
      if (pu.y > this.scale.height + 40) pu.destroy();
    });

    // Keep aura anchored to player
    this.shieldAura.setPosition(this.player.x, this.player.y);

    // Update HUD
    this.scoreText.setText(`${this.score} pts`);
    this.distText.setText(`${this.distance} m`);
    this.coinsText.setText(`🪙 ${this.coins}`);
    this.heartsText.setText('❤️'.repeat(Math.max(0, this.lives)));

    if (this.streak >= 3) {
      this.streakBanner.setText(`🔥 ${this.streak} Question Streak!`);
    } else {
      this.streakBanner.setText('');
    }

    // Check Question Trigger
    if (this.distance >= this.nextQuestionDistance && this.questions.length > 0) {
      this.triggerQuestionEvent();
    }
  }

  triggerQuestionEvent() {
    this.isQuestionActive = true;
    this.nextQuestionDistance += Phaser.Math.Between(180, 240);

    // Stop obstacles and motion during question
    this.obstacles.setVelocityY(0);
    this.coinGroup.setVelocityY(0);
    this.powerupGroup.setVelocityY(0);

    const question = this.questions[this.currentQuestionIndex % this.questions.length];
    this.currentQuestionIndex++;

    this.renderQuestionOverlay(question);
  }

  renderQuestionOverlay(question) {
    const { width, height } = this.scale;

    this.qContainer = this.add.container(0, 0).setDepth(200);

    // Backdrop overlay
    const backdrop = this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a14, 0.85);
    this.qContainer.add(backdrop);

    // Card panel
    const panelWidth = Math.min(width * 0.92, 420);
    const panelHeight = Math.min(height * 0.72, 480);
    const panel = this.add.rectangle(width / 2, height / 2, panelWidth, panelHeight, 0x1f1f38)
      .setStrokeStyle(3, 0x4361ee);
    this.qContainer.add(panel);

    // Header badge
    const badgeText = this.add.text(width / 2, height / 2 - panelHeight / 2 + 30, `📚 STUDY CHALLENGE`, {
      fontFamily: 'system-ui',
      fontSize: '15px',
      fontWeight: 'bold',
      color: '#4cc9f0'
    }).setOrigin(0.5);
    this.qContainer.add(badgeText);

    // Question Text
    const qText = this.add.text(width / 2, height / 2 - panelHeight / 2 + 75, question.text, {
      fontFamily: 'system-ui',
      fontSize: '16px',
      fontWeight: '600',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: panelWidth - 40 }
    }).setOrigin(0.5, 0);
    this.qContainer.add(qText);

    // Timer display (15s countdown)
    let timeLeft = 15;
    const timerText = this.add.text(width / 2 + panelWidth / 2 - 40, height / 2 - panelHeight / 2 + 30, `⏱️ ${timeLeft}s`, {
      fontFamily: 'system-ui',
      fontSize: '13px',
      color: '#ffbe0b'
    }).setOrigin(0.5);
    this.qContainer.add(timerText);

    const countdownTimer = this.time.addEvent({
      delay: 1000,
      repeat: 14,
      callback: () => {
        timeLeft--;
        timerText.setText(`⏱️ ${timeLeft}s`);
        if (timeLeft <= 0) {
          this.handleQuestionAnswer(question, false, null, explanationText, feedbackBanner);
        }
      }
    });

    // Choices buttons
    const choiceButtons = [];
    const startY = height / 2 - panelHeight / 2 + 165;
    const btnHeight = 44;
    const btnSpacing = 12;

    const feedbackBanner = this.add.text(width / 2, height / 2 + panelHeight / 2 - 80, '', {
      fontFamily: 'system-ui',
      fontSize: '15px',
      fontWeight: 'bold',
      align: 'center'
    }).setOrigin(0.5);
    this.qContainer.add(feedbackBanner);

    const explanationText = this.add.text(width / 2, height / 2 + panelHeight / 2 - 45, '', {
      fontFamily: 'system-ui',
      fontSize: '12px',
      color: '#ced4da',
      align: 'center',
      wordWrap: { width: panelWidth - 40 }
    }).setOrigin(0.5);
    this.qContainer.add(explanationText);

    question.choices.forEach((choice, idx) => {
      const btnY = startY + idx * (btnHeight + btnSpacing);
      const btnBg = this.add.rectangle(width / 2, btnY, panelWidth - 40, btnHeight, 0x2b2b4c)
        .setStrokeStyle(1.5, 0x484875)
        .setInteractive({ useHandCursor: true });

      const label = this.add.text(width / 2, btnY, choice.text, {
        fontFamily: 'system-ui',
        fontSize: '14px',
        fontWeight: '500',
        color: '#ffffff',
        wordWrap: { width: panelWidth - 60 },
        align: 'center'
      }).setOrigin(0.5);

      btnBg.on('pointerdown', () => {
        countdownTimer.remove();
        choiceButtons.forEach(b => b.bg.disableInteractive());
        this.handleQuestionAnswer(question, choice.isCorrect, btnBg, explanationText, feedbackBanner, choiceButtons);
      });

      choiceButtons.push({ bg: btnBg, label, isCorrect: choice.isCorrect });
      this.qContainer.add([btnBg, label]);
    });
  }

  handleQuestionAnswer(question, isCorrect, clickedBtn, explanationText, feedbackBanner, choiceButtons = []) {
    GameQuestionService.recordAnswer(question.id, isCorrect, 'endless');

    if (isCorrect) {
      if (clickedBtn) clickedBtn.setFillStyle(0x38b000);
      feedbackBanner.setText('✅ Correct! +50 pts +3 coins').setColor('#38b000');
      this.score += 50;
      this.coins += 3;
      this.streak++;
      this.cameras.main.flash(200, 56, 176, 0);

      this.time.delayedCall(1200, () => this.resumeRunningAfterQuestion());
    } else {
      if (clickedBtn) clickedBtn.setFillStyle(0xd90429);
      // Highlight correct choice
      choiceButtons.forEach(b => {
        if (b.isCorrect) b.bg.setFillStyle(0x38b000);
      });

      feedbackBanner.setText('❌ Incorrect').setColor('#d90429');
      explanationText.setText(`Explanation: ${question.explanation}`);
      this.streak = 0;
      this.cameras.main.flash(200, 217, 4, 41);

      // Keep explanation readable for 3 seconds
      this.time.delayedCall(3000, () => this.resumeRunningAfterQuestion());
    }
  }

  resumeRunningAfterQuestion() {
    if (this.qContainer) {
      this.qContainer.destroy();
      this.qContainer = null;
    }
    this.isQuestionActive = false;
  }

  triggerGameOver() {
    this.isGameOver = true;
    this.obstacles.setVelocityY(0);
    this.coinGroup.setVelocityY(0);
    this.powerupGroup.setVelocityY(0);

    // Save score to IndexedDB
    GameQuestionService.recordGameSession?.({
      score: this.score,
      coins: this.coins,
      distance: this.distance,
      date: new Date().toISOString()
    });

    this.scene.start('GameOverScene', {
      score: this.score,
      coins: this.coins,
      distance: this.distance,
      streak: this.streak
    });
  }
}


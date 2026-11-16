/**
 * TouchControls.js
 * Reusable touch/swipe + keyboard input handler for STUDY DASH.
 * Emits events on the scene's event emitter:
 *   swipeLeft, swipeRight, swipeUp, swipeDown, tap
 */
export default class TouchControls {
  /**
   * @param {Phaser.Scene} scene - The scene to attach input listeners to.
   */
  constructor(scene) {
    this._scene = scene;
    this._startX = 0;
    this._startY = 0;
    this._startTime = 0;
    this._threshold = 30;   // minimum px distance for swipe
    this._timeLimit = 300;  // maximum ms duration for swipe

    // --- Pointer events ---
    scene.input.on('pointerdown', (pointer) => {
      this._startX = pointer.x;
      this._startY = pointer.y;
      this._startTime = Date.now();
    });

    scene.input.on('pointerup', (pointer) => {
      const dx = pointer.x - this._startX;
      const dy = pointer.y - this._startY;
      const dt = Date.now() - this._startTime;

      if (dt > this._timeLimit) {
        scene.events.emit('tap');
        return;
      }

      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (absX > absY && absX > this._threshold) {
        if (dx < 0) {
          scene.events.emit('swipeLeft');
        } else {
          scene.events.emit('swipeRight');
        }
      } else if (absY > this._threshold) {
        if (dy < 0) {
          scene.events.emit('swipeUp');
        } else {
          scene.events.emit('swipeDown');
        }
      } else {
        scene.events.emit('tap');
      }
    });

    // --- Keyboard fallback ---
    if (scene.input.keyboard) {
      this._keys = scene.input.keyboard.addKeys({
        left:  Phaser.Input.Keyboard.KeyCodes.LEFT,
        right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
        up:    Phaser.Input.Keyboard.KeyCodes.UP,
        down:  Phaser.Input.Keyboard.KeyCodes.DOWN,
        a:     Phaser.Input.Keyboard.KeyCodes.A,
        d:     Phaser.Input.Keyboard.KeyCodes.D,
        w:     Phaser.Input.Keyboard.KeyCodes.W,
        s:     Phaser.Input.Keyboard.KeyCodes.S,
        space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      });
    } else {
      this._keys = null;
    }

    // Track previous key state to detect "just pressed"
    this._keyPrev = {};
  }

  /**
   * Call every frame from the scene's update() to process keyboard input.
   */
  update() {
    if (!this._keys) return;

    const k = this._keys;
    const scene = this._scene;

    const justPressed = (key) => {
      if (!key) return false;
      const wasDown = this._keyPrev[key.keyCode] || false;
      const isDown  = key.isDown;
      this._keyPrev[key.keyCode] = isDown;
      return isDown && !wasDown;
    };

    if (justPressed(k.left)  || justPressed(k.a)) scene.events.emit('swipeLeft');
    if (justPressed(k.right) || justPressed(k.d)) scene.events.emit('swipeRight');
    if (justPressed(k.up)    || justPressed(k.w) || justPressed(k.space)) scene.events.emit('swipeUp');
    if (justPressed(k.down)  || justPressed(k.s)) scene.events.emit('swipeDown');

    // Store remaining keys
    [k.left, k.right, k.up, k.down, k.a, k.d, k.w, k.s, k.space].forEach(key => {
      if (key) this._keyPrev[key.keyCode] = key.isDown;
    });
  }

  /**
   * Remove all listeners created by this instance.
   */
  destroy() {
    this._scene.input.off('pointerdown');
    this._scene.input.off('pointerup');
    this._keys = null;
  }
}

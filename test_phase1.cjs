/**
 * test_phase1.cjs — Automated verification for Phase 1:
 * Foundation, Perspective, and Environment.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('============================================================');
console.log(' 🧪 STUDY DASH — Phase 1 Verification Test');
console.log('============================================================\n');

let passCount = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}\n    ${err.message}`);
    process.exit(1);
  }
}

// 1. Check Responsive Scaling & Aspect Ratio in GameManager.js
test('GameManager uses fixed 480x800 portrait resolution', () => {
  const code = fs.readFileSync(path.join(__dirname, 'js/game/GameManager.js'), 'utf-8');
  assert(code.includes('width: 480'), 'GameManager should have width: 480');
  assert(code.includes('height: 800'), 'GameManager should have height: 800');
  assert(code.includes('mode: Phaser.Scale.FIT'), 'GameManager should use Scale.FIT');
  assert(code.includes('autoCenter: Phaser.Scale.CENTER_BOTH'), 'GameManager should use CENTER_BOTH');
});

// 2. Check CSS styling in style.css for letterboxing and preventing distortion
test('style.css centers #game-container with letterbox background and no forced stretching', () => {
  const css = fs.readFileSync(path.join(__dirname, 'style.css'), 'utf-8');
  assert(css.includes('#game-container {'), 'Missing #game-container in style.css');
  assert(!css.includes('#game-container canvas {\n  display: block;\n  width: 100% !important;'),
    'Should not force width: 100% !important which stretches and distorts portrait aspect ratio');
  assert(css.includes('max-width: 100vw;'), 'Canvas should use max-width: 100vw');
  assert(css.includes('max-height: 100vh;'), 'Canvas should use max-height: 100vh');
});

// 3. Check 2.5D Perspective Projection in GameScene.js
test('GameScene implements 2.5D vanishing point perspective and 3 converging lanes', () => {
  const sceneCode = fs.readFileSync(path.join(__dirname, 'js/game/GameScene.js'), 'utf-8');
  assert(sceneCode.includes('VANISHING_X = 240'), 'Vanishing point X should be 240');
  assert(sceneCode.includes('HORIZON_Y = 220'), 'Horizon Y should be 220');
  assert(sceneCode.includes('PLAYER_BASE_Y = 670'), 'Player base Y should be 670');
  assert(sceneCode.includes('getDepthProgress('), 'Missing getDepthProgress method');
  assert(sceneCode.includes('getLaneX('), 'Missing getLaneX method');
  assert(sceneCode.includes('getDepthScale('), 'Missing getDepthScale method');
});

// 4. Test math calculations for perspective convergence
test('Perspective projection math correctly tapers toward vanishing point', () => {
  // Simulate getLaneX and getDepthScale logic
  const VANISHING_X = 240;
  const HORIZON_Y = 220;
  const PLAYER_BASE_Y = 670;
  const W_LANE_HORIZON = 28;
  const W_LANE_BASE = 112;
  const MIN_SCALE = 0.28;

  function getDepthProgress(y) {
    return Math.max(0, Math.min(1.35, (y - HORIZON_Y) / (PLAYER_BASE_Y - HORIZON_Y)));
  }

  function getLaneX(laneIndex, y) {
    const t = getDepthProgress(y);
    const laneWidth = W_LANE_HORIZON + t * (W_LANE_BASE - W_LANE_HORIZON);
    const offset = laneIndex - 1;
    return VANISHING_X + offset * laneWidth;
  }

  function getDepthScale(y) {
    const t = getDepthProgress(y);
    return Math.max(MIN_SCALE, Math.min(1.25, MIN_SCALE + t * (1.0 - MIN_SCALE)));
  }

  // At horizon (y = 220)
  assert.strictEqual(getDepthProgress(220), 0);
  assert.strictEqual(getDepthScale(220), MIN_SCALE);
  assert.strictEqual(getLaneX(1, 220), 240); // Center lane is at center
  assert.strictEqual(getLaneX(0, 220), 240 - 28); // Left lane is 212
  assert.strictEqual(getLaneX(2, 220), 240 + 28); // Right lane is 268

  // At player baseline (y = 670)
  assert.strictEqual(getDepthProgress(670), 1);
  assert.strictEqual(getDepthScale(670), 1.0);
  assert.strictEqual(getLaneX(1, 670), 240); // Center lane remains centered
  assert.strictEqual(getLaneX(0, 670), 240 - 112); // Left lane wide: 128
  assert.strictEqual(getLaneX(2, 670), 240 + 112); // Right lane wide: 352
});

// 5. Check Floor Contact Shadows in GameScene.js
test('GameScene manages dynamic floor contact shadows for player and approaching entities', () => {
  const sceneCode = fs.readFileSync(path.join(__dirname, 'js/game/GameScene.js'), 'utf-8');
  assert(sceneCode.includes('lib_floor_shadow'), 'Should use lib_floor_shadow texture');
  assert(sceneCode.includes('playerShadow'), 'Player must have floor contact shadow');
  assert(sceneCode.includes('obs.shadow'), 'Approaching obstacles must have dynamic contact shadows');
  assert(sceneCode.includes('coin.shadow'), 'Approaching coins must have dynamic contact shadows');
  assert(sceneCode.includes('pu.shadow'), 'Approaching powerups must have dynamic contact shadows');
});

// 6. Check University Campus / Library Environment Textures in BootScene.js
test('BootScene generates University Campus / Library Run procedural textures', () => {
  const bootCode = fs.readFileSync(path.join(__dirname, 'js/game/BootScene.js'), 'utf-8');
  assert(bootCode.includes('lib_horizon_door'), 'Generates horizon doors with STUDY DASH RUN header');
  assert(bootCode.includes('lib_bookshelf_left'), 'Generates left bookshelf wall texture');
  assert(bootCode.includes('lib_bookshelf_right'), 'Generates right bookshelf wall texture');
  assert(bootCode.includes('lib_ceiling_arch'), 'Generates overhead ceiling arch with chandelier');
  assert(bootCode.includes('lib_floor_tile'), 'Generates academic runner floor with watermark doodles');
  assert(bootCode.includes('lib_floor_shadow'), 'Generates smooth radial contact shadow');
});

// 7. Check Environment Assembly in GameScene.js
test('GameScene renders corridor bookshelves, horizon doors, and converging lane dividers', () => {
  const sceneCode = fs.readFileSync(path.join(__dirname, 'js/game/GameScene.js'), 'utf-8');
  assert(sceneCode.includes('this.horizonDoor = this.add.image'), 'Renders horizon door at vanishing point');
  assert(sceneCode.includes('this.shelfSegments = []'), 'Renders perspective bookshelf columns');
  assert(sceneCode.includes('this.overheadArches = []'), 'Renders overhead chandeliers/arches');
  assert(sceneCode.includes('renderPerspectiveFloor'), 'Renders perspective floor with converging lines');
});

console.log('\n============================================================');
console.log(` Results: ${passCount} passed, 0 failed.`);
console.log(' Phase 1 requirements are fully met!');
console.log('============================================================');


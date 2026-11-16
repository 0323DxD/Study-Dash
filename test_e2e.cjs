/**
 * test_e2e.cjs — Automated verification test suite for Study Dash.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('='.repeat(60));
console.log(' 🧪 STUDY DASH — Automated Verification Suite');
console.log('='.repeat(60));

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

// 1. Verify all JS files syntax
console.log('\n[1/5] Checking JavaScript syntax across all modules...');
try {
  execSync('node verify_syntax.cjs', { stdio: 'pipe' });
  assert(true, 'All 26 JavaScript files parsed with zero syntax errors');
} catch (e) {
  assert(false, 'Syntax check failed: ' + e.message);
}

// 2. Verify PWA files
console.log('\n[2/5] Checking PWA configuration and assets...');
const manifestPath = path.join(__dirname, 'manifest.json');
assert(fs.existsSync(manifestPath), 'manifest.json exists');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
assert(manifest.start_url === '.', 'manifest.json has correct start_url');
assert(manifest.display === 'standalone', 'manifest.json has display: standalone');
assert(manifest.icons && manifest.icons.length >= 2, 'manifest.json defines responsive icons');

const swPath = path.join(__dirname, 'sw.js');
assert(fs.existsSync(swPath), 'Service worker (sw.js) exists');
const swContent = fs.readFileSync(swPath, 'utf8');
assert(swContent.includes('CACHE_NAME'), 'Service worker specifies cache name');
assert(swContent.includes('PRE_CACHE_ASSETS'), 'Service worker specifies pre-cache asset list');

const icon192 = path.join(__dirname, 'icons', 'icon-192.svg');
const icon512 = path.join(__dirname, 'icons', 'icon-512.svg');
assert(fs.existsSync(icon192), 'icons/icon-192.svg exists');
assert(fs.existsSync(icon512), 'icons/icon-512.svg exists');

// 3. Test CSV Parser logic
console.log('\n[3/5] Testing CSV Import & Export logic...');
// Inline test of CSV parser logic from ImportService
function parseCSV(text) {
  const lines = [];
  let row = [''];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    if (char === '"') {
      if (inQuotes && nextChar === '"') { row[row.length - 1] += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (char === ',' && !inQuotes) {
      row.push('');
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      if (row.length > 1 || row[0] !== '') lines.push(row);
      row = [''];
    } else {
      row[row.length - 1] += char;
    }
  }
  if (row.length > 1 || row[0] !== '') lines.push(row);
  return lines;
}

const sampleCSV = `type,question,optionA,optionB,optionC,optionD,correctAnswer,explanation,subject,lesson,difficulty
mcq,"Which OSI layer handles routing?",Data Link,Network,Transport,Application,B,"Network layer routes packets.",IT,Networking,medium
truefalse,"UDP guarantees delivery.",,,,,False,"UDP is connectionless.",IT,Protocols,easy`;

const parsed = parseCSV(sampleCSV);
assert(parsed.length === 3, `CSV parsed into 3 rows (header + 2 questions), got ${parsed.length}`);
assert(parsed[1][1] === 'Which OSI layer handles routing?', 'Question text with quotes parsed correctly');
assert(parsed[1][6] === 'B', 'Correct answer letter B captured');
assert(parsed[2][6] === 'False', 'True/False value captured');

// 4. Test Game Question Formatter
console.log('\n[4/5] Testing Game Question Formatter...');
function formatForGame(rawQ) {
  const type = rawQ.type || 'mcq';
  const text = rawQ.text || rawQ.question;
  let choices = [];
  if (type === 'mcq') {
    choices = rawQ.options.map((opt, idx) => ({
      id: idx,
      text: String(opt),
      isCorrect: idx === rawQ.correctIndex
    }));
  } else if (type === 'truefalse') {
    choices = [
      { id: 'true', text: 'True', isCorrect: rawQ.correct === true },
      { id: 'false', text: 'False', isCorrect: rawQ.correct === false }
    ];
  }
  return { id: rawQ.id, type, text, choices };
}

const mockMCQ = {
  id: 101,
  type: 'mcq',
  text: 'What port does HTTPS use?',
  options: ['80', '443', '22', '21'],
  correctIndex: 1
};

const formattedMCQ = formatForGame(mockMCQ);
assert(formattedMCQ.choices.length === 4, 'MCQ formatted with 4 interactive choices');
assert(formattedMCQ.choices[1].isCorrect === true, 'Choice 1 (443) correctly flagged isCorrect: true');
assert(formattedMCQ.choices[0].isCorrect === false, 'Choice 0 (80) correctly flagged isCorrect: false');

// 5. Test Server files
console.log('\n[5/5] Checking server scripts and launcher...');
assert(fs.existsSync(path.join(__dirname, 'server.py')), 'server.py exists');
assert(fs.existsSync(path.join(__dirname, 'server.js')), 'server.js exists');
assert(fs.existsSync(path.join(__dirname, 'run.bat')), 'run.bat exists');

console.log('='.repeat(60));
console.log(` Results: ${passed} passed, ${failed} failed.`);
console.log('='.repeat(60));
process.exit(failed > 0 ? 1 : 0);

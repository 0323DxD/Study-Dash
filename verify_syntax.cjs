const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

let errors = 0;
let checked = 0;

function checkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      checkDir(full);
    } else if (full.endsWith('.js')) {
      checked++;
      const rel = path.relative(__dirname, full);
      try {
        execSync(`node --check "${full}"`, { stdio: 'pipe' });
        console.log('✓ Valid syntax:', rel);
      } catch (e) {
        console.error('✗ SYNTAX ERROR in ' + rel + ':', e.stderr ? e.stderr.toString() : e.message);
        errors++;
      }
    }
  }
}

checkDir(path.join(__dirname, 'js'));
console.log(`\nChecked ${checked} files, ${errors} syntax errors.`);
process.exit(errors > 0 ? 1 : 0);

const { execSync } = require('node:child_process');
const assert = require('node:assert/strict');
const manifest = JSON.parse(execSync('npm pack --dry-run --json', { encoding: 'utf8' }))[0];
const paths = manifest.files.map(file => file.path);
for (const required of ['package.json', 'README.md', 'bin/adbwifiqr.js', 'src/cli.js', 'src/adb.js', 'src/ui.js']) {
  assert.ok(paths.includes(required), `Package is missing ${required}`);
}
assert.equal(paths.length, 6, 'Unexpected package contents. Review for private keys, fixtures, or caches.');
console.log('Package contains only the six intended application files.');

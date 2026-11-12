const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { wrap } = require('../src/ui');
test('panel wrapping respects narrow terminal widths without dropping text', () => {
  const message = 'A connection port is required before opening an Android shell.';
  const lines = wrap(message, 24);
  assert.ok(lines.every(line => line.length <= 24));
  assert.equal(lines.join(' '), message);
  assert.equal(wrap('x'.repeat(100), 24).join(''), 'x'.repeat(100));
});
test('version output is suitable for scripts and contains no footer', () => {
  const result = spawnSync(process.execPath, [path.resolve(__dirname, '../bin/adbwifiqr.js'), '--version'], { encoding: 'utf8' });
  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), require('../package.json').version);
  assert.equal(result.stderr, '');
});

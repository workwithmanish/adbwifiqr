const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { setupShell } = require('../src/setup-shell');

function sandbox(run) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'adbwifiqr-shell-'));
  try { run(home, path.join(home, '.local', 'bin')); }
  finally { fs.rmSync(home, { recursive: true, force: true }); }
}
test('Bash preserves existing configuration and configures interactive and login shells once', () => sandbox((home, bin) => {
  fs.writeFileSync(path.join(home, '.bashrc'), '# existing settings\n');
  fs.writeFileSync(path.join(home, '.bash_profile'), '# existing login\n');
  const options = { home, bin, shell: '/bin/bash' };
  setupShell(options);
  const first = fs.readFileSync(path.join(home, '.bashrc'), 'utf8');
  setupShell(options);
  assert.equal(fs.readFileSync(path.join(home, '.bashrc'), 'utf8'), first);
  assert.ok(first.startsWith('# existing settings\n'));
  assert.equal(fs.readFileSync(path.join(home, '.bashrc.adbwifiqr.bak'), 'utf8'), '# existing settings\n');
  assert.match(fs.readFileSync(path.join(home, '.bash_profile'), 'utf8'), /adbwifiqr PATH/);
  assert.equal(fs.existsSync(path.join(home, '.profile')), false);
}));
test('Bash uses the existing profile instead of introducing a new login-file precedence', () => sandbox((home, bin) => {
  fs.writeFileSync(path.join(home, '.profile'), '# my profile\n');
  setupShell({ home, bin, shell: 'bash' });
  assert.equal(fs.existsSync(path.join(home, '.bash_profile')), false);
  assert.ok(fs.readFileSync(path.join(home, '.profile'), 'utf8').startsWith('# my profile\n'));
}));
test('Zsh respects ZDOTDIR and configures both startup modes', () => sandbox((home, bin) => {
  const zdotdir = path.join(home, 'zsh-settings');
  setupShell({ home, bin, shell: '/usr/bin/zsh', zdotdir });
  assert.match(fs.readFileSync(path.join(zdotdir, '.zshrc'), 'utf8'), /adbwifiqr PATH/);
  assert.match(fs.readFileSync(path.join(zdotdir, '.zprofile'), 'utf8'), /adbwifiqr PATH/);
  assert.equal(fs.existsSync(path.join(home, '.zshrc')), false);
}));
test('Fish gets Fish syntax rather than Bash export syntax', () => sandbox((home, bin) => {
  setupShell({ home, bin, shell: 'fish' });
  const content = fs.readFileSync(path.join(home, '.config/fish/conf.d/adbwifiqr.fish'), 'utf8');
  assert.match(content, /fish_add_path --prepend/);
  assert.doesNotMatch(content, /export PATH/);
}));
test('updating the configured install path replaces only the managed block', () => sandbox((home, bin) => {
  setupShell({ home, bin, shell: 'zsh' });
  setupShell({ home, bin: path.join(home, 'new bin'), shell: 'zsh' });
  const content = fs.readFileSync(path.join(home, '.zshrc'), 'utf8');
  assert.equal(content.split('# >>> adbwifiqr PATH >>>').length, 2);
  assert.match(content, /new bin/);
  assert.ok(!content.includes(bin));
}));
test('does not overwrite an unrelated command on PATH', { skip: process.platform === 'win32' }, () => sandbox((home, bin) => {
  const directory = path.join(home, 'existing-bin');
  fs.mkdirSync(directory);
  fs.writeFileSync(path.join(directory, 'adbwifiqr'), '# unrelated executable');
  const result = setupShell({ home, bin, shell: 'bash', pathValue: directory });
  assert.equal(result.ready, false);
  assert.equal(fs.readFileSync(path.join(directory, 'adbwifiqr'), 'utf8'), '# unrelated executable');
}));
test('links into a writable existing PATH directory without needing a parent-shell export', { skip: process.platform === 'win32' }, () => sandbox((home, bin) => {
  const directory = path.join(home, 'existing-bin');
  fs.mkdirSync(directory);
  const result = setupShell({ home, bin, shell: 'bash', pathValue: directory });
  assert.equal(result.ready, true);
  assert.equal(fs.readlinkSync(path.join(directory, 'adbwifiqr')), path.join(bin, 'adbwifiqr'));
}));
test('unknown shells fail clearly before changing configuration', () => sandbox((home, bin) => {
  assert.throws(() => setupShell({ home, bin, shell: 'unknown' }), /Supported: bash, zsh, fish/);
  assert.deepEqual(fs.readdirSync(home), []);
}));

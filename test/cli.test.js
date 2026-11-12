const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { mkdtempSync, rmSync } = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

function run(args, scenario = 'normal') {
  const state = mkdtempSync(path.join(os.tmpdir(), 'adbwifiqr-test-'));
  try {
    const result = spawnSync(process.execPath, [
      '--require', path.join(root, 'fixtures', 'adb-preload.cjs'),
      path.join(root, 'bin', 'adbwifiqr.js'), ...args,
    ], {
      cwd: os.tmpdir(), encoding: 'utf8', timeout: 15000,
      env: { ...process.env, ADBWIFIQR_HOME: state, ADB_TEST_CASE: scenario, NO_COLOR: '1' },
    });
    assert.ifError(result.error);
    return { status: result.status, output: result.stdout + result.stderr };
  } finally { rmSync(state, { recursive: true, force: true }); }
}

test('installed entry point shows help outside the checkout without calling ADB', () => {
  const result = run(['--help'], 'must-not-run');
  assert.equal(result.status, 0);
  assert.match(result.output, /adbwifiqr connect IP:PORT/);
  assert.doesNotMatch(result.output, /\x1b\[/);
});
test('version does not require ADB', () => {
  const result = run(['--version'], 'must-not-run');
  assert.equal(result.status, 0);
  assert.ok(result.output.includes(require('../package.json').version));
});
for (const args of [['unknown'], ['connect'], ['connect', '1.2.3.4:80', 'extra'], ['devices', 'extra'], ['connect', '1.2.3.4:0']]) {
  test('rejects invalid invocation: ' + args.join(' '), () => {
    const result = run(args, 'must-not-run');
    assert.equal(result.status, 1);
    assert.doesNotMatch(result.output, /Unexpected ADB call/);
  });
}
for (const [scenario, expected] of [
  ['missing', /Install Android Platform Tools/],
  ['permission', /executable permissions/],
  ['timeout', /20 seconds/],
]) {
  test('actionable ADB error: ' + scenario, () => {
    const result = run(['doctor'], scenario);
    assert.equal(result.status, 1);
    assert.match(result.output, expected);
  });
}
test('failed connection is a failure even when ADB exits zero', () => {
  const result = run(['connect', '192.168.1.4:40123'], 'refused');
  assert.equal(result.status, 1);
  assert.match(result.output, /main Wireless debugging screen/);
  assert.doesNotMatch(result.output, /connected\n/);
});
test('successful connection shows the connected device', () => {
  const result = run(['connect', '192.168.1.4:40123']);
  assert.equal(result.status, 0);
  assert.match(result.output, /Test Phone/);
  assert.match(result.output, /connected/);
});
test('devices handles an empty list clearly', () => {
  const result = run(['devices'], 'empty');
  assert.equal(result.status, 0);
  assert.match(result.output, /No devices connected/);
});
test('code pairing explains that redirected input is unsupported', () => {
  const result = run(['pair']);
  assert.equal(result.status, 1);
  assert.match(result.output, /interactive terminal/);
});
test('broken discovery offers pairing-code fallback', () => {
  const result = run([], 'discovery-failure');
  assert.equal(result.status, 1);
  assert.match(result.output, /adbwifiqr pair to pair without multicast/);
});
test('QR flow discovers its matching service and confirms pairing', () => {
  const result = run([]);
  assert.equal(result.status, 0);
  assert.match(result.output, /Phone discovered/);
  assert.match(result.output, /Pairing complete/);
  assert.match(result.output, /Test Phone/);
});

test('Kali regression: QR pairs using direct discovery when ADB mDNS is empty', () => {
  const result = run([], 'direct-only');
  assert.equal(result.status, 0);
  assert.match(result.output, /Phone discovered/);
  assert.match(result.output, /Pairing complete/);
});

test('Kali regression: pairing is followed by direct discovery of the connection port', () => {
  const result = run([], 'auto-connect');
  assert.equal(result.status, 0);
  assert.match(result.output, /Phone connected/);
  assert.match(result.output, /Test Phone/);
  assert.doesNotMatch(result.output, /active connection is still pending/);
});

test('prints the exact dynamic connection command even if auto-connect is refused', () => {
  const result = run([], 'connect-refused');
  assert.equal(result.status, 0);
  assert.match(result.output, /adb connect 192\.168\.1\.4:50123/);
  assert.doesNotMatch(result.output, /adb connect 192\.168\.1\.4:40124/);
});

test('when the port is hidden, shows the known phone IP and only asks for the port', () => {
  const result = run([], 'port-hidden');
  assert.equal(result.status, 0);
  assert.match(result.output, /adb connect 192\.168\.1\.4:<PORT>/);
  assert.match(result.output, /did not advertise a connection port/);
});

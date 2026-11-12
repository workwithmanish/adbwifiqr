const { test } = require('node:test');
const assert = require('node:assert/strict');
const { services, endpoint, adbEnvironment } = require('../src/adb');

test('reads only pairing and connection mDNS rows', () => {
  assert.deepEqual(services('List of discovered mdns services\nADB_WIFI_test\t_adb-tls-pairing._tcp.\t192.168.1.4:43210\nother _adb-tls-connect._tcp 192.168.1.4:43211\nnoise'), [
    { name: 'ADB_WIFI_test', type: '_adb-tls-pairing._tcp', address: '192.168.1.4:43210' },
    { name: 'other', type: '_adb-tls-connect._tcp', address: '192.168.1.4:43211' },
  ]);
});
test('rejects invalid or executable endpoint text', () => {
  for (const value of ['999.1.1.1:80', '1.2.3.4:0', '1.2.3.4:65536', '1.2.3.4:80 & whoami', 'localhost']) {
    assert.throws(() => endpoint(value));
  }
  assert.equal(endpoint('192.168.1.5:37123'), '192.168.1.5:37123');
});

test('Linux and macOS keep Android settings local without adding Windows home variables', () => {
  for (const platform of ['linux', 'darwin']) {
    const env = adbEnvironment('/home/user/adbwifiqr', { PATH: '/usr/bin' }, platform);
    assert.equal(env.HOME, '/home/user/adbwifiqr');
    assert.equal(env.ANDROID_USER_HOME, '/home/user/adbwifiqr/.android');
    assert.equal(env.ADB_VENDOR_KEYS, '/home/user/adbwifiqr/.android');
    assert.equal(env.PATH, '/usr/bin');
    assert.equal(env.USERPROFILE, undefined);
    assert.equal(env.HOMEDRIVE, undefined);
    assert.equal(env.HOMEPATH, undefined);
  }
});

test('Windows uses a project-local drive, profile, and Android home', () => {
  const env = adbEnvironment('D:\\adbwifiqr', { PATH: 'existing-path' }, 'win32');
  assert.equal(env.HOMEDRIVE, 'D:');
  assert.equal(env.HOMEPATH, '\\adbwifiqr');
  assert.equal(env.USERPROFILE, 'D:\\adbwifiqr');
  assert.equal(env.ANDROID_USER_HOME, 'D:\\adbwifiqr\\.android');
  assert.equal(env.PATH, 'existing-path');
});

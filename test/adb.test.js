const { test } = require('node:test');
const assert = require('node:assert/strict');
const { services, endpoint } = require('../src/adb');

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

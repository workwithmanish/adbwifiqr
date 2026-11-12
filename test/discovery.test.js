const { test } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { createDiscovery, pairingService, findPairing } = require('../src/discovery');
const phone = { name: 'ADB_WIFI_expected', type: 'adb-tls-pairing', protocol: 'tcp',
  port: 40123, addresses: ['192.168.1.8'] };

test('direct discovery validates pairing services and prefers IPv4', () => {
  assert.equal(pairingService({ ...phone, addresses: ['::1', '192.168.1.8'] }).address, '192.168.1.8:40123');
  assert.equal(pairingService({ ...phone, addresses: ['::1'] }).address, '[::1]:40123');
  assert.equal(pairingService({ ...phone, type: 'http' }), null);
  assert.equal(pairingService({ ...phone, port: 0 }), null);
  assert.equal(pairingService({ ...phone, addresses: ['invalid'] }), null);
});
test('Android announcements can use their sender address when no A record is included', () => {
  assert.equal(pairingService({ ...phone, addresses: [], referer: { address: '192.168.1.8' } }).address, '192.168.1.8:40123');
});
test('a matching direct announcement wins even if ADB discovery never responds', async () => {
  let receive, stopped = false, destroyed = false;
  class FakeBonjour {
    find(options, callback) {
      assert.equal(options.type, 'adb-tls-pairing');
      receive = callback;
      return Object.assign(new EventEmitter(), { update() {}, stop() { stopped = true; } });
    }
    destroy() { destroyed = true; }
  }
  const discovery = createDiscovery(FakeBonjour);
  try {
    const result = findPairing(discovery, phone.name, () => new Promise(() => {}));
    receive({ ...phone, name: 'someone-else' });
    receive(phone);
    assert.equal((await result).name, phone.name);
  } finally { discovery.close(); }
  assert.ok(stopped && destroyed);
});
test('direct discovery works when ADB returns empty output', async () => {
  const discovery = { waitFor: async () => pairingService(phone) };
  assert.equal((await findPairing(discovery, phone.name, async () => '')).address, '192.168.1.8:40123');
});
test('ADB discovery still works if direct multicast cannot start', async () => {
  const discovery = { error: new Error('port blocked'), waitFor: async () => null };
  const result = await findPairing(discovery, phone.name,
    async () => `${phone.name} _adb-tls-pairing._tcp 192.168.1.8:40123`);
  assert.equal(result.name, phone.name);
});
test('does not select an unrelated ADB pairing service', async () => {
  assert.equal(await findPairing({ waitFor: async () => null }, phone.name,
    async () => 'someone-else _adb-tls-pairing._tcp 192.168.1.9:40123'), null);
});
test('closing discovery releases pending waits', async () => {
  class FakeBonjour {
    find() { return Object.assign(new EventEmitter(), { stop() {}, update() {} }); }
    destroy() {}
  }
  const discovery = createDiscovery(FakeBonjour);
  const waiting = discovery.waitFor(phone.name, 60000);
  discovery.close();
  assert.equal(await waiting, null);
});

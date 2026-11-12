const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createDiscovery, pairingService, findPairing, connectPairedPhone } = require('../src/discovery');
const phone = { fqdn: 'ADB_WIFI_expected._adb-tls-pairing._tcp.local',
  address: '192.168.1.8', service: { port: 40123 } };
const name = 'ADB_WIFI_expected';

test('accepts the node-dns-sd result shape and validates endpoints', () => {
  assert.equal(pairingService(phone).address, '192.168.1.8:40123');
  assert.equal(pairingService({ ...phone, address: '::1' }).address, '[::1]:40123');
  assert.equal(pairingService({ ...phone, fqdn: 'other._http._tcp.local' }), null);
  assert.equal(pairingService({ ...phone, service: { port: 0 } }), null);
  assert.equal(pairingService({ ...phone, address: 'invalid' }), null);
});
test('accepts trailing DNS root dot without altering the QR instance name', () => {
  assert.equal(pairingService({ ...phone, fqdn: phone.fqdn + '.' }).name, name);
});
test('uses the proven discovery query and returns early only for the matching QR', async () => {
  let called = false;
  const scanner = { async discover(options) {
    called = true;
    assert.equal(options.name, '_adb-tls-pairing._tcp.local');
    assert.equal(options.quick, true);
    assert.equal(options.filter({ ...phone, fqdn: 'someone-else._adb-tls-pairing._tcp.local' }), false);
    assert.equal(options.filter(phone), true);
    return [phone];
  } };
  const discovery = createDiscovery(scanner);
  try {
    const result = await findPairing(discovery, name, () => new Promise(() => {}));
    assert.equal(result.name, name);
    assert.ok(called);
  } finally { discovery.close(); }
});
test('direct discovery works when ADB returns empty output', async () => {
  const discovery = createDiscovery({ discover: async () => [phone] });
  try { assert.equal((await findPairing(discovery, name, async () => '')).address, '192.168.1.8:40123'); }
  finally { discovery.close(); }
});
test('ADB discovery still works if direct multicast cannot start', async () => {
  const discovery = { error: new Error('port blocked'), waitFor: async () => null };
  const result = await findPairing(discovery, name, async () => `${name} _adb-tls-pairing._tcp 192.168.1.8:40123`);
  assert.equal(result.name, name);
});
test('does not select an unrelated ADB pairing service', async () => {
  assert.equal(await findPairing({ waitFor: async () => null }, name,
    async () => 'someone-else _adb-tls-pairing._tcp 192.168.1.9:40123'), null);
});
test('closing discovery releases pending waits', async () => {
  const discovery = createDiscovery({ discover: () => new Promise(() => {}) });
  const waiting = discovery.waitFor(name);
  discovery.close();
  assert.equal(await waiting, null);
});
test('does not run overlapping node-dns-sd scans', async () => {
  let calls = 0, finish;
  const discovery = createDiscovery({ discover: () => { calls++; return new Promise(resolve => { finish = resolve; }); } });
  const first = discovery.waitFor(name);
  const second = discovery.waitFor(name);
  await Promise.resolve();
  finish([phone]);
  assert.equal((await first).name, name);
  assert.equal((await second).name, name);
  assert.equal(calls, 1);
  discovery.close();
});
test('real node-dns-sd parser understands an Android-style DNS response', () => {
  const packet = require('node-dns-sd/lib/dns-sd-parser').parse(require('../fixtures/pairing-packet.cjs')());
  assert.ok(packet);
  packet.address = '192.168.1.8';
  const device = require('node-dns-sd')._createDeviceObject(packet);
  assert.equal(pairingService(device).name, name);
  assert.equal(pairingService(device).address, '192.168.1.8:40123');
});

test('auto-connect uses the connection advertisement, never the pairing port', async () => {
  const calls = [];
  let connected = false;
  const connection = { ...phone, fqdn: 'adb-guid._adb-tls-connect._tcp.local', service: { port: 50123 } };
  const scanner = { discover: async options => {
    assert.equal(options.name, '_adb-tls-connect._tcp.local');
    assert.equal(options.filter({ ...connection, address: '192.168.1.9' }), false);
    assert.equal(options.filter(connection), true);
    return [connection];
  } };
  const result = await connectPairedPhone('192.168.1.8:40123', async args => {
    calls.push(args);
    if (args[0] === 'connect') { connected = true; return 'connected to 192.168.1.8:50123'; }
    return 'List of devices attached\n' + (connected ? '192.168.1.8:50123 device' : '');
  }, scanner);
  assert.equal(result.connected, true);
  assert.deepEqual(calls.find(args => args[0] === 'connect'), ['connect', '192.168.1.8:50123']);
});

test('no connection advertisement preserves paired-but-not-connected status', async () => {
  const result = await connectPairedPhone('192.168.1.8:40123', async args => {
    assert.equal(args[0], 'devices');
    return 'List of devices attached';
  }, { discover: async () => [] });
  assert.equal(result.connected, false);
});

test('an unrelated connected device does not count as the paired phone', async () => {
  const result = await connectPairedPhone('192.168.1.8:40123', async () =>
    'List of devices attached\n192.168.1.99:50123 device', { discover: async () => [] });
  assert.equal(result.connected, false);
});

test('retains the dynamic IP and port when connecting fails', async () => {
  const result = await connectPairedPhone('192.168.1.8:40123', async args => {
    if (args[0] === 'connect') return 'failed to connect: Connection refused';
    return 'List of devices attached';
  }, { discover: async () => [{ ...phone, fqdn: 'adb-guid._adb-tls-connect._tcp.local', service: { port: 45678 } }] });
  assert.equal(result.connected, false);
  assert.equal(result.address, '192.168.1.8:45678');
  assert.match(result.error, /Connection refused/);
});

test('retries discovery when Android publishes the connection port later', async () => {
  let scans = 0;
  const result = await connectPairedPhone('192.168.1.8:40123', async args => args[0] === 'connect'
    ? 'connected to 192.168.1.8:45678' : 'List of devices attached', {
    discover: async () => ++scans < 3 ? [] : [{ ...phone, fqdn: 'adb-guid._adb-tls-connect._tcp.local', service: { port: 45678 } }],
  });
  assert.equal(scans, 3);
  assert.equal(result.address, '192.168.1.8:45678');
});

test('an undiscoverable port stays unknown instead of reusing the pairing port', async () => {
  const result = await connectPairedPhone('192.168.1.8:40123', async () => 'List of devices attached', { discover: async () => [] });
  assert.equal(result.host, '192.168.1.8');
  assert.equal(result.address, undefined);
});

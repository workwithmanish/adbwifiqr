// Optional real local UDP test of node-dns-sd's query and packet handling.
const dgram = require('node:dgram');
const { createDiscovery } = require('../src/discovery');
const packet = require('../fixtures/pairing-packet.cjs')();
// Isolate the smoke test from any ADB/Bonjour listener already using port 5353.
require('node-dns-sd')._UDP_PORT = 15353;
const discovery = createDiscovery();
const sender = dgram.createSocket('udp4');
let timer;
sender.on('error', error => { console.error(error.message); process.exitCode = 1; });
sender.bind(0, '127.0.0.2', async () => {
  timer = setInterval(() => sender.send(packet, 15353, '127.0.0.1'), 100);
  try {
    const found = await discovery.waitFor('ADB_WIFI_expected');
    if (!found) throw new Error('UDP test response was not discovered.');
    console.log('Real UDP discovery passed with node-dns-sd 0.4.2.');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
  finally { clearInterval(timer); sender.close(); discovery.close(); }
});

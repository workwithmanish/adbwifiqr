// Optional real UDP multicast smoke test. Advertises a test service, not a phone.
const { Bonjour } = require('bonjour-service');
const { createDiscovery } = require('../src/discovery');
const name = 'adbwifiqr-self-check-' + process.pid;
const discovery = createDiscovery();
const publisher = new Bonjour({ reuseAddr: true }, error => console.error(error.message));
const service = publisher.publish({ name, type: 'adb-tls-pairing', protocol: 'tcp', port: 40123 });
service.on('error', error => console.error(error.message));
(async () => {
  try {
    const found = await discovery.waitFor(name, 8000);
    if (!found) throw new Error('Local multicast test did not discover its service. Check multicast access.');
    console.log('Real UDP multicast discovery passed (local test advertisement).');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
  finally { discovery.close(); publisher.destroy(); }
})();

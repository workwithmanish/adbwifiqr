const { EventEmitter } = require('node:events');
const { isIP } = require('node:net');
const { Bonjour } = require('bonjour-service');
const { services } = require('./adb');

function pairingService(service) {
  if (service.type !== 'adb-tls-pairing' || service.protocol !== 'tcp' ||
      !Number.isInteger(service.port) || service.port < 1 || service.port > 65535) return null;
  const addresses = [...(service.addresses || []), service.referer?.address].filter(Boolean);
  const host = addresses.find(address => isIP(address) === 4) || addresses.find(address => isIP(address) === 6);
  if (!host || !service.name) return null;
  return { name: service.name, type: '_adb-tls-pairing._tcp',
    address: `${isIP(host) === 6 ? `[${host}]` : host}:${service.port}` };
}

function createDiscovery(BonjourClass = Bonjour) {
  const events = new EventEmitter();
  const cache = new Map();
  let instance, browser, timer, failure, closed = false;
  const fail = error => { failure = error; events.emit('change'); };
  const receive = service => {
    const parsed = pairingService(service);
    if (parsed) { cache.set(parsed.name, parsed); events.emit('change'); }
  };
  try {
    instance = new BonjourClass({ reuseAddr: true }, fail);
    browser = instance.find({ type: 'adb-tls-pairing', protocol: 'tcp' }, receive);
    browser.on('srv-update', receive);
    browser.on('down', service => cache.delete(service.name));
    // Re-query promptly while the Android QR pairing dialog is advertising.
    timer = setInterval(() => {
      try { browser.update(); } catch (error) { fail(error); }
    }, 1000);
    timer.unref();
  } catch (error) { fail(error); }
  const close = () => {
    if (closed) return;
    closed = true;
    clearInterval(timer);
    events.emit('change');
    browser?.stop();
    instance?.destroy();
    process.removeListener('exit', close);
  };
  process.once('exit', close);
  return {
    get error() { return failure; },
    list: () => [...cache.values()],
    waitFor(name, milliseconds = 2000) {
      if (cache.has(name)) return Promise.resolve(cache.get(name));
      if (closed || failure) return Promise.resolve(null);
      return new Promise(resolve => {
        let timeout;
        const finish = value => { clearTimeout(timeout); events.removeListener('change', check); resolve(value); };
        const check = () => {
          if (cache.has(name)) finish(cache.get(name));
          else if (closed || failure) finish(null);
        };
        events.on('change', check);
        timeout = setTimeout(() => finish(null), milliseconds);
        check();
      });
    },
    close,
  };
}

async function findPairing(discovery, name, runAdb) {
  let adbFailure;
  const required = service => {
    if (!service) throw new Error('No matching service yet');
    return service;
  };
  try {
    // A blank or stalled ADB backend must not block a direct mDNS announcement.
    return await Promise.any([
      discovery.waitFor(name).then(required),
      runAdb(['mdns', 'services'], { timeout: 1500 })
        .catch(error => { adbFailure = error; return ''; })
        .then(output => services(output).find(service => service.name === name && service.type === '_adb-tls-pairing._tcp'))
        .then(required),
    ]);
  } catch {
    if (discovery.error && adbFailure) {
      throw new Error('Network discovery is unavailable. Try adbwifiqr pair to pair without multicast discovery.');
    }
    return null;
  }
}

module.exports = { createDiscovery, pairingService, findPairing };

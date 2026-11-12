const dnsSd = require('node-dns-sd');
const { isIP } = require('node:net');
const { services } = require('./adb');
const SERVICE = '_adb-tls-pairing._tcp.local';

function pairingService(device) {
  const suffix = '.' + SERVICE;
  const fqdn = String(device.fqdn || '').replace(/\.$/, '');
  const port = device.service?.port;
  if (!fqdn.endsWith(suffix) || !isIP(device.address) ||
      !Number.isInteger(port) || port < 1 || port > 65535) return null;
  const name = fqdn.slice(0, -suffix.length);
  if (!name) return null;
  return { name, type: '_adb-tls-pairing._tcp',
    address: `${isIP(device.address) === 6 ? `[${device.address}]` : device.address}:${port}` };
}

function createDiscovery(scanner = dnsSd) {
  let cache = [], pending, failure, closed = false, release;
  const stopped = new Promise(resolve => { release = resolve; });
  async function scan(name) {
    if (closed) return [];
    if (!pending) {
      pending = Promise.resolve().then(() => scanner.discover({
        name: SERVICE,
        key: 'fqdn',
        quick: true,
        filter: device => {
          const parsed = pairingService(device);
          return !!parsed && (!name || parsed.name === name);
        },
      })).then(devices => {
        cache = devices.map(pairingService).filter(Boolean);
        failure = null;
        return cache;
      }).catch(error => { failure = error; return []; }).finally(() => { pending = null; });
    }
    return Promise.race([pending, stopped.then(() => [])]);
  }
  return {
    get error() { return failure; },
    list: () => cache,
    scan,
    async waitFor(name) { return (await scan(name)).find(service => service.name === name) || null; },
    close() { closed = true; release(); },
  };
}

async function findPairing(discovery, name, runAdb) {
  let adbFailure;
  const required = service => {
    if (!service) throw new Error('No matching service yet');
    return service;
  };
  try {
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

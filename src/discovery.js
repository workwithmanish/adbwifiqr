const dnsSd = require('node-dns-sd');
const { isIP } = require('node:net');
const { services, connectionResult } = require('./adb');
const SERVICE = '_adb-tls-pairing._tcp.local';

function networkService(device, serviceType = 'pairing') {
  const suffix = `._adb-tls-${serviceType}._tcp.local`;
  const fqdn = String(device.fqdn || '').replace(/\.$/, '');
  const port = device.service?.port;
  if (!fqdn.endsWith(suffix) || !isIP(device.address) ||
      !Number.isInteger(port) || port < 1 || port > 65535) return null;
  const name = fqdn.slice(0, -suffix.length);
  if (!name) return null;
  return { name, type: `_adb-tls-${serviceType}._tcp`,
    address: `${isIP(device.address) === 6 ? `[${device.address}]` : device.address}:${port}` };
}
const pairingService = device => networkService(device);

function endpointHost(address) {
  const match = address.match(/^\[([^\]]+)\]:\d+$|^([^:]+):\d+$/);
  return match ? match[1] || match[2] : null;
}

async function connectPairedPhone(pairingAddress, runAdb, scanner = dnsSd) {
  const host = endpointHost(pairingAddress);
  if (!host || !isIP(host)) throw new Error('Cannot identify the paired phone address.');
  const output = await runAdb(['devices', '-l']);
  const hasConnection = text => text.split(/\r?\n/).some(line => {
    const [serial, state] = line.trim().split(/\s+/);
    return state === 'device' && endpointHost(serial) === host;
  });
  if (hasConnection(output)) return { output, connected: true };
  const targets = await discoverConnections(host, scanner);
  const target = targets.find(service => endpointHost(service.address) === host);
  if (!target) return { output, connected: false };
  connectionResult(await runAdb(['connect', target.address]));
  const current = await runAdb(['devices', '-l']);
  return { output: current, connected: hasConnection(current) };
}

async function discoverConnections(host, scanner = dnsSd) {
  const devices = await scanner.discover({
    name: '_adb-tls-connect._tcp.local', key: 'fqdn', quick: true,
    filter: device => !!networkService(device, 'connect') && (!host || device.address === host),
  });
  return devices.map(device => networkService(device, 'connect')).filter(Boolean);
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
    close() { closed = true; release(); return pending ? pending.then(() => {}) : Promise.resolve(); },
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

module.exports = { createDiscovery, pairingService, findPairing, connectPairedPhone, discoverConnections };

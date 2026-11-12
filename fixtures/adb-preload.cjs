// Fake only the ADB process boundary; CLI parsing, output, and exit codes stay real.
const childProcess = require('node:child_process');
const crypto = require('node:crypto');
crypto.randomBytes = size => Buffer.alloc(size, 0xab);
const { EventEmitter } = require('node:events');
require('bonjour-service').Bonjour = class {
  constructor(options, onError) {
    if (process.env.ADB_TEST_CASE === 'discovery-failure') setImmediate(() => onError(new Error('multicast unavailable')));
  }
  find(options, onService) {
    if (process.env.ADB_TEST_CASE === 'direct-only') {
      setImmediate(() => onService({ name: 'ADB_WIFI_' + 'ab'.repeat(8),
        type: 'adb-tls-pairing', protocol: 'tcp', port: 40124, addresses: ['192.168.1.4'] }));
    }
    return Object.assign(new EventEmitter(), { update() {}, stop() {} });
  }
  destroy() {}
};
childProcess.execFile = (file, args, options, callback) => {
  const scenario = process.env.ADB_TEST_CASE;
  if (scenario === 'must-not-run') throw new Error('Unexpected ADB call');
  const failures = {
    missing: { code: 'ENOENT' },
    permission: { code: 'EACCES' },
    timeout: { killed: true },
  };
  if (failures[scenario]) {
    setImmediate(() => callback({ message: 'simulated failure', ...failures[scenario] }, '', ''));
    return;
  }
  let output = '';
  if (args[0] === 'version') output = 'Android Debug Bridge version 1.0.41\nVersion 37.0.0-test';
  else if (args[0] === 'devices') output = 'List of devices attached\n' + (scenario === 'empty' ? '' : '192.168.1.4:40123 device model:Test_Phone');
  else if (args[0] === 'connect') output = scenario === 'refused' ? 'failed to connect: Connection refused' : 'connected to ' + args[1];
  else if (args[0] === 'pair') output = 'Successfully paired to ' + args[1];
  else if (args.join(' ') === 'mdns check') output = 'mdns daemon version [test]';
  else if (args.join(' ') === 'mdns services') {
    if (scenario === 'direct-only') { setImmediate(() => callback(null, '', '')); return; }
    if (scenario === 'discovery-failure') {
      setImmediate(() => callback(new Error('unknown command mdns'), '', 'unknown command mdns'));
      return;
    }
    output = 'List of discovered mdns services\nADB_WIFI_' + 'ab'.repeat(8) + ' _adb-tls-pairing._tcp 192.168.1.4:40124';
  } else throw new Error('Unexpected ADB arguments: ' + args.join(' '));
  setImmediate(() => callback(null, output, ''));
};

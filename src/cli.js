const { randomBytes } = require('node:crypto');
const { setTimeout: delay } = require('node:timers/promises');
const readline = require('node:readline/promises');
const qr = require('qrcode-terminal');
const { adb, services, endpoint, connectionResult } = require('./adb');
const ui = require('./ui');
process.once('exit', ui.footer);
process.once('SIGINT', () => { ui.info('Session stopped.'); process.exit(130); });

async function manual() {
  if (!process.stdin.isTTY) throw new Error('Code pairing needs an interactive terminal. Open a terminal and run adbwifiqr pair.');
  const input = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    ui.section('PAIR WITH A CODE');
    ui.info('Phone: Wireless debugging > Pair device with pairing code.');
    const address = endpoint((await input.question(ui.prompt('Pairing IP address and port:'))).trim());
    const code = (await input.question(ui.prompt('Six-digit pairing code:'))).trim();
    if (!/^\d{6}$/.test(code)) throw new Error('The pairing code must contain six digits.');
    const result = await adb(['pair', address, code]);
    ui.block(result);
    if (!/successfully paired/i.test(result)) throw new Error('Pairing was not confirmed. Generate a new code and try again.');
    ui.success('Phone paired.');
    ui.section('CONNECT YOUR PHONE');
    ui.info('Return to the main Wireless debugging screen. Its port is different.');
    const connect = endpoint((await input.question(ui.prompt('Main-screen IP address and port:'))).trim());
    ui.success(connectionResult(await adb(['connect', connect])));
    ui.devices(await adb(['devices', '-l']));
  } finally { input.close(); }
}

async function main() {
  const command = process.argv[2] || 'qr';
  if (['--version', '-v'].includes(command)) return console.log(require('../package.json').version);
  if (process.argv.length > 3) throw new Error('Too many arguments. Run adbwifiqr --help for usage.');
  ui.header(({ qr: 'QR PAIRING', doctor: 'SETUP CHECK', pair: 'CODE PAIRING', devices: 'YOUR DEVICES' })[command] || 'QUICK HELP');
  if (['--help', '-h', 'help'].includes(command)) {
    ui.section('COMMANDS');
    ui.block('adbwifiqr                  Pair with a QR code\nadbwifiqr doctor           Check your setup\nadbwifiqr pair             Pair with a six-digit code\nadbwifiqr devices          Show connected devices\nadbwifiqr connect IP:PORT  Connect a paired phone\nadbwifiqr --help           Show commands\nadbwifiqr --version        Show installed version');
    return;
  }
  if (!['qr', 'doctor', 'pair', 'devices'].includes(command)) throw new Error('Unknown command. Use adbwifiqr --help (or npm start -- --help in a source checkout).');
  if (command === 'devices') return ui.devices(await adb(['devices', '-l']));
  const version = await adb(['version']);
  ui.success('ADB ready' + (command === 'doctor' ? '  ·  ' + (version.split(/\r?\n/).find(line => line.startsWith('Version ')) || version.split(/\r?\n/)[0]) : ''));
  if (command === 'doctor') {
    ui.section('NETWORK DISCOVERY');
    ui.block(await adb(['mdns', 'check']));
    ui.section('NEARBY SERVICES');
    const nearby = services(await adb(['mdns', 'services']));
    if (nearby.length) nearby.forEach(service => ui.block(`${service.name}  ${service.address}`));
    else ui.info('No services found. Enable Wireless debugging on your phone.');
    ui.devices(await adb(['devices', '-l']));
    return;
  }
  if (command === 'pair') return manual();
  const name = 'ADB_WIFI_' + randomBytes(8).toString('hex');
  const password = randomBytes(16).toString('hex');
  ui.section('SET UP YOUR PHONE');
  ui.step(1, 'Put your phone and PC on the same trusted Wi-Fi.');
  ui.step(2, 'Phone: Settings > Developer options > Wireless debugging.');
  ui.step(3, 'Enable it, then tap Pair device with QR code.');
  ui.section('SCAN WITH YOUR PHONE');
  qr.generate(`WIFI:T:ADB;S:${name};P:${password};;`, { small: true }, code => {
    console.log(code.split('\n').map(line => '    ' + line).join('\n'));
  });
  ui.info('Scan in Wireless debugging. Keep this code private.');
  ui.info('Ctrl+C stop  ·  adbwifiqr pair use a pairing code');
  console.log();
  let stopWaiting = ui.spinner('Waiting for phone · 3 min limit');
  try {
  const deadline = Date.now() + 180000;
  const attempts = new Map();
  while (Date.now() < deadline) {
    let found;
    try { found = services(await adb(['mdns', 'services'])); }
    catch (error) { throw new Error(`Discovery unavailable: ${error.message}\nTry adbwifiqr pair to pair without multicast discovery.`); }
    const service = found.find(s => s.type === '_adb-tls-pairing._tcp' && s.name === name);
    if (service && (attempts.get(service.address) || 0) < 3) {
      attempts.set(service.address, (attempts.get(service.address) || 0) + 1);
      stopWaiting();
      ui.success('Phone discovered. Pairing...');
      try {
        const result = await adb(['pair', service.address, password]);
        if (!/successfully paired/i.test(result)) throw new Error(result);
        ui.block(result);
      } catch (error) {
        ui.warning('Pairing attempt failed: ' + error.message);
        stopWaiting = ui.spinner('Retrying pairing');
        await delay(2000);
        continue;
      }
      await delay(3000);
      ui.success('Pairing complete.');
      ui.devices(await adb(['devices', '-l']));
      ui.section('NEXT STEP');
      ui.info('If disconnected, use the main Wireless debugging IP and port:');
      ui.block('adbwifiqr connect <IP:PORT>');
      return;
    }
    await delay(2000);
  }
  throw new Error('No matching phone paired in time. Try adbwifiqr pair (or npm run pair in a source checkout). Check Wi-Fi, VPN, and firewall settings.');
  } finally { stopWaiting(); }
}

const connectArgs = process.argv.slice(2);
Promise.resolve().then(async () => {
  if (connectArgs[0] === 'connect') {
    if (connectArgs.length !== 2) throw new Error('Usage: adbwifiqr connect IP:PORT');
    ui.header('CONNECT YOUR PHONE');
    ui.success(connectionResult(await adb(['connect', endpoint(connectArgs[1] || '')])));
    ui.devices(await adb(['devices', '-l']));
  } else await main();
}).catch(error => { ui.error(error.message); process.exitCode = 1; });

const color = process.stdout.isTTY && !('NO_COLOR' in process.env) && process.env.TERM !== 'dumb';
const paint = (code, text) => color ? `\x1b[${code}m${text}\x1b[0m` : text;
const cyan = text => paint('36', text);
const dim = text => paint('2', text);
const bold = text => paint('1', text);
let activeSpinner;
const rule = () => dim('  ' + '─'.repeat(Math.max(8, Math.min(54, (process.stdout.columns || 80) - 4))));
function stopActivity() { activeSpinner?.(); }

function header(mode) {
  console.log('\n  ' + bold('adb') + cyan(' / ') + bold('wifi qr'));
  console.log('  ' + dim('Wireless Android pairing  ·  v' + require('../package.json').version));
  console.log('\n' + rule());
  console.log('  ' + mode.toLowerCase() + dim('  ·  Android 11+'));
}

function section(title) { console.log('\n  ' + bold(title.toLowerCase().replace(/^./, letter => letter.toUpperCase())) + '\n'); }
function info(message) { stopActivity(); console.log('  ' + dim(message)); }
function success(message) { stopActivity(); console.log('  ' + paint('32', '✓ ') + message); }
function warning(message) { stopActivity(); console.log('\n  ' + paint('33', '! ') + message); }
function error(message) { stopActivity(); console.error('\n  ' + paint('31', '× ') + message); }
function step(number, text) { console.log('  ' + dim(String(number).padStart(2, '0')) + '  ' + text); }
function prompt(text) { return '\n  ' + cyan('› ') + text + ' '; }
function block(text) { console.log(String(text).split(/\r?\n/).map(line => '  ' + line).join('\n')); }
function devices(output) {
  section('DEVICES');
  const rows = output.split(/\r?\n/).filter(line => line.trim() && !line.startsWith('List of devices'));
  if (!rows.length) return info('No devices connected yet. Pairing and active connection are separate.');
  for (const row of rows) {
    const [serial, state, ...details] = row.trim().split(/\s+/);
    const model = details.find(item => item.startsWith('model:'))?.slice(6).replace(/_/g, ' ');
    console.log('  ' + (state === 'device' ? paint('32', '●') : paint('33', '○')) + ' ' + bold(model || serial) + dim('  ·  ' + (state === 'device' ? 'connected' : state)));
    info(model ? serial : details.join(' '));
  }
}
function spinner(label) {
  stopActivity();
  if (!process.stdout.isTTY) { info(label); return () => {}; }
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let frame = 0;
  const start = Date.now();
  const draw = () => {
    const width = Math.max(10, (process.stdout.columns || 80) - 2);
    const line = `  ${frames[frame++ % frames.length]} ${label}  ·  ${Math.floor((Date.now() - start) / 1000)}s`;
    process.stdout.write('\r\x1b[2K' + dim(line.slice(0, width)));
  };
  draw();
  const timer = setInterval(draw, 120);
  timer.unref();
  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    clearInterval(timer);
    process.stdout.write('\r\x1b[2K');
  };
  activeSpinner = stop;
  process.once('exit', stop);
  return () => { process.removeListener('exit', stop); stop(); };
}
function footer() {
  stopActivity();
  console.log('\n' + rule());
  console.log('  ' + dim('Thanks for using ADB Wi-Fi QR.'));
  console.log('  ' + dim('https://github.com/workwithmanish') + '\n');
}
module.exports = { header, section, info, success, warning, error, step, prompt, block, devices, spinner, footer };

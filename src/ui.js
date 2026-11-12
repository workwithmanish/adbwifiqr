const color = process.stdout.isTTY && !('NO_COLOR' in process.env) && process.env.TERM !== 'dumb';
const paint = (code, text) => color ? `\x1b[${code}m${text}\x1b[0m` : text;
const cyan = text => paint('36', text);
const dim = text => paint('2', text);
const bold = text => paint('1', text);
let activeSpinner;

function header(mode) {
  console.log('\n' + cyan('  +--------------------------------------------+'));
  console.log(cyan('  |') + bold('             ADB Wi-Fi QR                   ') + cyan('|'));
  console.log(cyan('  +--------------------------------------------+'));
  console.log('  ' + dim('Your Android. Connected wirelessly.'));
  console.log('  ' + cyan(mode) + dim('  /  Android 11+\n'));
}

function section(title) { console.log('\n  ' + bold(title) + '\n'); }
function info(message) { console.log('  ' + dim(message)); }
function success(message) { console.log('\n  ' + paint('32', '[OK] ') + message); }
function warning(message) { console.log('\n  ' + paint('33', '[!] ') + message); }
function error(message) { console.error('\n  ' + paint('31', '[ERROR] ') + message); }
function step(number, text) { console.log('  ' + cyan(`${number}.`) + ' ' + text); }
function prompt(text) { return '  ' + cyan('> ') + text + ' '; }
function block(text) { console.log(String(text).split(/\r?\n/).map(line => '  ' + line).join('\n')); }
function devices(output) {
  section('DEVICES');
  const rows = output.split(/\r?\n/).filter(line => line.trim() && !line.startsWith('List of devices'));
  if (!rows.length) return info('No devices connected yet. Pair your phone to get started.');
  for (const row of rows) {
    const [serial, state, ...details] = row.trim().split(/\s+/);
    const model = details.find(item => item.startsWith('model:'))?.slice(6).replace(/_/g, ' ');
    console.log('  ' + (state === 'device' ? paint('32', '[CONNECTED]') : paint('33', `[${state.toUpperCase()}]`)) + ' ' + bold(model || serial));
    info(model ? serial : details.join(' '));
  }
}
function spinner(label) {
  if (!process.stdout.isTTY) { info(label); return () => {}; }
  const frames = ['|', '/', '-', '\\'];
  let frame = 0;
  const start = Date.now();
  const draw = () => {
    const width = Math.max(10, (process.stdout.columns || 80) - 2);
    const line = `  ${frames[frame++ % frames.length]} ${label}  ${Math.floor((Date.now() - start) / 1000)}s`;
    process.stdout.write('\r\x1b[2K' + cyan(line.slice(0, width)));
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
  activeSpinner?.();
  console.log('\n  ' + dim('--------------------------------------------'));
  console.log('  ' + bold('Thanks for using ADB Wi-Fi QR!'));
  console.log('  Made by ' + cyan('workwithmanish'));
  console.log('  ' + dim('https://github.com/workwithmanish') + '\n');
}
module.exports = { header, section, info, success, warning, error, step, prompt, block, devices, spinner, footer };

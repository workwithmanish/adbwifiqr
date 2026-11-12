const color = process.stdout.isTTY && !('NO_COLOR' in process.env) && process.env.TERM !== 'dumb';
const paint = (code, text) => color ? `\x1b[${code}m${text}\x1b[0m` : text;
const accent = text => paint('36', text);
const muted = text => paint('90', text);
const bold = text => paint('1', text);
let activeSpinner;
let showFooter = false;
const width = () => Math.max(24, Math.min(66, (process.stdout.columns || 80) - 4));
function stopActivity() { activeSpinner?.(); }
function wrap(text, limit) {
  const lines = [];
  for (const source of String(text).split('\n')) {
    let rest = source;
    while (rest.length > limit) {
      let cut = rest.lastIndexOf(' ', limit);
      if (cut < limit / 3) cut = limit;
      lines.push(rest.slice(0, cut));
      rest = rest.slice(cut).trimStart();
    }
    lines.push(rest);
  }
  return lines;
}
function panel(title, lines, tone = '36') {
  stopActivity();
  const size = width();
  const border = text => paint(tone, text);
  console.log('\n  ' + border('┌' + '─'.repeat(size) + '┐'));
  const row = (line, heading = false) => {
    for (const part of wrap(line, size - 4)) {
      const content = part.padEnd(size - 4);
      console.log('  ' + border('│') + '  ' + (heading ? bold(content) : content) + '  ' + border('│'));
    }
  };
  row(title, true);
  console.log('  ' + border('├' + '─'.repeat(size) + '┤'));
  lines.forEach(line => row(line));
  console.log('  ' + border('└' + '─'.repeat(size) + '┘'));
}
function header(mode) {
  showFooter = !['SETUP CHECK', 'YOUR DEVICES', 'QUICK HELP'].includes(mode);
  console.log('\n  ' + bold('ADB WIFI QR') + muted('  v' + require('../package.json').version));
  console.log('  ' + accent(mode.toLowerCase()) + muted('  /  Android 11+'));
  console.log('  ' + muted('─'.repeat(width() + 2)));
}
function section(title) { stopActivity(); console.log('\n  ' + bold(title.toUpperCase())); }
function info(message) { stopActivity(); console.log('  ' + message); }
function success(message) { stopActivity(); console.log('  ' + paint('32', '✓') + ' ' + message); }
function warning(message) { stopActivity(); console.log('  ' + paint('33', '!') + ' ' + message); }
function error(message) { stopActivity(); panel('ACTION REQUIRED', [message], '31'); }
function step(number, text) { console.log('  ' + accent(String(number).padStart(2, '0')) + '  ' + text); }
function prompt(text) { return '\n  ' + accent('› ') + text + ' '; }
function block(text) { stopActivity(); console.log(String(text).split(/\r?\n/).map(line => '    ' + line).join('\n')); }
function command(text) { panel('RUN IN YOUR TERMINAL', Array.isArray(text) ? text : [text]); }
function result({ host, address, connected, error: detail }) {
  const rows = [
    'Pairing      Complete',
    'Connection   ' + (connected ? 'Connected' : 'Needs one more step'),
    'Phone IP     ' + host,
    'ADB address  ' + (address || 'Connection port not discovered'),
  ];
  if (detail) rows.push('', detail);
  panel(connected ? 'READY TO USE' : 'PAIRED · CONNECTION PENDING', rows, connected ? '32' : '33');
}
function devices(output) {
  const rows = output.split(/\r?\n/).filter(line => line.trim() && !line.startsWith('List of devices'));
  if (!rows.length) return panel('DEVICES', ['No active ADB connection.']);
  const content = [];
  for (const row of rows) {
    const [serial, state, ...details] = row.trim().split(/\s+/);
    const model = details.find(item => item.startsWith('model:'))?.slice(6).replace(/_/g, ' ');
    content.push((model || serial) + '  /  ' + (state === 'device' ? 'connected' : state));
    if (model) content.push(serial);
  }
  panel('DEVICES', content);
}
function spinner(label) {
  stopActivity();
  if (!process.stdout.isTTY) { info(label); return () => {}; }
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let frame = 0;
  const start = Date.now();
  const draw = () => {
    const line = `  ${frames[frame++ % frames.length]} ${label}  ${Math.floor((Date.now() - start) / 1000)}s`;
    process.stdout.write('\r\x1b[2K' + accent(line.slice(0, (process.stdout.columns || 80) - 2)));
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
  if (!showFooter) return;
  console.log('\n  ' + muted('Thanks for using ADB Wi-Fi QR.'));
  console.log('  ' + muted('github.com/workwithmanish') + '\n');
}
module.exports = { header, section, info, success, warning, error, step, prompt, block, devices, spinner, footer, panel, command, result, wrap };

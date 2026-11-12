const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const START = '# >>> adbwifiqr PATH >>>';
const END = '# <<< adbwifiqr PATH <<<';
const quote = value => "'" + value.replace(/'/g, "'\"'\"'") + "'";

function setupShell({ home, bin, shell, pathValue = '', zdotdir }) {
  const name = path.basename(shell || '').replace(/^-/, '');
  let files;
  let block = `${START}\ncase ":$PATH:" in\n  *:${quote(bin)}:*) ;;\n  *) export PATH=${quote(bin)}:"$PATH" ;;\nesac\n${END}`;
  if (name === 'zsh') {
    const directory = zdotdir || home;
    files = [path.join(directory, '.zshrc'), path.join(directory, '.zprofile')];
  } else if (name === 'bash') {
    const login = ['.bash_profile', '.bash_login'].find(file => fs.existsSync(path.join(home, file))) || '.profile';
    files = [path.join(home, '.bashrc'), path.join(home, login)];
  } else if (name === 'fish') {
    files = [path.join(home, '.config', 'fish', 'conf.d', 'adbwifiqr.fish')];
    block = `${START}\nfish_add_path --prepend ${quote(bin)}\n${END}`;
  } else throw new Error(`Unsupported shell: ${name || 'unknown'}. Supported: bash, zsh, fish.`);
  for (const file of files) {
    const original = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
    const marker = new RegExp(START + '[\\s\\S]*?' + END, 'g');
    const next = original.includes(START) ? original.replace(marker, block)
      : original + (original.endsWith('\n') || !original ? '' : '\n') + '\n' + block + '\n';
    if (next === original) continue;
    fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
    if (original && !fs.existsSync(file + '.adbwifiqr.bak')) fs.writeFileSync(file + '.adbwifiqr.bak', original, { mode: 0o600 });
    fs.writeFileSync(file, next, { mode: 0o600 });
  }
  const executable = path.join(bin, 'adbwifiqr');
  let ready = pathValue.split(path.delimiter).includes(bin);
  // A writable directory already on PATH also makes the command usable in
  // the existing parent terminal, whose environment a child cannot change.
  if (!ready && process.platform !== 'win32') {
    for (const directory of pathValue.split(path.delimiter)) {
      if (!path.isAbsolute(directory) || directory === bin) continue;
      const target = path.join(directory, 'adbwifiqr');
      try {
        fs.accessSync(directory, fs.constants.W_OK);
        if (fs.existsSync(target) || fs.lstatSync(target, { throwIfNoEntry: false })) {
          if (!fs.lstatSync(target).isSymbolicLink()) continue;
          const existing = fs.readlinkSync(target);
          if (path.resolve(directory, existing) === executable) { ready = true; break; }
          if (!existing.includes('node_modules/adbwifiqr/')) continue;
          fs.unlinkSync(target);
        }
        fs.symlinkSync(executable, target);
        ready = true;
        break;
      } catch { /* Try the next writable PATH directory. */ }
    }
  }
  return { shell: name, files, ready };
}

if (require.main === module) {
  try {
    const result = setupShell({ home: os.homedir(), bin: process.argv[2], shell: process.argv[3],
      pathValue: process.env.PATH, zdotdir: process.env.ZDOTDIR });
    console.log(`Shell configured: ${result.shell}. PATH settings saved without duplicates.`);
    console.log(result.ready ? 'Command ready: adbwifiqr' : 'New terminals will find adbwifiqr automatically. Starting it now for this session.');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { setupShell };

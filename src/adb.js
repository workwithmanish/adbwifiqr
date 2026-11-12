const { execFile } = require('node:child_process');
const { mkdirSync } = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

function adbEnvironment(projectRoot, base = process.env, platform = process.platform) {
  const paths = platform === 'win32' ? path.win32 : path.posix;
  const home = paths.join(projectRoot, '.android');
  const env = { ...base, HOME: projectRoot, ANDROID_USER_HOME: home,
    ANDROID_SDK_HOME: projectRoot, ADB_VENDOR_KEYS: home };
  if (platform === 'win32') {
    env.USERPROFILE = projectRoot;
    env.HOMEDRIVE = paths.parse(projectRoot).root.replace(/[\\/]$/, '');
    env.HOMEPATH = projectRoot.slice(paths.parse(projectRoot).root.length - 1);
  }
  return env;
}

function adb(args) {
  const home = path.join(root, '.android');
  mkdirSync(home, { recursive: true });
  return new Promise((resolve, reject) => {
    execFile(process.env.ADB_PATH || 'adb', args, {
      cwd: root,
      windowsHide: true,
      timeout: 20000,
      env: adbEnvironment(root),
    }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(error.code === 'ENOENT'
          ? 'ADB was not found. See the Platform Tools setup in README.md.'
          : (stderr.trim() || stdout.trim() || error.message)));
      } else resolve(stdout.trim());
    });
  });
}

function services(output) {
  return output.split(/\r?\n/).flatMap(line => {
    const match = line.trim().match(/^(\S+)\s+(_adb-tls-(?:pairing|connect)\._tcp\.?)\s+(\S+)$/);
    return match ? [{ name: match[1], type: match[2].replace(/\.$/, ''), address: match[3] }] : [];
  });
}

function endpoint(value) {
  const match = value.match(/^(\d{1,3}(?:\.\d{1,3}){3}):(\d{1,5})$/);
  if (!match || match[1].split('.').some(n => Number(n) > 255) || +match[2] < 1 || +match[2] > 65535) {
    throw new Error('Enter an IPv4 address and port, for example 192.168.1.5:37123.');
  }
  return value;
}

module.exports = { adb, services, endpoint, adbEnvironment };

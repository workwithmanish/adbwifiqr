const { execFile } = require('node:child_process');
const { mkdirSync } = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const stateRoot = process.env.ADBWIFIQR_HOME ? path.resolve(process.env.ADBWIFIQR_HOME) : root;

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
  const home = path.join(stateRoot, '.android');
  try {
    mkdirSync(home, { recursive: true, mode: 0o700 });
  } catch {
    return Promise.reject(new Error('Cannot write Android settings. Set ADBWIFIQR_HOME to a directory owned by your user.'));
  }
  return new Promise((resolve, reject) => {
    execFile(process.env.ADB_PATH || 'adb', args, {
      cwd: root,
      windowsHide: true,
      timeout: 20000,
      env: adbEnvironment(stateRoot),
    }, (error, stdout, stderr) => {
      if (error) {
        const detail = stderr.trim() || stdout.trim() || error.message;
        reject(new Error(error.code === 'ENOENT'
          ? 'ADB was not found. Install Android Platform Tools and set ADB_PATH to the full adb executable path.'
          : error.code === 'EACCES' || error.code === 'EPERM'
            ? 'ADB cannot be executed. Check ADB_PATH and executable permissions; do not run the tool with sudo.'
            : error.killed
              ? 'ADB did not respond within 20 seconds. Check your phone/network and run adbwifiqr doctor.'
              : detail));
      } else resolve(stdout.trim());
    });
  });
}

function connectionResult(output) {
  if (!/^(?:already )?connected to\s+/im.test(output)) {
    throw new Error(`${output || 'ADB did not confirm a connection.'}\nUse the connection port from the main Wireless debugging screen, not the pairing port.`);
  }
  return output;
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

module.exports = { adb, services, endpoint, adbEnvironment, connectionResult };

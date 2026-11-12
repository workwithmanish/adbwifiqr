# adb / wifi qr

**Pair your Android phone from your terminal. No USB cable needed.**

A minimal terminal tool for Android wireless debugging: scan a QR, pair with a six-digit code, and check connected devices.

[Install](#install) · [Pair your phone](#pair-your-phone) · [Commands](#commands) · [Troubleshooting](#troubleshooting) · [Update](#update)

## Install

Install directly from GitHub:

```bash
npm install -g github:workwithmanish/adbwifiqr
```

**npm 12 or `EALLOWGIT`?** Newer npm versions block Git downloads by default. Explicitly allow Git fetching for this installation only:

```bash
npm install -g --allow-git=all github:workwithmanish/adbwifiqr
```

If using the user-owned prefix recommended for Kali/macOS:

```bash
npm install -g --prefix "$HOME/.local" --allow-git=all github:workwithmanish/adbwifiqr
export PATH="$HOME/.local/bin:$PATH"
```

This flag applies only to that command; it does not change your global npm configuration. The package has no installation lifecycle scripts. If an older npm reports an unknown `allow-git` option, omit the flag. Check your version with `npm --version`. Use the same flag when updating on npm 12.

Then run from **any directory**:

```bash
adbwifiqr
```

No cloning or `npm start` is required for normal use. This package is distributed through GitHub and is **not published to the npm registry**. Use the complete GitHub install command above, not `npm install -g adbwifiqr` or `npx adbwifiqr`. The npm client downloads it from GitHub and creates the `adbwifiqr` terminal command.

### Requirements

| Requirement | Details |
| --- | --- |
| Computer | Windows, Linux (including Kali), or macOS |
| Node.js and npm | Node.js **22+**; a supported LTS release recommended |
| Git | Required for installing from GitHub |
| ADB | Recent Android SDK Platform Tools with `pair` support; ADB's own mDNS backend is optional |
| Phone | Android **11+**, with Wireless debugging available |
| Network | Phone and computer on the same trusted local network, with device-to-device communication allowed |

ADB must be installed separately. Android Studio, a USB cable, and phone root are not required for this pairing flow. This is a computer-side tool, not a phone app or screen-mirroring application.

### Kali Linux

Install prerequisites:

```bash
sudo apt update
sudo apt install -y git nodejs npm adb
node --version
npm --version
adb version
adb help
```

Node must report `v22` or newer. ADB help must include `pair`. Version 1.2.0 adds direct network discovery, so an empty or unavailable ADB mDNS backend does not by itself prevent QR pairing. Versions depend on your repositories. If Node is too old, follow the [official Node.js download instructions](https://nodejs.org/en/download) to install a supported LTS version. If ADB is too old, install [Google's current Platform Tools](https://developer.android.com/tools/releases/platform-tools) and use the [custom ADB path](#custom-adb-path) below.

Configure a user-owned npm installation location so no `sudo npm` is needed:

```bash
mkdir -p "$HOME/.local"
npm install -g --prefix "$HOME/.local" github:workwithmanish/adbwifiqr
export PATH="$HOME/.local/bin:$PATH"
adbwifiqr doctor
adbwifiqr
```

The `export` applies to this terminal. To make it permanent, add this line once to your shell configuration (`~/.zshrc` for zsh, or `~/.bashrc` for bash), then reopen the terminal:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

Run `echo "$SHELL"` if you are unsure which shell you use. Do not run this tool with sudo. If a Node version manager already provides a writable global npm prefix, the shorter `npm install -g github:workwithmanish/adbwifiqr` command also works.

**Kali in VirtualBox/VMware:** the VM must reach the phone directly. Bridged networking is often needed for multicast discovery; NAT may block it even when internet access works. If the phone is reachable but discovery fails, use `adbwifiqr pair`.

### Windows (PowerShell)

1. Install [Node.js LTS](https://nodejs.org/en/download) and [Git for Windows](https://git-scm.com/downloads/win), then reopen PowerShell.
2. Download and extract the Windows ZIP from [Google Platform Tools](https://developer.android.com/tools/releases/platform-tools).
3. Add the extracted `platform-tools` folder to PATH, or set the actual executable path for this terminal:

```powershell
$env:ADB_PATH = 'C:\path\to\platform-tools\adb.exe'
```

Replace the example path before running it. Install and start:

```powershell
npm install -g github:workwithmanish/adbwifiqr
adbwifiqr doctor
adbwifiqr
```

If PowerShell blocks `.ps1` scripts, use `npm.cmd` and `adbwifiqr.cmd` instead. No execution-policy change is needed.

### macOS

If you use [Homebrew](https://brew.sh/):

```bash
brew install node git
brew install --cask android-platform-tools
```

Alternatively, install [Node.js LTS](https://nodejs.org/en/download), [Git](https://git-scm.com/downloads/mac), and [Google Platform Tools](https://developer.android.com/tools/releases/platform-tools) separately.

Install the command in a user-owned location:

```bash
mkdir -p "$HOME/.local"
npm install -g --prefix "$HOME/.local" github:workwithmanish/adbwifiqr
export PATH="$HOME/.local/bin:$PATH"
adbwifiqr doctor
adbwifiqr
```

Add the PATH line to `~/.zshrc` (or your shell's configuration file) once to keep it after restarting the terminal. If your npm global prefix is already writable and on PATH, the shorter install command at the top also works.

### Other Linux distributions

Install Git, Node.js 22+ with npm, and recent ADB using your package manager or the official downloads above. Then follow the user-owned npm installation steps for Kali. Debian/Ubuntu often use the same package names, but verify their Node and ADB versions. On ARM systems, choose binaries matching your architecture rather than assuming Google's Linux ZIP matches your CPU.

## Pair your phone

1. Put the computer and phone on the same trusted network. Avoid guest networks that isolate devices.
2. Enable Developer options: usually **Settings > About phone > Build number**, then tap Build number seven times. Some brands put it under Software information. Enter your PIN if asked.
3. Open **Settings > Developer options > Wireless debugging**, turn it on, and approve your trusted network if prompted.
4. On your computer, run:

```bash
adbwifiqr
```

5. On the phone, tap **Pair device with QR code** and scan the terminal QR using that scanner, not your ordinary camera.
6. Wait for **Pairing complete**, then check:

```bash
adbwifiqr devices
```

A device marked **connected** is ready for ADB. Pairing and connection are separate steps; if the device is absent, use [Connect after pairing](#connect-after-pairing).

The tool waits up to three minutes. Press **Ctrl+C** to stop. Each run generates fresh QR credentials; completed pairing remains on your phone after stopping.

```text
  adb / wifi qr
  Wireless Android pairing

  ──────────────────────────────────────────────────────
  qr pairing  ·  Android 11+
  ✓ ADB ready

  Set up your phone

  01  Put your phone and PC on the same trusted Wi-Fi.
  02  Phone: Settings > Developer options > Wireless debugging.
  03  Enable it, then tap Pair device with QR code.

  Scan with your phone

      [A fresh, scannable QR appears here]
```

### Pair with a six-digit code

```bash
adbwifiqr pair
```

1. On your phone, open **Wireless debugging > Pair device with pairing code**.
2. Enter the dialog's **IP address and pairing port**, for example `192.168.1.5:40123`.
3. Enter the six-digit code. Keep the dialog open until pairing completes.
4. Return to the **main Wireless debugging screen**.
5. Enter that screen's **IP address and connection port** when prompted.

**The pairing port and connection port are different.** Use each from its correct screen. Manual prompts currently accept IPv4 addresses; IPv6-only networks are not supported by them.

### Connect after pairing

Use the IP and port on the phone's **main Wireless debugging screen**:

```bash
adbwifiqr connect 192.168.1.5:37123
adbwifiqr devices
```

Replace the example address with your phone's actual address. Ports can change when Wireless debugging restarts. You generally need not pair again while the phone remembers this computer and its ADB keys remain available.

## Commands

These commands work from any directory after global installation:

| Command | Purpose |
| --- | --- |
| `adbwifiqr` | Display a QR and wait for pairing |
| `adbwifiqr pair` | Pair with a six-digit code, then connect |
| `adbwifiqr doctor` | Check ADB, discovery, services, and devices |
| `adbwifiqr devices` | Show devices and connection states |
| `adbwifiqr connect IP:PORT` | Connect an already-paired phone |
| `adbwifiqr --help` | Show commands |
| `adbwifiqr --version` | Show the installed version without needing ADB |

### Custom ADB path

Set `ADB_PATH` to the full executable path, not its folder. This applies to the current terminal.

Linux/macOS:

```bash
export ADB_PATH="/your/path/platform-tools/adb"
adbwifiqr doctor
```

Windows PowerShell:

```powershell
$env:ADB_PATH = 'C:\your\path\platform-tools\adb.exe'
adbwifiqr doctor
```

Without this variable, the tool uses `adb` from PATH. It does not install ADB or edit PATH itself.

### Settings and appearance

The installed command keeps Android settings and keys under `~/.adbwifiqr/.android` on Linux/macOS, or `%USERPROFILE%\.adbwifiqr\.android` on Windows. This avoids writing into potentially read-only global package directories and keeps keys across package updates.

To choose a different writable location, set `ADBWIFIQR_HOME` before running. For example:

```bash
export ADBWIFIQR_HOME="$HOME/my-adb-settings"
adbwifiqr
```

PowerShell:

```powershell
$env:ADBWIFIQR_HOME = 'D:\adbwifiqr'
adbwifiqr
```

Use a Unicode-capable terminal and monospaced font. Colors and animation are disabled for redirected output. To disable text colors, use `NO_COLOR=1 adbwifiqr` on Linux/macOS, or set `$env:NO_COLOR = '1'` before running on PowerShell.

## Troubleshooting

| Problem | What to try |
| --- | --- |
| `adbwifiqr: command not found` | Confirm installation succeeded. Add your npm global executable directory to PATH and reopen the terminal. |
| `EACCES` during npm install | Use the user-owned `--prefix "$HOME/.local"` installation above. Do not use sudo npm. |
| `EALLOWGIT`: Git fetching disabled | On npm 12, add `--allow-git=all` to the GitHub install command for this invocation only. See Install above. |
| `node`, `npm`, or `git` missing | Install the prerequisite, reopen the terminal, and check its version. |
| Unsupported Node version | Install Node.js 22+ using a supported LTS release. |
| ADB missing or too old | Install recent Platform Tools and configure `ADB_PATH`. ADB must support `pair`. |
| Phone stays on “Pairing device” after scanning | Update to 1.2.0 or newer, stop the old session, reopen the phone's QR scanner, and scan the newly generated QR. This version uses direct mDNS discovery alongside ADB discovery. If both are blocked by the network, use code pairing. |
| QR times out / no nearby services | Check Wireless debugging, Wi-Fi, VPN, firewall, and VM networking. Try `adbwifiqr pair`. |
| Pairing code rejected | Open a fresh pairing-code dialog and retry before it expires. |
| Paired but disconnected | Use `adbwifiqr connect IP:PORT` with the main screen's connection port. |
| Connection refused | Check the current IP and port and make sure Wireless debugging is on. |
| Offline or unauthorized | Unlock the phone, check prompts, and retry. If needed, Forget this computer and pair again. |
| QR distorted | Maximize the terminal, reduce font size, and prevent line wrapping. Try code pairing. |
| PowerShell blocks scripts | Use `npm.cmd` and `adbwifiqr.cmd`. |

Find the global npm installation prefix:

```bash
npm prefix -g
```

Executables are in its `bin` subdirectory on Linux/macOS and directly in that prefix on Windows. If you installed with `--prefix`, use `npm prefix -g --prefix` followed by that same path to inspect it. On Linux/macOS you can also check `command -v adbwifiqr`; on PowerShell use `Get-Command adbwifiqr`.

Allow ADB through the firewall only on your trusted network if prompted; avoid disabling the firewall. Code pairing bypasses discovery but still requires a direct route to the phone.

ADB uses a shared background server. An existing server may retain keys/settings from another installation. If versions or settings conflict, close other ADB tools and restart the selected ADB server. **This disconnects other ADB sessions.** For ADB on PATH:

```bash
adb kill-server
adbwifiqr doctor
```

For a custom ADB executable, run that executable with `kill-server` instead. Pair again if necessary. When switching from an earlier source checkout to the global command, you may need to pair again because the default key directory changes. Alternatively, point `ADBWIFIQR_HOME` to the old project directory to reuse its settings.

For help, [open an issue](https://github.com/workwithmanish/adbwifiqr/issues) with your OS, Node version, ADB version, and error text. Omit private keys, pairing codes, QR credentials, and personal device information.

## Update

Reinstall from GitHub to get the latest version:

```bash
npm install -g github:workwithmanish/adbwifiqr
```

If you used the user-owned prefix, keep using it:

```bash
npm install -g --prefix "$HOME/.local" github:workwithmanish/adbwifiqr
```

Then run `adbwifiqr doctor`. Your installed-command settings are outside the package directory, so reinstalling does not remove them.

On npm 12, include `--allow-git=all` in either update command, as described under Install.

## Uninstall

For the default global prefix:

```bash
npm uninstall -g adbwifiqr
```

For the user-owned prefix:

```bash
npm uninstall -g --prefix "$HOME/.local" adbwifiqr
```

On the phone, open **Wireless debugging > Paired devices**, select the computer, and tap **Forget**. Turn Wireless debugging off when finished. The settings folder remains unless you manually remove it. Separately installed Node.js, Git, and ADB remain installed.

## Run from source / development

Global installation is optional. To edit the code or run the project without adding a global command:

```bash
git clone https://github.com/workwithmanish/adbwifiqr.git
cd adbwifiqr
npm ci --cache .npm-cache
npm start
```

| Source command | Installed equivalent |
| --- | --- |
| `npm start` | `adbwifiqr` |
| `npm run doctor` | `adbwifiqr doctor` |
| `npm run pair` | `adbwifiqr pair` |
| `npm run devices` | `adbwifiqr devices` |
| `npm start -- connect IP:PORT` | `adbwifiqr connect IP:PORT` |
| `npm start -- --help` | `adbwifiqr --help` |

The help screen uses installed command names; use this table if you work only from source. Source commands default to settings in the checkout's `.android/` folder, preserving the original development behavior. `ADBWIFIQR_HOME` overrides this too.

To update a source checkout:

```bash
git pull --ff-only
npm ci --cache .npm-cache
npm run doctor
```

Save local edits before updating; do not force Git to discard them. ZIP downloads must be updated by downloading a new ZIP instead.

```text
bin/adbwifiqr.js    Installed terminal entry point
src/cli.js         Commands, QR generation, discovery, pairing
src/adb.js         ADB runner, environment, address parsing
src/discovery.js   Direct network discovery with ADB fallback
src/ui.js          Terminal interface
test/              Automated tests
.github/workflows/ Cross-platform CI
```

No build step is required. Validate changes with:

```bash
npm test
node bin/adbwifiqr.js --help
npm pack --dry-run
```

GitHub Actions checks Node.js 22 and 24 on Linux, Windows, and macOS, including installing the packaged command and running its help screen. These checks do not pair real phones or verify your network. See the [Actions page](https://github.com/workwithmanish/adbwifiqr/actions) for actual results.

## Reliability and supported environments

The automated checks cover Node.js 22 and 24 on GitHub's Ubuntu, Windows, and macOS runners. npm 12 GitHub installation is checked on all three operating systems with its required per-command Git permission. Kali installation uses the documented prerequisites; the hosted Linux runner is Ubuntu, not Kali.

The 29 tests check argument validation, missing/non-executable/unresponsive ADB, connection failure exit codes, empty device lists, discovery errors, and the QR pairing sequence using simulated ADB responses. Discovery regressions cover empty/stalled ADB backends, unrelated pairing services, IPv4/IPv6 service addresses, and listener cleanup. Packaging checks ensure that only the intended application files ship. These tests run on each push and pull request.

QR discovery listens directly for the phone's `_adb-tls-pairing._tcp` service while querying ADB as a fallback. The first matching service wins; an empty ADB backend cannot block the direct listener. `doctor` reports an empty ADB discovery status explicitly rather than printing a blank section. A real local UDP advertisement smoke test is available with `node scripts/discovery-smoke.cjs`; it tests multicast reception, not Android pairing.

Phone models, Android vendor changes, router isolation, VPNs, firewalls, VM networking, and user permissions can still cause issues. Passing automation does not guarantee every phone/network combination. Run `adbwifiqr doctor` after installation and use pairing-code mode if discovery is blocked. See [TESTING.md](TESTING.md) for real-device verification steps and the release checklist.

For reproducible installation, you can replace `github:workwithmanish/adbwifiqr` with `github:workwithmanish/adbwifiqr#FULL_COMMIT_SHA` in the documented command. A full commit SHA selects that exact source revision; the unpinned command installs the current default branch.

## Privacy

Use this with devices you own or have permission to debug. QR credentials are generated in memory and are not saved by the app. Manual pairing codes are typed visibly, so keep the terminal private. Your installed command's Android home is described under Settings; dependencies and package files do not contain your pairing keys.

Stopping this tool does not revoke completed pairing or stop the shared ADB server. Revoke access on the phone when needed. In a source checkout, `.android/`, npm cache, dependencies, downloaded Platform Tools, and environment files are ignored by Git. Global installation uses npm's normal cache unless you override it.

## References

- [Android wireless debugging](https://developer.android.com/tools/adb#connect-to-a-device-over-wi-fi)
- [Google Platform Tools downloads](https://developer.android.com/tools/releases/platform-tools)
- [Node.js downloads](https://nodejs.org/en/download)
- [npm installation documentation](https://docs.npmjs.com/cli/v11/commands/npm-install/)
- [Homebrew Platform Tools](https://formulae.brew.sh/cask/android-platform-tools)

Thanks for using ADB Wi-Fi QR. [GitHub · workwithmanish](https://github.com/workwithmanish)

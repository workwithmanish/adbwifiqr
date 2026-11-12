# ADB Wi-Fi QR

**Pair Android over Wi-Fi, directly from your terminal.**

QR pairing · Automatic connection discovery · Pairing-code fallback · ADB shell guidance

[Install](#install) · [Pair](#pair-your-phone) · [Open a shell](#open-an-adb-shell) · [Commands](#commands) · [Troubleshooting](#troubleshooting) · [Update](#update)

## Install

Install the latest code from GitHub's HTTPS source archive:

```bash
npm install -g --allow-remote=all --prefer-online "https://codeload.github.com/workwithmanish/adbwifiqr/tar.gz/refs/heads/main"
adbwifiqr
```

No version tag is required. The installed command works from any directory. This project is not published to the npm registry; use the full archive URL above, not `npm install -g adbwifiqr`.

**Why an archive?** Some npm Git-install paths call the deprecated `url.parse()` API and produce `DEP0169` before the app starts. HTTPS archive installation avoids that Git helper. Warnings are not disabled or filtered. CI installs with a test hook that fails if `url.parse()` is invoked at all.

`--allow-remote=all` permits this remote archive for the current invocation, as required by npm 12. It does not change global npm settings. If older npm rejects that option, omit it. `--prefer-online` requests freshness checks for updates from the same URL.

### Requirements

| Item | Requirement |
| --- | --- |
| Computer | Windows, Linux (including Kali), or macOS |
| Node.js | 22 or newer, preferably a supported LTS release; npm included |
| ADB | Recent Android SDK Platform Tools with `adb pair` support |
| Phone | Android 11+ with Wireless debugging available |
| Network | Both devices on the same trusted network, with device-to-device traffic allowed |

No phone root, USB cable, Android Studio, or global Git installation is needed for archive installation. This is a computer-side pairing tool, not a phone app or screen mirror.

### Kali Linux: fresh installation

Install prerequisites and check their versions:

```bash
sudo apt update
sudo apt install -y nodejs npm adb
node --version
npm --version
adb version
```

Node must show `v22` or newer. Package versions depend on your repositories. If needed, install a supported LTS version using the [Node.js download instructions](https://nodejs.org/en/download). If ADB lacks `pair`, install [Google Platform Tools](https://developer.android.com/tools/releases/platform-tools) and configure `ADB_PATH` below.

Install into a user-owned folder so npm does not need sudo:

```bash
mkdir -p "$HOME/.local"
npm install -g --prefix "$HOME/.local" --allow-remote=all --prefer-online "https://codeload.github.com/workwithmanish/adbwifiqr/tar.gz/refs/heads/main"
export PATH="$HOME/.local/bin:$PATH"
hash -r
adbwifiqr --version
adbwifiqr doctor
adbwifiqr
```

The current release is **1.4.0**. Add the following line once to `~/.zshrc` (or `~/.bashrc` for Bash), then reopen the terminal, to keep the command on PATH:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

Use `echo "$SHELL"` to check your shell. Run npm and the tool as your regular user. For Kali inside VirtualBox/VMware, the VM must reach the phone; bridged networking is often needed for multicast discovery. Internet access through NAT alone does not prove discovery will work.

### Windows (PowerShell)

Install [Node.js LTS](https://nodejs.org/en/download) and extract the Windows ZIP from [Google Platform Tools](https://developer.android.com/tools/releases/platform-tools). Reopen PowerShell. Add the extracted `platform-tools` folder to PATH or set its actual executable location:

```powershell
$env:ADB_PATH = 'C:\your\path\platform-tools\adb.exe'
npm install -g --allow-remote=all --prefer-online "https://codeload.github.com/workwithmanish/adbwifiqr/tar.gz/refs/heads/main"
adbwifiqr doctor
adbwifiqr
```

Replace the sample ADB path first. If PowerShell blocks `.ps1` scripts, use `npm.cmd` and `adbwifiqr.cmd`. No execution-policy change is needed.

### macOS

If you use [Homebrew](https://brew.sh/):

```bash
brew install node
brew install --cask android-platform-tools
```

Alternatively, install Node.js and Platform Tools from the official links above. Then use the user-owned installation:

```bash
mkdir -p "$HOME/.local"
npm install -g --prefix "$HOME/.local" --allow-remote=all --prefer-online "https://codeload.github.com/workwithmanish/adbwifiqr/tar.gz/refs/heads/main"
export PATH="$HOME/.local/bin:$PATH"
adbwifiqr doctor
adbwifiqr
```

Add the PATH line once to your shell configuration, usually `~/.zshrc`. Other Linux distributions can follow the same installation after installing compatible Node.js, npm, and ADB. On ARM, choose ADB binaries built for your architecture.

### Install an exact release (optional)

The main-branch archive above selects the latest code. For a repeatable version, use a tag archive instead:

```bash
npm install -g --allow-remote=all "https://codeload.github.com/workwithmanish/adbwifiqr/tar.gz/refs/tags/v1.4.0"
```

Keep the same `--prefix` option if you used a user-owned installation. GitHub shorthand installations may still work, but may trigger npm's deprecated Git URL parser; use the archive route to avoid that code path.

## Pair your phone

1. Connect your computer and phone to the same trusted Wi-Fi/network.
2. Enable Developer options on Android: usually **Settings > About phone > Build number**, then tap seven times. Some brands place Build number under Software information. Enter your PIN if asked.
3. Open **Settings > Developer options > Wireless debugging**, turn it on, and approve the trusted network.
4. Run `adbwifiqr` on the computer.
5. On Android, choose **Pair device with QR code** and scan using that scanner, not the ordinary camera app.

The terminal groups the result and next action into panels:

```text
  ┌──────────────────────────────────────────────┐
  │  PAIRED · CONNECTION PENDING                 │
  ├──────────────────────────────────────────────┤
  │  Pairing      Complete                       │
  │  Connection   Needs one more step            │
  │  Phone IP     192.168.1.5                     │
  │  ADB address  Connection port not discovered │
  └──────────────────────────────────────────────┘
```

A **READY TO USE** result means the phone is connected. The app automatically searches for the paired phone's connection service up to three times. When it discovers the port, it attempts to connect and displays the address. If connection fails, it prints the exact detected `adb connect IP:PORT` command.

If the network does not expose the port, the app shows the known IP with a `<PORT>` placeholder. Read only the connection port on Android's main Wireless debugging page. The tool cannot reliably infer that port from the pairing port and never guesses one.

Press **Ctrl+C** to stop waiting. A fresh QR is generated for each run. Completed pairing remains valid after the tool exits until revoked on Android.

### Pair with a six-digit code

```bash
adbwifiqr pair
```

On Android, choose **Wireless debugging > Pair device with pairing code**. Enter the dialog's IP/pairing port and six-digit code when prompted. Keep that dialog open until pairing completes. Then return to the **main Wireless debugging page** and enter its connection IP and port.

**Pairing and connection use different ports.** Manual address prompts currently support IPv4; IPv6-only networks are not supported by those prompts.

## Open an ADB shell

QR pairing authorizes your computer; an active connection is needed before a shell can open. Once the app reports connected:

```bash
adb devices
adb shell
```

If it says `adb: no devices/emulators found`:

1. On Android, open the **main Wireless debugging page**.
2. Find **IP address & Port** there, outside the QR scanner/pairing-code dialog.
3. Connect using that current address, then open the shell:

```bash
adb connect 192.168.0.182:36099
adb devices
adb shell
```

Replace that example with your actual address. The port can change when Wireless debugging restarts. Do not reuse the port from a pairing-success message. A device listed with state `device` is connected. A phone prompt such as `snow:/ $` means you are in its shell; type `exit` to return to your computer.

With multiple devices, use the serial shown by `adb devices`:

```bash
adb -s 192.168.0.182:36099 shell
```

If you configured a custom `ADB_PATH`, use that same ADB executable for direct `adb` commands too.

## Commands

| Command | Purpose |
| --- | --- |
| `adbwifiqr` | Pair by QR, then attempt connection |
| `adbwifiqr pair` | Pair using a six-digit code |
| `adbwifiqr doctor` | Check ADB, network discovery, and devices |
| `adbwifiqr devices` | List active device states |
| `adbwifiqr connect IP:PORT` | Connect an already-paired phone |
| `adbwifiqr --help` | Show commands |
| `adbwifiqr --version` | Print only the installed version |

### Custom ADB and settings

`ADB_PATH` selects an executable; the app otherwise uses `adb` from PATH.

```bash
export ADB_PATH="/your/path/platform-tools/adb"
adbwifiqr doctor
```

PowerShell equivalent: `$env:ADB_PATH = 'C:\your\path\platform-tools\adb.exe'`.

The installed command stores Android settings/keys in `~/.adbwifiqr/.android` or `%USERPROFILE%\.adbwifiqr\.android`. Set `ADBWIFIQR_HOME` to a different writable directory to override this. Package updates do not delete those settings. ADB is a shared background server and can retain keys/settings from an already-running instance.

Use a Unicode-capable terminal and monospaced font. Text colors and animation are disabled for redirected output. `NO_COLOR=1 adbwifiqr` disables text colors on Linux/macOS; on PowerShell set `$env:NO_COLOR = '1'`. This appearance option does not suppress errors or Node warnings.

## Troubleshooting

| Problem | Action |
| --- | --- |
| `DEP0169` during the old GitHub shorthand install | Use the HTTPS archive command in Install. npm's Git helper contains a deprecated `url.parse()` call; this route avoids it without disabling warnings. |
| `EALLOWREMOTE` | Include `--allow-remote=all` in the archive installation command for npm 12. |
| `EALLOWGIT` with an old command | Switch to the documented archive installation; it does not fetch a Git dependency. |
| `EACCES` when installing | Use the user-owned npm prefix above; do not use sudo npm. |
| Command not found / old version | Reopen the terminal, check PATH, and run `type -a adbwifiqr` or PowerShell's `Get-Command adbwifiqr -All`. |
| ADB not found or lacks pairing | Install recent Platform Tools and set `ADB_PATH`. |
| QR pairing hangs | Check Wi-Fi, VPN, firewall, and VM networking. Try `adbwifiqr pair`. |
| Code expired | Open a new code dialog and retry. |
| Paired but disconnected | Use the connection command/address shown by the app. If the port is unknown, read it on Android's main Wireless debugging page. |
| Connection refused | Recheck the phone's current address and ensure Wireless debugging is on. |
| Shell says no devices | Run `adb connect IP:PORT`, check `adb devices`, then `adb shell`. |
| QR is distorted | Maximize the terminal, reduce font size, or use code pairing. |
| PowerShell blocks scripts | Use `npm.cmd` and `adbwifiqr.cmd`. |

Code pairing bypasses discovery but still requires a direct network route to the phone. Guest/office networks can isolate devices. Allow ADB on your trusted private network if prompted; do not disable your firewall.

If multiple ADB versions conflict, close other ADB tools and restart the selected server. `adb kill-server` disconnects other active ADB sessions; then run `adbwifiqr doctor`. For custom ADB paths, invoke that executable with `kill-server` instead. Never share private keys, pairing codes, or live QR credentials in bug reports.

## Update

Use the same prefix as your original installation:

```bash
npm install -g --prefix "$HOME/.local" --allow-remote=all --prefer-online "https://codeload.github.com/workwithmanish/adbwifiqr/tar.gz/refs/heads/main"
hash -r
adbwifiqr --version
```

Omit `--prefix "$HOME/.local"` if you installed into npm's default global prefix. The app's settings persist. The updated command can replace an older GitHub-based installation in the same prefix.

### Repeat a fresh-install test

1. On Android, choose **Wireless debugging > Paired devices > this computer > Forget**.
2. Uninstall from the same npm prefix used previously:

```bash
npm uninstall -g --prefix "$HOME/.local" adbwifiqr
```

For the default global prefix, use `npm uninstall -g adbwifiqr` instead.

3. Run the installation commands above, confirm the version, and scan a fresh QR.
4. Check `adbwifiqr devices` and `adb shell` before attempting a manual fallback if you are testing automatic connection.

You do not need to delete private settings to retest pairing after forgetting the computer on Android. Uninstalling the npm package alone does not revoke phone authorization.

## Development and verification

Source checkout (Git is needed only for this method):

```bash
git clone https://github.com/workwithmanish/adbwifiqr.git
cd adbwifiqr
npm ci --cache .npm-cache
npm test
npm start
```

Source equivalents: `npm run doctor`, `npm run pair`, `npm run devices`, and `npm start -- connect IP:PORT`. Source commands default to the checkout's `.android/` settings unless `ADBWIFIQR_HOME` is set. Update a source clone with `git pull --ff-only` followed by `npm ci --cache .npm-cache`.

The 42 tests cover CLI behavior, ADB failures, connection discovery, DNS parsing, exit codes, panel wrapping, and script-friendly version output. CI checks Node.js 22/24 and packaged installation across Linux, Windows, and macOS. npm 12 archive installs run with a test-only hook that throws on deprecated `url.parse()` calls; it does not hide warnings. Runtime tests also run with deprecations configured to fail.

The direct discovery engine remains pinned to `node-dns-sd` 0.4.2. Changes to the presentation do not replace it. Packaging checks exclude Android keys, caches, and test fixtures from the npm-packed artifact. Source archives contain the public source checkout; private runtime data is ignored by Git and is not in the repository.

[Actions results](https://github.com/workwithmanish/adbwifiqr/actions) · [Real-device checklist](TESTING.md) · [Report an issue](https://github.com/workwithmanish/adbwifiqr/issues)

Automated pairing tests simulate ADB. They do not guarantee every phone/router combination. User-reported Kali testing confirmed QR pairing and manual `adb connect` followed by `adb shell`; automatic connection still depends on discovering the phone's connection service.

## Privacy and cleanup

Only debug devices you own or have permission to use, on trusted networks. QR credentials are generated in memory. Pairing codes are typed visibly; keep the screen private. Stopping this app does not revoke pairing or stop the shared ADB server.

To remove access, Forget the computer on Android and turn off Wireless debugging. Uninstall using the same prefix as installation. The settings folder and separately installed Node.js/ADB remain until you remove them yourself.

## References

- [Android wireless debugging](https://developer.android.com/tools/adb#connect-to-a-device-over-wi-fi)
- [Google Platform Tools](https://developer.android.com/tools/releases/platform-tools)
- [Node.js downloads](https://nodejs.org/en/download)
- [Node.js DEP0169](https://nodejs.org/api/deprecations.html#dep0169-insecure-urlparse)
- [npm Git clone implementation](https://github.com/npm/git/blob/main/lib/clone.js)

Thanks for using ADB Wi-Fi QR. [GitHub · workwithmanish](https://github.com/workwithmanish)

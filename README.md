# ADB Wi-Fi QR

**Connect your Android phone to your computer over Wi-Fi. Scan a QR, connect, and open an ADB shell.**

No USB cable, phone root, or Android Studio required.

[Quick start](#quick-start-kali--linux) · [Connect and open a shell](#3-connect-and-open-a-shell) · [Other systems](#other-systems) · [Help](#common-problems)

## Before you start

- An **Android 11+** phone with Wireless debugging available.
- Your phone and computer on the **same trusted Wi-Fi/network**.
- **Node.js 22+**, npm, and a recent **ADB** installation.

This tool runs on your computer. You do not install it on the phone.

## Quick start: Kali / Linux

**Paste each block once.** Installation is needed only the first time; afterward, just run `adbwifiqr`.

### 1. Install and start

On Kali (or Debian/Ubuntu), install the prerequisites:

```bash
sudo apt update && sudo apt install -y nodejs npm adb && node --version
```

**Check the version before continuing:** it must be `v22` or newer. If it is older, follow the [Node.js LTS installation instructions](https://nodejs.org/en/download). If your ADB does not support `adb pair`, get [current Platform Tools](https://developer.android.com/tools/releases/platform-tools).

Install the latest tool into your user's folder and start it:

```bash
npm install -g --prefix "$HOME/.local" --allow-remote=all --prefer-online "https://codeload.github.com/workwithmanish/adbwifiqr/tar.gz/refs/heads/main" &&
export PATH="$HOME/.local/bin:$PATH" &&
hash -r &&
adbwifiqr
```

Run these project commands as your normal user; `sudo` is only needed for system packages. No Git installation or version tag is required. The install uses an HTTPS archive to avoid the deprecated URL parser in npm's Git-install path. No warnings are suppressed.

### 2. Scan the QR on Android

1. Enable **Developer options**: usually **Settings > About phone > tap Build number seven times**. Enter your PIN if asked.
2. Open **Settings > Developer options > Wireless debugging** and turn it on.
3. Tap **Pair device with QR code** and scan the terminal QR with that scanner, not the ordinary camera.

Wait for the result:

| Terminal result | What to do |
| --- | --- |
| **READY TO USE** | Run `adb shell`. |
| **PAIRED · CONNECTION PENDING** | Follow step 3 below. Pairing has already succeeded. |

The app attempts to discover and connect to your phone automatically. If it finds the connection address but cannot connect, it prints the exact command to run. If the port cannot be discovered, it shows the known IP and asks only for the port.

### 3. Connect and open a shell

**Skip this step if the app already says READY TO USE.**

On your phone, return to the **main Wireless debugging page** and find **IP address & Port**. This is outside the QR scanner and pairing-code dialog.

Edit **only the first line** below to match that address, then paste the whole block into your Linux/macOS terminal:

```bash
PHONE="192.168.0.182:36099"
adb connect "$PHONE" && adb -s "$PHONE" shell
```

**The address above is an example. Use your phone's current address.** The connection port is different from the pairing port and may change when Wireless debugging restarts.

A prompt such as `snow:/ $` means you are inside the phone's shell. Type `exit` to return to your computer.

> Confirmed on Kali: QR pairing succeeded, then connecting with the address on Android's main Wireless debugging page opened `adb shell`. Automatic connection may still require this manual step on networks where the connection service cannot be discovered.

### Next time

Run:

```bash
adbwifiqr
```

If the phone is still paired, you can use its current connection address with the step 3 block instead of pairing again.

<details>
<summary><strong>Keep the command available after restarting your terminal</strong></summary>

The installation block sets PATH for the current terminal. Add this line **once** to `~/.zshrc` for zsh (usual on Kali) or `~/.bashrc` for Bash, then reopen the terminal:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

Run `echo "$SHELL"` if you are unsure which shell you use. If the command is missing in a new terminal, run the PATH line there and check your shell configuration.

</details>

## Useful commands

| Command | Use it to… |
| --- | --- |
| `adbwifiqr` | Show a fresh pairing QR |
| `adbwifiqr pair` | Use a six-digit pairing code instead |
| `adbwifiqr doctor` | Check ADB and discovery when something fails |
| `adbwifiqr devices` | See connection status |
| `adbwifiqr connect IP:PORT` | Connect an already-paired phone |
| `adbwifiqr --version` | Check the installed version |
| `adb shell` | Open the shell after connecting |

**Code pairing:** run `adbwifiqr pair`, then choose **Wireless debugging > Pair device with pairing code** on Android. Enter that dialog's pairing address and code. After pairing, return to the main Wireless debugging page and enter its separate connection address when prompted.

## Common problems

| Problem | Fix |
| --- | --- |
| `adb shell` says no devices | Pairing is complete but the connection is missing. Follow step 3. |
| Connection refused | Recheck the current address on Android's main Wireless debugging page. Keep Wireless debugging on. |
| QR keeps waiting | Check Wi-Fi/VPN/firewall, or try `adbwifiqr pair`. In a VM, bridged networking may be needed. |
| Command missing or old version | Check PATH and run `type -a adbwifiqr` to find duplicate installations. |
| `EALLOWREMOTE` | Include `--allow-remote=all` in the installation command for npm 12. |
| Older npm rejects `--allow-remote` | Omit that option and repeat the install. |
| `DEP0169` with an old install command | Use the HTTPS archive command above instead of `github:...` installation. |
| ADB missing or too old | Install current [Platform Tools](https://developer.android.com/tools/releases/platform-tools). See custom paths below. |
| Terminal QR is distorted | Maximize the terminal, reduce font size, or use code pairing. |

Use a trusted network that allows devices to communicate. Guest networks, VPNs, firewalls, and VM NAT can block discovery. Code pairing still needs a direct route to the phone. Do not disable your firewall.

## Update

Use the same prefix you installed with. For the recommended Linux/macOS setup, update and check the version in one block:

```bash
npm install -g --prefix "$HOME/.local" --allow-remote=all --prefer-online "https://codeload.github.com/workwithmanish/adbwifiqr/tar.gz/refs/heads/main" &&
export PATH="$HOME/.local/bin:$PATH" &&
hash -r &&
adbwifiqr --version
```

If you installed into npm's default global location, omit `--prefix "$HOME/.local"`. The latest installation does not need a version tag. Android settings and keys persist across updates.

<details>
<summary><strong>Fresh-install testing and uninstalling</strong></summary>

To test as a new user:

1. On Android, choose **Wireless debugging > Paired devices > this computer > Forget**.
2. Uninstall from the same prefix used for installation:

```bash
npm uninstall -g --prefix "$HOME/.local" adbwifiqr
```

For a default global install, use `npm uninstall -g adbwifiqr` instead.

3. Repeat the quick-start installation block and scan a fresh QR.
4. Check whether the app connects automatically before using the manual fallback, if that is what you are testing.

Uninstalling alone does not revoke phone pairing. You do not need to delete the private settings folder after forgetting the computer on Android. To stop debugging, Forget the computer and turn Wireless debugging off. Separately installed Node.js and ADB remain installed.

</details>

## Other systems

<details>
<summary><strong>Windows / PowerShell</strong></summary>

Install [Node.js LTS](https://nodejs.org/en/download) and extract [Platform Tools for Windows](https://developer.android.com/tools/releases/platform-tools). Reopen PowerShell. Add the extracted folder to PATH or select the executable below using its actual location.

```powershell
$env:ADB_PATH = 'C:\your\path\platform-tools\adb.exe'
npm install -g --allow-remote=all --prefer-online "https://codeload.github.com/workwithmanish/adbwifiqr/tar.gz/refs/heads/main"
if ($LASTEXITCODE -eq 0) { adbwifiqr }
```

Replace the ADB path first. Scan using Android's Wireless debugging QR scanner. If manual connection is needed, use the main page's actual address:

```powershell
$phoneAddress = '192.168.0.182:36099'
adb connect $phoneAddress
adb -s $phoneAddress shell
```

If PowerShell blocks scripts, use `npm.cmd` and `adbwifiqr.cmd`. You do not need to change execution policy.

</details>

<details>
<summary><strong>macOS</strong></summary>

If you use [Homebrew](https://brew.sh/), install prerequisites:

```bash
brew install node && brew install --cask android-platform-tools
```

Alternatively, use the official Node.js and Platform Tools downloads. Then paste the **Install the latest tool** block from step 1. The QR and shell steps are the same as Linux. Add the PATH line to your shell configuration, usually `~/.zshrc`.

</details>

<details>
<summary><strong>Custom ADB path, settings, and exact releases</strong></summary>

Set `ADB_PATH` to an executable, not a folder:

```bash
export ADB_PATH="/your/path/platform-tools/adb"
adbwifiqr doctor
```

On Windows use `$env:ADB_PATH = 'C:\your\path\platform-tools\adb.exe'`. For direct `adb` commands, use that same executable if it is not on PATH. Select ADB binaries matching your CPU architecture.

The installed command stores private settings/keys under `~/.adbwifiqr/.android` or `%USERPROFILE%\.adbwifiqr\.android`. `ADBWIFIQR_HOME` can select another writable directory. ADB is a shared background server; an existing instance may retain its original settings. Restarting it with `adb kill-server` disconnects other ADB sessions, so close other ADB tools first if you need to resolve a conflict.

For a fixed release, replace `refs/heads/main` in the installation URL with `refs/tags/v1.4.0`. Tags are optional; the normal command gets the latest code. The project is distributed through GitHub, not the npm registry.

Manual address prompts accept IPv4. They do not support IPv6-only networks. Use a Unicode-capable terminal and monospaced font. `NO_COLOR=1 adbwifiqr` disables text colors without suppressing errors or warnings.

</details>

<details>
<summary><strong>Development and testing</strong></summary>

No build step is needed. To work from source:

```bash
git clone https://github.com/workwithmanish/adbwifiqr.git &&
cd adbwifiqr &&
npm ci --cache .npm-cache &&
npm test &&
npm start
```

Source equivalents include `npm run doctor`, `npm run pair`, `npm run devices`, and `npm start -- connect IP:PORT`. Source commands default to the checkout's `.android/` directory unless `ADBWIFIQR_HOME` is set.

The 42 tests cover commands, ADB errors, discovery, DNS parsing, connection states, and UI formatting. CI checks Node 22/24 and packaged installation on Linux, Windows, and macOS. Archive-install checks fail if npm invokes deprecated `url.parse()`; warnings are not hidden. Pairing tests simulate ADB, so real-phone and network verification still matter. The direct discovery library is pinned to `node-dns-sd` 0.4.2.

[Actions results](https://github.com/workwithmanish/adbwifiqr/actions) · [Real-device checklist](TESTING.md)

</details>

## Need help?

[Open an issue](https://github.com/workwithmanish/adbwifiqr/issues) with your OS, Node/npm/ADB versions, command, and sanitized error output. Never share private keys, pairing codes, or live QR credentials. Only debug devices you own or have permission to use.

[Android wireless debugging guide](https://developer.android.com/tools/adb#connect-to-a-device-over-wi-fi)

Thanks for using ADB Wi-Fi QR. [workwithmanish](https://github.com/workwithmanish)

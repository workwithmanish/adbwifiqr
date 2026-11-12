# adb / wifi qr

**Pair your Android phone from your terminal. No USB cable needed.**

A minimal terminal tool for Android wireless debugging, with QR pairing, a six-digit pairing-code fallback, connection checks, and a clean interface.

[Installation](#installation) · [Pair your phone](#pair-your-phone) · [Commands](#commands) · [Troubleshooting](#troubleshooting) · [Update](#update)

## What does it do?

ADB (Android Debug Bridge) lets a computer communicate with Android for app installation and debugging. This tool generates a QR code, discovers the matching phone on your local network, and asks ADB to pair it. Android can then connect automatically; a manual connection command is available if needed.

This is a **computer-side terminal tool**, not a phone app or screen-mirroring application. No Android Studio, phone root, or USB connection is needed for this pairing flow. ADB must be installed separately.

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

      [A fresh, scannable QR code appears here]
```

## Requirements

| Requirement | Details |
| --- | --- |
| Computer | Windows, Linux (including Kali), or macOS |
| Node.js and npm | Node.js **22 or newer**; a supported LTS release is recommended |
| ADB | Recent Android SDK Platform Tools, with `pair` and `mdns` support |
| Phone | Android **11 or newer**, with Wireless debugging available |
| Network | Phone and computer on the same local network, with communication between devices allowed |
| Git | For cloning and updating; a repository ZIP is also available |

Windows has been checked locally. The GitHub Actions workflow checks JavaScript tests and the help command on Ubuntu, Windows, and macOS. It does not test real-phone pairing or your network. Check the [Actions page](https://github.com/workwithmanish/adbwifiqr/actions) for run results.

## Installation

Choose your operating system. Run the project commands as your normal user. Administrator privileges are needed only for installing system packages, where shown.

### Kali Linux

Open your Kali terminal and install the prerequisites:

```bash
sudo apt update
sudo apt install -y git nodejs npm adb
```

Verify the installed versions:

```bash
node --version
npm --version
adb version
adb help
```

Node must report `v22` or newer. ADB help must include `pair` and `mdns`. Package versions depend on your Kali repositories. If Node is too old, install a supported LTS version using the [official Node.js download instructions](https://nodejs.org/en/download). If ADB is too old or lacks discovery support, use [Google's current Platform Tools](https://developer.android.com/tools/releases/platform-tools) and the [custom ADB path](#use-a-specific-adb-installation) instructions below.

Download and run the project:

```bash
git clone https://github.com/workwithmanish/adbwifiqr.git
cd adbwifiqr
npm ci --cache .npm-cache
npm run doctor
npm start
```

Now follow [Pair your phone](#pair-your-phone). Do **not** use `sudo npm start` or `sudo npm ci`; normal user permissions are sufficient.

**Using Kali in VirtualBox or VMware?** The virtual machine must be able to reach the phone. Bridged networking is often needed for local multicast discovery. NAT can prevent QR discovery even when the VM can access the internet. If discovery is unavailable but the phone is reachable, use `npm run pair` and then enter the main-screen connection address.

### Windows (PowerShell)

Install [Node.js LTS](https://nodejs.org/en/download) and [Git for Windows](https://git-scm.com/downloads/win). Reopen PowerShell after installation.

Download the Windows ZIP from [Google's Platform Tools page](https://developer.android.com/tools/releases/platform-tools). Extract it to a location you can find. Add its `platform-tools` folder to PATH or select its `adb.exe` with `ADB_PATH` below.

```powershell
git clone https://github.com/workwithmanish/adbwifiqr.git
cd adbwifiqr
npm ci --cache .npm-cache
```

If ADB is not on PATH, set its actual location for this terminal. For example, if you extracted `platform-tools` into the project folder:

```powershell
$env:ADB_PATH = (Resolve-Path .\platform-tools\adb.exe).Path
```

Then run:

```powershell
npm run doctor
npm start
```

If PowerShell blocks `npm.ps1`, use `npm.cmd` instead of `npm` in these commands. No execution-policy change is needed.

**Already using `D:\adbwifiqr`?** Run `cd D:\adbwifiqr` and skip cloning. Follow [Update](#update) to get changes.

### macOS

If you already use [Homebrew](https://brew.sh/), install the prerequisites:

```bash
brew install node git
brew install --cask android-platform-tools
```

Alternatively, install Node.js from its [official download page](https://nodejs.org/en/download), Git from [its download page](https://git-scm.com/downloads/mac), and ADB from [Google's Platform Tools page](https://developer.android.com/tools/releases/platform-tools). Configure `ADB_PATH` if ADB is not on PATH.

```bash
git clone https://github.com/workwithmanish/adbwifiqr.git
cd adbwifiqr
npm ci --cache .npm-cache
npm run doctor
npm start
```

### Other Linux distributions

Install Git, Node.js 22+ with npm, and a recent ADB using your distribution's package manager or the official downloads linked above. The Kali `apt` instructions also apply to many Debian/Ubuntu systems, but their packaged Node.js and ADB versions may differ. Check the versions before continuing.

Then use the same clone, `npm ci`, `npm run doctor`, and `npm start` commands as Kali. On ARM systems, select tools built for your architecture; do not assume Google's Linux ZIP matches your CPU.

### Download without Git

On [the repository page](https://github.com/workwithmanish/adbwifiqr), choose **Code > Download ZIP**, extract it, and open a terminal inside the extracted folder. Then run:

```bash
npm ci --cache .npm-cache
npm run doctor
npm start
```

Git update commands do not work for a ZIP download. Download a new ZIP for newer versions.

## Pair your phone

1. Connect your phone and computer to the same trusted local network. Avoid guest networks that isolate devices.
2. Enable Developer options on your phone. Usually: **Settings > About phone > Build number**, then tap Build number seven times. Some brands put it under Software information. Enter your phone PIN if asked.
3. Open **Settings > Developer options > Wireless debugging**. Turn it on and approve your trusted network if prompted.
4. On the computer, run `npm start` inside the project folder.
5. On the phone, tap **Pair device with QR code** and scan the terminal's QR using that scanner, not the ordinary camera app.
6. Wait for **Pairing complete**, then verify the connection:

```bash
npm run devices
```

A device marked **connected** is ready for ADB use. Pairing and connection are separate steps: if pairing succeeds but the device is absent, use [Connect after pairing](#connect-after-pairing).

The QR is usable only while this pairing session is running. Each new run creates new credentials. Press **Ctrl+C** to stop waiting; already completed pairing remains on the phone.

### Pair using a six-digit code

Use this if the QR is difficult to scan or multicast discovery does not work:

```bash
npm run pair
```

1. On the phone, open **Wireless debugging > Pair device with pairing code**.
2. Enter the dialog's **IP address and pairing port**, for example `192.168.1.5:40123`, when the terminal asks.
3. Enter the **six-digit pairing code**. Keep the dialog open until pairing finishes.
4. Return to the **main Wireless debugging screen**.
5. Enter that screen's **IP address and connection port** when prompted.

**The pairing port and connection port are different.** Use each one from the correct screen. The manual prompts currently accept IPv4 addresses; IPv6-only networks are not supported by those prompts.

### Connect after pairing

Use the address on the phone's **main Wireless debugging screen**:

```bash
npm start -- connect 192.168.1.5:37123
npm run devices
```

Replace the sample address with your phone's actual address. The port can change when Wireless debugging restarts. You generally do not need to pair again while this computer remains in the phone's paired-devices list and its ADB keys remain available.

## Commands

Run these from inside the project directory:

| Command | Purpose |
| --- | --- |
| `npm start` | Show a QR code and wait up to three minutes for pairing |
| `npm run pair` | Pair with a six-digit code, then connect |
| `npm run doctor` | Check ADB, discovery, nearby services, and devices |
| `npm run devices` | List devices and their connection states |
| `npm start -- connect IP:PORT` | Connect an already-paired phone |
| `npm start -- --help` | Show available commands |
| `npm test` | Run automated tests; no phone required |

This project is installed from GitHub and run locally. It is not published to npm; `npm install -g adbwifiqr` and `npx adbwifiqr` are not the installation method.

### Use a specific ADB installation

Set `ADB_PATH` to the **full executable path**, not just its folder. The setting lasts for the current terminal and applies to all project commands.

Linux/macOS, with Platform Tools extracted into this project:

```bash
export ADB_PATH="$PWD/platform-tools/adb"
npm run doctor
```

Windows PowerShell:

```powershell
$env:ADB_PATH = (Resolve-Path .\platform-tools\adb.exe).Path
npm run doctor
```

Without `ADB_PATH`, the tool runs `adb` from your PATH. It does not download ADB or change your system PATH.

### Appearance

Use a Unicode-capable terminal and monospaced font. QR modules are left uncolored for scanning. Text colors and animation are disabled when output is redirected. To disable text colors interactively:

```bash
NO_COLOR=1 npm start
```

PowerShell equivalent:

```powershell
$env:NO_COLOR = '1'
npm start
```

## Troubleshooting

| Problem | What to try |
| --- | --- |
| `node`, `npm`, or `git` not found | Install the prerequisite, reopen the terminal, and check its version. |
| Unsupported Node version | Install Node.js 22+; use a supported LTS release. |
| ADB not found | Install Platform Tools and configure `ADB_PATH` or PATH. |
| ADB lacks `pair` or `mdns` | Install current Platform Tools and ensure the app uses that executable. |
| No nearby services / QR times out | Enable Wireless debugging; check the network, VPN, firewall, and VM networking. Try `npm run pair`. |
| Pairing code rejected | Open a fresh code dialog and retry before it expires. |
| Paired but not connected | Run `npm start -- connect IP:PORT` using the main screen's connection port. |
| Connection refused | Recheck the phone's current IP and port and confirm Wireless debugging is on. |
| Device offline or unauthorized | Unlock the phone, check prompts, and retry. If necessary, Forget this computer on the phone and pair again. |
| QR looks distorted | Maximize the terminal, reduce the font size, and avoid line wrapping. Use code pairing if scanning still fails. |
| PowerShell blocks npm | Use `npm.cmd`, for example `npm.cmd start`. |
| Permission errors on Linux | Keep the checkout writable by your user and run npm without sudo. |

If Windows asks about firewall access, allow ADB on your trusted private network. Avoid disabling the firewall. School, office, and guest networks can block device-to-device traffic or mDNS; pairing-code mode still requires a direct network route to the phone.

ADB is a shared background service. An existing server may use keys or settings from another installation. If there are conflicting ADB versions or settings, close other ADB tools and restart the server with your selected ADB executable. **This disconnects other active ADB sessions.** For the default PATH executable:

```bash
adb kill-server
npm run doctor
```

For a custom executable, run that executable with `kill-server` instead. Then pair again if needed. If you need help, [open an issue](https://github.com/workwithmanish/adbwifiqr/issues) with your operating system, Node version, ADB version, and error text. Do not include QR credentials, pairing codes, private keys, or personal device information.

## Update

For a Git clone, open a terminal in the project folder and run:

```bash
git pull --ff-only
npm ci --cache .npm-cache
npm run doctor
```

If Git reports local changes or divergent history, save your edits and resolve that before updating. This command will not overwrite them forcibly. Check the requirements again after an update.

To run the tool later:

```bash
cd /path/to/adbwifiqr
npm start
```

On your Windows computer, the folder is `D:\adbwifiqr`. On Kali, if you cloned from your home directory, use `cd ~/adbwifiqr`.

## Development

No build step is needed. Edit the JavaScript files and run the command again.

```text
src/
  cli.js          Commands, QR generation, discovery, and pairing
  adb.js          ADB process runner, environment, and address parsing
  ui.js           Terminal layout, messages, animation, and footer
test/
  adb.test.js     Discovery, address, and platform environment tests
.github/workflows/
  ci.yml          Automated checks on Linux, Windows, and macOS
```

```bash
npm ci --cache .npm-cache
npm test
node src/cli.js --help
```

Tests cover discovery parsing, IPv4 endpoint validation, and Windows/Linux/macOS ADB environment configuration. GitHub Actions runs tests and CLI smoke checks on Node.js 22 and 24 across Ubuntu, Windows, and macOS. It does not run ADB or pair real devices. See the [Actions page](https://github.com/workwithmanish/adbwifiqr/actions) for actual results.

## Privacy and cleanup

Use this with devices you own or have permission to debug, on a trusted network. QR credentials are generated in memory for each run and are not saved by this tool. Manual pairing codes are typed visibly in the terminal; keep your screen private while pairing.

The app configures its Android home and keys under `.android/` inside the project. The documented install command keeps npm's cache in `.npm-cache/`. Dependencies live in `node_modules/`. Those folders, downloaded Platform Tools, and `.env` files are ignored by Git. An already-running ADB server can retain its original keys and settings; the project cannot isolate that shared server simply by changing a child process's environment.

To revoke access, open **Wireless debugging > Paired devices**, tap the computer, and choose **Forget**. Turn off Wireless debugging when finished. Stopping this tool does not stop the shared ADB server or revoke an existing pairing.

To uninstall, revoke pairing on the phone, stop the tool, and remove its project folder. Any Node.js, Git, or ADB installation you made separately remains installed.

## References

- [Android: connect a device over Wi-Fi](https://developer.android.com/tools/adb#connect-to-a-device-over-wi-fi)
- [Google SDK Platform Tools downloads](https://developer.android.com/tools/releases/platform-tools)
- [Node.js downloads](https://nodejs.org/en/download)
- [Kali package tracker: Android Platform Tools](https://pkg.kali.org/pkg/android-platform-tools)
- [Homebrew: Android Platform Tools](https://formulae.brew.sh/cask/android-platform-tools)

Thanks for using ADB Wi-Fi QR. [GitHub · workwithmanish](https://github.com/workwithmanish)

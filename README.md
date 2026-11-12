# ADB Wi-Fi QR

A small terminal application that pairs your Android phone with this PC over Wi-Fi.

ADB means Android Debug Bridge. Developers use it to install apps, read debugging information, and communicate with Android. This tool simplifies pairing; it does not mirror your screen.

## Start here (Windows)

You need Node.js 20 or newer and Android SDK Platform Tools (ADB). Install Node.js from https://nodejs.org/ and see the ADB setup below if `adb` is not available.

1. Open PowerShell or Windows Terminal.
2. Run these commands one line at a time:

```powershell
git clone https://github.com/workwithmanish/adbwifiqr.git D:\adbwifiqr
cd D:\adbwifiqr
npm ci --cache .npm-cache
npm run doctor
npm start
```

If you already have this project in `D:\adbwifiqr`, skip the `git clone` command. Downloading and extracting the repository ZIP into that folder also works if Git is not installed.

3. Connect your PC and phone to the same trusted Wi-Fi network. Your phone must run Android 11 or newer.
4. On the phone, enable Developer options: usually Settings > About phone > tap Build number seven times. Some brands put Build number under Software information. Enter your phone PIN if asked.
5. Open Settings > Developer options > Wireless debugging. Enable it and allow the current network.
6. Tap **Pair device with QR code**. Use that scanner to scan the QR in your terminal (not your regular camera).
7. Wait for the pairing message. Then check:

```powershell
npm run devices
```

A row ending in `device` (possibly followed by model details) means it is connected. Press Ctrl+C to stop waiting for a scan.

## If QR pairing does not work

Run:

```powershell
npm run pair
```

On the phone choose **Pair device with pairing code**. Enter its IP address and pairing port, then the six-digit code, when the terminal asks. Keep this phone dialog open while entering the code.

After pairing, return to the **main Wireless debugging screen**. Enter that screen's IP address and connection port when asked. The connection port and pairing port are different.

If QR pairing succeeds but no device appears, connect using the main screen's address:

```powershell
npm start -- connect 192.168.1.5:37123
```

Replace the example with your phone's actual IP and connection port. Ports can change when wireless debugging restarts.

## Troubleshooting

- No discovery: check both devices are on the same Wi-Fi. Guest networks, VPNs, and routers that isolate devices can block discovery. Use the pairing-code fallback.
- Firewall prompt: allow ADB on your trusted private network if you want discovery. Do not disable your firewall.
- Code expired: open a new pairing-code dialog and run `npm run pair` again.
- QR too small or distorted: maximize the terminal, reduce its font size, or use the pairing-code fallback.
- ADB missing on another computer: download Google's Platform Tools from https://developer.android.com/tools/releases/platform-tools and extract the ZIP into this folder, resulting in `D:\adbwifiqr\platform-tools\adb.exe`. In PowerShell run:

```powershell
$env:ADB_PATH = 'D:\adbwifiqr\platform-tools\adb.exe'
npm run doctor
```

This sets the path for the current terminal only. No global installation is needed.

## What the files do

- `package.json`: project information, commands, and dependency list.
- `src/cli.js`: prints a fresh QR, waits for the matching phone, and pairs it; also handles manual pairing.
- `src/adb.js`: runs ADB safely as a separate program and reads discovery results.
- `src/ui.js`: colors, headings, waiting animation, device display, and thank-you footer.
- `test/adb.test.js`: checks discovery parsing and address validation.
- `node_modules/`: downloaded QR library; do not edit it.
- `.android/`: local Android settings and keys. Keep it private.
- `.npm-cache/`: local dependency download cache.

To learn, start by changing the welcome message in `src/cli.js`, save, and run `npm start` again. No build step is needed. Run `npm test` to check the parsing and validation logic.

## Privacy and scope

QR credentials are generated fresh each run and are not saved by this tool. Pair only your own devices on trusted networks. To revoke access, open Wireless debugging on your phone, select this computer, and tap Forget. Turn wireless debugging off when finished.

Project files, npm cache, and the Android home configured by this app stay inside this folder. ADB uses a shared background server on the computer; an already-running server may retain its existing keys/settings. Starting or using ADB can create processes and interact with paired devices. No system PATH or global npm packages are changed by this project.

Real-phone pairing requires your scan or pairing code and must be verified with your phone. Automated tests cannot confirm your Wi-Fi, phone settings, or firewall behavior.

Official Android guide: https://developer.android.com/tools/adb#connect-to-a-device-over-wi-fi

## Author

Thanks for using ADB Wi-Fi QR! Made by [workwithmanish](https://github.com/workwithmanish).

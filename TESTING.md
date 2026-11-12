# Reliability checks

## Automated checks

Run `npm ci --cache .npm-cache`, then `npm test` in a source checkout. The tests run the real CLI with a simulated ADB process boundary; no phone is needed and no actual device is modified.

The workflow checks:

- Node.js 22 and 24 on Ubuntu, Windows, and macOS.
- A packaged global installation, executable entry point, and help command on each platform.
- Actual GitHub installation using npm 12 on all three operating systems.
- Package contents: exactly the intended seven application files, with no Android keys, caches, test fixtures, or dependencies bundled in the archive.
- Argument handling, exit codes, environment configuration, pairing flow, and actionable failure messages.

Run results: https://github.com/workwithmanish/adbwifiqr/actions

Version 1.3.0 also tests direct discovery with an empty or stalled ADB backend, rejects unrelated service names, and checks listener cleanup. Run `node scripts/discovery-smoke.cjs` for an optional real local UDP packet test on port 15353. It sends a synthetic Android-style DNS response through the actual node-dns-sd 0.4.2 library; it does not contact or pair a phone or verify multicast reachability to another device.

## Real-device checks

Version 1.3.1 adds regression checks for automatic connection after pairing: only the paired phone's address is selected, its connection port is used instead of its pairing port, and an unrelated connected device does not count as success. Real-phone confirmation is still required.

These are a checklist, **not a claim that every scenario below has been tested**. Record the OS, Node/npm/ADB versions, phone model, Android version, network type, and result when doing them. Do not record pairing codes, QR credentials, or private keys.

1. Install as a regular user into a writable npm prefix, open a new terminal, and run `adbwifiqr --version` and `adbwifiqr --help` from outside the source directory.
2. Run `adbwifiqr doctor`; confirm ADB starts and displays discovery and device results.
3. On the same trusted Wi-Fi, scan a new QR with Android's Wireless debugging scanner. Confirm pairing, then verify the device is connected using `adbwifiqr devices`.
4. Stop the tool with Ctrl+C while waiting. Confirm the terminal is usable and no waiting animation remains.
5. Forget the computer on the phone. Use `adbwifiqr pair`, enter a fresh code, then the main-screen connection port. Verify connection.
6. Turn Wireless debugging off and on. Connect using the new main-screen address without pairing again, if the phone still remembers the computer.
7. Try an expired code, an incorrect connection port, and Wireless debugging off. Confirm errors do not report a successful connection.
8. Try a network with discovery blocked but direct phone access allowed. Confirm code pairing and manual connection work.
9. Reinstall/update the package. Confirm settings persist and the command remains available from another directory.
10. Uninstall with the same npm prefix. Confirm the executable is removed. Revoke pairing on the phone separately.

For Kali, check a native installation and, if relevant, a VM with bridged networking. A successful Ubuntu CI job does not verify Kali repository package versions or VM multicast access.

## Before sharing a version

- Confirm all GitHub Actions jobs pass for the intended commit.
- Perform QR and code pairing with at least one real Android phone and record the result.
- Confirm installation instructions match the npm version used, especially npm 12's `--allow-git=all` requirement.
- Check README requirements and error examples against the actual commands.
- Keep untested platforms or device combinations explicitly marked as unverified.

## Reporting an issue

Include the command used, OS, Node version, npm version, ADB version, and sanitized error output. Mention whether Kali is native or in a VM and whether pairing-code mode works. Never attach private Android keys or live pairing credentials.

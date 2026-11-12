#!/bin/sh
set -eu

launch=1
case "${1-}" in
  --no-launch) launch=0 ;;
  '') ;;
  *) printf 'Usage: sh install.sh [--no-launch]\n' >&2; exit 1 ;;
esac
case "$(uname -s)" in
  Linux|Darwin) ;;
  *) printf 'Use the Windows installation instructions in README.md.\n' >&2; exit 1 ;;
esac
command -v node >/dev/null 2>&1 || { printf 'Install Node.js 22+ first: https://nodejs.org/en/download\n' >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { printf 'npm is required. Install Node.js with npm first.\n' >&2; exit 1; }
node -e 'if (+process.versions.node.split(".")[0] < 22) { console.error("Node.js 22 or newer is required."); process.exit(1); }'

parent=$(ps -p "$PPID" -o comm= 2>/dev/null | tr -d ' ' || true)
parent=${parent##*/}
parent=${parent#-}
case "$parent" in
  bash|zsh|fish) user_shell=$parent ;;
  *) user_shell=${SHELL:-}; user_shell=${user_shell##*/} ;;
esac
case "$user_shell" in
  bash|zsh|fish) ;;
  *) printf 'Could not detect a supported shell (bash, zsh, fish).\n' >&2; exit 1 ;;
esac

prefix="$HOME/.local"
npm_major=$(npm --version | cut -d . -f 1)
archive='https://codeload.github.com/workwithmanish/adbwifiqr/tar.gz/refs/heads/main'
printf '\nInstalling ADB Wi-Fi QR for %s…\n' "$user_shell"
if [ "$npm_major" -ge 12 ]; then
  npm install -g --prefix "$prefix" --allow-remote=all --prefer-online "$archive"
else
  npm install -g --prefix "$prefix" --prefer-online "$archive"
fi
node "$prefix/lib/node_modules/adbwifiqr/src/setup-shell.js" "$prefix/bin" "$user_shell"
if [ "$launch" -eq 1 ]; then
  if [ -r /dev/tty ] && ( : </dev/tty ) 2>/dev/null; then
    exec "$prefix/bin/adbwifiqr" </dev/tty
  else
    printf 'Installed. Open an interactive terminal and run adbwifiqr.\n'
  fi
fi

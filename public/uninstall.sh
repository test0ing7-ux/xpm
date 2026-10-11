#!/usr/bin/env bash
set -e

# XPM Uninstaller for Linux and macOS
INSTALL_DIR="$HOME/.xpm-bin"

echo "==> Uninstalling XPM from system..."
rm -f "$INSTALL_DIR/xpm"
rm -f "$HOME/.xpm/auth.json"

if [ -d "$INSTALL_DIR" ] && [ -z "$(ls -A "$INSTALL_DIR" 2>/dev/null)" ]; then
    rm -rf "$INSTALL_DIR"
fi

echo "✔ XPM has been uninstalled. Remove '$INSTALL_DIR' from your .bashrc or .zshrc if desired."

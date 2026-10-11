#!/usr/bin/env bash
set -e

# XPM APT Installer for Ubuntu / Debian
# Usage: curl -fsSL https://edvu.in/setup-apt.sh | sudo bash

echo ""
echo -e "\033[31m  __   __ ___  __  __ \033[0m"
echo -e "\033[31m  \\ \\ / /| _ \\|  \\/  |\033[0m"
echo -e "\033[33m   \\ V / |  _/| |\\/| |\033[0m"
echo -e "\033[36m    |_|  |_|  |_|  |_|\033[0m"
echo -e "\033[90m  Universal Native Package Manager - APT Setup\033[0m"
echo ""

if [ "$EUID" -ne 0 ]; then
  echo "❌ Please run as root or with sudo: curl -fsSL https://edvu.in/setup-apt.sh | sudo bash"
  exit 1
fi

TMP_DEB="/tmp/xpm.deb"
echo "==> Downloading xpm.deb from https://edvu.in/xpm.deb..."
curl -fsSL "https://edvu.in/xpm.deb" -o "$TMP_DEB"

echo "==> Installing XPM package via apt..."
if command -v apt-get >/dev/null 2>&1; then
    apt-get update -qq
    apt-get install -y --allow-downgrades "$TMP_DEB"
elif command -v dpkg >/dev/null 2>&1; then
    dpkg -i "$TMP_DEB"
else
    echo "❌ Neither apt nor dpkg found on this system."
    rm -f "$TMP_DEB"
    exit 1
fi

rm -f "$TMP_DEB"

echo ""
echo -e "\033[32m✔ XPM and XPX successfully installed to /usr/bin via APT!\033[0m"
echo "Try running:"
echo "  xpm --help"
echo "  xpx -y cowsay"
echo ""

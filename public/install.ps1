# XPM Installer for Windows PowerShell
# Quick run: irm https://edvu.in/i | iex

$ErrorActionPreference = 'Stop'

# Configure TLS 1.2/1.3 and bypass certificate revocation check on restricted Wi-Fi
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls13
[Net.ServicePointManager]::CheckCertificateRevocationList = $false

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
$zipUrl = "https://edvu.in/xpm-win.zip"
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

# 3. Download via firewall-resilient ZIP bundle (bypasses Wi-Fi .exe blocks)
if (-not $installed) {
    $tempZip = "$env:TEMP\xpm-win-$([Guid]::NewGuid().ToString('N')).zip"
    Write-Host "==> Downloading XPM bundle from $zipUrl..." -ForegroundColor Gray
    try {
        Invoke-WebRequest -Uri $zipUrl -OutFile $tempZip -UseBasicParsing
        
        # Verify download is not a captive portal / firewall block page
        $fileSize = (Get-Item $tempZip).Length
        if ($fileSize -gt 1000000) {
            Write-Host "==> Unpacking binaries to $installDir..." -ForegroundColor Gray
            Expand-Archive -Path $tempZip -DestinationPath $installDir -Force
            Remove-Item -Path $tempZip -Force -ErrorAction SilentlyContinue
            $installed = $true
        } else {
            # Less than 1MB means it's likely a firewall error response HTML
            Remove-Item -Path $tempZip -Force -ErrorAction SilentlyContinue
        }
    } catch {
        Remove-Item -Path $tempZip -Force -ErrorAction SilentlyContinue
    }
}

# 4. Fallback to direct EXE downloads if ZIP failed
if (-not $installed) {
    Write-Host "==> Downloading xpm.exe fallback..." -ForegroundColor Gray
    try {
        Invoke-WebRequest -Uri $xpmExeUrl -OutFile $binPath -UseBasicParsing
        $installed = $true
        try {
            Invoke-WebRequest -Uri $xpxExeUrl -OutFile $xpxBinPath -UseBasicParsing -ErrorAction SilentlyContinue
        } catch {
            # Fallback cmd runner if xpx.exe direct download fails
            $xpxCmdContent = "@echo off`r`n`"%~dp0xpm.exe`" x %*"
            Set-Content -Path "$installDir\xpx.cmd" -Value $xpxCmdContent -Encoding ASCII
        }
    } catch {
        Write-Host "❌ Failed to download XPM binaries: $_" -ForegroundColor Red
        Write-Host "   If you are on a restricted Wi-Fi network, switch to a mobile hotspot or visit https://edvu.in" -ForegroundColor Yellow
        exit 1
    }
}

# Ensure xpx runner exists (if xpx.exe missing, create wrapper)
if (-not (Test-Path $xpxBinPath) -and -not (Test-Path "$installDir\xpx.cmd")) {
    $xpxCmdContent = "@echo off`r`n`"%~dp0xpm.exe`" x %*"
    Set-Content -Path "$installDir\xpx.cmd" -Value $xpxCmdContent -Encoding ASCII
}

# 5. Add to User PATH permanently if not already present
$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
if ($userPath -notlike "*$installDir*") {
    Write-Host "==> Adding $installDir to User PATH..." -ForegroundColor Cyan
    $newPath = if ($userPath) { "$userPath;$installDir" } else { $installDir }
    [Environment]::SetEnvironmentVariable('Path', $newPath, 'User')
}

# 6. Refresh PATH in current session
if ($env:Path -notlike "*$installDir*") {
    $env:Path = "$env:Path;$installDir"
}

Write-Host ""
Write-Host "==> XPM installed successfully!" -ForegroundColor Green
Write-Host "Run 'xpm --help' or 'xpm login' to get started." -ForegroundColor White
Write-Host ""


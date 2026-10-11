# XPM Installer for Windows PowerShell
# Quick run: irm https://edvu.in/install.ps1 | iex

$ErrorActionPreference = 'Stop'

Write-Host ""
Write-Host "  __   __ ___  __  __ " -ForegroundColor Red
Write-Host "  \ \ / /| _ \|  \/  |" -ForegroundColor Red
Write-Host "   \ V / |  _/| |\/| |" -ForegroundColor Yellow
Write-Host "    |_|  |_|  |_|  |_|" -ForegroundColor Cyan
Write-Host "  Native Universal Package Manager" -ForegroundColor Gray
Write-Host ""

$installDir = "$HOME\.xpm-bin"
$binPath = "$installDir\xpm.exe"
$downloadUrl = "https://edvu.in/xpm.exe"
$xpxBinPath = "$installDir\xpx.exe"
$xpxDownloadUrl = "https://edvu.in/xpx.exe"

Write-Host "==> Installing XPM & XPX to $installDir..." -ForegroundColor Cyan

# 1. Create target directory
if (-not (Test-Path $installDir)) {
    New-Item -ItemType Directory -Path $installDir -Force | Out-Null
}

# 2. Download or copy xpm.exe
$localSource = "$PSScriptRoot\xpm.exe"
$parentLocalSource = "$PSScriptRoot\..\public\xpm.exe"

if (Test-Path $localSource) {
    Write-Host "==> Installing xpm from local bundle..." -ForegroundColor Gray
    Copy-Item -Path $localSource -Destination $binPath -Force
} elseif (Test-Path $parentLocalSource) {
    Write-Host "==> Installing xpm from repo bundle..." -ForegroundColor Gray
    Copy-Item -Path $parentLocalSource -Destination $binPath -Force
} else {
    Write-Host "==> Downloading latest xpm.exe from $downloadUrl..." -ForegroundColor Gray
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri $downloadUrl -OutFile $binPath -UseBasicParsing
    } catch {
        Write-Host "❌ Failed to download xpm.exe: $_" -ForegroundColor Red
        exit 1
    }
}

# 3. Download or copy xpx.exe (Package Runner like npx)
$xpxLocalSource = "$PSScriptRoot\xpx.exe"
$xpxParentLocalSource = "$PSScriptRoot\..\public\xpx.exe"

if (Test-Path $xpxLocalSource) {
    Copy-Item -Path $xpxLocalSource -Destination $xpxBinPath -Force
} elseif (Test-Path $xpxParentLocalSource) {
    Copy-Item -Path $xpxParentLocalSource -Destination $xpxBinPath -Force
} else {
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri $xpxDownloadUrl -OutFile $xpxBinPath -UseBasicParsing -ErrorAction SilentlyContinue
    } catch {
        # Fallback to cmd helper if standalone binary download fails
        $xpxCmdContent = "@echo off`r`n`"%~dp0xpm.exe`" x %*"
        Set-Content -Path "$installDir\xpx.cmd" -Value $xpxCmdContent -Encoding ASCII
    }
}

# 3. Add to User PATH if not already present
$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
if ($userPath -notlike "*$installDir*") {
    Write-Host "==> Adding $installDir to User PATH..." -ForegroundColor Cyan
    $newPath = if ($userPath) { "$userPath;$installDir" } else { $installDir }
    [Environment]::SetEnvironmentVariable('Path', $newPath, 'User')
}

# 4. Refresh PATH in current PowerShell session
if ($env:Path -notlike "*$installDir*") {
    $env:Path = "$env:Path;$installDir"
}

Write-Host ""
Write-Host "✔ XPM installed successfully!" -ForegroundColor Green
Write-Host "Run 'xpm --help' or 'xpm login' to get started." -ForegroundColor White
Write-Host ""

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

Write-Host "==> Installing XPM to $installDir..." -ForegroundColor Cyan

# 1. Create target directory
if (-not (Test-Path $installDir)) {
    New-Item -ItemType Directory -Path $installDir -Force | Out-Null
}

# 2. Download latest binary or copy local file if running from repo
$localSource = "$PSScriptRoot\xpm.exe"
$parentLocalSource = "$PSScriptRoot\..\public\xpm.exe"

if (Test-Path $localSource) {
    Write-Host "==> Installing from local bundle ($localSource)..." -ForegroundColor Gray
    Copy-Item -Path $localSource -Destination $binPath -Force
} elseif (Test-Path $parentLocalSource) {
    Write-Host "==> Installing from repo bundle ($parentLocalSource)..." -ForegroundColor Gray
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

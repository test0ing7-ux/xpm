# XPM Uninstaller for Windows PowerShell
# Usage: powershell -ExecutionPolicy Bypass -File uninstall.ps1

$ErrorActionPreference = 'SilentlyContinue'

Write-Host ""
Write-Host "==> Uninstalling XPM from system..." -ForegroundColor Yellow

$installDir = "$HOME\.xpm-bin"
$xpmHome = "$HOME\.xpm"

# 1. Kill any running xpm process if active
Get-Process -Name "xpm" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# 2. Remove all binaries and helper scripts in install directory
$filesToRemove = @("xpm.exe", "xpm-old.exe", "xpm.ps1", "xpm.cmd", "xpm")
foreach ($f in $filesToRemove) {
    $target = Join-Path $installDir $f
    if (Test-Path $target) {
        Remove-Item -Path $target -Force -ErrorAction SilentlyContinue
    }
}

# Remove directory if empty
if (Test-Path $installDir) {
    $items = Get-ChildItem -Path $installDir -ErrorAction SilentlyContinue
    if (-not $items -or $items.Count -eq 0) {
        Remove-Item -Path $installDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# 3. Clean up global credentials / cache if requested (ask or remove)
if (Test-Path "$xpmHome\auth.json") {
    Remove-Item -Path "$xpmHome\auth.json" -Force -ErrorAction SilentlyContinue
}

# 4. Remove installDir from User PATH
$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
if ($userPath -like "*$installDir*") {
    Write-Host "==> Removing $installDir from User PATH..." -ForegroundColor Gray
    $paths = ($userPath -split ';') | Where-Object { $_ -ne $installDir -and $_ -ne "$installDir\" -and $_.Trim() -ne '' }
    $newPath = $paths -join ';'
    [Environment]::SetEnvironmentVariable('Path', $newPath, 'User')
}

# 5. Remove installDir from current session PATH
if ($env:Path -like "*$installDir*") {
    $envPaths = ($env:Path -split ';') | Where-Object { $_ -ne $installDir -and $_ -ne "$installDir\" -and $_.Trim() -ne '' }
    $env:Path = $envPaths -join ';'
}

Write-Host ""
Write-Host "✔ XPM has been completely removed from your system." -ForegroundColor Green
Write-Host ""

param([string]$SigningKey = $env:TAURI_SIGNING_PRIVATE_KEY)
$ErrorActionPreference = 'Stop'
if (-not $SigningKey) { $SigningKey = Join-Path $PSScriptRoot '../.tools/updater/timeflow.key' }
if (-not (Test-Path -LiteralPath $SigningKey)) { throw 'Set TAURI_SIGNING_PRIVATE_KEY to the release signing key path.' }
$previousKey = $env:TAURI_SIGNING_PRIVATE_KEY
try {
    $env:TAURI_SIGNING_PRIVATE_KEY = (Resolve-Path -LiteralPath $SigningKey).Path
    npm.cmd run desktop:build -- -- --locked
    if ($LASTEXITCODE -ne 0) { throw 'Release build failed' }
} finally { $env:TAURI_SIGNING_PRIVATE_KEY = $previousKey }

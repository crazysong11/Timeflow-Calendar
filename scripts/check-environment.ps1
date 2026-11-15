$ErrorActionPreference = 'Stop'
$missing = @()

foreach ($toolName in @('node', 'npm.cmd', 'rustc', 'cargo', 'git')) {
    $command = Get-Command $toolName -ErrorAction SilentlyContinue
    if ($command) {
        $version = & $command.Source --version
        if ($LASTEXITCODE -eq 0) {
            Write-Output ($toolName + ': ' + ($version -join ' '))
        } else {
            $missing += $toolName
        }
    } else {
        $missing += $toolName
    }
}

$vswherePath = Join-Path ${env:ProgramFiles(x86)} 'Microsoft Visual Studio\Installer\vswhere.exe'
if (Test-Path -LiteralPath $vswherePath) {
    $vsPath = & $vswherePath -latest -products '*' -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
    if ($vsPath) {
        Write-Output ('MSVC: ' + $vsPath)
    } else {
        $missing += 'MSVC x64/x86 build tools'
    }
} else {
    $missing += 'Visual Studio C++ Build Tools'
}

$sdkRoot = Join-Path ${env:ProgramFiles(x86)} 'Windows Kits\10\Lib'
$sdkVersions = @(Get-ChildItem -LiteralPath $sdkRoot -Directory -ErrorAction SilentlyContinue | Where-Object {
    (Test-Path -LiteralPath (Join-Path $_.FullName 'um\x64\kernel32.lib')) -and
    (Test-Path -LiteralPath (Join-Path $_.FullName 'ucrt\x64\ucrt.lib'))
})
if ($sdkVersions.Count -gt 0) {
    Write-Output ('Windows SDK: ' + (($sdkVersions | Select-Object -ExpandProperty Name) -join ', '))
} else {
    $missing += 'Windows SDK'
}

$webview = @(foreach ($registryPath in @(
    'HKLM:\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\*',
    'HKLM:\SOFTWARE\Microsoft\EdgeUpdate\Clients\*',
    'HKCU:\SOFTWARE\Microsoft\EdgeUpdate\Clients\*'
)) {
    Get-ItemProperty -Path $registryPath -ErrorAction SilentlyContinue | Where-Object { $_.name -eq 'Microsoft Edge WebView2 Runtime' }
})
if ($webview.Count -gt 0) {
    Write-Output ('WebView2: ' + $webview[0].pv)
} else {
    $missing += 'WebView2 Runtime'
}

if ($missing.Count -gt 0) {
    Write-Output ('Setup needed: ' + ($missing -join ', '))
    exit 1
}

Write-Output 'Windows development prerequisites are ready.'

param(
    [string]$Executable = (Join-Path $PSScriptRoot '..\src-tauri\target\debug\timeflow-calendar.exe')
)

$ErrorActionPreference = 'Stop'
$appPath = (Resolve-Path -LiteralPath $Executable).Path
$processName = [IO.Path]::GetFileNameWithoutExtension($appPath)
if (Get-Process -Name $processName -ErrorAction SilentlyContinue) {
    throw 'Exit Timeflow Calendar from its tray menu before running this check.'
}

$started = [Collections.Generic.List[Diagnostics.Process]]::new()
function Start-TestInstance {
    $process = Start-Process -FilePath $appPath -WindowStyle Hidden -PassThru
    $started.Add($process)
    return $process
}
function Stop-TestInstance([Diagnostics.Process]$process) {
    if (-not $process.HasExited) {
        Stop-Process -InputObject $process
        if (-not $process.WaitForExit(5000)) { throw 'Test process did not exit in time.' }
    }
}
function Assert-SecondaryExits([Diagnostics.Process]$process) {
    if (-not $process.WaitForExit(12000)) { throw 'A repeated launch left a second instance running.' }
    if ($process.ExitCode -ne 0) { throw "Repeated launch exited abnormally: $($process.ExitCode)" }
}

try {
    $primary = Start-TestInstance
    if ($primary.WaitForExit(2000)) { throw 'The primary instance exited early.' }
    1..3 | ForEach-Object { Assert-SecondaryExits (Start-TestInstance) }
    if ($primary.HasExited) { throw 'A repeated launch closed the primary instance.' }
    Write-Output 'PASS: three repeated launches reuse the first instance.'
    Stop-TestInstance $primary

    $burst = @(1..5 | ForEach-Object { Start-TestInstance })
    foreach ($process in $burst) { $null = $process.WaitForExit(3000) }
    $survivors = @($burst | Where-Object { -not $_.HasExited })
    if ($survivors.Count -ne 1) { throw "Concurrent launches left $($survivors.Count) instances running." }
    foreach ($process in $burst) {
        if ($process.HasExited -and $process.ExitCode -ne 0) { throw 'A concurrent launch exited abnormally.' }
    }
    Write-Output 'PASS: five simultaneous launches leave exactly one instance.'
    Stop-TestInstance $survivors[0]

    $restarted = Start-TestInstance
    if ($restarted.WaitForExit(2000)) { throw 'The app could not restart after exit.' }
    Assert-SecondaryExits (Start-TestInstance)
    if ($restarted.HasExited) { throw 'The restarted primary instance exited early.' }
    Write-Output 'PASS: the instance lock is released on exit and can be acquired again.'
} finally {
    foreach ($process in $started) { Stop-TestInstance $process }
}

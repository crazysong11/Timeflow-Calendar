# Dot-source this script to apply the Windows proxy to the current terminal.
$targetUri = [Uri]'https://index.crates.io'
if ($PSVersionTable.PSVersion.Major -ge 7) {
    $systemProxy = [System.Net.Http.HttpClient]::DefaultProxy
} else {
    $systemProxy = [System.Net.WebRequest]::DefaultWebProxy
}

if ($systemProxy -and -not $systemProxy.IsBypassed($targetUri)) {
    $proxyUri = $systemProxy.GetProxy($targetUri)
    foreach ($variableName in @('HTTP_PROXY', 'HTTPS_PROXY', 'CARGO_HTTP_PROXY', 'npm_config_proxy', 'npm_config_https_proxy')) {
        if (-not [Environment]::GetEnvironmentVariable($variableName, 'Process')) {
            [Environment]::SetEnvironmentVariable($variableName, $proxyUri.AbsoluteUri, 'Process')
        }
    }
    $bypassEntries = @($env:NO_PROXY -split ',' | Where-Object { $_ }) + @('localhost', '127.0.0.1', '::1')
    $env:NO_PROXY = ($bypassEntries | Select-Object -Unique) -join ','
    Write-Output 'Windows proxy applied to dependency tools in this terminal.'
} else {
    Write-Output 'Windows uses a direct connection for the dependency registry.'
}

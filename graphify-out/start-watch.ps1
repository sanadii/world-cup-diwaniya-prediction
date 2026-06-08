# Start graphify watch + auto-sync the dashboard. Stop with Ctrl+C.
Set-Location $PSScriptRoot\..

$py = $null
$pyFile = "graphify-out\.graphify_python"
if (Test-Path $pyFile) {
    $candidate = (Get-Content $pyFile -Raw).Trim()
    if ($candidate -and (Test-Path $candidate)) { $py = $candidate }
}
if (-not $py -and (Get-Command uv -ErrorAction SilentlyContinue)) {
    $uvDir = (uv tool dir 2>$null).Trim()
    if ($uvDir) {
        $candidate = Join-Path $uvDir "graphifyy\Scripts\python.exe"
        if (Test-Path $candidate) { $py = $candidate }
    }
}
if (-not $py) {
    $cmd = Get-Command python -ErrorAction SilentlyContinue
    if ($cmd) { $py = $cmd.Source }
}
if (-not $py) { Write-Error "Could not find a Python with graphify installed."; exit 1 }

& $py graphify-out\watch-sync.py

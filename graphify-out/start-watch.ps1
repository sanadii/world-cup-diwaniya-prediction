# Start graphify watch + auto-sync dashboard/callflow
# Stop with Ctrl+C in this terminal
$py = "C:\Users\User\AppData\Roaming\uv\tools\graphifyy\Scripts\python.exe"
if (Test-Path "graphify-out\.graphify_python") {
    $py = (Get-Content "graphify-out\.graphify_python" -Raw).Trim()
}
Set-Location $PSScriptRoot\..
& $py graphify-out\watch-sync.py

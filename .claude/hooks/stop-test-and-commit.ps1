$logFile = ".claude/hooks/hook.log"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

$hooksDir = Split-Path -Parent $logFile
if (-not (Test-Path $hooksDir)) {
    New-Item -ItemType Directory -Path $hooksDir -Force | Out-Null
}

Add-Content -Path $logFile -Value "[$timestamp][HOOK] Stop hook started"

if (-not (Test-Path "index.html")) {
    Add-Content -Path $logFile -Value "[$timestamp][HOOK] FAIL: index.html not found - commit forbidden"
    exit 0
}

$html = Get-Content "index.html" -Raw -ErrorAction SilentlyContinue
$testPassed = $true
$failReason = ""

if ([string]::IsNullOrWhiteSpace($html)) {
    $testPassed = $false
    $failReason = "index.html is empty"
}
elseif ($html -notmatch "<!DOCTYPE\s+html>") {
    $testPassed = $false
    $failReason = "missing <!DOCTYPE html>"
}
elseif ($html -notmatch "<html") {
    $testPassed = $false
    $failReason = "missing <html> tag"
}
elseif ($html -notmatch "<body") {
    $testPassed = $false
    $failReason = "missing <body> tag"
}
elseif ($html -notmatch "<style") {
    $testPassed = $false
    $failReason = "missing <style> block"
}

if (-not $testPassed) {
    Add-Content -Path $logFile -Value "[$timestamp][HOOK] FAIL: $failReason - commit forbidden"
    exit 0
}

Add-Content -Path $logFile -Value "[$timestamp][HOOK] test passed"

$statusOutput = & git status --porcelain 2>&1
$statusStr = ($statusOutput -join "").Trim()

if ([string]::IsNullOrWhiteSpace($statusStr)) {
    Add-Content -Path $logFile -Value "[$timestamp][HOOK] no changes detected - commit skip"
    exit 0
}

& git add .
& git commit -m "auto: Claude Code generated update"

if ($LASTEXITCODE -eq 0) {
    $hashOutput = & git log -1 --format="%h" 2>&1
    $hashStr = ($hashOutput -join "").Trim()
    Add-Content -Path $logFile -Value "[$timestamp][HOOK] commit success: $hashStr"
} else {
    Add-Content -Path $logFile -Value "[$timestamp][HOOK] commit failed (exit $LASTEXITCODE)"
}

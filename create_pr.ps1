$ErrorActionPreference = "Stop"
$cred = "protocol=https`nhost=github.com`n" | git credential fill
$tokenLine = $cred | Where-Object { $_ -match "^password=" }
if (!$tokenLine) {
    Write-Error "No password found in credential manager for github.com"
    exit 1
}
$token = $tokenLine.Substring(9)

$headers = @{
    "Authorization" = "Bearer $token"
    "Accept" = "application/vnd.github.v3+json"
}

$bodyJSON = @{
    title = "Remove clacky sound option & Add unit tests"
    body = "Test PR"
    head = "remove-clacky-sound"
    base = "main"
} | ConvertTo-Json

try {
    $res = Invoke-RestMethod -Uri "https://api.github.com/repos/N0Algorithm/RapidKeys-TypingSpeedTest/pulls" -Method Post -Headers $headers -Body $bodyJSON
    Write-Output "SUCCESS: $($res.html_url)"
} catch {
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errBody = $reader.ReadToEnd()
        Write-Output "BODY ERROR: $errBody"
    }
}

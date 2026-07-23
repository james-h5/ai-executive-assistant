<#
Speaks text aloud as "the Count" using ElevenLabs TTS.
Usage: speak.ps1 -Text "..."  OR  speak.ps1 -TextFile "path\to\response.txt"
Requires ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID in the repo root .env - see ../.env.example
#>
param(
    [Parameter(Mandatory=$false)][string]$Text,
    [Parameter(Mandatory=$false)][string]$TextFile
)

if (-not $Text -and -not $TextFile) {
    Write-Error "Provide -Text or -TextFile"
    exit 1
}
if ($TextFile) {
    $Text = Get-Content -Path $TextFile -Raw
}

$envPath = Join-Path $PSScriptRoot "..\..\..\.env"
if (-not (Test-Path $envPath)) {
    Write-Error ".env not found at $envPath"
    exit 1
}

$envVars = @{}
Get-Content $envPath | ForEach-Object {
    if ($_ -match '^\s*([A-Z_]+)\s*=\s*(.*)$') {
        $envVars[$matches[1]] = $matches[2].Trim()
    }
}
$apiKey = $envVars['ELEVENLABS_API_KEY']
$voiceId = $envVars['ELEVENLABS_VOICE_ID']

if ([string]::IsNullOrWhiteSpace($apiKey) -or [string]::IsNullOrWhiteSpace($voiceId)) {
    Write-Error "ELEVENLABS_API_KEY / ELEVENLABS_VOICE_ID missing from .env - see projects/monte-cristo/.env.example"
    exit 1
}

$uri = "https://api.elevenlabs.io/v1/text-to-speech/$voiceId"
$headers = @{
    "xi-api-key"   = $apiKey
    "Content-Type" = "application/json"
}
$body = @{
    text     = $Text
    model_id = "eleven_multilingual_v2"
    voice_settings = @{ stability = 0.5; similarity_boost = 0.75 }
} | ConvertTo-Json

$outputPath = Join-Path $env:TEMP "monte-cristo-$(Get-Date -Format 'yyyyMMddHHmmss').mp3"

try {
    Invoke-WebRequest -Uri $uri -Method Post -Headers $headers -Body $body -OutFile $outputPath -ErrorAction Stop
} catch {
    Write-Error "ElevenLabs request failed: $_"
    exit 1
}

Add-Type -AssemblyName PresentationCore
$player = New-Object System.Windows.Media.MediaPlayer
$player.Open([Uri]$outputPath)
Start-Sleep -Milliseconds 500
$player.Play()

$waited = 0
while (-not $player.NaturalDuration.HasTimeSpan -and $waited -lt 20) {
    Start-Sleep -Milliseconds 200
    $waited++
}
if ($player.NaturalDuration.HasTimeSpan) {
    Start-Sleep -Seconds ($player.NaturalDuration.TimeSpan.TotalSeconds + 0.5)
} else {
    Start-Sleep -Seconds 8
}
$player.Close()
Remove-Item $outputPath -ErrorAction SilentlyContinue

# Windows TTS hook — speaks last assistant response aloud.
# Only runs when .claude/tts-enabled exists (toggle file).

$toggleFile = "C:/Users/james/OneDrive/AI/Executive Assistant/.claude/tts-enabled"
if (-not (Test-Path $toggleFile)) { exit 0 }

try {
    $raw = [Console]::In.ReadToEnd()
    $payload = $raw | ConvertFrom-Json
} catch { exit 0 }

$transcriptPath = $payload.transcript_path
if (-not $transcriptPath -or -not (Test-Path $transcriptPath)) { exit 0 }

$lastText = $null
Get-Content $transcriptPath | ForEach-Object {
    try {
        $entry = $_ | ConvertFrom-Json
        if ($entry.type -eq "assistant") {
            $content = $entry.message.content
            if ($content -is [string] -and $content.Length -gt 0) {
                $lastText = $content
            } elseif ($content -is [array]) {
                $textBlock = $content | Where-Object { $_.type -eq "text" } | Select-Object -Last 1
                if ($textBlock -and $textBlock.text) { $lastText = $textBlock.text }
            }
        }
    } catch {}
}

if (-not $lastText) { exit 0 }

# Strip markdown
$text = $lastText
$text = [regex]::Replace($text, '(?s)```.*?```', 'code block.')
$text = [regex]::Replace($text, '`[^`]+`', '')
$text = [regex]::Replace($text, '#{1,6}\s+', '')
$text = [regex]::Replace($text, '\*{1,2}([^*\n]+)\*{1,2}', '$1')
$text = [regex]::Replace($text, '_([^_\n]+)_', '$1')
$text = [regex]::Replace($text, '\[([^\]]+)\]\([^\)]+\)', '$1')
$text = [regex]::Replace($text, '(?m)^\s*[-*+]\s+', '')
$text = $text.Trim()

if ($text.Length -eq 0) { exit 0 }

try {
    Add-Type -AssemblyName System.Speech
    $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
    $synth.Rate = 2
    $synth.Speak($text)
} catch {}
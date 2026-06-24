$j = [Console]::In.ReadToEnd() | ConvertFrom-Json
$fp = $j.tool_input.file_path
if (-not $fp -or $fp -notmatch '\.md$') { exit 0 }

$content = Get-Content -Path $fp -Raw -ErrorAction SilentlyContinue
if (-not $content -or $content.TrimStart().StartsWith('---')) { exit 0 }

$name = [IO.Path]::GetFileNameWithoutExtension($fp)
$type = if ($fp -match '[/\\]projects[/\\]') { 'project' }
        elseif ($fp -match '[/\\]context[/\\]') { 'context' }
        elseif ($fp -match '[/\\]templates[/\\]') { 'template' }
        elseif ($fp -match '[/\\]\.claude[/\\]skills[/\\]') { 'skill' }
        elseif ($fp -match '[/\\]logs[/\\]daily[/\\]') { 'daily-log' }
        else { 'note' }

$nl = "`n"
$fm = "---${nl}name: ${name}${nl}type: ${type}${nl}description: ${nl}---${nl}${nl}"
$enc = [System.Text.UTF8Encoding]::new($false)
[IO.File]::WriteAllText($fp, $fm + $content, $enc)

[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string] $InputFile
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $InputFile -PathType Leaf)) {
    throw "File not found: $InputFile"
}

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$ResolvedInput = (Resolve-Path -LiteralPath $InputFile).Path
$Name = [IO.Path]::GetFileNameWithoutExtension($ResolvedInput)
$SourceName = [IO.Path]::GetFileName($ResolvedInput)
$OutputDirectory = Join-Path $ProjectRoot "documents\converted"
$MediaDirectory = Join-Path $OutputDirectory "$Name-media"
$OutputFile = Join-Path $OutputDirectory "$Name.md"
$TemporaryFile = Join-Path $OutputDirectory "$Name.tmp.md"

New-Item -ItemType Directory -Force -Path $MediaDirectory | Out-Null

& pandoc $ResolvedInput `
    "--from=docx" `
    "--to=gfm" `
    "--extract-media=$MediaDirectory" `
    "--output=$TemporaryFile"

if ($LASTEXITCODE -ne 0) {
    throw "Pandoc failed with exit code $LASTEXITCODE"
}

$Header = @"
---
source: ../$SourceName
generated: true
format: docx-to-markdown
---

"@

Set-Content -LiteralPath $OutputFile -Value $Header -Encoding utf8
Get-Content -LiteralPath $TemporaryFile -Raw |
    Add-Content -LiteralPath $OutputFile -Encoding utf8
Remove-Item -LiteralPath $TemporaryFile -Force

Write-Host "Created: $OutputFile"

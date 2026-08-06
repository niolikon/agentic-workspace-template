[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string] $Workspace
)

$ErrorActionPreference = "Stop"

$RepositoryRoot = Split-Path -Parent $PSScriptRoot
$ProviderRoot = Join-Path $RepositoryRoot "providers"
$ConfigPath = Join-Path $Workspace "opencode.jsonc"

if (-not (Test-Path $ConfigPath -PathType Leaf)) {
    throw "Workspace configuration not found: $ConfigPath"
}

$options = @{
    "1" = "openai"
    "2" = "anthropic"
    "3" = "google"
    "4" = "deepseek"
    "5" = "custom"
}

Write-Host "Select provider:"
Write-Host "  1) OpenAI"
Write-Host "  2) Anthropic"
Write-Host "  3) Google"
Write-Host "  4) DeepSeek"
Write-Host "  5) Custom provider/model"

$choice = Read-Host "Choice"
if (-not $options.ContainsKey($choice)) {
    throw "Invalid choice."
}

if ($options[$choice] -eq "custom") {
    $model = Read-Host "Primary model identifier (provider/model)"
    $smallModel = Read-Host "Small model identifier (provider/model)"
}
else {
    $presetPath = Join-Path $ProviderRoot ($options[$choice] + ".jsonc")
    $preset = Get-Content -LiteralPath $presetPath -Raw | ConvertFrom-Json
    $model = $preset.model
    $smallModel = $preset.small_model
}

$configText = Get-Content -LiteralPath $ConfigPath -Raw
$configText = [regex]::Replace(
    $configText,
    '"model"\s*:\s*"[^"]+"',
    '"model": "' + $model + '"',
    1
)
$configText = [regex]::Replace(
    $configText,
    '"small_model"\s*:\s*"[^"]+"',
    '"small_model": "' + $smallModel + '"',
    1
)

Set-Content -LiteralPath $ConfigPath -Value $configText -Encoding utf8

Write-Host "Configured:"
Write-Host "  model:       $model"
Write-Host "  small_model: $smallModel"
Write-Host "Authenticate with: opencode auth login"
Write-Host "Then verify the current identifiers with /models."

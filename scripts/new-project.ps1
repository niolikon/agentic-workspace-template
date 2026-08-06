[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidateNotNullOrEmpty()]
    [string] $ProjectName,

    [Parameter()]
    [string] $DestinationRoot = (Join-Path $HOME "Projects"),

    [switch] $InitializeGit
)

$ErrorActionPreference = "Stop"

$RepositoryRoot = Split-Path -Parent $PSScriptRoot
$TemplateRoot = Join-Path $RepositoryRoot "template"
$Destination = Join-Path $DestinationRoot $ProjectName

if (-not (Test-Path $TemplateRoot -PathType Container)) {
    throw "Template directory not found: $TemplateRoot"
}

if (Test-Path $Destination) {
    throw "Destination already exists: $Destination"
}

New-Item -ItemType Directory -Force -Path $DestinationRoot | Out-Null
Copy-Item -Path $TemplateRoot -Destination $Destination -Recurse -Force

if ($InitializeGit) {
    Push-Location $Destination
    try {
        git init
    }
    finally {
        Pop-Location
    }
}

Write-Host "Workspace created: $Destination"
Write-Host "Next:"
Write-Host "  1. Configure a provider."
Write-Host "  2. Run opencode auth login or /connect."
Write-Host "  3. Start OpenCode from the workspace root."

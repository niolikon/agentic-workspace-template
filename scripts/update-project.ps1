[CmdletBinding()]
param(
    [Parameter()]
    [string] $Workspace = (Get-Location).Path,

    [switch] $DryRun
)

$ErrorActionPreference = "Stop"

$RepositoryRoot = Split-Path -Parent $PSScriptRoot
$SourceOpenCode = Join-Path $RepositoryRoot "template/.opencode"
$DestinationOpenCode = Join-Path $Workspace ".opencode"
$StagingRoot = Join-Path $DestinationOpenCode ".tmp"
$StagingDependencies = Join-Path $StagingRoot "dependencies"
$StagingEcosystems = @("npm", "python", "maven", "gradle", "nuget", "yarn", "pnpm", "go", "cargo")
$ManagedDirectories = @("agents", "commands", "skills", "tools")

if (-not (Test-Path $Workspace -PathType Container)) {
    throw "Workspace not found: $Workspace"
}

if (-not (Test-Path $SourceOpenCode -PathType Container)) {
    throw "Template OpenCode directory not found: $SourceOpenCode"
}

foreach ($Directory in $ManagedDirectories) {
    $Source = Join-Path $SourceOpenCode $Directory
    if (-not (Test-Path $Source -PathType Container)) {
        throw "Template-managed directory not found: $Source"
    }
}

function Get-DirectoryFingerprint {
    param(
        [Parameter(Mandatory)]
        [string] $Path
    )

    if (-not (Test-Path $Path -PathType Container)) {
        return $null
    }

    $Root = (Resolve-Path $Path).Path.TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)

    $Entries = Get-ChildItem -LiteralPath $Root -Recurse -File | ForEach-Object {
        $RelativePath = $_.FullName.Substring($Root.Length).TrimStart([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
        $Hash = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash
        "$RelativePath|$Hash"
    }

    return @($Entries | Sort-Object)
}

function Test-DirectoriesEqual {
    param(
        [Parameter(Mandatory)]
        [string] $Source,

        [Parameter(Mandatory)]
        [string] $Destination
    )

    if (-not (Test-Path $Destination -PathType Container)) {
        return $false
    }

    $SourceFingerprint = @(Get-DirectoryFingerprint -Path $Source)
    $DestinationFingerprint = @(Get-DirectoryFingerprint -Path $Destination)
    $Difference = Compare-Object -ReferenceObject $SourceFingerprint -DifferenceObject $DestinationFingerprint

    return ($null -eq $Difference)
}

if ($DryRun) {
    Write-Host "Dry run: $Workspace"
}
else {
    New-Item -ItemType Directory -Force -Path $DestinationOpenCode, $StagingDependencies | Out-Null
    foreach ($Ecosystem in $StagingEcosystems) {
        New-Item -ItemType Directory -Force -Path (Join-Path $StagingDependencies $Ecosystem) | Out-Null
    }
    @"
**/*
!.gitignore
!dependencies/
!dependencies/npm/
!dependencies/python/
!dependencies/maven/
!dependencies/gradle/
!dependencies/nuget/
!dependencies/yarn/
!dependencies/pnpm/
!dependencies/go/
!dependencies/cargo/
"@ | Set-Content -LiteralPath (Join-Path $StagingRoot ".gitignore") -Encoding UTF8
    Write-Host "Updating workspace: $Workspace"
}

$Changed = 0

foreach ($Directory in $ManagedDirectories) {
    $Source = Join-Path $SourceOpenCode $Directory
    $Destination = Join-Path $DestinationOpenCode $Directory

    if (-not (Test-Path $Destination -PathType Container)) {
        $Status = "ADD"
    }
    elseif (Test-DirectoriesEqual -Source $Source -Destination $Destination) {
        $Status = "UNCHANGED"
    }
    else {
        $Status = "UPDATE"
    }

    Write-Host ("{0,-9} .opencode/{1}" -f $Status, $Directory)

    if ($Status -ne "UNCHANGED") {
        $Changed++

        if (-not $DryRun) {
            if (Test-Path $Destination) {
                Remove-Item -LiteralPath $Destination -Recurse -Force
            }
            Copy-Item -LiteralPath $Source -Destination $Destination -Recurse -Force
        }
    }
}

if ($DryRun) {
    Write-Host "No files were modified. Managed directories with changes: $Changed"
}
else {
    Write-Host "Update complete. Managed directories changed: $Changed"
}

[CmdletBinding()]
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]] $OpenCodeArguments
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

Set-Location $ProjectRoot
$env:OPENCODE_CONFIG_DIR = Join-Path $ProjectRoot ".opencode"

try {
    & opencode @OpenCodeArguments
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}
finally {
    Remove-Item Env:OPENCODE_CONFIG_DIR -ErrorAction SilentlyContinue
}

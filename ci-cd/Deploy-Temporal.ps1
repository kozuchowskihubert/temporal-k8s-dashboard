<#
.SYNOPSIS
    Temporal Cluster Deployment Script
#>

[CmdletBinding()]
param(
    [ValidateSet("Staging", "Production")]
    [string]$Environment = "Staging",
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

# Configuration
$ScriptPath = $MyInvocation.MyCommand.Path
$BaseDir = Split-Path (Split-Path $ScriptPath -Parent) -Parent
$EnvFile = Join-Path $BaseDir ".env"

if (-not (Test-Path $EnvFile)) {
    Throw ".env file not found."
}

# Load Environment
Get-Content $EnvFile | Where-Object { $_ -match '=' -and $_ -notmatch '^\s*#' } | ForEach-Object {
    $k, $v = $_ -split '=', 2
    [Environment]::SetEnvironmentVariable($k.Trim(), $v.Trim(), "Process")
}

$Namespace = if ($Environment -eq "Production") { "temporal-prod" } else { "temporal-staging" }
$ValuesFile = if ($Environment -eq "Production") { "backend/temporal/values-prod.yaml" } else { "backend/temporal/values-staging.yaml" }
$AbsValuesFile = Join-Path $BaseDir $ValuesFile
$DbPassword = $env:NEON_DB_PASSWORD

if ([string]::IsNullOrWhiteSpace($DbPassword)) {
    Throw "NEON_DB_PASSWORD not set."
}

# Operations
helm repo add temporalio https://go.temporal.io/helm-charts | Out-Null
helm repo update | Out-Null

$NsCmd = "kubectl create namespace $Namespace --dry-run=client -o yaml | kubectl apply -f -"
if ($DryRun) { Write-Output $NsCmd } else { Invoke-Expression $NsCmd | Out-Null }

$SecretCmd = "kubectl create secret generic temporal-db-secret -n $Namespace --from-literal=password='$DbPassword' --dry-run=client -o yaml"
if ($DryRun) { Write-Output "$SecretCmd | kubectl apply -f -" } else { Invoke-Expression $SecretCmd | kubectl apply -f - | Out-Null }

$HelmArgs = @(
    "upgrade", "--install", $Namespace, "temporalio/temporal",
    "--namespace", $Namespace,
    "--version", "0.73.1",
    "-f", $AbsValuesFile,
    "--timeout", "10m",
    "--wait"
)

if ($DryRun) {
    $HelmArgs += "--dry-run"
    $HelmArgs += "--debug"
    Write-Output "helm $($HelmArgs -join ' ')"
}
else {
    helm $HelmArgs
}

<#
.SYNOPSIS
    Temporal Health Check
#>

[CmdletBinding()]
param(
    [ValidateSet("Staging", "Production")]
    [string]$Environment = "Staging"
)

$ErrorActionPreference = "Stop"
$Namespace = if ($Environment -eq "Production") { "temporal-prod" } else { "temporal-staging" }

if (-not (kubectl get ns $Namespace 2>$null)) {
    Throw "Namespace '$Namespace' not found."
}

$Pods = kubectl get pods -n $Namespace -o json | ConvertFrom-Json
$Total = $Pods.items.Count
$Running = ($Pods.items | Where-Object { $_.status.phase -eq "Running" }).Count

Write-Output "Pods: $Running/$Total Running"

if ($Running -ne $Total) {
    kubectl get pods -n $Namespace
}

$WebSvc = kubectl get svc -n $Namespace -l app.kubernetes.io/component=web -o jsonpath='{.items[0].metadata.name}' 2>$null
if ($WebSvc) {
    Write-Output "Web UI: svc/$WebSvc (Port 8080)"
}
else {
    Write-Output "Web UI: Not Found"
}

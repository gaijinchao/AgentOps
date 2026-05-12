<#
  Minimal Run + Spans (ASCII). Same flow as quickstart.py.
  API up: docker compose up -d (repo root), then:
    pwsh examples/quickstart.ps1
  Optional: -Wait polls /health up to ~90s.
#>
param(
    [string]$BaseUrl = "http://localhost:8000",
    [string]$UiOrigin = "http://localhost:5173",
    [switch]$Wait
)

$ErrorActionPreference = "Stop"
if ($env:BASE_URL) { $BaseUrl = $env:BASE_URL }
if ($env:AGENTOPS_UI_ORIGIN) { $UiOrigin = $env:AGENTOPS_UI_ORIGIN }
$base = $BaseUrl.TrimEnd("/")
$ui = $UiOrigin.TrimEnd("/")

if ($Wait) {
    $deadline = (Get-Date).AddSeconds(90)
    do {
        try {
            $h = Invoke-WebRequest -Uri "$base/health" -UseBasicParsing -TimeoutSec 3
            if ($h.StatusCode -eq 200) { break }
        }
        catch { Start-Sleep -Seconds 1 }
        if ((Get-Date) -gt $deadline) { throw "API not healthy within 90s: $base/health" }
    } while ($true)
}

$runBody = @{
    status          = "succeeded"
    started_at      = "2026-05-12T10:00:00Z"
    ended_at        = "2026-05-12T10:00:02Z"
    input_summary   = "quickstart (powershell)"
    output_summary  = "done"
    error_summary   = $null
    external_ref    = "quickstart-demo"
} | ConvertTo-Json

$run = Invoke-RestMethod -Method Post -Uri "$base/v1/runs" -Body $runBody -ContentType "application/json; charset=utf-8"
$runId = $run.id

$rootBatch = @{ spans = @(@{
            parent_span_id = $null
            type             = "agent"
            name             = "root"
            status           = "succeeded"
            started_at       = "2026-05-12T10:00:00.100Z"
            ended_at         = "2026-05-12T10:00:01.000Z"
            attributes       = @{ hello = "agentops" }
        }) } | ConvertTo-Json -Depth 6

$roots = Invoke-RestMethod -Method Post -Uri "$base/v1/runs/$runId/spans" -Body $rootBatch -ContentType "application/json; charset=utf-8"
$rootId = $roots[0].id

$childBatch = @{ spans = @(@{
            parent_span_id = $rootId
            type             = "tool"
            name             = "example_tool"
            status           = "succeeded"
            started_at       = "2026-05-12T10:00:01.100Z"
            ended_at         = "2026-05-12T10:00:01.500Z"
            attributes       = @{ detail = "your code can mirror this shape" }
        }) } | ConvertTo-Json -Depth 6

Invoke-RestMethod -Method Post -Uri "$base/v1/runs/$runId/spans" -Body $childBatch -ContentType "application/json; charset=utf-8" | Out-Null

Write-Host "RUN_ID=$runId"
Write-Host "Open in UI: $ui/runs/$runId"
Write-Host "GET spans: $base/v1/runs/$runId/spans"

<#
  Seed demo Run+Spans (ASCII-only for PS 5.1). Repo root: .\examples\demo-rich.ps1
#>
param(
    [string]$BaseUrl = "http://localhost:8000",
    [string]$RunIdOutFile = ""
)

$ErrorActionPreference = "Stop"

function Write-Utf8NoBom([string]$Path, [string]$Content) {
    [System.IO.File]::WriteAllText($Path, $Content, [System.Text.UTF8Encoding]::new($false))
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$outPath = if ($RunIdOutFile) { $RunIdOutFile } else { Join-Path $repoRoot ".demo-run-id" }

Write-Host "== Create Run (one user request -> agent handling)" -ForegroundColor Cyan
$runBody = @{
    status         = "running"
    started_at     = "2026-05-11T14:00:00Z"
    ended_at       = $null
    input_summary  = "User: Beijing weather + one-line summary (demo-rich.ps1)"
    output_summary = $null
    error_summary  = $null
} | ConvertTo-Json

$run = Invoke-RestMethod -Method Post -Uri "$BaseUrl/v1/runs" -Body $runBody -ContentType "application/json; charset=utf-8"
$runId = $run.id
Write-Host "RUN_ID=$runId"

Write-Host "`n== 1) Root span: workflow, parent_span_id null" -ForegroundColor Cyan
$rootBatch = @{ spans = @(@{
            parent_span_id = $null
            type           = "workflow"
            name           = "orchestrator"
            status         = "running"
            started_at     = "2026-05-11T14:00:01Z"
            ended_at       = $null
            attributes     = @{ scenario = "demo-rich"; step = 1 }
            error_message  = $null
        }) } | ConvertTo-Json -Depth 8

$roots = Invoke-RestMethod -Method Post -Uri "$BaseUrl/v1/runs/$runId/spans" -Body $rootBatch -ContentType "application/json; charset=utf-8"
$rootId = $roots[0].id
Write-Host "ROOT_SPAN_ID=$rootId"

Write-Host "`n== 2) Two sibling spans under root (tree siblings)" -ForegroundColor Cyan
$layer2 = @{ spans = @(
        @{
            parent_span_id = $rootId
            type             = "tool"
            name             = "prepare_context"
            status           = "succeeded"
            started_at       = "2026-05-11T14:00:02Z"
            ended_at         = "2026-05-11T14:00:02.800Z"
            attributes       = @{ tool = "memory.load"; keys = @("user_prefs", "session") }
            error_message    = $null
        },
        @{
            parent_span_id = $rootId
            type             = "llm"
            name             = "llm_reasoning"
            status           = "running"
            started_at       = "2026-05-11T14:00:03Z"
            ended_at         = $null
            attributes       = @{ model = "demo-llm"; temperature = 0.2 }
            error_message    = $null
        }
    ) } | ConvertTo-Json -Depth 8

$layer2Resp = Invoke-RestMethod -Method Post -Uri "$BaseUrl/v1/runs/$runId/spans" -Body $layer2 -ContentType "application/json; charset=utf-8"
$prepareId = ($layer2Resp | Where-Object { $_.name -eq "prepare_context" } | Select-Object -First 1).id
$llmId = ($layer2Resp | Where-Object { $_.name -eq "llm_reasoning" } | Select-Object -First 1).id
Write-Host "PREPARE_SPAN_ID=$prepareId"
Write-Host "LLM_SPAN_ID=$llmId"

Write-Host "`n== 3) Under LLM: failed tool then ok tool (weak replay -> error_message)" -ForegroundColor Cyan
$layer3 = @{ spans = @(
        @{
            parent_span_id = $llmId
            type             = "tool"
            name             = "web_search"
            status           = "failed"
            started_at       = "2026-05-11T14:00:04Z"
            ended_at         = "2026-05-11T14:00:04.500Z"
            attributes       = @{ endpoint = "weather.example"; http_status = 503 }
            error_message    = "Upstream weather API unavailable (demo error)."
        },
        @{
            parent_span_id = $llmId
            type             = "tool"
            name             = "local_search"
            status           = "succeeded"
            started_at       = "2026-05-11T14:00:05Z"
            ended_at         = "2026-05-11T14:00:05.900Z"
            attributes       = @{ source = "static_kb"; city = "Beijing" }
            error_message    = $null
        }
    ) } | ConvertTo-Json -Depth 8

Invoke-RestMethod -Method Post -Uri "$BaseUrl/v1/runs/$runId/spans" -Body $layer3 -ContentType "application/json; charset=utf-8" | Out-Null

Write-Host "`n== 4) Span with null started_at (sorts last in timeline)" -ForegroundColor Cyan
$layer4 = @{ spans = @(@{
            parent_span_id = $rootId
            type             = "custom"
            name             = "finalize_no_start"
            status           = "succeeded"
            started_at       = $null
            ended_at         = "2026-05-11T14:00:07Z"
            attributes       = @{ note = "started_at null -> verify timeline order" }
            error_message    = $null
        }) } | ConvertTo-Json -Depth 8

Invoke-RestMethod -Method Post -Uri "$BaseUrl/v1/runs/$runId/spans" -Body $layer4 -ContentType "application/json; charset=utf-8" | Out-Null

Write-Utf8NoBom $outPath $runId

Write-Host "`nRUN_ID=$runId  ->  http://localhost:5173/runs/$runId"

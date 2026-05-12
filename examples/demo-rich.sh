#!/usr/bin/env bash
# Rich demo: one Run + multi-level spans. Requires curl + jq.
# Span names match examples/demo-rich.ps1 (ASCII) for parity with Windows PowerShell 5.1.
set -euo pipefail

BASE="${BASE_URL:-http://localhost:8000}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUT_FILE="${RUN_ID_OUT:-$REPO_ROOT/.demo-run-id}"

echo "== Create Run"
RUN_JSON="$(curl -sS -X POST "${BASE}/v1/runs" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "running",
    "started_at": "2026-05-11T14:00:00Z",
    "input_summary": "User: Beijing weather + one-line summary (demo-rich.sh)",
    "output_summary": null,
    "error_summary": null
  }')"
echo "$RUN_JSON" | jq .
RUN_ID="$(echo "$RUN_JSON" | jq -r .id)"
echo "RUN_ID=$RUN_ID"

echo "== Root span"
ROOT_JSON="$(curl -sS -X POST "${BASE}/v1/runs/${RUN_ID}/spans" \
  -H "Content-Type: application/json" \
  -d '{
    "spans": [
      {
        "parent_span_id": null,
        "type": "workflow",
        "name": "orchestrator",
        "status": "running",
        "started_at": "2026-05-11T14:00:01Z",
        "attributes": { "scenario": "demo-rich", "step": 1 }
      }
    ]
  }')"
echo "$ROOT_JSON" | jq .
ROOT_ID="$(echo "$ROOT_JSON" | jq -r '.[0].id')"

echo "== Siblings under root: tool + llm"
curl -sS -X POST "${BASE}/v1/runs/${RUN_ID}/spans" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg rid "$ROOT_ID" '{
    spans: [
      {
        parent_span_id: $rid,
        type: "tool",
        name: "prepare_context",
        status: "succeeded",
        started_at: "2026-05-11T14:00:02Z",
        ended_at: "2026-05-11T14:00:02.800Z",
        attributes: { tool: "memory.load", keys: ["user_prefs","session"] }
      },
      {
        parent_span_id: $rid,
        type: "llm",
        name: "llm_reasoning",
        status: "running",
        started_at: "2026-05-11T14:00:03Z",
        attributes: { model: "demo-llm", temperature: 0.2 }
      }
    ]
  }')" | jq .

LLM_ID="$(curl -sS "${BASE}/v1/runs/${RUN_ID}/spans" | jq -r '.[] | select(.name=="llm_reasoning") | .id')"

echo "== Under LLM: failed tool then succeeded tool"
curl -sS -X POST "${BASE}/v1/runs/${RUN_ID}/spans" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg lid "$LLM_ID" '{
    spans: [
      {
        parent_span_id: $lid,
        type: "tool",
        name: "web_search",
        status: "failed",
        started_at: "2026-05-11T14:00:04Z",
        ended_at: "2026-05-11T14:00:04.500Z",
        attributes: { endpoint: "weather.example", http_status: 503 },
        error_message: "Upstream weather API unavailable (demo error)."
      },
      {
        parent_span_id: $lid,
        type: "tool",
        name: "local_search",
        status: "succeeded",
        started_at: "2026-05-11T14:00:05Z",
        ended_at: "2026-05-11T14:00:05.900Z",
        attributes: { source: "static_kb", city: "Beijing" }
      }
    ]
  }')" | jq .

echo "== Root child: custom span with null started_at (sorts last in timeline)"
curl -sS -X POST "${BASE}/v1/runs/${RUN_ID}/spans" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg rid "$ROOT_ID" '{
    spans: [
      {
        parent_span_id: $rid,
        type: "custom",
        name: "finalize_no_start",
        status: "succeeded",
        started_at: null,
        ended_at: "2026-05-11T14:00:07Z",
        attributes: { note: "started_at null -> verify timeline order" }
      }
    ]
  }')" | jq .

printf '%s' "$RUN_ID" > "$OUT_FILE"

echo ""
echo "Saved RUN_ID to $OUT_FILE"
echo "UI: http://localhost:5173/runs/${RUN_ID}"
echo "http://localhost:5173/runs/${RUN_ID}"

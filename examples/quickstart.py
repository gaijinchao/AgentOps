#!/usr/bin/env python3
"""
Minimal AgentOps ingest: one Run + root Span + child Span.
Stdlib only (urllib); no pip install for this script.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request


def _req(method: str, url: str, body: object | None = None) -> dict:
    data = None if body is None else json.dumps(body).encode("utf-8")
    r = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={"Content-Type": "application/json", "Accept": "application/json"},
    )
    try:
        with urllib.request.urlopen(r, timeout=30) as resp:
            raw = resp.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")
        raise SystemExit(f"HTTP {e.code} {method} {url}\n{err_body}") from e
    except urllib.error.URLError as e:
        raise SystemExit(f"Request failed: {e.reason!s}\n{url}") from e
    return json.loads(raw) if raw else {}


def _wait_health(base: str, seconds: int) -> None:
    url = f"{base}/health"
    deadline = time.monotonic() + seconds
    while time.monotonic() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=3) as resp:
                if resp.status == 200:
                    return
        except OSError:
            pass
        time.sleep(1)
    raise SystemExit(f"API not healthy within {seconds}s: {url}")


def main() -> int:
    p = argparse.ArgumentParser(description="Post a minimal Run + Spans to AgentOps.")
    p.add_argument(
        "--base-url",
        default=os.environ.get("BASE_URL", "http://localhost:8000").rstrip("/"),
        help="API base (default BASE_URL or http://localhost:8000).",
    )
    p.add_argument(
        "--wait",
        action="store_true",
        help="Poll GET /health until 200 (up to ~90s).",
    )
    p.add_argument(
        "--ui-origin",
        default=os.environ.get("AGENTOPS_UI_ORIGIN", "http://localhost:5173").rstrip("/"),
        help="Printed Run detail link base.",
    )
    args = p.parse_args()
    base = args.base_url.rstrip("/")

    if args.wait:
        _wait_health(base, 90)

    run = _req(
        "POST",
        f"{base}/v1/runs",
        {
            "status": "succeeded",
            "started_at": "2026-05-12T10:00:00Z",
            "ended_at": "2026-05-12T10:00:02Z",
            "input_summary": "quickstart (python)",
            "output_summary": "done",
            "error_summary": None,
            "external_ref": "quickstart-demo",
        },
    )
    run_id = run["id"]

    roots = _req(
        "POST",
        f"{base}/v1/runs/{run_id}/spans",
        {
            "spans": [
                {
                    "parent_span_id": None,
                    "type": "agent",
                    "name": "root",
                    "status": "succeeded",
                    "started_at": "2026-05-12T10:00:00.100Z",
                    "ended_at": "2026-05-12T10:00:01.000Z",
                    "attributes": {"hello": "agentops"},
                }
            ]
        },
    )
    root_id = roots[0]["id"]

    _req(
        "POST",
        f"{base}/v1/runs/{run_id}/spans",
        {
            "spans": [
                {
                    "parent_span_id": root_id,
                    "type": "tool",
                    "name": "example_tool",
                    "status": "succeeded",
                    "started_at": "2026-05-12T10:00:01.100Z",
                    "ended_at": "2026-05-12T10:00:01.500Z",
                    "attributes": {"detail": "your code can mirror this shape"},
                }
            ]
        },
    )

    ui = f"{args.ui_origin}/runs/{run_id}"
    print(f"RUN_ID={run_id}")
    print(f"Open in UI: {ui}")
    print(f"GET spans: {base}/v1/runs/{run_id}/spans")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

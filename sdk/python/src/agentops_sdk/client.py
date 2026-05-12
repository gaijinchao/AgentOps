from __future__ import annotations

from typing import Any, Literal

import httpx

RunStatus = Literal["pending", "running", "succeeded", "failed"]


class Client:
    """Sync thin client for AgentOps HTTP API."""

    def __init__(self, base_url: str = "http://localhost:8000", *, timeout: float = 30.0) -> None:
        self._base = base_url.rstrip("/")
        self._client = httpx.Client(base_url=self._base, timeout=timeout)

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> Client:
        return self

    def __exit__(self, *args: object) -> None:
        self.close()

    def create_run(
        self,
        *,
        status: RunStatus,
        started_at: str | None = None,
        ended_at: str | None = None,
        input_summary: str | None = None,
        output_summary: str | None = None,
        error_summary: str | None = None,
        external_ref: str | None = None,
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {"status": status}
        if started_at is not None:
            payload["started_at"] = started_at
        if ended_at is not None:
            payload["ended_at"] = ended_at
        if input_summary is not None:
            payload["input_summary"] = input_summary
        if output_summary is not None:
            payload["output_summary"] = output_summary
        if error_summary is not None:
            payload["error_summary"] = error_summary
        if external_ref is not None:
            payload["external_ref"] = external_ref
        r = self._client.post("/v1/runs", json=payload)
        r.raise_for_status()
        return r.json()

    def create_spans(self, run_id: str, spans: list[dict[str, Any]]) -> list[dict[str, Any]]:
        r = self._client.post(f"/v1/runs/{run_id}/spans", json={"spans": spans})
        r.raise_for_status()
        return r.json()

    def list_runs(
        self,
        *,
        limit: int | None = None,
        offset: int = 0,
        status: RunStatus | None = None,
        external_ref: str | None = None,
    ) -> list[dict[str, Any]]:
        params: dict[str, Any] = {"offset": offset}
        if limit is not None:
            params["limit"] = limit
        if status is not None:
            params["status"] = status
        if external_ref:
            params["external_ref"] = external_ref
        r = self._client.get("/v1/runs", params=params)
        r.raise_for_status()
        return r.json()

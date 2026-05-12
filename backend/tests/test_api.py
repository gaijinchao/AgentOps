import pytest


@pytest.mark.asyncio
async def test_health(client):
    r = await client.get("/health")
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


@pytest.mark.asyncio
async def test_create_run_and_list(client):
    body = {
        "status": "running",
        "started_at": "2026-05-11T10:00:00Z",
        "input_summary": "hello",
        "output_summary": None,
    }
    r = await client.post("/v1/runs", json=body)
    assert r.status_code == 201
    data = r.json()
    assert "id" in data
    assert data["status"] == "running"
    assert data["input_summary"] == "hello"
    assert data.get("external_ref") in (None, "")

    r2 = await client.get("/v1/runs")
    assert r2.status_code == 200
    runs = r2.json()
    assert len(runs) == 1
    assert runs[0]["id"] == data["id"]


@pytest.mark.asyncio
async def test_get_run_not_found(client):
    r = await client.get("/v1/runs/00000000-0000-0000-0000-000000000001")
    assert r.status_code == 404
    err = r.json()["error"]
    assert err["code"] == "not_found"


@pytest.mark.asyncio
async def test_spans_tree_and_order(client):
    r = await client.post(
        "/v1/runs",
        json={"status": "succeeded", "input_summary": "x"},
    )
    run_id = r.json()["id"]

    t0 = "2026-05-11T10:00:05Z"
    t1 = "2026-05-11T10:00:01Z"
    t2 = "2026-05-11T10:00:03Z"

    r_sp = await client.post(
        f"/v1/runs/{run_id}/spans",
        json={
            "spans": [
                {
                    "parent_span_id": None,
                    "type": "workflow",
                    "name": "root",
                    "status": "succeeded",
                    "started_at": t1,
                    "ended_at": t0,
                },
            ]
        },
    )
    assert r_sp.status_code == 201
    root_id = r_sp.json()[0]["id"]

    await client.post(
        f"/v1/runs/{run_id}/spans",
        json={
            "spans": [
                {
                    "parent_span_id": str(root_id),
                    "type": "llm",
                    "name": "call",
                    "status": "succeeded",
                    "started_at": t2,
                    "attributes": {"model": "gpt"},
                },
            ]
        },
    )

    r_list = await client.get(f"/v1/runs/{run_id}/spans")
    assert r_list.status_code == 200
    spans = r_list.json()
    assert len(spans) == 2
    # started_at asc, nulls last: root t1 then child t2
    assert spans[0]["name"] == "root"
    assert spans[1]["name"] == "call"
    assert spans[1]["attributes"] == {"model": "gpt"}


@pytest.mark.asyncio
async def test_span_parent_must_exist(client):
    r = await client.post("/v1/runs", json={"status": "running"})
    run_id = r.json()["id"]
    bad_parent = "00000000-0000-0000-0000-000000000099"
    r2 = await client.post(
        f"/v1/runs/{run_id}/spans",
        json={
            "spans": [
                {
                    "parent_span_id": bad_parent,
                    "type": "tool",
                    "name": "t",
                    "status": "failed",
                }
            ]
        },
    )
    assert r2.status_code == 400
    assert r2.json()["error"]["code"] == "validation_error"


@pytest.mark.asyncio
async def test_spans_null_started_at_sort_last(client):
    r = await client.post("/v1/runs", json={"status": "running"})
    run_id = r.json()["id"]
    await client.post(
        f"/v1/runs/{run_id}/spans",
        json={
            "spans": [
                {
                    "parent_span_id": None,
                    "type": "workflow",
                    "name": "with_time",
                    "status": "running",
                    "started_at": "2026-05-11T12:00:00Z",
                },
                {
                    "parent_span_id": None,
                    "type": "workflow",
                    "name": "no_time",
                    "status": "running",
                },
            ]
        },
    )
    r_list = await client.get(f"/v1/runs/{run_id}/spans")
    spans = r_list.json()
    assert spans[0]["name"] == "with_time"
    assert spans[1]["name"] == "no_time"


@pytest.mark.asyncio
async def test_create_run_external_ref_and_list_filters(client):
    await client.post(
        "/v1/runs",
        json={"status": "pending", "external_ref": "job-a", "input_summary": "a"},
    )
    await client.post(
        "/v1/runs",
        json={"status": "running", "external_ref": "job-b", "input_summary": "b"},
    )

    r = await client.get("/v1/runs", params={"external_ref": "job-a"})
    assert r.status_code == 200
    xs = r.json()
    assert len(xs) == 1
    assert xs[0]["external_ref"] == "job-a"
    assert xs[0]["status"] == "pending"

    r2 = await client.get("/v1/runs", params={"status": "running"})
    assert len(r2.json()) == 1
    assert r2.json()[0]["external_ref"] == "job-b"


@pytest.mark.asyncio
async def test_list_runs_pagination(client):
    for i in range(5):
        await client.post("/v1/runs", json={"status": "succeeded", "input_summary": str(i)})
    r = await client.get("/v1/runs", params={"limit": 2, "offset": 0})
    assert len(r.json()) == 2
    r2 = await client.get("/v1/runs", params={"limit": 2, "offset": 2})
    assert len(r2.json()) == 2
    first_page_ids = {x["id"] for x in r.json()}
    second_page_ids = {x["id"] for x in r2.json()}
    assert first_page_ids.isdisjoint(second_page_ids)

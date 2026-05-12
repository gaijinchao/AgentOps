# agentops-sdk（薄 HTTP 客户端）

仅依赖 **httpx**，封装 `POST/GET /v1/runs` 与 `POST /v1/runs/{id}/spans`，便于在任意 Python Agent 中 **少量代码** 上报。

## 安装（自仓库根）

```bash
pip install -e "./sdk/python"
```

## 最小用法

```python
from agentops_sdk import Client

c = Client(base_url="http://localhost:8000")
run = c.create_run(
    status="running",
    input_summary="my agent",
    external_ref="req-123",
)
c.create_spans(
    run["id"],
    [
        {
            "parent_span_id": None,
            "type": "agent",
            "name": "root",
            "status": "running",
        }
    ],
)
```

列表与过滤：`c.list_runs(limit=20, offset=0, status="running", external_ref="req-123")`。

契约以服务端 **`/docs`** 为准。

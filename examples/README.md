## quickstart（最小接入）

API 在 `http://localhost:8000` 时，仓库根执行其一：

- `python examples/quickstart.py --wait`（仅标准库）
- `powershell -File examples\quickstart.ps1 -Wait`
- `bash examples/quickstart.sh --wait`（需本机 Python）

环境变量：`BASE_URL`（默认 `http://localhost:8000`）、`AGENTOPS_UI_ORIGIN`（打印详情链接用，默认 `http://localhost:5173`）。

## Python SDK

仓库根：`pip install -e "./sdk/python"`，在代码中使用 `agentops_sdk.Client`（见 `sdk/python/README.md`）。

## demo-rich（完整演示树）

API 已就绪时：`.\examples\demo-rich.ps1` 或 `bash examples/demo-rich.sh`（需 `curl`、`jq`）。`RUN_ID` 写入仓库根 `.demo-run-id`。

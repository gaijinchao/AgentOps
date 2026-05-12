# examples

前提：API 在 **http://localhost:8000**。

- **`demo-rich.ps1`**：仓库根、PowerShell 下执行 `.\examples\demo-rich.ps1`（脚本为 ASCII，避免 PS 5.1 编码问题）。若脚本被拦：`Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`
- **`demo-rich.sh`**：`bash examples/demo-rich.sh`（需 `curl`、`jq`）

写入后终端会打印 `RUN_ID`，并写入仓库根 `.demo-run-id`。浏览器：`http://localhost:5173/runs/<RUN_ID>`。

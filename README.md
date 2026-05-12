# AgentOps

HTTP 上报 **Run / Span** → Postgres；本仓库提供 **FastAPI**（:8000）与 **Vite + React**（:5173）列表、Span 树、时间线与只读「弱回放」。

## 快速开始

需要：**Docker**、**Node 20+**。在项目根目录：

| 步骤 | 命令 / 说明 |
|------|----------------|
| 后端 + DB + 演示数据（Windows） | `.\scripts\up.ps1`（会起 Docker、Compose、并执行 `examples\demo-rich.ps1`） |
| 或仅起容器 | `docker compose up -d` |
| 写入演示（API 已在 8000） | PowerShell：`.\examples\demo-rich.ps1`；Bash：`bash examples/demo-rich.sh` |
| 前端 | `cd frontend && npm install && npm run dev` → [http://localhost:5173](http://localhost:5173) |

端口：**API 8000**，**前端 5173**，**Postgres 5432**（`postgres` / `postgres`，库名 `agentops`）。OpenAPI：[http://localhost:8000/docs](http://localhost:8000/docs)。

**P0 验收（简）**：按上表起服务 → 跑测试（见下）→ 有演示数据时 UI 可见树与时间线。**功能说明在 Web 首页顶栏**，不写长文档。

## 环境变量（常用）

| 变量 | 默认 |
|------|------|
| `DATABASE_URL` | `postgresql+asyncpg://postgres:postgres@localhost:5432/agentops` |
| `RUN_LIST_LIMIT_DEFAULT` | `50` |
| `CORS_ORIGINS` | `http://localhost:5173` |

## HTTP 入口（契约以 `/docs` 为准）

`GET /health` · `POST/GET /v1/runs` · `POST/GET /v1/runs/{id}/spans`（批量 `{ "spans": [...] }`，`started_at` 升序、`NULL` 殿后）。

## 测试

本地需 Postgres；测试库示例：`agentops_test`。

```bash
docker compose exec postgres psql -U postgres -c "CREATE DATABASE agentops_test;"
cd backend && pip install -e ".[dev]" && export DATABASE_URL=postgresql+asyncpg://postgres:postgres@127.0.0.1:5432/agentops_test && alembic upgrade head && pytest
cd frontend && npm install && npm test && npm run build
```

CI：`.github/workflows/ci.yml`。

## 其它

- 示例脚本说明（极短）：[`examples/README.md`](examples/README.md)  
- 贡献与许可证：[`CONTRIBUTING.md`](CONTRIBUTING.md)、[`LICENSE`](LICENSE)

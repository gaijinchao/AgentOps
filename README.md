# AgentOps

FastAPI + Postgres（ingest/query）+ Vite/React（列表、Span 树、时间线、只读弱回放）。

## 范围 / 非目标

| 在范围内（P0） | 不在范围内 |
|----------------|------------|
| HTTP 写入/查询 Run·Span；UUID 服务端生成；无鉴权 | 账号体系、多租户、强 Replay、框架内置 SDK 适配 |
| `docker-compose`：Postgres + API；`examples/demo-rich.*` 演示 | 生产鉴权、队列异步摄取、自动脱敏 |
| 契约以运行中 **`/docs`** 为准 | 本仓库不提交本地 `需求文档.md`（见 `.gitignore`） |

## 快速开始

| 步骤 | 命令 |
|------|------|
| 起栈 + 演示数据（Windows） | `.\scripts\up.ps1` |
| 仅容器 | `docker compose up -d` |
| 仅灌演示（API 已 :8000） | `.\examples\demo-rich.ps1` 或 `bash examples/demo-rich.sh` |
| 前端 | `cd frontend && npm install && npm run dev` → http://localhost:5173 |

端口：**8000** / **5173** / **5432**（`postgres`/`postgres`，库 `agentops`）。

## 环境变量

`DATABASE_URL` · `RUN_LIST_LIMIT_DEFAULT`（默认 50）· `CORS_ORIGINS`（默认 `http://localhost:5173`）

## 测试

```bash
docker compose exec postgres psql -U postgres -c "CREATE DATABASE agentops_test;"
cd backend && pip install -e ".[dev]" && export DATABASE_URL=postgresql+asyncpg://postgres:postgres@127.0.0.1:5432/agentops_test && alembic upgrade head && pytest
cd frontend && npm install && npm test && npm run build
```

CI：`.github/workflows/ci.yml`。贡献与许可：`CONTRIBUTING.md`、`LICENSE`。

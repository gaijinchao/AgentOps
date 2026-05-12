# AgentOps

通过 HTTP 上报 **Run**（一次执行）与 **Span**（步骤树），数据写入 **Postgres**；提供 **OpenAPI**（`GET /docs`）与 **Web UI**（运行列表、筛选与分页、`external_ref`、Span 树、时间线、甘特条、弱回放）。默认 **无鉴权**；生产环境请自行加网关或鉴权。

**环境**：Python ≥3.11（后端 / 示例脚本）、Node ≥20（前端）、Docker（推荐，用于 Postgres + API）。

## 能力与接口（摘要）

| 能力 | 说明 |
|------|------|
| 健康检查 | `GET /health` |
| Run | `POST /v1/runs` 创建；`GET /v1/runs` 列表；`GET /v1/runs/{id}` 详情。列表可选查询参数：`limit`、`offset`、`status`、`external_ref`（精确匹配）。创建时可填可选字段 **`external_ref`**。 |
| Span | `POST` / `GET /v1/runs/{id}/spans`，请求体为 `{ "spans": [ ... ] }` |
| 契约与枚举 | 以运行中的 **`http://localhost:8000/docs`** 为准（端口随部署而变） |

## 快速开始

| 步骤 | 命令 |
|------|------|
| 起栈 + 演示数据（Windows） | `.\scripts\up.ps1` |
| 仅 Postgres + API（仓库根） | `docker compose up -d --build`（API 容器启动时会执行 `alembic upgrade head`，见 `backend/Dockerfile`） |
| 仅灌演示（API 已在 :8000） | `.\examples\demo-rich.ps1` 或 `bash examples/demo-rich.sh` |
| 前端开发 | `cd frontend && npm install && npm run dev` → http://localhost:5173 |

**端口**：API **8000**，前端开发 **5173**，Postgres **5432**（用户/密码 `postgres`，库名 **`agentops`**）。

## 最小示例数据（接入自测）

在 API 可访问（例如 `http://localhost:8000`）且健康检查为 200 后，任选其一：

- `python examples/quickstart.py --wait`（`--wait` 轮询 `/health`，最多约 90s）
- `powershell -File examples\quickstart.ps1 -Wait`
- `bash examples/quickstart.sh --wait`（需本机有 `python3` 或 `python`）

终端会打印 **Run 详情链接**（含 `external_ref: quickstart-demo`）。更多说明见 `examples/README.md`。

## 环境变量（API）

| 变量 | 含义 |
|------|------|
| `DATABASE_URL` | 异步 Postgres 连接串（compose 内已设） |
| `RUN_LIST_LIMIT_DEFAULT` | `GET /v1/runs` 未传 `limit` 时的默认条数（默认 50） |
| `RUN_LIST_LIMIT_MAX` | `limit` 上限（默认 200） |
| `CORS_ORIGINS` | 允许的前端源（默认 `http://localhost:5173`） |

前端若 API 非本机默认地址，可用 Vite 环境变量 **`VITE_API_URL`**（例如 `http://localhost:8000`）。

## Python SDK（可选）

仓库根执行：`pip install -e "./sdk/python"`。用法见 **`sdk/python/README.md`**。

## 本机跑后端 / 测试库

若**不用 Docker**、在本机直连 Postgres：设置 `DATABASE_URL` 后，在 `backend` 目录执行 **`alembic upgrade head`** 再启动 `uvicorn`。

本地测试库 **`agentops_test`** 需先创建并对该库执行迁移，再跑 pytest（与下节命令一致）。

## 测试

```bash
docker compose exec postgres psql -U postgres -c "CREATE DATABASE agentops_test;"
cd backend && pip install -e ".[dev]" && export DATABASE_URL=postgresql+asyncpg://postgres:postgres@127.0.0.1:5432/agentops_test && alembic upgrade head && pytest
cd frontend && npm install && npm test && npm run build
```

CI：`.github/workflows/ci.yml`。贡献与许可：`CONTRIBUTING.md`、`LICENSE`。

# AgentOps

## 项目定位

**自托管、REST/OpenAPI**：HTTP 上报 **Run** / **Span** → Postgres → 查询 API + **Web UI**（列表、Span 树、时间线、弱回放）。取向是 **栈小、数据不外发、契约看 `/docs`**；P0 **无鉴权**。主要对准 **多步不可见**、**trace 不外发**、**HTTP 即可接**。

## 体验目标（产品方向，迭代验收）

以下三条与内部规格对齐；**大能力须先在本 README「范围」中列出再实现**，避免静默扩 scope。

1. **泛接入**：任意语言/框架或无框架，只要具备 **HTTP** 或本仓库已提供的 **官方薄 SDK（仅封装 `/v1`，无服务端框架依赖）** 即可上报；不将某一商业框架私有协议作为唯一接入方式。
2. **极低接入**：个人开发者 **≤5 分钟** 从克隆到在 UI 看到自有进程的第一条 Run（基线：「5 分钟接入」+ `examples/quickstart.*`）；进一步目标为典型集成 **≤~15 行** 或 **单行 Client 初始化 + 环境变量**（以落地 SDK 文档为准）。「零代码」路径（包装器/网关/侧车等）若做须另开章节说明运维与安全边界。
3. **直观与美化**：列表与详情 **层级清晰**；树与时间线联动；时间维至少实现 **相对 Run 起点的偏移或等比例时间条（甘特式）** 之一；全站 **统一视觉与弱回放 JSON 可读性**；`demo-rich` 场景下 **`npm run build`** 通过且布局不崩。

**当前功能**：`POST/GET /v1/runs`（列表支持 `limit`、`offset`、`status`、`external_ref`）；`POST/GET /v1/runs/{id}/spans`（`{spans:[]}`）；Run 可选 **`external_ref`**；`GET /health`；Alembic；`docker-compose`；`examples/demo-rich.*`、`examples/quickstart.*`；官方薄 Python SDK **`sdk/python`**；CI（后端 pytest + 前端测试/构建）。

**如何使用**：仓库根 `.\scripts\up.ps1`（Windows，起栈并灌演示）→ `cd frontend && npm install && npm run dev` → http://localhost:5173。仅容器：`docker compose up -d`；仅灌数：`.\examples\demo-rich.ps1`。详见下表与「测试」。

## 范围 / 非目标

### P0（当前已实现）

| 在范围内（P0） | 不在范围内 |
|----------------|------------|
| HTTP 写入/查询 Run·Span；`GET /v1/runs` 支持 `limit`/`offset`/`status`/`external_ref`；UUID 服务端生成；无鉴权 | 账号体系、多租户、**生产级**鉴权 |
| `docker-compose`：Postgres + API；`examples/*`；**`sdk/python`** 薄 SDK | 异步队列摄取、自动脱敏 |
| 契约以运行中 **`/docs`** 为准 | 本仓库不提交本地 `需求文档.md`（见 `.gitignore`） |

### 体验目标迭代（后续仍可增强；本 PR 已部分落地）

| 已落地（持续打磨） | 仍默认不做（须另扩 README 再开发） |
|--------------------|-------------------------------------|
| `external_ref`、列表过滤与 `limit`/`offset`；详情 **甘特条 + 相对时间**；弱回放 **折叠 JSON**；`sdk/python` 薄客户端；全站 **色板/圆角/按钮与筛选条** | OTel 导出、强 Replay、Eval、多租户 |
| 更深主题（暗色）、网关「零代码」侧车等 | 生产级鉴权、队列硬依赖、自动脱敏管线 |

## 5 分钟接入（个人开发者）

目标：**只依赖 Docker** 起 API，用脚本写入一条最小 Run + Span，把输出里的 JSON 形状嵌进你自己的 Agent 即可（不必先装 Node）。

1. 仓库根：`docker compose up -d --build`，等到 `http://localhost:8000/health` 返回 200。
2. 任选其一写入示例数据（`--wait` / `-Wait` 会轮询 `/health`，最多约 90s）：
   - Python 3.11+：`python examples/quickstart.py --wait`
   - PowerShell：`powershell -File examples\quickstart.ps1 -Wait`
   - Bash：`bash examples/quickstart.sh --wait`（内部调用 `quickstart.py`，需本机有 `python3`/`python`）
3. 看 Web UI（可选）：另开终端 `cd frontend && npm install && npm run dev`，打开命令行打印的 `http://localhost:5173/runs/...`。

完整字段与枚举以运行中的 **`http://localhost:8000/docs`** 为准。Windows 一键起栈并灌**丰富**演示数据仍用 `.\scripts\up.ps1`（会跑 `demo-rich`）；**接自己的进程**时优先用本节的 `quickstart`。

## 快速开始

| 步骤 | 命令 |
|------|------|
| 起栈 + 演示数据（Windows） | `.\scripts\up.ps1` |
| 仅容器 | `docker compose up -d` |
| 仅灌演示（API 已 :8000） | `.\examples\demo-rich.ps1` 或 `bash examples/demo-rich.sh` |
| 前端 | `cd frontend && npm install && npm run dev` → http://localhost:5173 |

端口：**8000** / **5173** / **5432**（`postgres`/`postgres`，库 `agentops`）。

## 环境变量

`DATABASE_URL` · `RUN_LIST_LIMIT_DEFAULT`（默认 50）· `RUN_LIST_LIMIT_MAX`（默认 200，`GET /v1/runs` 的 `limit` 上限）· `CORS_ORIGINS`（默认 `http://localhost:5173`）

## Python SDK（薄封装）

仓库根：`pip install -e "./sdk/python"`。用法见 `sdk/python/README.md`（`Client.create_run` / `create_spans` / `list_runs`）。

## 测试

```bash
docker compose exec postgres psql -U postgres -c "CREATE DATABASE agentops_test;"
cd backend && pip install -e ".[dev]" && export DATABASE_URL=postgresql+asyncpg://postgres:postgres@127.0.0.1:5432/agentops_test && alembic upgrade head && pytest
cd frontend && npm install && npm test && npm run build
```

## 仅须你亲自完成

1. **Docker 路线**：在本机打开并运行 **Docker Desktop**，在仓库根执行 `docker compose up -d --build`。**API 容器每次启动都会执行 `alembic upgrade head`**（见 `backend/Dockerfile` 的 `CMD`），一般**不必**再手动给 `agentops` 库跑迁移。  
2. **看 Web UI**：本机安装 **Node 20+** 且 `npm` 在 PATH 后：`cd frontend && npm install && npm run dev`，浏览器打开 http://localhost:5173。  
3. （按需）把本地提交推到 GitHub：`git push origin main`（需已配置 SSH 或 HTTPS 凭据）。

若你**不用 Docker**、而是本机直连 Postgres：自行设置 `DATABASE_URL` 后，对**该库**执行一次 `cd backend && alembic upgrade head`。

CI：`.github/workflows/ci.yml`。贡献与许可：`CONTRIBUTING.md`、`LICENSE`。

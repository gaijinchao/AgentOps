# Contributing

- Python 3.11+、Node 20+；Postgres（根目录 `README.md`）。
- 后端：`cd backend && pip install -e ".[dev]" && alembic upgrade head && uvicorn app.main:app --reload --port 8000`
- 前端：`cd frontend && npm install && npm run dev`
- PR 前：`pytest`（`backend/`）、`npm test`（`frontend/`）；改动聚焦、说明动机。

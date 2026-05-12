# AgentOps Backend

FastAPI service for Run/Span ingest and queries. See repository root `README.md` for compose and Quickstart.

```bash
cd backend
pip install -e ".[dev]"
export DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/agentops
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

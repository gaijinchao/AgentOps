# Contributing

Thanks for your interest in improving AgentOps.

## Development setup

1. Install Python 3.11+ and Node.js 20+.
2. Start Postgres (see root `README.md` Quickstart). Create a test database `agentops_test` if you run backend tests locally.
3. Backend: `cd backend && pip install -e ".[dev]" && alembic upgrade head && uvicorn app.main:app --reload --port 8000`
4. Frontend: `cd frontend && npm install && npm run dev`

## Pull requests

- Keep changes focused on a single concern when possible.
- Run `pytest` in `backend/` and `npm test` in `frontend/` before opening a PR.
- Describe what changed and why in the PR description.

## Code style

Match surrounding code. Prefer small, readable modules over clever abstractions.

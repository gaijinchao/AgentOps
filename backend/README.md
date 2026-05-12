根目录 `README.md`。本地 API：

```bash
pip install -e ".[dev]"
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

`DATABASE_URL` 见根 README。

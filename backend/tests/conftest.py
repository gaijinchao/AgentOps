import os
from collections.abc import AsyncIterator

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text

os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@127.0.0.1:5432/agentops_test",
)

from app.database import engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest_asyncio.fixture(autouse=True)
async def wipe_db() -> AsyncIterator[None]:
    # function-scoped event loop + global engine pool: dispose so new connections bind to this loop.
    await engine.dispose()
    async with engine.begin() as conn:
        await conn.execute(text("TRUNCATE TABLE runs CASCADE"))
    yield
    async with engine.begin() as conn:
        await conn.execute(text("TRUNCATE TABLE runs CASCADE"))
    await engine.dispose()


@pytest_asyncio.fixture
async def client() -> AsyncIterator[AsyncClient]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import nulls_last, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.exceptions import AppError
from app.models import Run, RunStatus, Span, SpanStatus
from app.schemas import RunCreate, RunRead, SpanBatchCreate, SpanRead

router = APIRouter(prefix="/v1", tags=["runs"])


@router.post("/runs", response_model=RunRead, status_code=201)
async def create_run(body: RunCreate, db: AsyncSession = Depends(get_db)) -> Run:
    run = Run(
        status=RunStatus(body.status.value),
        started_at=body.started_at,
        ended_at=body.ended_at,
        input_summary=body.input_summary,
        output_summary=body.output_summary,
        error_summary=body.error_summary,
    )
    db.add(run)
    await db.commit()
    await db.refresh(run)
    return run


@router.get("/runs", response_model=list[RunRead], summary="List runs")
async def list_runs(db: AsyncSession = Depends(get_db)) -> list[Run]:
    stmt = select(Run).order_by(Run.created_at.desc()).limit(settings.run_list_limit_default)
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/runs/{run_id}", response_model=RunRead)
async def get_run(run_id: UUID, db: AsyncSession = Depends(get_db)) -> Run:
    run = await db.get(Run, run_id)
    if run is None:
        raise AppError("not_found", "Run not found", 404)
    return run


@router.get("/runs/{run_id}/spans", response_model=list[SpanRead])
async def list_spans_for_run(run_id: UUID, db: AsyncSession = Depends(get_db)) -> list[Span]:
    run = await db.get(Run, run_id)
    if run is None:
        raise AppError("not_found", "Run not found", 404)
    stmt = (
        select(Span)
        .where(Span.run_id == run_id)
        .order_by(nulls_last(Span.started_at.asc()))
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.post("/runs/{run_id}/spans", response_model=list[SpanRead], status_code=201)
async def create_spans(run_id: UUID, body: SpanBatchCreate, db: AsyncSession = Depends(get_db)) -> list[Span]:
    run = await db.get(Run, run_id)
    if run is None:
        raise AppError("not_found", "Run not found", 404)

    res_ids = await db.execute(select(Span.id).where(Span.run_id == run_id))
    existing_ids: set[UUID] = set(res_ids.scalars().all())

    new_spans: list[Span] = []
    for item in body.spans:
        span = Span(
            run_id=run_id,
            parent_span_id=item.parent_span_id,
            type=item.type,
            name=item.name,
            status=SpanStatus(item.status.value),
            started_at=item.started_at,
            ended_at=item.ended_at,
            attributes=item.attributes,
            error_message=item.error_message,
        )
        new_spans.append(span)

    db.add_all(new_spans)
    await db.flush()

    batch_ids = {s.id for s in new_spans}
    all_ids = existing_ids | batch_ids

    for span in new_spans:
        pid = span.parent_span_id
        if pid is not None and pid not in all_ids:
            await db.rollback()
            raise AppError("validation_error", f"parent_span_id {pid} not found for this run", 400)

    await db.commit()
    for s in new_spans:
        await db.refresh(s)

    return sorted(new_spans, key=lambda s: (s.started_at is None, s.started_at))

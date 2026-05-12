from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ErrorBody(BaseModel):
    code: str
    message: str


class RunStatusEnum(str, Enum):
    pending = "pending"
    running = "running"
    succeeded = "succeeded"
    failed = "failed"


class SpanStatusEnum(str, Enum):
    running = "running"
    succeeded = "succeeded"
    failed = "failed"


class RunCreate(BaseModel):
    status: RunStatusEnum
    started_at: datetime | None = None
    ended_at: datetime | None = None
    input_summary: str | None = None
    output_summary: str | None = None
    error_summary: str | None = None


class RunRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    status: RunStatusEnum
    started_at: datetime | None
    ended_at: datetime | None
    input_summary: str | None
    output_summary: str | None
    error_summary: str | None
    created_at: datetime


class SpanCreateItem(BaseModel):
    parent_span_id: UUID | None = None
    type: str = Field(..., max_length=64)
    name: str = Field(..., max_length=512)
    status: SpanStatusEnum
    started_at: datetime | None = None
    ended_at: datetime | None = None
    attributes: dict | None = None
    error_message: str | None = None


class SpanBatchCreate(BaseModel):
    spans: list[SpanCreateItem] = Field(..., min_length=1)


class SpanRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    run_id: UUID
    parent_span_id: UUID | None
    type: str
    name: str
    status: SpanStatusEnum
    started_at: datetime | None
    ended_at: datetime | None
    attributes: dict | None
    error_message: str | None
    created_at: datetime

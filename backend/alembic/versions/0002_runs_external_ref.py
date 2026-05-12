"""runs external_ref for business-side correlation

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-12

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: Union[str, Sequence[str], None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("runs", sa.Column("external_ref", sa.String(length=512), nullable=True))
    op.create_index("ix_runs_external_ref", "runs", ["external_ref"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_runs_external_ref", table_name="runs")
    op.drop_column("runs", "external_ref")

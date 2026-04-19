"""merge query_runs and profile_stack branches

Revision ID: c9e1f7a4b2d0
Revises: 7f0d1a2b3c4d, 8d4b7a9c2f31
Create Date: 2026-04-19 16:20:00.000000

"""

from typing import Sequence, Union


revision: str = "c9e1f7a4b2d0"
down_revision: Union[str, Sequence[str], None] = ("7f0d1a2b3c4d", "8d4b7a9c2f31")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass

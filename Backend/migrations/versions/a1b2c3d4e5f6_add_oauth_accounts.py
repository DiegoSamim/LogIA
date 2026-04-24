"""add_oauth_accounts

Revision ID: a1b2c3d4e5f6
Revises: 3cb626dadafd
Create Date: 2026-04-24 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '3cb626dadafd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'oauth_accounts',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('provider', sa.String(length=50), nullable=False),
        sa.Column('provider_user_id', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('provider', 'provider_user_id'),
    )
    op.create_index('ix_oauth_accounts_user_id', 'oauth_accounts', ['user_id'])
    op.alter_column('users', 'password_hash', nullable=True)


def downgrade() -> None:
    op.alter_column('users', 'password_hash', nullable=False)
    op.drop_index('ix_oauth_accounts_user_id', table_name='oauth_accounts')
    op.drop_table('oauth_accounts')

"""project_attachments_task_hours

Revision ID: 3c8d2a1f9e7b
Revises: efb6e5f196f6
Create Date: 2026-04-16 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '3c8d2a1f9e7b'
down_revision: Union[str, None] = 'efb6e5f196f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add hours_worked column to tasks
    op.add_column('tasks', sa.Column('hours_worked', sa.Float(), nullable=True))

    # Create project_attachments table
    op.create_table(
        'project_attachments',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('project_id', sa.UUID(), nullable=False),
        sa.Column('uploaded_by', sa.UUID(), nullable=False),
        sa.Column('file_name', sa.Text(), nullable=False),
        sa.Column('file_url', sa.Text(), nullable=False),
        sa.Column('file_type', sa.String(length=100), nullable=True),
        sa.Column('mime_type', sa.String(length=100), nullable=True),
        sa.Column('file_size', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['uploaded_by'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_project_attachments_project_id'), 'project_attachments', ['project_id'], unique=False)
    op.create_index(op.f('ix_project_attachments_uploaded_by'), 'project_attachments', ['uploaded_by'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_project_attachments_uploaded_by'), table_name='project_attachments')
    op.drop_index(op.f('ix_project_attachments_project_id'), table_name='project_attachments')
    op.drop_table('project_attachments')
    op.drop_column('tasks', 'hours_worked')

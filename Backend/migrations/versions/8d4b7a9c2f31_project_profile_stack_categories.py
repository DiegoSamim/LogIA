"""project_profile_stack_categories

Revision ID: 8d4b7a9c2f31
Revises: 3c8d2a1f9e7b
Create Date: 2026-04-16 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "8d4b7a9c2f31"
down_revision: Union[str, None] = "3c8d2a1f9e7b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


KNOWN_STACKS = (
    "react",
    "vite",
    "next.js",
    "angular",
    "vue",
    "nuxt",
    "react native",
    "expo",
    "tailwind css",
    "material ui",
    "node.js",
    "express",
    "nestjs",
    "fastapi",
    "django",
    "spring boot",
    ".net",
    "go",
    "laravel",
    "ruby on rails",
    "aws",
    "azure",
    "gcp",
    "docker",
    "kubernetes",
    "terraform",
    "github actions",
    "nginx",
    "cloudflare",
    "postgresql",
    "mysql",
    "sql server",
    "mongodb",
    "redis",
    "elasticsearch",
)


def _array_filter_sql(values: tuple[str, ...]) -> str:
    allowed = ", ".join(f"'{value}'" for value in values)
    return f"""
        ARRAY(
            SELECT tech
            FROM unnest(COALESCE(main_stack, ARRAY[]::text[])) WITH ORDINALITY AS item(tech, ord)
            WHERE lower(tech) IN ({allowed})
            ORDER BY ord
        )
    """


def upgrade() -> None:
    op.add_column(
        "project_profiles",
        sa.Column("frontend_stack", postgresql.ARRAY(sa.Text()), server_default="{}", nullable=False),
    )
    op.add_column(
        "project_profiles",
        sa.Column("backend_stack", postgresql.ARRAY(sa.Text()), server_default="{}", nullable=False),
    )
    op.add_column(
        "project_profiles",
        sa.Column("infra_stack", postgresql.ARRAY(sa.Text()), server_default="{}", nullable=False),
    )
    op.add_column(
        "project_profiles",
        sa.Column("database_stack", postgresql.ARRAY(sa.Text()), server_default="{}", nullable=False),
    )
    op.add_column(
        "project_profiles",
        sa.Column("other_stack", postgresql.ARRAY(sa.Text()), server_default="{}", nullable=False),
    )
    op.add_column("project_profiles", sa.Column("architecture_frontend", sa.Text(), nullable=True))
    op.add_column("project_profiles", sa.Column("architecture_backend", sa.Text(), nullable=True))
    op.add_column("project_profiles", sa.Column("architecture_integrations", sa.Text(), nullable=True))
    op.add_column("project_profiles", sa.Column("architecture_data", sa.Text(), nullable=True))
    op.add_column("project_profiles", sa.Column("architecture_infra", sa.Text(), nullable=True))
    op.add_column("project_profiles", sa.Column("business_rules_core", sa.Text(), nullable=True))
    op.add_column("project_profiles", sa.Column("business_rules_permissions", sa.Text(), nullable=True))
    op.add_column("project_profiles", sa.Column("business_rules_validations", sa.Text(), nullable=True))
    op.add_column("project_profiles", sa.Column("business_rules_constraints", sa.Text(), nullable=True))

    op.execute(
        f"""
        UPDATE project_profiles
        SET
            frontend_stack = {_array_filter_sql((
                "react", "vite", "next.js", "angular", "vue", "nuxt", "react native",
                "expo", "tailwind css", "material ui"
            ))},
            backend_stack = {_array_filter_sql((
                "node.js", "express", "nestjs", "fastapi", "django", "spring boot",
                ".net", "go", "laravel", "ruby on rails"
            ))},
            infra_stack = {_array_filter_sql((
                "aws", "azure", "gcp", "docker", "kubernetes", "terraform",
                "github actions", "nginx", "cloudflare"
            ))},
            database_stack = {_array_filter_sql((
                "postgresql", "mysql", "sql server", "mongodb", "redis", "elasticsearch"
            ))},
            other_stack = ARRAY(
                SELECT tech
                FROM unnest(COALESCE(main_stack, ARRAY[]::text[])) WITH ORDINALITY AS item(tech, ord)
                WHERE lower(tech) NOT IN ({", ".join(f"'{value}'" for value in KNOWN_STACKS)})
                ORDER BY ord
            )
        """
    )


def downgrade() -> None:
    op.drop_column("project_profiles", "business_rules_constraints")
    op.drop_column("project_profiles", "business_rules_validations")
    op.drop_column("project_profiles", "business_rules_permissions")
    op.drop_column("project_profiles", "business_rules_core")
    op.drop_column("project_profiles", "architecture_infra")
    op.drop_column("project_profiles", "architecture_data")
    op.drop_column("project_profiles", "architecture_integrations")
    op.drop_column("project_profiles", "architecture_backend")
    op.drop_column("project_profiles", "architecture_frontend")
    op.drop_column("project_profiles", "other_stack")
    op.drop_column("project_profiles", "database_stack")
    op.drop_column("project_profiles", "infra_stack")
    op.drop_column("project_profiles", "backend_stack")
    op.drop_column("project_profiles", "frontend_stack")

"""Parse DDL statements (CREATE TABLE ...) into entity/column/relation previews.

Uses sqlglot to support postgres, mysql, tsql, oracle, sqlite dialects.
MongoDB is not SQL; users create collections manually in that case.
"""
from __future__ import annotations

from dataclasses import dataclass, field

import sqlglot
from sqlglot import exp

from app.schemas.catalog import (
    ColumnCreate,
    ParsedEntityPreview,
    ParsedRelationPreview,
)

_DIALECT_MAP = {
    "postgres": "postgres",
    "mysql": "mysql",
    "sqlserver": "tsql",
    "oracle": "oracle",
    "sqlite": "sqlite",
}


@dataclass
class ParsedSchema:
    entities: list[ParsedEntityPreview] = field(default_factory=list)
    relations: list[ParsedRelationPreview] = field(default_factory=list)


def _extract_column(col_def: exp.ColumnDef, ordinal: int) -> ColumnCreate:
    name = col_def.this.name if col_def.this else ""
    data_type = col_def.args["kind"].sql(dialect="postgres") if col_def.args.get("kind") else "text"
    is_nullable = True
    is_pk = False
    is_unique = False
    default_value: str | None = None
    for constraint in col_def.args.get("constraints") or []:
        kind = constraint.args.get("kind")
        if isinstance(kind, exp.NotNullColumnConstraint):
            is_nullable = False
        elif isinstance(kind, exp.PrimaryKeyColumnConstraint):
            is_pk = True
            is_nullable = False
        elif isinstance(kind, exp.UniqueColumnConstraint):
            is_unique = True
        elif isinstance(kind, exp.DefaultColumnConstraint):
            default_value = kind.this.sql() if kind.this else None
    return ColumnCreate(
        name=name,
        data_type=data_type,
        is_primary_key=is_pk,
        is_unique=is_unique,
        is_nullable=is_nullable,
        default_value=default_value,
        ordinal=ordinal,
    )


def parse_ddl(ddl: str, dialect: str | None) -> ParsedSchema:
    read_dialect = _DIALECT_MAP.get(dialect or "", None)
    try:
        statements = sqlglot.parse(ddl, read=read_dialect)
    except Exception:
        statements = sqlglot.parse(ddl)

    result = ParsedSchema()
    for stmt in statements:
        if not isinstance(stmt, exp.Create):
            continue
        if (stmt.args.get("kind") or "").upper() != "TABLE":
            continue

        schema_expr = stmt.this
        table_name = ""
        schema_name: str | None = None
        if isinstance(schema_expr, exp.Schema):
            table = schema_expr.this
            if isinstance(table, exp.Table):
                table_name = table.name
                schema_name = table.db or None
            column_defs = [
                c for c in schema_expr.expressions if isinstance(c, exp.ColumnDef)
            ]
            pk_constraints = [
                c for c in schema_expr.expressions if isinstance(c, exp.PrimaryKey)
            ]
            fk_constraints = [
                c for c in schema_expr.expressions if isinstance(c, exp.ForeignKey)
            ]
        else:
            if isinstance(schema_expr, exp.Table):
                table_name = schema_expr.name
                schema_name = schema_expr.db or None
            column_defs = []
            pk_constraints = []
            fk_constraints = []

        columns = [_extract_column(c, idx) for idx, c in enumerate(column_defs)]

        pk_names: set[str] = set()
        for pk in pk_constraints:
            for col in pk.expressions or []:
                if isinstance(col, exp.Column):
                    pk_names.add(col.name)
        if pk_names:
            for col in columns:
                if col.name in pk_names:
                    col.is_primary_key = True
                    col.is_nullable = False

        fk_col_names: set[str] = set()
        for fk in fk_constraints:
            source_cols = [
                c.name for c in fk.expressions or [] if hasattr(c, "name")
            ]
            ref = fk.args.get("reference")
            if not ref or not ref.this:
                continue
            ref_schema = ref.this
            target_table = None
            target_cols: list[str] = []
            if isinstance(ref_schema, exp.Schema):
                tbl = ref_schema.this
                target_table = tbl.name if tbl else None
                target_cols = [
                    c.name for c in ref_schema.expressions or [] if hasattr(c, "name")
                ]
            elif isinstance(ref_schema, exp.Table):
                target_table = ref_schema.name
            if not target_table or not source_cols:
                continue
            for src, tgt in zip(source_cols, target_cols or [""] * len(source_cols)):
                fk_col_names.add(src)
                result.relations.append(
                    ParsedRelationPreview(
                        from_entity=table_name,
                        to_entity=target_table,
                        from_column=src,
                        to_column=tgt,
                        on_delete=None,
                    )
                )
        for col in columns:
            if col.name in fk_col_names:
                col.is_foreign_key = True

        result.entities.append(
            ParsedEntityPreview(
                name=table_name,
                schema_name=schema_name,
                columns=columns,
            )
        )

    return result

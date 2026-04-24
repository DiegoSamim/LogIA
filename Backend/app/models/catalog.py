import enum
import uuid

from sqlalchemy import Boolean, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class DatabaseDialect(str, enum.Enum):
    POSTGRES = "postgres"
    MYSQL = "mysql"
    SQLSERVER = "sqlserver"
    ORACLE = "oracle"
    SQLITE = "sqlite"
    MONGODB = "mongodb"
    OTHER = "other"


class DatabaseCatalog(Base, TimestampMixin):
    __tablename__ = "database_catalogs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        unique=True,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), default="Database Catalog")
    dialect: Mapped[str] = mapped_column(String(30), default=DatabaseDialect.POSTGRES.value)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    project: Mapped["Project"] = relationship(back_populates="catalog")  # type: ignore[name-defined]
    entities: Mapped[list["CatalogEntity"]] = relationship(
        back_populates="catalog", cascade="all, delete-orphan"
    )
    relations: Mapped[list["CatalogRelation"]] = relationship(
        back_populates="catalog", cascade="all, delete-orphan"
    )


class CatalogEntity(Base, TimestampMixin):
    __tablename__ = "catalog_entities"
    __table_args__ = (UniqueConstraint("catalog_id", "schema_name", "name"),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    catalog_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("database_catalogs.id", ondelete="CASCADE"),
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255))
    schema_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    entity_type: Mapped[str] = mapped_column(String(30), default="table")
    tags: Mapped[list[str]] = mapped_column(ARRAY(Text), server_default="{}", default=list)
    position_x: Mapped[float | None] = mapped_column(Float, nullable=True)
    position_y: Mapped[float | None] = mapped_column(Float, nullable=True)

    catalog: Mapped["DatabaseCatalog"] = relationship(back_populates="entities")
    columns: Mapped[list["CatalogColumn"]] = relationship(
        back_populates="entity",
        cascade="all, delete-orphan",
        order_by="CatalogColumn.ordinal",
    )


class CatalogColumn(Base, TimestampMixin):
    __tablename__ = "catalog_columns"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("catalog_entities.id", ondelete="CASCADE"),
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255))
    data_type: Mapped[str] = mapped_column(String(255))
    is_primary_key: Mapped[bool] = mapped_column(Boolean, default=False)
    is_unique: Mapped[bool] = mapped_column(Boolean, default=False)
    is_nullable: Mapped[bool] = mapped_column(Boolean, default=True)
    is_foreign_key: Mapped[bool] = mapped_column(Boolean, default=False)
    default_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    ordinal: Mapped[int] = mapped_column(Integer, default=0)

    entity: Mapped["CatalogEntity"] = relationship(back_populates="columns")


class CatalogRelation(Base, TimestampMixin):
    __tablename__ = "catalog_relations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    catalog_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("database_catalogs.id", ondelete="CASCADE"),
        index=True,
    )
    from_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("catalog_entities.id", ondelete="CASCADE"),
        index=True,
    )
    to_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("catalog_entities.id", ondelete="CASCADE"),
        index=True,
    )
    from_column: Mapped[str] = mapped_column(String(255))
    to_column: Mapped[str] = mapped_column(String(255))
    relation_type: Mapped[str] = mapped_column(String(30), default="one_to_many")
    on_delete: Mapped[str | None] = mapped_column(String(30), nullable=True)

    catalog: Mapped["DatabaseCatalog"] = relationship(back_populates="relations")
    from_entity: Mapped["CatalogEntity"] = relationship(foreign_keys=[from_entity_id])
    to_entity: Mapped["CatalogEntity"] = relationship(foreign_keys=[to_entity_id])

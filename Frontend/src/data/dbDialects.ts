export type DbDialect =
  | 'postgres'
  | 'mysql'
  | 'sqlserver'
  | 'oracle'
  | 'sqlite'
  | 'mongodb'
  | 'other'

export interface DialectInfo {
  label: string
  types: readonly string[]
  supportsSchemas: boolean
}

export const DB_DIALECTS: Record<DbDialect, DialectInfo> = {
  postgres: {
    label: 'PostgreSQL',
    supportsSchemas: true,
    types: [
      'uuid',
      'varchar(255)',
      'text',
      'char(n)',
      'integer',
      'bigint',
      'smallint',
      'serial',
      'bigserial',
      'boolean',
      'timestamp',
      'timestamptz',
      'date',
      'time',
      'numeric(10,2)',
      'real',
      'double precision',
      'jsonb',
      'json',
      'bytea',
      'inet',
      'cidr',
    ],
  },
  mysql: {
    label: 'MySQL',
    supportsSchemas: false,
    types: [
      'int',
      'bigint',
      'smallint',
      'tinyint(1)',
      'varchar(255)',
      'char(n)',
      'text',
      'mediumtext',
      'longtext',
      'datetime',
      'timestamp',
      'date',
      'time',
      'decimal(10,2)',
      'float',
      'double',
      'json',
      'blob',
      'enum',
    ],
  },
  sqlserver: {
    label: 'SQL Server',
    supportsSchemas: true,
    types: [
      'uniqueidentifier',
      'nvarchar(255)',
      'varchar(255)',
      'nchar(n)',
      'int',
      'bigint',
      'smallint',
      'tinyint',
      'bit',
      'datetime2',
      'datetimeoffset',
      'date',
      'time',
      'decimal(10,2)',
      'money',
      'float',
      'varbinary(max)',
      'xml',
    ],
  },
  oracle: {
    label: 'Oracle',
    supportsSchemas: true,
    types: [
      'VARCHAR2(255)',
      'NVARCHAR2(n)',
      'CHAR(n)',
      'NUMBER(10,2)',
      'INTEGER',
      'DATE',
      'TIMESTAMP',
      'TIMESTAMP WITH TIME ZONE',
      'CLOB',
      'BLOB',
      'RAW(n)',
    ],
  },
  sqlite: {
    label: 'SQLite',
    supportsSchemas: false,
    types: ['INTEGER', 'TEXT', 'REAL', 'BLOB', 'NUMERIC'],
  },
  mongodb: {
    label: 'MongoDB',
    supportsSchemas: false,
    types: [
      'String',
      'Int32',
      'Int64',
      'Double',
      'Decimal128',
      'Boolean',
      'Date',
      'ObjectId',
      'Array',
      'Object',
      'Binary',
      'Null',
    ],
  },
  other: {
    label: 'Outro',
    supportsSchemas: false,
    types: ['string', 'number', 'boolean', 'date', 'json'],
  },
}

export const DIALECT_OPTIONS: { value: DbDialect; label: string }[] = (
  Object.keys(DB_DIALECTS) as DbDialect[]
).map((value) => ({ value, label: DB_DIALECTS[value].label }))

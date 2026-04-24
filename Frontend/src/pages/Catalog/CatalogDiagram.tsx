import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  type Edge,
  type Node,
  type NodeChange,
  type NodeMouseHandler,
  applyNodeChanges,
  Handle,
  Position,
} from 'reactflow'
import 'reactflow/dist/style.css'

import type { EntitySummaryDTO, RelationDTO } from '@/services/catalog.service'

interface Props {
  entities: EntitySummaryDTO[]
  relations: RelationDTO[]
  onSelect: (entityId: string) => void
  onLayoutChange: (positions: { entity_id: string; x: number; y: number }[]) => void
}

interface TableNodeData {
  entity: EntitySummaryDTO
}

const CARDINALITY_LABEL: Record<string, string> = {
  one_to_one: '1 : 1',
  one_to_many: '1 : N',
  many_to_many: 'N : N',
}

function TableNode({ data }: { data: TableNodeData }) {
  const { entity } = data
  return (
    <div className="min-w-[200px] rounded-[10px] border border-white/10 bg-surface-container shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={false}
        className="!h-2 !w-2 !border-accent-indigo !bg-accent-indigo"
      />
      <div className="flex items-center gap-2 border-b border-white/6 px-3 py-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-surface-high text-white/60">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          </svg>
        </span>
        <p className="text-[13px] font-semibold text-white/92">{entity.name}</p>
        {entity.tags[0] && (
          <span className="ml-auto rounded-[4px] bg-accent-indigo/14 px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.12em] text-accent-indigo uppercase">
            {entity.tags[0]}
          </span>
        )}
      </div>
      <div className="px-3 py-2 text-[11px] text-white/56">
        <div className="flex justify-between">
          <span>Columns</span>
          <span className="font-mono text-white/72">{entity.columns_count}</span>
        </div>
        <div className="flex justify-between">
          <span>Relations</span>
          <span className="font-mono text-white/72">{entity.relations_count}</span>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={false}
        className="!h-2 !w-2 !border-accent-violet !bg-accent-violet"
      />
    </div>
  )
}

const nodeTypes = { table: TableNode }

function computeAutoLayout(entities: EntitySummaryDTO[]): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {}
  const perRow = Math.max(1, Math.ceil(Math.sqrt(entities.length)))
  const gapX = 280
  const gapY = 200
  entities.forEach((e, i) => {
    const row = Math.floor(i / perRow)
    const col = i % perRow
    positions[e.id] = { x: col * gapX + 40, y: row * gapY + 40 }
  })
  return positions
}

export default function CatalogDiagram({ entities, relations, onSelect, onLayoutChange }: Props) {
  const autoLayout = useMemo(() => computeAutoLayout(entities), [entities])

  const [nodes, setNodes] = useState<Node<TableNodeData>[]>([])

  // Sync nodes when entity list changes (initial load, new entity added, etc.)
  useEffect(() => {
    setNodes(
      entities.map((entity) => {
        const auto = autoLayout[entity.id] ?? { x: 0, y: 0 }
        return {
          id: entity.id,
          type: 'table',
          position: {
            x: entity.position_x ?? auto.x,
            y: entity.position_y ?? auto.y,
          },
          data: { entity },
        }
      }),
    )
  }, [entities]) // intentionally omit autoLayout to avoid reset on layout recalc

  const edges = useMemo<Edge[]>(
    () =>
      relations.map((rel) => ({
        id: rel.id,
        source: rel.from_entity_id,
        target: rel.to_entity_id,
        label: `${rel.from_column} → ${rel.to_column}  ${CARDINALITY_LABEL[rel.relation_type] ?? ''}`,
        labelStyle: { fill: 'rgba(255,255,255,0.64)', fontSize: 10 },
        labelBgStyle: { fill: 'rgba(13,15,20,0.9)' },
        style: { stroke: 'rgba(139,92,246,0.55)' },
        animated: false,
      })),
    [relations],
  )

  const debounceRef = useRef<number | null>(null)

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds))

      const hasPositionDone = changes.some((c) => c.type === 'position' && !c.dragging)
      if (hasPositionDone) {
        if (debounceRef.current) window.clearTimeout(debounceRef.current)
        debounceRef.current = window.setTimeout(() => {
          setNodes((nds) => {
            onLayoutChange(nds.map((n) => ({ entity_id: n.id, x: n.position.x, y: n.position.y })))
            return nds
          })
        }, 500)
      }
    },
    [onLayoutChange],
  )

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      onSelect(node.id)
    },
    [onSelect],
  )

  useEffect(
    () => () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    },
    [],
  )

  return (
    <div className="h-[calc(100vh-220px)] min-h-[480px] w-full overflow-hidden rounded-[12px] border border-white/6 bg-surface-low/40">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onNodeClick={handleNodeClick}
        nodesConnectable={false}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={18} size={1} color="rgba(255,255,255,0.06)" />
        <MiniMap
          nodeColor={() => '#1A1D26'}
          maskColor="rgba(10,12,16,0.7)"
          style={{ backgroundColor: '#0A0C10', border: '1px solid rgba(255,255,255,0.06)' }}
        />
        <Controls
          style={{
            background: '#13161E',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
          }}
        />
      </ReactFlow>
    </div>
  )
}

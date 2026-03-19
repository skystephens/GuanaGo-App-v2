import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  ReactFlow, Node, Edge, Background, Controls, MiniMap,
  useNodesState, useEdgesState, MarkerType, NodeProps,
  Handle, Position, Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ArrowLeft, TowerControl, RefreshCw, Network, Info } from 'lucide-react';
import { AppRoute } from '../../types';
import type { SeccionControl, TareaControl, EstadoTarea } from './AdminTorreControl';

// ─── Constants ───────────────────────────────────────────────────────────────
const TORRE_KEY = 'guanago_torre_v3';

const SECTION_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  aliados:     { bg: '#022c22', border: '#34d399', text: '#6ee7b7', glow: '#34d39933' },
  pwa:         { bg: '#0c1a2e', border: '#60a5fa', text: '#93c5fd', glow: '#60a5fa33' },
  ads:         { bg: '#2d1800', border: '#fbbf24', text: '#fde68a', glow: '#fbbf2433' },
  seguridad:   { bg: '#2d0a0a', border: '#f87171', text: '#fca5a5', glow: '#f8717133' },
  pagos:       { bg: '#1e0a3d', border: '#c084fc', text: '#d8b4fe', glow: '#c084fc33' },
  lanzamiento: { bg: '#2d0a1e', border: '#f472b6', text: '#fbcfe8', glow: '#f472b633' },
  firebase:    { bg: '#2d1000', border: '#fb923c', text: '#fed7aa', glow: '#fb923c33' },
  ia:          { bg: '#1a0533', border: '#a78bfa', text: '#ddd6fe', glow: '#a78bfa33' },
  comercial:   { bg: '#022926', border: '#2dd4bf', text: '#99f6e4', glow: '#2dd4bf33' },
  marca:       { bg: '#031d26', border: '#22d3ee', text: '#a5f3fc', glow: '#22d3ee33' },
};

const ESTADO_COLOR: Record<EstadoTarea, { dot: string; label: string }> = {
  pendiente:   { dot: '#6b7280', label: 'Pendiente' },
  en_progreso: { dot: '#3b82f6', label: 'En progreso' },
  completado:  { dot: '#22c55e', label: 'Completado' },
  bloqueado:   { dot: '#ef4444', label: 'Bloqueado' },
};

const DEFAULT_COLOR = { bg: '#0f172a', border: '#475569', text: '#94a3b8', glow: '#47556933' };

// ─── Helpers ─────────────────────────────────────────────────────────────────
const loadTorre = (): SeccionControl[] => {
  try {
    const raw = localStorage.getItem(TORRE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
};

const radialPos = (i: number, total: number, cx: number, cy: number, r: number) => {
  const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
};

// ─── Node: Root ──────────────────────────────────────────────────────────────
function RootNode() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #0c2340 0%, #020617 100%)',
      border: '2px solid #38bdf8',
      borderRadius: 20,
      padding: '18px 28px',
      textAlign: 'center',
      minWidth: 170,
      boxShadow: '0 0 40px #38bdf840, 0 0 80px #38bdf820',
      cursor: 'default',
    }}>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: 'none' }} />
      <div style={{ fontSize: 28, marginBottom: 6 }}>🗺️</div>
      <div style={{ color: '#e2e8f0', fontWeight: 800, fontSize: 16, letterSpacing: 0.5 }}>GuanaGO 2026</div>
      <div style={{ color: '#38bdf8', fontSize: 11, marginTop: 4, fontWeight: 500 }}>Mega Proyecto</div>
    </div>
  );
}

// ─── Node: Section ────────────────────────────────────────────────────────────
function SectionNode({ data }: NodeProps) {
  const { seccion, expanded, onToggle, completadas, total } = data as {
    seccion: SeccionControl;
    expanded: boolean;
    onToggle: () => void;
    completadas: number;
    total: number;
  };
  const pct = total > 0 ? Math.round((completadas / total) * 100) : 0;
  const c = SECTION_COLORS[seccion.id] ?? DEFAULT_COLOR;
  const allDone = total > 0 && completadas === total;

  return (
    <div
      onClick={onToggle}
      style={{
        background: c.bg,
        border: `2px solid ${expanded ? c.border : c.border + '70'}`,
        borderRadius: 14,
        padding: '10px 14px',
        minWidth: 160,
        maxWidth: 195,
        cursor: 'pointer',
        boxShadow: expanded ? `0 0 24px ${c.glow}` : 'none',
        transition: 'box-shadow 0.25s, border-color 0.25s',
        userSelect: 'none',
      }}
    >
      <Handle type="target" position={Position.Left}  style={{ opacity: 0, pointerEvents: 'none' }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0, pointerEvents: 'none' }} />

      {/* Title */}
      <div style={{ color: c.text, fontWeight: 700, fontSize: 12.5, lineHeight: 1.3, marginBottom: 6 }}>
        {seccion.titulo}
      </div>

      {/* Progress bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ flex: 1, height: 5, background: '#1e293b', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            width: `${pct}%`, height: '100%',
            background: allDone ? '#22c55e' : c.border,
            borderRadius: 3,
            transition: 'width 0.4s',
          }} />
        </div>
        <span style={{ color: allDone ? '#22c55e' : c.text, fontSize: 10, fontWeight: 600, minWidth: 28 }}>{pct}%</span>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
        <span style={{ color: '#64748b', fontSize: 10 }}>{completadas}/{total} tareas</span>
        <span style={{ color: expanded ? c.border : '#475569', fontSize: 10 }}>
          {expanded ? '▲ contraer' : '▼ expandir'}
        </span>
      </div>
    </div>
  );
}

// ─── Node: Task ───────────────────────────────────────────────────────────────
function TaskNode({ data }: NodeProps) {
  const { tarea, sectionColor } = data as { tarea: TareaControl; sectionColor: typeof DEFAULT_COLOR };
  const est = ESTADO_COLOR[tarea.estado] ?? ESTADO_COLOR.pendiente;

  return (
    <div style={{
      background: '#080f1e',
      border: `1.5px solid ${est.dot}55`,
      borderRadius: 9,
      padding: '7px 10px',
      minWidth: 140,
      maxWidth: 180,
    }}>
      <Handle type="target" position={Position.Left} style={{ opacity: 0, pointerEvents: 'none' }} />

      {/* Status dot + title */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: est.dot,
          flexShrink: 0, marginTop: 3,
          boxShadow: `0 0 6px ${est.dot}88`,
        }} />
        <span style={{ color: '#cbd5e1', fontSize: 11, lineHeight: 1.4 }}>
          {tarea.titulo.length > 42 ? tarea.titulo.slice(0, 42) + '…' : tarea.titulo}
        </span>
      </div>

      {/* Priority badge */}
      {tarea.prioridad === 'critica' && (
        <div style={{ marginTop: 4, paddingLeft: 15 }}>
          <span style={{ color: '#ef4444', fontSize: 9, fontWeight: 600, letterSpacing: 0.5 }}>CRÍTICA</span>
        </div>
      )}
    </div>
  );
}

const nodeTypes = {
  rootNode:    RootNode,
  sectionNode: SectionNode,
  taskNode:    TaskNode,
};

// ─── Legend ───────────────────────────────────────────────────────────────────
function Legend() {
  return (
    <div style={{
      background: '#0f172a', border: '1px solid #1e293b',
      borderRadius: 10, padding: '10px 14px', fontSize: 11, color: '#94a3b8',
    }}>
      <div style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: 6 }}>Estado de tareas</div>
      {Object.entries(ESTADO_COLOR).map(([k, v]) => (
        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: v.dot, boxShadow: `0 0 5px ${v.dot}88` }} />
          <span>{v.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Stats bar ───────────────────────────────────────────────────────────────
function StatsBar({ secciones }: { secciones: SeccionControl[] }) {
  const totalTareas = secciones.reduce((a, s) => a + s.tareas.length, 0);
  const completadas = secciones.reduce((a, s) => a + s.tareas.filter(t => t.estado === 'completado').length, 0);
  const enProgreso  = secciones.reduce((a, s) => a + s.tareas.filter(t => t.estado === 'en_progreso').length, 0);
  const criticas    = secciones.reduce((a, s) => a + s.tareas.filter(t => t.prioridad === 'critica' && t.estado !== 'completado').length, 0);
  const pct = totalTareas > 0 ? Math.round((completadas / totalTareas) * 100) : 0;

  const stat = (label: string, val: number | string, color: string) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <span style={{ color, fontWeight: 700, fontSize: 18 }}>{val}</span>
      <span style={{ color: '#64748b', fontSize: 10 }}>{label}</span>
    </div>
  );

  return (
    <div style={{
      display: 'flex', gap: 20, alignItems: 'center',
      background: '#0f172a', border: '1px solid #1e293b',
      borderRadius: 10, padding: '8px 16px',
    }}>
      {stat('Proyectos', secciones.length, '#38bdf8')}
      {stat('Tareas', totalTareas, '#94a3b8')}
      {stat('Completadas', completadas, '#22c55e')}
      {stat('En progreso', enProgreso, '#3b82f6')}
      {stat('Críticas', criticas, '#ef4444')}
      {stat('Avance', `${pct}%`, pct >= 50 ? '#22c55e' : '#fbbf24')}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props {
  onBack: () => void;
  onNavigate: (route: AppRoute) => void;
}

export default function AdminMapaMental({ onBack, onNavigate }: Props) {
  const [secciones, setSecciones] = useState<SeccionControl[]>(() => loadTorre());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleSection = useCallback((id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpanded(new Set(secciones.map(s => s.id)));
  }, [secciones]);

  const collapseAll = useCallback(() => setExpanded(new Set()), []);

  const reload = useCallback(() => setSecciones(loadTorre()), []);

  // ─── Build graph ────────────────────────────────────────────────────────────
  const { builtNodes, builtEdges } = useMemo(() => {
    const cx = 0, cy = 0;
    const sectionR = 400;
    const taskR    = 170;
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Root
    nodes.push({
      id: 'root',
      type: 'rootNode',
      position: { x: cx - 85, y: cy - 50 },
      data: {},
      draggable: true,
    });

    secciones.forEach((sec, si) => {
      const sp = radialPos(si, secciones.length, cx, cy, sectionR);
      const completadas = sec.tareas.filter(t => t.estado === 'completado').length;
      const c = SECTION_COLORS[sec.id] ?? DEFAULT_COLOR;
      const isExpanded = expanded.has(sec.id);

      nodes.push({
        id: sec.id,
        type: 'sectionNode',
        position: { x: sp.x - 97, y: sp.y - 38 },
        data: {
          seccion: sec,
          expanded: isExpanded,
          completadas,
          total: sec.tareas.length,
          onToggle: () => toggleSection(sec.id),
        },
        draggable: true,
      });

      edges.push({
        id: `root-${sec.id}`,
        source: 'root',
        target: sec.id,
        type: 'smoothstep',
        style: { stroke: c.border + '55', strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: c.border + '55', width: 12, height: 12 },
      });

      if (isExpanded) {
        sec.tareas.forEach((tarea, ti) => {
          const tp = radialPos(ti, sec.tareas.length, sp.x, sp.y, taskR);
          const nid = `task-${sec.id}-${tarea.id}`;
          nodes.push({
            id: nid,
            type: 'taskNode',
            position: { x: tp.x - 90, y: tp.y - 22 },
            data: { tarea, sectionColor: c },
            draggable: true,
          });
          const eCol = ESTADO_COLOR[tarea.estado]?.dot ?? '#334155';
          edges.push({
            id: `e-${nid}`,
            source: sec.id,
            target: nid,
            type: 'smoothstep',
            style: { stroke: eCol + '66', strokeWidth: 1 },
          });
        });
      }
    });

    return { builtNodes: nodes, builtEdges: edges };
  }, [secciones, expanded, toggleSection]);

  const [nodes, setNodes, onNodesChange] = useNodesState(builtNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(builtEdges);

  useEffect(() => { setNodes(builtNodes); }, [builtNodes, setNodes]);
  useEffect(() => { setEdges(builtEdges); }, [builtEdges, setEdges]);

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#020617', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 16px',
        background: '#0a0f1e',
        borderBottom: '1px solid #1e293b',
        zIndex: 10, flexShrink: 0,
      }}>
        <button
          onClick={onBack}
          style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13 }}
        >
          <ArrowLeft size={16} /> Volver
        </button>

        <Network size={18} style={{ color: '#38bdf8' }} />
        <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 15 }}>Mapa Mental</span>
        <span style={{ color: '#334155', fontSize: 13 }}>—</span>
        <span style={{ color: '#64748b', fontSize: 12 }}>Haz clic en un nodo para expandir sus tareas</span>

        <div style={{ flex: 1 }} />

        {/* Expand / Collapse all */}
        <button
          onClick={expandAll}
          style={{ color: '#94a3b8', background: '#1e293b', border: '1px solid #334155', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: 12 }}
        >
          Expandir todo
        </button>
        <button
          onClick={collapseAll}
          style={{ color: '#94a3b8', background: '#1e293b', border: '1px solid #334155', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: 12 }}
        >
          Contraer todo
        </button>

        <button
          onClick={reload}
          title="Recargar desde localStorage"
          style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
        >
          <RefreshCw size={15} />
        </button>

        <button
          onClick={() => onNavigate(AppRoute.ADMIN_TORRE_CONTROL)}
          style={{
            color: '#38bdf8', background: '#0c2340',
            border: '1px solid #0369a1', borderRadius: 8,
            padding: '6px 12px', cursor: 'pointer', fontSize: 12,
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <TowerControl size={14} /> Torre de Control
        </button>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.15}
          maxZoom={2.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#0f172a" gap={28} size={1} />
          <Controls
            style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}
          />
          <MiniMap
            style={{ background: '#0a0f1e', border: '1px solid #1e293b' }}
            nodeColor={(n) => {
              if (n.type === 'rootNode') return '#38bdf8';
              if (n.type === 'sectionNode') {
                const id = n.id as string;
                return SECTION_COLORS[id]?.border ?? '#475569';
              }
              return '#1e293b';
            }}
            maskColor="#02061766"
          />

          {/* Stats panel — top right */}
          <Panel position="top-right" style={{ margin: 12 }}>
            <StatsBar secciones={secciones} />
          </Panel>

          {/* Legend — bottom left */}
          <Panel position="bottom-left" style={{ margin: 12 }}>
            <Legend />
          </Panel>

          {/* Hint — bottom right */}
          <Panel position="bottom-right" style={{ margin: 12 }}>
            <div style={{
              background: '#0f172a', border: '1px solid #1e293b',
              borderRadius: 8, padding: '7px 12px', fontSize: 11, color: '#475569',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Info size={12} />
              Scroll para zoom · Drag para mover · Editar en Torre de Control
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}

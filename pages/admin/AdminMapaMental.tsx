import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  ReactFlow, Node, Edge, Background, Controls, MiniMap,
  useNodesState, useEdgesState, MarkerType, NodeProps,
  Handle, Position, Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ArrowLeft, TowerControl, RefreshCw, Network, Info, Layers } from 'lucide-react';
import { AppRoute } from '../../types';
import type { SeccionControl, TareaControl, EstadoTarea } from './AdminTorreControl';

type MapaVista = 'proyectos' | 'arquitectura';

// ─── Constants ───────────────────────────────────────────────────────────────
const TORRE_KEY = 'guanago_torre_v3';

const SECTION_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  aliados:           { bg: '#022c22', border: '#34d399', text: '#6ee7b7', glow: '#34d39933' },
  pwa:               { bg: '#0c1a2e', border: '#60a5fa', text: '#93c5fd', glow: '#60a5fa33' },
  ads:               { bg: '#2d1800', border: '#fbbf24', text: '#fde68a', glow: '#fbbf2433' },
  seguridad:         { bg: '#2d0a0a', border: '#f87171', text: '#fca5a5', glow: '#f8717133' },
  pagos:             { bg: '#1e0a3d', border: '#c084fc', text: '#d8b4fe', glow: '#c084fc33' },
  lanzamiento:       { bg: '#2d0a1e', border: '#f472b6', text: '#fbcfe8', glow: '#f472b633' },
  firebase:          { bg: '#2d1000', border: '#fb923c', text: '#fed7aa', glow: '#fb923c33' },
  ia:                { bg: '#1a0533', border: '#a78bfa', text: '#ddd6fe', glow: '#a78bfa33' },
  comercial:         { bg: '#022926', border: '#2dd4bf', text: '#99f6e4', glow: '#2dd4bf33' },
  marca:             { bg: '#031d26', border: '#22d3ee', text: '#a5f3fc', glow: '#22d3ee33' },
  guiasai_agencias:  { bg: '#2d1500', border: '#fb7235', text: '#fed7b0', glow: '#fb723533' },
  lean_canvas:       { bg: '#140a2d', border: '#818cf8', text: '#c7d2fe', glow: '#818cf833' },
  marketing:         { bg: '#2d0a1a', border: '#f472b6', text: '#fce7f3', glow: '#f472b633' },
  tokens_blockchain: { bg: '#2d2400', border: '#eab308', text: '#fef08a', glow: '#eab30833' },
  experiencia_b2c:   { bg: '#052e16', border: '#4ade80', text: '#86efac', glow: '#4ade8033' },
  airtable_datos:    { bg: '#1a2e05', border: '#a3e635', text: '#d9f99d', glow: '#a3e63533' },
  backend_faltante:  { bg: '#0a1a2e', border: '#38bdf8', text: '#7dd3fc', glow: '#38bdf833' },
  admin_metricas:    { bg: '#2e0a0a', border: '#f87171', text: '#fecaca', glow: '#f8717133' },
  b2c:               { bg: '#0a1e2e', border: '#7dd3fc', text: '#bae6fd', glow: '#7dd3fc33' },
  b2b:               { bg: '#1e1a05', border: '#fbbf24', text: '#fde68a', glow: '#fbbf2433' },
  ceo:               { bg: '#2e0a14', border: '#fb7185', text: '#fecdd3', glow: '#fb718533' },
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

// ─── Node: Architecture Block ─────────────────────────────────────────────────
function ArchNode({ data }: NodeProps) {
  const { label, sublabel, emoji, color, border, bg, done } = data as {
    label: string; sublabel: string; emoji: string;
    color: string; border: string; bg: string; done: boolean;
  };
  return (
    <div style={{
      background: bg,
      border: `2px solid ${border}`,
      borderRadius: 12,
      padding: '10px 14px',
      minWidth: 148,
      maxWidth: 180,
      boxShadow: `0 0 18px ${border}44`,
      opacity: done ? 1 : 0.75,
    }}>
      <Handle type="target" position={Position.Left}  style={{ opacity: 0, pointerEvents: 'none' }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0, pointerEvents: 'none' }} />
      <Handle type="target" position={Position.Top}   style={{ opacity: 0, pointerEvents: 'none' }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: 'none' }} />
      <div style={{ fontSize: 18, marginBottom: 4 }}>{emoji}</div>
      <div style={{ color, fontWeight: 700, fontSize: 12, lineHeight: 1.3 }}>{label}</div>
      <div style={{ color: '#64748b', fontSize: 10, marginTop: 3, lineHeight: 1.4 }}>{sublabel}</div>
      {done && <div style={{ color: '#22c55e', fontSize: 9, marginTop: 4, fontWeight: 700 }}>✓ ACTIVO</div>}
      {!done && <div style={{ color: '#f59e0b', fontSize: 9, marginTop: 4, fontWeight: 700 }}>⬡ PENDIENTE</div>}
    </div>
  );
}

// ─── Architecture graph (static) ─────────────────────────────────────────────
function buildArchNodes(): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const x0 = -600;

  // ── CAPA 0: Centro/marca ──
  nodes.push({ id: 'arch-root', type: 'archNode', position: { x: -90, y: 0 }, data: {
    label: 'GuanaGO', sublabel: 'Plataforma turismo San Andrés', emoji: '🗺️',
    color: '#38bdf8', border: '#38bdf8', bg: '#071728', done: true,
  }});

  // ── CAPA 1: Canales de acceso (arriba) ──
  const canales = [
    { id: 'ch-b2c',     label: 'App B2C Turista',    sublabel: 'Descubrir, reservar, itinerario', emoji: '🌴', color: '#4ade80', border: '#4ade80', bg: '#052e16', done: true },
    { id: 'ch-b2b',     label: 'Portal Agencias',    sublabel: 'GuiaSAI · cotizador B2B + PDF', emoji: '🏢', color: '#fbbf24', border: '#fbbf24', bg: '#1c1100', done: true },
    { id: 'ch-partner', label: 'Portal Aliado',       sublabel: 'Dashboard + Scanner QR + Wallet', emoji: '🤝', color: '#a78bfa', border: '#a78bfa', bg: '#1a0533', done: true },
    { id: 'ch-admin',   label: 'Panel Admin CEO',     sublabel: 'Torre Control · IA · Métricas', emoji: '⚙️', color: '#fb7185', border: '#fb7185', bg: '#2e0714', done: true },
  ];
  canales.forEach((c, i) => {
    const xPos = x0 + i * 320;
    nodes.push({ id: c.id, type: 'archNode', position: { x: xPos, y: -230 }, data: c });
    edges.push({ id: `e-root-${c.id}`, source: 'arch-root', target: c.id, type: 'smoothstep',
      style: { stroke: c.border + '66', strokeWidth: 1.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color: c.border + '66', width: 10, height: 10 }});
  });

  // ── CAPA 2: Features core (debajo del root) ──
  const features = [
    { id: 'ft-catalogo',    label: 'Catálogo Servicios', sublabel: 'Tours · Hoteles · Taxis · Paquetes', emoji: '📋', color: '#34d399', border: '#34d399', bg: '#022c22', done: true },
    { id: 'ft-itinerario',  label: 'Itinerario IA',      sublabel: 'Plan día a día personalizado', emoji: '📅', color: '#60a5fa', border: '#60a5fa', bg: '#0c1a2e', done: false },
    { id: 'ft-reservas',    label: 'Reservas & Pagos',   sublabel: 'Carrito → Wompi → Voucher', emoji: '💳', color: '#c084fc', border: '#c084fc', bg: '#1e0a3d', done: false },
    { id: 'ft-mapa',        label: 'Mapa Interactivo',   sublabel: 'Mapbox · Directorio · POIs', emoji: '🗺️', color: '#fbbf24', border: '#fbbf24', bg: '#2d1800', done: true },
    { id: 'ft-caribbean',   label: 'Caribbean Night',    sublabel: 'Eventos RIMM · Artistas · Tickets', emoji: '🎶', color: '#f472b6', border: '#f472b6', bg: '#2d0a1e', done: true },
    { id: 'ft-recomen',     label: 'Recomendaciones',    sublabel: 'IA personalizada por perfil', emoji: '✨', color: '#a78bfa', border: '#a78bfa', bg: '#1a0533', done: false },
    { id: 'ft-reseñas',     label: 'Reseñas',            sublabel: 'Calificaciones verificadas', emoji: '⭐', color: '#fde68a', border: '#fbbf24', bg: '#2d1800', done: false },
    { id: 'ft-wallet',      label: 'GuanaWallet',        sublabel: 'Puntos · Tokens · Beneficios', emoji: '👛', color: '#6ee7b7', border: '#34d399', bg: '#022c22', done: true },
  ];
  const featCols = 4;
  features.forEach((f, i) => {
    const col = i % featCols;
    const row = Math.floor(i / featCols);
    nodes.push({ id: f.id, type: 'archNode', position: { x: x0 + col * 310, y: 200 + row * 190 }, data: f });
    edges.push({ id: `e-root-${f.id}`, source: 'arch-root', target: f.id, type: 'smoothstep',
      style: { stroke: f.border + '44', strokeWidth: 1.2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: f.border + '44', width: 9, height: 9 }});
  });

  // ── CAPA 3: Infraestructura (fondo) ──
  const infra = [
    { id: 'in-airtable',  label: 'Airtable',       sublabel: 'Captura datos · Fuente verdad', emoji: '📊', color: '#a3e635', border: '#a3e635', bg: '#1a2e05', done: true },
    { id: 'in-firestore', label: 'Firestore',       sublabel: 'Runtime · Conversaciones · Cache', emoji: '🔥', color: '#fb923c', border: '#fb923c', bg: '#2d1000', done: false },
    { id: 'in-auth',      label: 'Firebase Auth',   sublabel: 'Google · Email · Custom Claims', emoji: '🔐', color: '#f87171', border: '#f87171', bg: '#2d0a0a', done: true },
    { id: 'in-groq',      label: 'Groq / Llama',    sublabel: 'IA: cotizador · turista · admin', emoji: '🤖', color: '#ddd6fe', border: '#a78bfa', bg: '#1a0533', done: true },
    { id: 'in-mapbox',    label: 'Mapbox',           sublabel: 'Mapas interactivos + rutas', emoji: '📍', color: '#7dd3fc', border: '#38bdf8', bg: '#071728', done: true },
    { id: 'in-storage',   label: 'Firebase Storage', sublabel: 'Imágenes servicios + galería', emoji: '🖼️', color: '#fed7aa', border: '#fb923c', bg: '#2d1000', done: false },
    { id: 'in-make',      label: 'Make.com',         sublabel: 'Automatizaciones · Sync · Email', emoji: '⚡', color: '#fde68a', border: '#fbbf24', bg: '#2d1800', done: true },
    { id: 'in-wompi',     label: 'Wompi / PayU',     sublabel: 'Pasarela de pago Colombia', emoji: '💰', color: '#d8b4fe', border: '#c084fc', bg: '#1e0a3d', done: false },
  ];
  infra.forEach((inf, i) => {
    const col = i % featCols;
    const row = Math.floor(i / featCols);
    nodes.push({ id: inf.id, type: 'archNode', position: { x: x0 + col * 310, y: 580 + row * 190 }, data: inf });
  });
  // Conectar features → infra
  const featureInfra: [string, string][] = [
    ['ft-catalogo', 'in-airtable'], ['ft-catalogo', 'in-firestore'],
    ['ft-itinerario', 'in-firestore'], ['ft-recomen', 'in-groq'],
    ['ft-reservas', 'in-wompi'], ['ft-reservas', 'in-airtable'],
    ['ft-mapa', 'in-mapbox'], ['ft-reseñas', 'in-firestore'],
    ['ft-wallet', 'in-firestore'],
  ];
  featureInfra.forEach(([s, t]) => {
    edges.push({ id: `e-${s}-${t}`, source: s, target: t, type: 'smoothstep',
      style: { stroke: '#33415566', strokeWidth: 1 }});
  });

  return { nodes, edges };
}

const nodeTypes = {
  rootNode:    RootNode,
  sectionNode: SectionNode,
  taskNode:    TaskNode,
  archNode:    ArchNode,
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
  const [vista, setVista] = useState<MapaVista>('proyectos');

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

  const archData = useMemo(() => buildArchNodes(), []);

  const [nodes, setNodes, onNodesChange] = useNodesState(builtNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(builtEdges);

  useEffect(() => { if (vista === 'proyectos') setNodes(builtNodes); }, [builtNodes, setNodes, vista]);
  useEffect(() => { if (vista === 'proyectos') setEdges(builtEdges); }, [builtEdges, setEdges, vista]);
  useEffect(() => {
    if (vista === 'arquitectura') {
      setNodes(archData.nodes);
      setEdges(archData.edges);
    }
  }, [vista, archData, setNodes, setEdges]);

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

        {/* Vista toggle */}
        <div style={{ display: 'flex', background: '#1e293b', borderRadius: 8, padding: 3, gap: 2, marginLeft: 6 }}>
          <button
            onClick={() => setVista('proyectos')}
            style={{
              color: vista === 'proyectos' ? '#e2e8f0' : '#64748b',
              background: vista === 'proyectos' ? '#0f172a' : 'transparent',
              border: 'none', borderRadius: 6, padding: '4px 11px', cursor: 'pointer', fontSize: 12,
              display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s',
            }}
          >
            <Network size={13} /> Proyectos
          </button>
          <button
            onClick={() => setVista('arquitectura')}
            style={{
              color: vista === 'arquitectura' ? '#e2e8f0' : '#64748b',
              background: vista === 'arquitectura' ? '#0f172a' : 'transparent',
              border: 'none', borderRadius: 6, padding: '4px 11px', cursor: 'pointer', fontSize: 12,
              display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s',
            }}
          >
            <Layers size={13} /> Arquitectura
          </button>
        </div>

        <span style={{ color: '#64748b', fontSize: 11, marginLeft: 6 }}>
          {vista === 'proyectos' ? 'Clic en sección para expandir tareas' : 'Plataforma GuanaGO · componentes activos y pendientes'}
        </span>

        <div style={{ flex: 1 }} />

        {/* Expand / Collapse all — only for proyectos */}
        {vista === 'proyectos' && (<>
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
        </>)}

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

          {/* Stats panel — top right (proyectos only) */}
          {vista === 'proyectos' && (
            <Panel position="top-right" style={{ margin: 12 }}>
              <StatsBar secciones={secciones} />
            </Panel>
          )}

          {/* Arch legend — top right (arquitectura only) */}
          {vista === 'arquitectura' && (
            <Panel position="top-right" style={{ margin: 12 }}>
              <div style={{
                background: '#0f172a', border: '1px solid #1e293b',
                borderRadius: 10, padding: '10px 14px', fontSize: 11, color: '#94a3b8',
              }}>
                <div style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: 7 }}>Estado del componente</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                  <span style={{ color: '#22c55e', fontSize: 13 }}>✓</span>
                  <span style={{ color: '#22c55e', fontWeight: 600 }}>ACTIVO</span>
                  <span style={{ color: '#475569' }}>— en producción</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ color: '#f59e0b', fontSize: 13 }}>⬡</span>
                  <span style={{ color: '#f59e0b', fontWeight: 600 }}>PENDIENTE</span>
                  <span style={{ color: '#475569' }}>— por implementar</span>
                </div>
              </div>
            </Panel>
          )}

          {/* Legend — bottom left (proyectos only) */}
          {vista === 'proyectos' && (
            <Panel position="bottom-left" style={{ margin: 12 }}>
              <Legend />
            </Panel>
          )}

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

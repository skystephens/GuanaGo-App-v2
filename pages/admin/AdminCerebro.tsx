import React, { useState, useEffect, useRef } from 'react';
import {
  Brain, Plus, X, Download, Tag, Clock, ChevronDown,
  StickyNote, TrendingUp, FileCode, Search, Trash2, Edit3,
  Save, ArrowLeft, Star, Circle, CheckCircle2, AlertCircle,
  Building2, Smartphone, Globe, Coins, Users, Zap,
  Copy, Check, MoreVertical, Filter,
  Activity, Calendar, MessageCircle, Package, Server,
} from 'lucide-react';
import { AppRoute } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────

type NotaCategoria = 'reunión' | 'idea' | 'dev' | 'oportunidad' | 'contexto' | 'general';
type OportunidadEstado = 'identificada' | 'contactada' | 'negociación' | 'cerrada' | 'descartada';
type Proyecto = 'GuanaGO' | 'GuiaSAI' | 'Taxi App' | 'Web3/Token' | 'Otro';
type EventoTipo = 'reserva' | 'cotización' | 'reunión' | 'cliente' | 'mensaje' | 'operación' | 'sistema';

interface EventoTrazabilidad {
  id: string;
  tipo: EventoTipo;
  titulo: string;
  descripcion: string;
  proyecto: Proyecto;
  fecha: string;
  participantes: string;
  resultado: string;
  siguientePaso: string;
  referenciaId: string;
  creadaEn: string;
}

interface Nota {
  id: string;
  titulo: string;
  contenido: string;
  categoria: NotaCategoria;
  proyecto: Proyecto;
  creadaEn: string;
  editadaEn: string;
  fijada: boolean;
}

interface Oportunidad {
  id: string;
  titulo: string;
  descripcion: string;
  proyecto: Proyecto;
  estado: OportunidadEstado;
  fuente: string;           // e.g. "Gobernación", "GEF Seaflower"
  valorEstimado?: string;   // e.g. "$50M COP", "Alianza"
  siguientePaso: string;
  fechaLimite?: string;
  creadaEn: string;
}

const STORAGE_NOTAS   = 'guanago_cerebro_notas_v1';
const STORAGE_OPORS   = 'guanago_cerebro_oportunidades_v1';
const STORAGE_TRAZ    = 'guanago_cerebro_trazabilidad_v1';

const genId = () => `c-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_NOTAS: Nota[] = [
  {
    id: genId(), titulo: 'Contexto evento Gobernación',
    contenido: 'Reunión con Gobernación del Archipiélago. Objetivo: carta de respaldo institucional + convenio de colaboración. Ángulo: GuanaGO como infraestructura pública digital del turismo. Pedir equipos como especie si hay programas de dotación tecnológica.',
    categoria: 'reunión', proyecto: 'GuanaGO',
    creadaEn: new Date().toISOString(), editadaEn: new Date().toISOString(), fijada: true,
  },
  {
    id: genId(), titulo: 'Equipo humano — tareas que la IA no hace',
    contenido: 'Roles necesarios:\n- Enriquecimiento datos Airtable (ServiciosTuristicos_SAI incompleta)\n- Verificación operadores / visitas de campo\n- Atención turista WhatsApp/chat bilingüe\n- Fotografía/video aliados para la app\n- Coordinación eventos Caribbean Night\n\nModelo: colaboradores certificados GuanaGO, pago por resultado.',
    categoria: 'idea', proyecto: 'GuanaGO',
    creadaEn: new Date().toISOString(), editadaEn: new Date().toISOString(), fijada: false,
  },
];

const SEED_OPORTUNIDADES: Oportunidad[] = [
  {
    id: genId(), titulo: 'Gobernación del Archipiélago',
    descripcion: 'Alianza institucional para posicionar GuanaGO como infraestructura pública digital del turismo local.',
    proyecto: 'GuanaGO', estado: 'contactada', fuente: 'Evento directo',
    valorEstimado: 'Carta respaldo + convenio + equipos',
    siguientePaso: 'Asistir al evento. Dejar one-pager. Pedir carta de intención.',
    creadaEn: new Date().toISOString(),
  },
  {
    id: genId(), titulo: 'GEF Seaflower / Coralina',
    descripcion: 'Proponer GuanaGO como sistema de información turística del Plan de Turismo Sostenible Seaflower.',
    proyecto: 'GuanaGO', estado: 'identificada', fuente: 'Talleres GEF Seaflower',
    valorEstimado: 'Alianza + financiamiento internacional',
    siguientePaso: 'Preparar propuesta de una página. Contactar coordinador del plan.',
    creadaEn: new Date().toISOString(),
  },
  {
    id: genId(), titulo: 'Fontur — Fondo Nacional de Turismo',
    descripcion: 'Convocatoria para proyectos de turismo sostenible e innovación digital.',
    proyecto: 'GuanaGO', estado: 'identificada', fuente: 'Política pública',
    valorEstimado: 'Hasta $500M COP (estimado)',
    siguientePaso: 'Revisar convocatorias abiertas 2026. Preparar ficha de proyecto.',
    creadaEn: new Date().toISOString(),
  },
  {
    id: genId(), titulo: 'Celo / Gitcoin Grants — Web3',
    descripcion: 'Grants para proyectos de impacto social con componente blockchain. Token KRIOL/GUANA encaja con ReFi.',
    proyecto: 'Web3/Token', estado: 'identificada', fuente: 'Ecosistema crypto ReFi',
    valorEstimado: '$10k–$50k USD',
    siguientePaso: 'Redactar whitepaper básico (2-3 pág). Preparar demo app + carta de operadores.',
    creadaEn: new Date().toISOString(),
  },
];

// ─── Trazabilidad seed ────────────────────────────────────────────────────────

const SEED_TRAZ: EventoTrazabilidad[] = [
  {
    id: genId(),
    tipo: 'sistema',
    titulo: 'Módulo Trazabilidad activado',
    descripcion: 'El módulo de trazabilidad del Cerebro fue activado. A partir de ahora se pueden registrar interacciones con clientes, reservas, cotizaciones y eventos clave del proyecto.',
    proyecto: 'GuanaGO',
    fecha: new Date().toISOString(),
    participantes: '',
    resultado: 'Módulo funcionando correctamente',
    siguientePaso: 'Registrar las primeras interacciones reales con clientes',
    referenciaId: '',
    creadaEn: new Date().toISOString(),
  },
];

// ─── Config ───────────────────────────────────────────────────────────────────

const TIPO_CONFIG: Record<EventoTipo, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  reserva:    { label: 'Reserva',     color: 'text-blue-300',    bg: 'bg-blue-900/40 border-blue-700',    icon: Calendar },
  cotización: { label: 'Cotización',  color: 'text-emerald-300', bg: 'bg-emerald-900/40 border-emerald-700', icon: FileCode },
  reunión:    { label: 'Reunión',     color: 'text-yellow-300',  bg: 'bg-yellow-900/40 border-yellow-700', icon: Users },
  cliente:    { label: 'Cliente',     color: 'text-cyan-300',    bg: 'bg-cyan-900/40 border-cyan-700',    icon: Users },
  mensaje:    { label: 'Mensaje',     color: 'text-pink-300',    bg: 'bg-pink-900/40 border-pink-700',    icon: MessageCircle },
  operación:  { label: 'Operación',   color: 'text-orange-300',  bg: 'bg-orange-900/40 border-orange-700', icon: Package },
  sistema:    { label: 'Sistema',     color: 'text-gray-400',    bg: 'bg-gray-800/60 border-gray-700',    icon: Server },
};

const TIPOS_EVENTO: EventoTipo[] = ['reserva', 'cotización', 'reunión', 'cliente', 'mensaje', 'operación', 'sistema'];

const CAT_CONFIG: Record<NotaCategoria, { label: string; color: string; bg: string }> = {
  reunión:    { label: 'Reunión',    color: 'text-blue-300',   bg: 'bg-blue-900/50 border-blue-700' },
  idea:       { label: 'Idea',       color: 'text-yellow-300', bg: 'bg-yellow-900/50 border-yellow-700' },
  dev:        { label: 'Dev',        color: 'text-violet-300', bg: 'bg-violet-900/50 border-violet-700' },
  oportunidad:{ label: 'Oportunidad',color: 'text-emerald-300',bg: 'bg-emerald-900/50 border-emerald-700' },
  contexto:   { label: 'Contexto',   color: 'text-cyan-300',   bg: 'bg-cyan-900/50 border-cyan-700' },
  general:    { label: 'General',    color: 'text-gray-300',   bg: 'bg-gray-800 border-gray-600' },
};

const ESTADO_CONFIG: Record<OportunidadEstado, { label: string; color: string; icon: React.ElementType }> = {
  identificada: { label: 'Identificada', color: 'text-gray-400',   icon: Circle },
  contactada:   { label: 'Contactada',   color: 'text-blue-400',   icon: Users },
  negociación:  { label: 'Negociación',  color: 'text-yellow-400', icon: AlertCircle },
  cerrada:      { label: 'Cerrada',      color: 'text-emerald-400',icon: CheckCircle2 },
  descartada:   { label: 'Descartada',   color: 'text-red-400',    icon: X },
};

const PROYECTO_ICON: Record<Proyecto, React.ElementType> = {
  'GuanaGO':    Globe,
  'GuiaSAI':    Building2,
  'Taxi App':   Smartphone,
  'Web3/Token': Coins,
  'Otro':       Zap,
};

const PROYECTOS: Proyecto[] = ['GuanaGO', 'GuiaSAI', 'Taxi App', 'Web3/Token', 'Otro'];

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  onBack: () => void;
  onNavigate: (route: AppRoute) => void;
}

type Tab = 'notas' | 'oportunidades' | 'trazabilidad' | 'exportar';

export default function AdminCerebro({ onBack }: Props) {
  const [tab, setTab] = useState<Tab>('notas');

  // Notas
  const [notas, setNotas] = useState<Nota[]>(() => {
    try { const s = localStorage.getItem(STORAGE_NOTAS); return s ? JSON.parse(s) : SEED_NOTAS; }
    catch { return SEED_NOTAS; }
  });
  const [busqueda, setBusqueda]     = useState('');
  const [filtroCat, setFiltroCat]   = useState<NotaCategoria | 'todas'>('todas');
  const [filtroProy, setFiltroProy] = useState<Proyecto | 'todos'>('todos');
  const [editandoNota, setEditandoNota] = useState<Nota | null>(null);
  const [nuevaNota, setNuevaNota]   = useState(false);

  // Oportunidades
  const [opors, setOpors] = useState<Oportunidad[]>(() => {
    try { const s = localStorage.getItem(STORAGE_OPORS); return s ? JSON.parse(s) : SEED_OPORTUNIDADES; }
    catch { return SEED_OPORTUNIDADES; }
  });
  const [editandoOpor, setEditandoOpor] = useState<Oportunidad | null>(null);
  const [nuevaOpor, setNuevaOpor]   = useState(false);

  // Trazabilidad
  const [eventos, setEventos] = useState<EventoTrazabilidad[]>(() => {
    try { const s = localStorage.getItem(STORAGE_TRAZ); return s ? JSON.parse(s) : SEED_TRAZ; }
    catch { return SEED_TRAZ; }
  });
  const [editandoEvento, setEditandoEvento] = useState<EventoTrazabilidad | null>(null);
  const [nuevoEvento, setNuevoEvento] = useState(false);
  const [filtroTipo, setFiltroTipo]   = useState<EventoTipo | 'todos'>('todos');

  // Export
  const [copiado, setCopiado] = useState(false);

  useEffect(() => { localStorage.setItem(STORAGE_NOTAS, JSON.stringify(notas)); }, [notas]);
  useEffect(() => { localStorage.setItem(STORAGE_OPORS, JSON.stringify(opors)); }, [opors]);
  useEffect(() => { localStorage.setItem(STORAGE_TRAZ, JSON.stringify(eventos)); }, [eventos]);

  // ── Notas helpers ──────────────────────────────────────────────────────────

  const notasFiltradas = notas
    .filter(n => filtroCat === 'todas' || n.categoria === filtroCat)
    .filter(n => filtroProy === 'todos' || n.proyecto === filtroProy)
    .filter(n => !busqueda || n.titulo.toLowerCase().includes(busqueda.toLowerCase()) || n.contenido.toLowerCase().includes(busqueda.toLowerCase()))
    .sort((a, b) => {
      if (a.fijada !== b.fijada) return a.fijada ? -1 : 1;
      return new Date(b.editadaEn).getTime() - new Date(a.editadaEn).getTime();
    });

  const guardarNota = (nota: Nota) => {
    setNotas(prev => {
      const exists = prev.find(n => n.id === nota.id);
      if (exists) return prev.map(n => n.id === nota.id ? nota : n);
      return [nota, ...prev];
    });
    setEditandoNota(null);
    setNuevaNota(false);
  };

  const eliminarNota = (id: string) => {
    if (confirm('¿Eliminar esta nota?')) setNotas(prev => prev.filter(n => n.id !== id));
  };

  const toggleFijada = (id: string) => {
    setNotas(prev => prev.map(n => n.id === id ? { ...n, fijada: !n.fijada } : n));
  };

  // ── Oportunidades helpers ──────────────────────────────────────────────────

  const guardarOpor = (opor: Oportunidad) => {
    setOpors(prev => {
      const exists = prev.find(o => o.id === opor.id);
      if (exists) return prev.map(o => o.id === opor.id ? opor : o);
      return [opor, ...prev];
    });
    setEditandoOpor(null);
    setNuevaOpor(false);
  };

  const eliminarOpor = (id: string) => {
    if (confirm('¿Eliminar esta oportunidad?')) setOpors(prev => prev.filter(o => o.id !== id));
  };

  // ── Trazabilidad helpers ───────────────────────────────────────────────────

  const eventosFiltrados = eventos
    .filter(e => filtroTipo === 'todos' || e.tipo === filtroTipo)
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const guardarEvento = (ev: EventoTrazabilidad) => {
    setEventos(prev => {
      const exists = prev.find(e => e.id === ev.id);
      if (exists) return prev.map(e => e.id === ev.id ? ev : e);
      return [ev, ...prev];
    });
    setEditandoEvento(null);
    setNuevoEvento(false);
  };

  const eliminarEvento = (id: string) => {
    if (confirm('¿Eliminar este registro de trazabilidad?')) setEventos(prev => prev.filter(e => e.id !== id));
  };

  const descargarEventoMD = (ev: EventoTrazabilidad) => {
    const cfg = TIPO_CONFIG[ev.tipo];
    const md = `# [${cfg.label}] ${ev.titulo}

**Fecha:** ${new Date(ev.fecha).toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' })}
**Tipo:** ${cfg.label}
**Proyecto:** ${ev.proyecto}${ev.referenciaId ? `\n**Referencia:** ${ev.referenciaId}` : ''}${ev.participantes ? `\n**Participantes:** ${ev.participantes}` : ''}

## Descripción

${ev.descripcion}
${ev.resultado ? `\n## Resultado\n\n${ev.resultado}\n` : ''}${ev.siguientePaso ? `\n## Siguiente Paso\n\n${ev.siguientePaso}\n` : ''}
---
*Generado por Cerebro GuanaGO · ID: ${ev.id}*
`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `traza-${ev.tipo}-${ev.fecha.slice(0, 10)}-${ev.id.slice(-4)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const descargarTodosEventosMD = () => {
    const fecha = new Date().toISOString().slice(0, 10);
    const md = `# Trazabilidad GuanaGO / GuiaSAI
> Exportado el ${fecha} · ${eventos.length} registros

---

${eventos
  .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
  .map(ev => {
    const cfg = TIPO_CONFIG[ev.tipo];
    return `## [${cfg.label}] ${ev.titulo}

**Fecha:** ${new Date(ev.fecha).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })} · **Proyecto:** ${ev.proyecto}${ev.referenciaId ? ` · **Ref:** ${ev.referenciaId}` : ''}${ev.participantes ? `\n**Participantes:** ${ev.participantes}` : ''}

${ev.descripcion}${ev.resultado ? `\n\n**Resultado:** ${ev.resultado}` : ''}${ev.siguientePaso ? `\n\n**Siguiente paso:** ${ev.siguientePaso}` : ''}`;
  }).join('\n\n---\n\n')}

---
*Fin del registro · Generado por Cerebro GuanaGO*
`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trazabilidad-guanago-${fecha}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Export helpers ─────────────────────────────────────────────────────────

  const generarContextoMD = () => {
    const fecha = new Date().toISOString().slice(0, 10);
    const notasActivas = notas.filter(n => !['descartada'].includes(n.categoria));
    const oporsActivas = opors.filter(o => o.estado !== 'descartada');

    const notasMD = notasActivas.map(n =>
      `### [${CAT_CONFIG[n.categoria].label}] ${n.titulo}\n**Proyecto:** ${n.proyecto} · **Actualizado:** ${n.editadaEn.slice(0, 10)}\n\n${n.contenido}\n`
    ).join('\n---\n\n');

    const oportsMD = oporsActivas.map(o =>
      `### ${o.titulo}\n**Proyecto:** ${o.proyecto} · **Estado:** ${ESTADO_CONFIG[o.estado].label} · **Valor:** ${o.valorEstimado || 'N/A'}\n**Fuente:** ${o.fuente}\n\n${o.descripcion}\n\n**Siguiente paso:** ${o.siguientePaso}${o.fechaLimite ? `\n**Fecha límite:** ${o.fechaLimite}` : ''}\n`
    ).join('\n---\n\n');

    const eventosRecientes = eventos
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 10);
    const eventosMD = eventosRecientes.map(ev =>
      `### [${TIPO_CONFIG[ev.tipo].label}] ${ev.titulo}\n**Fecha:** ${ev.fecha.slice(0, 10)} · **Proyecto:** ${ev.proyecto}${ev.participantes ? ` · **Participantes:** ${ev.participantes}` : ''}\n\n${ev.descripcion}${ev.resultado ? `\n\n**Resultado:** ${ev.resultado}` : ''}${ev.siguientePaso ? `\n\n**Siguiente paso:** ${ev.siguientePaso}` : ''}\n`
    ).join('\n---\n\n');

    return `# Contexto Cerebro — GuiaSAI / GuanaGO
> Exportado el ${fecha} · Generado desde AdminCerebro

---

## Notas de Contexto (${notasActivas.length})

${notasMD || '_Sin notas._'}

---

## Pipeline de Oportunidades (${oporsActivas.length})

${oportsMD || '_Sin oportunidades._'}

---

## Trazabilidad Reciente (${Math.min(eventos.length, 10)} de ${eventos.length})

${eventosMD || '_Sin registros de trazabilidad._'}

---
_Fin del contexto. Cargar este archivo en Claude Code para continuar con contexto completo._
`;
  };

  const descargarMD = () => {
    const contenido = generarContextoMD();
    const blob = new Blob([contenido], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contexto-cerebro-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copiarMD = async () => {
    await navigator.clipboard.writeText(generarContextoMD());
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Header */}
      <header className="px-4 pt-10 pb-4 border-b border-gray-800 bg-gray-950 sticky top-0 z-30">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack} className="text-gray-500 hover:text-white p-1.5 rounded-lg hover:bg-gray-800">
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-900 border border-indigo-600 flex items-center justify-center">
              <Brain size={16} className="text-indigo-300" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">Cerebro</h1>
              <p className="text-xs text-gray-500">Notas · Oportunidades · Contexto Claude</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-900 p-1 rounded-xl overflow-x-auto">
          {([
            { key: 'notas',          label: 'Notas',    icon: StickyNote },
            { key: 'oportunidades',  label: 'Pipeline', icon: TrendingUp },
            { key: 'trazabilidad',   label: 'Traza',    icon: Activity },
            { key: 'exportar',       label: 'Exportar', icon: FileCode },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex-shrink-0 flex items-center justify-center gap-1 py-2 px-1 rounded-lg text-xs font-bold transition-colors
                ${tab === key ? 'bg-indigo-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">

        {/* ── TAB: NOTAS ── */}
        {tab === 'notas' && (
          <div className="px-4 py-4 space-y-3">

            {/* Quick add + search */}
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2">
                <Search size={13} className="text-gray-500 flex-shrink-0" />
                <input
                  type="text" placeholder="Buscar notas..."
                  value={busqueda} onChange={e => setBusqueda(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
                />
              </div>
              <button
                onClick={() => { setNuevaNota(true); setEditandoNota(null); }}
                className="bg-indigo-700 hover:bg-indigo-600 text-white px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-colors"
              >
                <Plus size={14} /> Nueva
              </button>
            </div>

            {/* Filtros */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => setFiltroCat('todas')}
                className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-lg border font-bold transition-colors
                  ${filtroCat === 'todas' ? 'bg-indigo-700 border-indigo-500 text-white' : 'border-gray-700 text-gray-500 hover:text-gray-300'}`}
              >Todas</button>
              {(Object.keys(CAT_CONFIG) as NotaCategoria[]).map(cat => (
                <button
                  key={cat}
                  onClick={() => setFiltroCat(cat)}
                  className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-lg border font-bold transition-colors
                    ${filtroCat === cat ? `${CAT_CONFIG[cat].bg} ${CAT_CONFIG[cat].color}` : 'border-gray-700 text-gray-500 hover:text-gray-300'}`}
                >
                  {CAT_CONFIG[cat].label}
                </button>
              ))}
            </div>

            {/* Proyecto filter */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => setFiltroProy('todos')}
                className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-lg border font-bold transition-colors
                  ${filtroProy === 'todos' ? 'bg-gray-700 border-gray-500 text-white' : 'border-gray-800 text-gray-600 hover:text-gray-400'}`}
              >Todos</button>
              {PROYECTOS.map(p => {
                const Icon = PROYECTO_ICON[p];
                return (
                  <button key={p} onClick={() => setFiltroProy(p)}
                    className={`flex-shrink-0 flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border font-bold transition-colors
                      ${filtroProy === p ? 'bg-gray-700 border-gray-500 text-white' : 'border-gray-800 text-gray-600 hover:text-gray-400'}`}
                  >
                    <Icon size={10} /> {p}
                  </button>
                );
              })}
            </div>

            {/* Form nueva nota */}
            {(nuevaNota || editandoNota) && (
              <NotaForm
                nota={editandoNota ?? undefined}
                onSave={guardarNota}
                onCancel={() => { setNuevaNota(false); setEditandoNota(null); }}
              />
            )}

            {/* Lista notas */}
            {notasFiltradas.length === 0 ? (
              <div className="text-center text-gray-600 text-sm py-12">
                <StickyNote size={32} className="mx-auto mb-3 opacity-30" />
                <p>Sin notas. Crea una para empezar.</p>
              </div>
            ) : (
              notasFiltradas.map(nota => (
                <NotaCard
                  key={nota.id}
                  nota={nota}
                  onEdit={() => { setEditandoNota(nota); setNuevaNota(false); }}
                  onDelete={() => eliminarNota(nota.id)}
                  onToggleFijada={() => toggleFijada(nota.id)}
                />
              ))
            )}
          </div>
        )}

        {/* ── TAB: OPORTUNIDADES ── */}
        {tab === 'oportunidades' && (
          <div className="px-4 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">{opors.filter(o => o.estado !== 'descartada').length} activas · {opors.length} total</p>
              <button
                onClick={() => { setNuevaOpor(true); setEditandoOpor(null); }}
                className="bg-indigo-700 hover:bg-indigo-600 text-white px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-colors"
              >
                <Plus size={14} /> Nueva
              </button>
            </div>

            {(nuevaOpor || editandoOpor) && (
              <OportunidadForm
                opor={editandoOpor ?? undefined}
                onSave={guardarOpor}
                onCancel={() => { setNuevaOpor(false); setEditandoOpor(null); }}
              />
            )}

            {/* Por estado */}
            {(['identificada', 'contactada', 'negociación', 'cerrada'] as OportunidadEstado[]).map(estado => {
              const grupo = opors.filter(o => o.estado === estado);
              if (grupo.length === 0) return null;
              const cfg = ESTADO_CONFIG[estado];
              const Icon = cfg.icon;
              return (
                <div key={estado}>
                  <div className={`flex items-center gap-2 mb-2 ${cfg.color}`}>
                    <Icon size={13} />
                    <span className="text-xs font-bold uppercase tracking-wide">{cfg.label} ({grupo.length})</span>
                  </div>
                  <div className="space-y-2">
                    {grupo.map(opor => (
                      <OportunidadCard
                        key={opor.id}
                        opor={opor}
                        onEdit={() => { setEditandoOpor(opor); setNuevaOpor(false); }}
                        onDelete={() => eliminarOpor(opor.id)}
                        onEstado={(estado) => setOpors(prev => prev.map(o => o.id === opor.id ? { ...o, estado } : o))}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {opors.length === 0 && (
              <div className="text-center text-gray-600 text-sm py-12">
                <TrendingUp size={32} className="mx-auto mb-3 opacity-30" />
                <p>Sin oportunidades registradas.</p>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: TRAZABILIDAD ── */}
        {tab === 'trazabilidad' && (
          <div className="px-4 py-4 space-y-3">

            {/* Header actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setNuevoEvento(true); setEditandoEvento(null); }}
                className="bg-indigo-700 hover:bg-indigo-600 text-white px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-colors"
              >
                <Plus size={14} /> Registrar evento
              </button>
              {eventos.length > 0 && (
                <button
                  onClick={descargarTodosEventosMD}
                  className="bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-colors ml-auto"
                >
                  <Download size={13} /> Descargar todos (.md)
                </button>
              )}
            </div>

            {/* Filtro por tipo */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => setFiltroTipo('todos')}
                className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-lg border font-bold transition-colors
                  ${filtroTipo === 'todos' ? 'bg-indigo-700 border-indigo-500 text-white' : 'border-gray-700 text-gray-500 hover:text-gray-300'}`}
              >Todos</button>
              {TIPOS_EVENTO.map(tipo => {
                const cfg = TIPO_CONFIG[tipo];
                return (
                  <button key={tipo} onClick={() => setFiltroTipo(tipo)}
                    className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-lg border font-bold transition-colors
                      ${filtroTipo === tipo ? `${cfg.bg} ${cfg.color}` : 'border-gray-700 text-gray-500 hover:text-gray-300'}`}
                  >{cfg.label}</button>
                );
              })}
            </div>

            {/* Form nuevo evento */}
            {(nuevoEvento || editandoEvento) && (
              <EventoForm
                evento={editandoEvento ?? undefined}
                onSave={guardarEvento}
                onCancel={() => { setNuevoEvento(false); setEditandoEvento(null); }}
              />
            )}

            {/* Lista eventos */}
            {eventosFiltrados.length === 0 ? (
              <div className="text-center text-gray-600 text-sm py-12">
                <Activity size={32} className="mx-auto mb-3 opacity-30" />
                <p>Sin registros. Crea el primero.</p>
              </div>
            ) : (
              eventosFiltrados.map(ev => (
                <EventoCard
                  key={ev.id}
                  evento={ev}
                  onEdit={() => { setEditandoEvento(ev); setNuevoEvento(false); }}
                  onDelete={() => eliminarEvento(ev.id)}
                  onDescargar={() => descargarEventoMD(ev)}
                />
              ))
            )}
          </div>
        )}

        {/* ── TAB: EXPORTAR ── */}
        {tab === 'exportar' && (
          <div className="px-4 py-4 space-y-4">
            <div className="bg-indigo-950 border border-indigo-700 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Brain size={16} className="text-indigo-300" />
                <span className="text-sm font-bold text-indigo-200">¿Para qué sirve?</span>
              </div>
              <p className="text-xs text-indigo-300 leading-relaxed">
                Exporta tus notas y oportunidades como un archivo <code className="bg-indigo-900 px-1 rounded">.md</code>.
                Ábrelo en VS Code o cárgalo al inicio de una sesión en Claude Code para que tenga contexto completo
                del proyecto, reuniones y oportunidades — sin necesidad de repetirlo cada vez.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Notas', value: notas.length, color: 'text-indigo-300' },
                { label: 'Pipeline', value: opors.filter(o => o.estado !== 'descartada').length, color: 'text-emerald-300' },
                { label: 'Trazabilidad', value: eventos.length, color: 'text-yellow-300' },
                { label: 'Proyectos', value: [...new Set([...notas.map(n => n.proyecto), ...opors.map(o => o.proyecto)])].length, color: 'text-cyan-300' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-gray-900 border border-gray-700 rounded-xl p-3 text-center">
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              ))}
            </div>

            {/* Preview */}
            <div className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400">Vista previa — contexto.md</span>
                <span className="text-xs text-gray-600">{generarContextoMD().length} caracteres</span>
              </div>
              <pre className="text-xs text-gray-400 p-4 overflow-x-auto max-h-64 leading-relaxed whitespace-pre-wrap">
                {generarContextoMD().slice(0, 1200)}{generarContextoMD().length > 1200 ? '\n\n... (más contenido)' : ''}
              </pre>
            </div>

            {/* Acciones */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={descargarMD}
                className="bg-indigo-700 hover:bg-indigo-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-colors"
              >
                <Download size={16} /> Descargar .md
              </button>
              <button
                onClick={copiarMD}
                className={`py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-colors border
                  ${copiado ? 'bg-emerald-900 border-emerald-600 text-emerald-300' : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'}`}
              >
                {copiado ? <><Check size={16} /> Copiado!</> : <><Copy size={16} /> Copiar texto</>}
              </button>
            </div>

            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-2">
              <p className="text-xs font-bold text-gray-400">Cómo usar este archivo en Claude Code</p>
              <ol className="text-xs text-gray-500 space-y-1 list-decimal list-inside">
                <li>Descarga el <code className="bg-gray-800 px-1 rounded">.md</code> con el botón de arriba</li>
                <li>Guárdalo en la carpeta del proyecto (ej: <code className="bg-gray-800 px-1 rounded">/apps/contexto/</code>)</li>
                <li>Al abrir Claude Code mañana, el archivo ya está disponible para leer</li>
                <li>O copia el texto y pégalo al inicio del chat de Claude</li>
              </ol>
            </div>

            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-2">
              <p className="text-xs font-bold text-gray-400">Portabilidad — acceso en reuniones</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Esta app está desplegada en línea — accede desde tu celular en cualquier reunión,
                captura notas al instante en la pestaña <strong className="text-gray-300">Notas</strong>,
                y cuando llegues a VS Code el contexto ya está listo para exportar.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── NotaCard ─────────────────────────────────────────────────────────────────

function NotaCard({ nota, onEdit, onDelete, onToggleFijada }: {
  nota: Nota;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFijada: () => void;
}) {
  const cat = CAT_CONFIG[nota.categoria];
  const PIcon = PROYECTO_ICON[nota.proyecto];

  return (
    <div className={`bg-gray-900 border rounded-2xl p-4 space-y-2 ${nota.fijada ? 'border-indigo-700' : 'border-gray-800'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {nota.fijada && <Star size={11} className="text-indigo-400 flex-shrink-0" fill="currentColor" />}
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cat.bg} ${cat.color}`}>
              {cat.label}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-gray-600">
              <PIcon size={10} /> {nota.proyecto}
            </span>
          </div>
          <h3 className="text-sm font-bold text-white leading-snug">{nota.titulo}</h3>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={onToggleFijada} className={`p-1.5 rounded-lg transition-colors ${nota.fijada ? 'text-indigo-400' : 'text-gray-600 hover:text-indigo-400'}`}>
            <Star size={13} fill={nota.fijada ? 'currentColor' : 'none'} />
          </button>
          <button onClick={onEdit} className="p-1.5 rounded-lg text-gray-600 hover:text-gray-300 transition-colors">
            <Edit3 size={13} />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-400 leading-relaxed line-clamp-4 whitespace-pre-line">{nota.contenido}</p>
      <p className="text-[10px] text-gray-700">
        {new Date(nota.editadaEn).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
      </p>
    </div>
  );
}

// ─── NotaForm ─────────────────────────────────────────────────────────────────

function NotaForm({ nota, onSave, onCancel }: {
  nota?: Nota;
  onSave: (n: Nota) => void;
  onCancel: () => void;
}) {
  const isNew = !nota;
  const [titulo, setTitulo]       = useState(nota?.titulo ?? '');
  const [contenido, setContenido] = useState(nota?.contenido ?? '');
  const [categoria, setCategoria] = useState<NotaCategoria>(nota?.categoria ?? 'general');
  const [proyecto, setProyecto]   = useState<Proyecto>(nota?.proyecto ?? 'GuanaGO');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  const guardar = () => {
    if (!titulo.trim()) return;
    onSave({
      id: nota?.id ?? genId(),
      titulo: titulo.trim(),
      contenido,
      categoria,
      proyecto,
      creadaEn: nota?.creadaEn ?? new Date().toISOString(),
      editadaEn: new Date().toISOString(),
      fijada: nota?.fijada ?? false,
    });
  };

  return (
    <div className="bg-gray-900 border border-indigo-700 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-indigo-300">{isNew ? '+ Nueva nota' : 'Editar nota'}</span>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-300 p-1"><X size={13} /></button>
      </div>
      <input
        type="text" placeholder="Título de la nota..."
        value={titulo} onChange={e => setTitulo(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
      />
      <textarea
        ref={textareaRef}
        placeholder="Contenido, contexto, decisiones..."
        value={contenido} onChange={e => setContenido(e.target.value)}
        rows={5}
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
      />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-gray-500 font-bold uppercase mb-1 block">Categoría</label>
          <select
            value={categoria} onChange={e => setCategoria(e.target.value as NotaCategoria)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            {(Object.keys(CAT_CONFIG) as NotaCategoria[]).map(c => (
              <option key={c} value={c}>{CAT_CONFIG[c].label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-gray-500 font-bold uppercase mb-1 block">Proyecto</label>
          <select
            value={proyecto} onChange={e => setProyecto(e.target.value as Proyecto)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            {PROYECTOS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-400 text-sm font-bold hover:bg-gray-700">
          Cancelar
        </button>
        <button
          onClick={guardar} disabled={!titulo.trim()}
          className="flex-1 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-600 text-white text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2"
        >
          <Save size={14} /> Guardar
        </button>
      </div>
    </div>
  );
}

// ─── OportunidadCard ──────────────────────────────────────────────────────────

function OportunidadCard({ opor, onEdit, onDelete, onEstado }: {
  opor: Oportunidad;
  onEdit: () => void;
  onDelete: () => void;
  onEstado: (e: OportunidadEstado) => void;
}) {
  const cfg = ESTADO_CONFIG[opor.estado];
  const Icon = cfg.icon;
  const PIcon = PROYECTO_ICON[opor.proyecto];
  const [showEstados, setShowEstados] = useState(false);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-2.5 relative">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`flex items-center gap-1 text-[10px] font-bold ${cfg.color}`}>
              <Icon size={10} /> {cfg.label}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-gray-600">
              <PIcon size={10} /> {opor.proyecto}
            </span>
            {opor.valorEstimado && (
              <span className="text-[10px] text-yellow-600 font-bold">{opor.valorEstimado}</span>
            )}
          </div>
          <h3 className="text-sm font-bold text-white">{opor.titulo}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{opor.fuente}</p>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={() => setShowEstados(v => !v)} className="p-1.5 rounded-lg text-gray-600 hover:text-yellow-400 transition-colors" title="Cambiar estado">
            <ChevronDown size={13} className={showEstados ? 'rotate-180' : ''} />
          </button>
          <button onClick={onEdit} className="p-1.5 rounded-lg text-gray-600 hover:text-gray-300 transition-colors">
            <Edit3 size={13} />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-400 leading-relaxed">{opor.descripcion}</p>

      <div className="bg-gray-800 rounded-xl px-3 py-2">
        <p className="text-[10px] text-gray-500 font-bold uppercase mb-0.5">Siguiente paso</p>
        <p className="text-xs text-gray-300">{opor.siguientePaso}</p>
      </div>

      {opor.fechaLimite && (
        <p className="text-[10px] text-orange-500 flex items-center gap-1">
          <Clock size={10} /> Límite: {opor.fechaLimite}
        </p>
      )}

      {showEstados && (
        <div className="flex gap-1.5 flex-wrap pt-1">
          {(Object.keys(ESTADO_CONFIG) as OportunidadEstado[]).map(e => {
            const ec = ESTADO_CONFIG[e];
            const EIcon = ec.icon;
            return (
              <button
                key={e}
                onClick={() => { onEstado(e); setShowEstados(false); }}
                className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border font-bold transition-colors
                  ${opor.estado === e ? `${ec.color} border-current bg-gray-800` : 'text-gray-600 border-gray-700 hover:text-gray-400'}`}
              >
                <EIcon size={9} /> {ec.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── OportunidadForm ──────────────────────────────────────────────────────────

function OportunidadForm({ opor, onSave, onCancel }: {
  opor?: Oportunidad;
  onSave: (o: Oportunidad) => void;
  onCancel: () => void;
}) {
  const [titulo, setTitulo]           = useState(opor?.titulo ?? '');
  const [descripcion, setDescripcion] = useState(opor?.descripcion ?? '');
  const [proyecto, setProyecto]       = useState<Proyecto>(opor?.proyecto ?? 'GuanaGO');
  const [estado, setEstado]           = useState<OportunidadEstado>(opor?.estado ?? 'identificada');
  const [fuente, setFuente]           = useState(opor?.fuente ?? '');
  const [valor, setValor]             = useState(opor?.valorEstimado ?? '');
  const [siguiente, setSiguiente]     = useState(opor?.siguientePaso ?? '');
  const [limite, setLimite]           = useState(opor?.fechaLimite ?? '');

  const guardar = () => {
    if (!titulo.trim()) return;
    onSave({
      id: opor?.id ?? genId(),
      titulo: titulo.trim(), descripcion, proyecto, estado,
      fuente, valorEstimado: valor, siguientePaso: siguiente,
      fechaLimite: limite || undefined,
      creadaEn: opor?.creadaEn ?? new Date().toISOString(),
    });
  };

  return (
    <div className="bg-gray-900 border border-indigo-700 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-indigo-300">{opor ? 'Editar oportunidad' : '+ Nueva oportunidad'}</span>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-300 p-1"><X size={13} /></button>
      </div>
      <input type="text" placeholder="Título *" value={titulo} onChange={e => setTitulo(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" />
      <textarea placeholder="Descripción" value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={3}
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 resize-none" />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-gray-500 font-bold uppercase mb-1 block">Proyecto</label>
          <select value={proyecto} onChange={e => setProyecto(e.target.value as Proyecto)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500">
            {PROYECTOS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-gray-500 font-bold uppercase mb-1 block">Estado</label>
          <select value={estado} onChange={e => setEstado(e.target.value as OportunidadEstado)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500">
            {(Object.keys(ESTADO_CONFIG) as OportunidadEstado[]).map(e => <option key={e} value={e}>{ESTADO_CONFIG[e].label}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input type="text" placeholder="Fuente (ej: Gobernación)" value={fuente} onChange={e => setFuente(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" />
        <input type="text" placeholder="Valor estimado" value={valor} onChange={e => setValor(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" />
      </div>
      <textarea placeholder="Siguiente paso *" value={siguiente} onChange={e => setSiguiente(e.target.value)} rows={2}
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 resize-none" />
      <input type="date" value={limite} onChange={e => setLimite(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-400 focus:outline-none focus:border-indigo-500" />
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-400 text-sm font-bold hover:bg-gray-700">Cancelar</button>
        <button onClick={guardar} disabled={!titulo.trim()}
          className="flex-1 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-600 text-white text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2">
          <Save size={14} /> Guardar
        </button>
      </div>
    </div>
  );
}

// ─── EventoCard ───────────────────────────────────────────────────────────────

function EventoCard({ evento, onEdit, onDelete, onDescargar }: {
  evento: EventoTrazabilidad;
  onEdit: () => void;
  onDelete: () => void;
  onDescargar: () => void;
}) {
  const cfg = TIPO_CONFIG[evento.tipo];
  const Icon = cfg.icon;
  const PIcon = PROYECTO_ICON[evento.proyecto];

  return (
    <div className={`bg-gray-900 border rounded-2xl p-4 space-y-2 ${cfg.bg}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} flex items-center gap-1`}>
              <Icon size={9} /> {cfg.label}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-gray-600">
              <PIcon size={10} /> {evento.proyecto}
            </span>
            {evento.referenciaId && (
              <span className="text-[10px] text-gray-600 font-mono">#{evento.referenciaId}</span>
            )}
          </div>
          <h3 className="text-sm font-bold text-white leading-snug">{evento.titulo}</h3>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={onDescargar} className="p-1.5 rounded-lg text-gray-600 hover:text-indigo-400 transition-colors" title="Descargar .md">
            <Download size={13} />
          </button>
          <button onClick={onEdit} className="p-1.5 rounded-lg text-gray-600 hover:text-gray-300 transition-colors">
            <Edit3 size={13} />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-400 leading-relaxed line-clamp-3 whitespace-pre-line">{evento.descripcion}</p>
      {evento.participantes && (
        <p className="text-[10px] text-gray-600"><span className="text-gray-500 font-bold">Participantes:</span> {evento.participantes}</p>
      )}
      {evento.resultado && (
        <p className="text-[10px] text-gray-500"><span className="text-gray-500 font-bold">Resultado:</span> {evento.resultado}</p>
      )}
      {evento.siguientePaso && (
        <p className="text-[10px] text-indigo-500"><span className="font-bold">→</span> {evento.siguientePaso}</p>
      )}
      <p className="text-[10px] text-gray-700">
        {new Date(evento.fecha).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
      </p>
    </div>
  );
}

// ─── EventoForm ───────────────────────────────────────────────────────────────

function EventoForm({ evento, onSave, onCancel }: {
  evento?: EventoTrazabilidad;
  onSave: (e: EventoTrazabilidad) => void;
  onCancel: () => void;
}) {
  const isNew = !evento;
  const [tipo, setTipo]               = useState<EventoTipo>(evento?.tipo ?? 'reunión');
  const [titulo, setTitulo]           = useState(evento?.titulo ?? '');
  const [descripcion, setDescripcion] = useState(evento?.descripcion ?? '');
  const [proyecto, setProyecto]       = useState<Proyecto>(evento?.proyecto ?? 'GuanaGO');
  const [fecha, setFecha]             = useState(evento?.fecha ? evento.fecha.slice(0, 16) : new Date().toISOString().slice(0, 16));
  const [participantes, setParticipantes] = useState(evento?.participantes ?? '');
  const [resultado, setResultado]     = useState(evento?.resultado ?? '');
  const [siguientePaso, setSiguiente] = useState(evento?.siguientePaso ?? '');
  const [referenciaId, setRef]        = useState(evento?.referenciaId ?? '');

  const guardar = () => {
    if (!titulo.trim()) return;
    onSave({
      id: evento?.id ?? genId(),
      tipo,
      titulo: titulo.trim(),
      descripcion,
      proyecto,
      fecha: new Date(fecha).toISOString(),
      participantes,
      resultado,
      siguientePaso,
      referenciaId,
      creadaEn: evento?.creadaEn ?? new Date().toISOString(),
    });
  };

  return (
    <div className="bg-gray-900 border border-indigo-700 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-indigo-300">{isNew ? '+ Nuevo registro' : 'Editar registro'}</span>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-300 p-1"><X size={13} /></button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-gray-500 font-bold uppercase mb-1 block">Tipo</label>
          <select value={tipo} onChange={e => setTipo(e.target.value as EventoTipo)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500">
            {TIPOS_EVENTO.map(t => <option key={t} value={t}>{TIPO_CONFIG[t].label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-gray-500 font-bold uppercase mb-1 block">Proyecto</label>
          <select value={proyecto} onChange={e => setProyecto(e.target.value as Proyecto)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500">
            {PROYECTOS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>
      <input type="text" placeholder="Título del evento *"
        value={titulo} onChange={e => setTitulo(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" />
      <textarea placeholder="Descripción detallada..."
        value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={4}
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed" />
      <div className="grid grid-cols-2 gap-3">
        <input type="text" placeholder="Participantes (nombres)" value={participantes} onChange={e => setParticipantes(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" />
        <input type="text" placeholder="Ref. (ID reserva, etc.)" value={referenciaId} onChange={e => setRef(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" />
      </div>
      <input type="text" placeholder="Resultado" value={resultado} onChange={e => setResultado(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" />
      <input type="text" placeholder="Siguiente paso" value={siguientePaso} onChange={e => setSiguiente(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" />
      <div>
        <label className="text-[10px] text-gray-500 font-bold uppercase mb-1 block">Fecha del evento</label>
        <input type="datetime-local" value={fecha} onChange={e => setFecha(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-indigo-500" />
      </div>
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-400 text-sm font-bold hover:bg-gray-700">Cancelar</button>
        <button onClick={guardar} disabled={!titulo.trim()}
          className="flex-1 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-600 text-white text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2">
          <Save size={14} /> Guardar
        </button>
      </div>
    </div>
  );
}

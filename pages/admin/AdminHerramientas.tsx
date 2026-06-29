import React, { useState } from 'react';
import {
  ArrowLeft, Network, BarChart2, Database, TowerControl,
  Layers, FileText, ChevronDown, ChevronUp, ExternalLink,
  CheckCircle2, AlertTriangle, Clock, Wrench,
} from 'lucide-react';
import { AppRoute } from '../../types';

interface Props {
  onBack: () => void;
  onNavigate: (route: AppRoute) => void;
}

const TODAY = new Date().toLocaleDateString('es-CO', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
});

// ─── Datos de estado del proyecto (de INVENTARIO_PROYECTO_GUANAGO.md) ─────────

const BACKEND_STATUS = [
  { nombre: 'API REST principal',         estado: '✅', detalle: 'Node.js + Express · Render.com' },
  { nombre: 'Directorio / Mapa',          estado: '✅', detalle: 'Lee Directorio_Mapa de Airtable, 40+ POIs' },
  { nombre: 'Micrositios /aliado/:slug',  estado: '✅', detalle: 'Página pública por negocio' },
  { nombre: 'Catálogo tours',             estado: '✅', detalle: 'ServiciosTuristicos_SAI' },
  { nombre: 'Catálogo alojamientos',      estado: '✅', detalle: 'AlojamientosTuristicos_SAI' },
  { nombre: 'Sistema de leads',           estado: '✅', detalle: 'CRM Airtable · ref GG-XXXXXX' },
  { nombre: 'Cotizaciones',              estado: '✅', detalle: 'Genera en Airtable con ítems desglosados' },
  { nombre: 'PayU (pagos)',              estado: '✅', detalle: 'Transacción real procesada · tubería a Alegra' },
  { nombre: 'Firebase Auth',             estado: '✅', detalle: 'Email + Google para turistas, residentes, admin' },
  { nombre: 'Chatbot Groq/Llama3',       estado: '✅', detalle: 'Base de conocimiento Raizal ES/EN/PT' },
  { nombre: 'Make.com (sync)',           estado: '⚠️', detalle: 'Webhook Users activo · Directorio sin confirmar' },
  { nombre: 'Registro aliado real',      estado: '❌', detalle: 'PartnerRegister es mock — no escribe en Airtable' },
  { nombre: 'Flujo aprobación socios',   estado: '❌', detalle: 'AdminApprovals gestiona reservas, no socios' },
];

const PENDIENTES = [
  { tarea: 'Conectar PartnerRegister.tsx a Airtable',       esfuerzo: '1h',   prioridad: 'rojo' },
  { tarea: 'Escritura real en /api/partners/register',       esfuerzo: '2-3h', prioridad: 'rojo' },
  { tarea: 'Vista aprobación aliados en panel admin',        esfuerzo: '3-4h', prioridad: 'rojo' },
  { tarea: 'Poblar ID_Slug en 6 aliados activos',           esfuerzo: '30min', prioridad: 'amarillo' },
  { tarea: 'Bug precios placeholder 700k COP alojamientos', esfuerzo: '2h',   prioridad: 'amarillo' },
  { tarea: 'Confirmar webhook Make.com Directorio_Mapa',    esfuerzo: '30min', prioridad: 'amarillo' },
  { tarea: 'Desplegar kits QR físicos a 8 aliados piloto',  esfuerzo: 'logística', prioridad: 'amarillo' },
];

const ALIADOS = [
  'Bushi Food · Restaurante',
  'Bobby Rock · Bar',
  'Capy Beach · Restaurante',
  'Casa Las Palmas · Alojamiento',
  'Capitán Mandy · Tour',
  'Dreamer Hotel · Hotel',
  'Sweet Avenue Café · Cafetería',
];

const MODELOS_NEGOCIO = [
  { plan: 'Plan Básico',         precio: 'Gratis',           color: '#6b7280' },
  { plan: 'Aliado Activo',       precio: '$49.900 COP/mes',  color: '#34d399' },
  { plan: 'Aliado Premium',      precio: '$129.900 COP/mes', color: '#fbbf24' },
  { plan: 'Comisión por venta',  precio: '12–15% por QR',    color: '#60a5fa' },
];

// ─── Tool cards ───────────────────────────────────────────────────────────────

interface ToolCard {
  emoji: string;
  label: string;
  sub: string;
  color: string;
  border: string;
  bg: string;
  route: AppRoute;
}

const TOOLS: ToolCard[] = [
  {
    emoji: '🗺️',
    label: 'Mapa Mental',
    sub: 'Proyectos · Tareas · Arquitectura de la plataforma',
    color: '#38bdf8',
    border: '#0369a1',
    bg: '#071728',
    route: AppRoute.ADMIN_MAPA_MENTAL,
  },
  {
    emoji: '📊',
    label: 'Lean Canvas & Estrategia',
    sub: 'Modelo de negocio · Embajadores · Paquetes · Onboarding aliados',
    color: '#00E5CC',
    border: '#0f5c55',
    bg: '#061a17',
    route: AppRoute.ADMIN_ESTRATEGIA,
  },
  {
    emoji: '🗄️',
    label: 'Backend / Sincronización',
    sub: 'Estado de conexión Airtable · Última sync · Forzar actualización',
    color: '#a78bfa',
    border: '#4c1d95',
    bg: '#120730',
    route: AppRoute.ADMIN_BACKEND,
  },
  {
    emoji: '⚡',
    label: 'Torre de Control',
    sub: 'Proyectos · Tareas por sección · Progreso de sprints',
    color: '#60a5fa',
    border: '#1e3a5f',
    bg: '#080f1e',
    route: AppRoute.ADMIN_TORRE_CONTROL,
  },
  {
    emoji: '🏗️',
    label: 'App Arquitectura',
    sub: 'Árbol de componentes · Rutas · Estructura del código',
    color: '#4ade80',
    border: '#14532d',
    bg: '#052e16',
    route: AppRoute.ADMIN_APP_ARQUITECTURA,
  },
  {
    emoji: '🔧',
    label: 'Panel de Control',
    sub: 'Config. del sistema · Permisos · Configuración avanzada',
    color: '#fb923c',
    border: '#7c2d12',
    bg: '#1c0a04',
    route: AppRoute.ADMIN_CONTROL_PANEL,
  },
];

// ─── Estado badge ─────────────────────────────────────────────────────────────

function EstadoBadge({ estado }: { estado: string }) {
  if (estado === '✅') return <span style={{ color: '#4ade80', fontSize: 14 }}>✅</span>;
  if (estado === '❌') return <span style={{ color: '#f87171', fontSize: 14 }}>❌</span>;
  return <span style={{ color: '#fbbf24', fontSize: 14 }}>⚠️</span>;
}

function PrioridadDot({ p }: { p: string }) {
  const col = p === 'rojo' ? '#ef4444' : p === 'amarillo' ? '#f59e0b' : '#22c55e';
  return <div style={{ width: 8, height: 8, borderRadius: '50%', background: col, boxShadow: `0 0 6px ${col}88`, flexShrink: 0, marginTop: 3 }} />;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function AdminHerramientas({ onBack, onNavigate }: Props) {
  const [inventarioOpen, setInventarioOpen] = useState(false);
  const [backendOpen, setBackendOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: '#030712', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 20px',
        background: '#0a0f1e',
        borderBottom: '1px solid #1e293b',
        position: 'sticky', top: 0, zIndex: 20,
      }}>
        <button
          onClick={onBack}
          style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13 }}
        >
          <ArrowLeft size={16} /> Volver
        </button>
        <div style={{ width: 1, height: 18, background: '#1e293b' }} />
        <Wrench size={17} style={{ color: '#38bdf8' }} />
        <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 15 }}>Herramientas del Proyecto</span>
        <span style={{ color: '#475569', fontSize: 11, marginLeft: 4 }}>GuanaGO 2026</span>
        <div style={{ flex: 1 }} />
        <span style={{ color: '#334155', fontSize: 11 }}>{TODAY}</span>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 20px', display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* ─── Grid de herramientas ───────────────────────────────────────────── */}
        <section>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#475569', marginBottom: 14 }}>
            Herramientas de diseño y desarrollo
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
            {TOOLS.map(tool => (
              <button
                key={tool.route}
                onClick={() => onNavigate(tool.route)}
                style={{
                  background: tool.bg,
                  border: `1.5px solid ${tool.border}`,
                  borderRadius: 14,
                  padding: '16px 18px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'box-shadow 0.2s, border-color 0.2s',
                  display: 'flex', flexDirection: 'column', gap: 6,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = tool.color; (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${tool.color}22`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = tool.border; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 22 }}>{tool.emoji}</span>
                  <span style={{ color: tool.color, fontWeight: 700, fontSize: 13 }}>{tool.label}</span>
                </div>
                <span style={{ color: '#64748b', fontSize: 11, lineHeight: 1.5 }}>{tool.sub}</span>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 2 }}>
                  <ExternalLink size={11} style={{ color: tool.border }} />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ─── Resumen de estado del proyecto ─────────────────────────────────── */}
        <section>
          <button
            onClick={() => setInventarioOpen(v => !v)}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', gap: 12,
              background: '#0a1628',
              border: '1.5px solid #1d4ed8',
              borderRadius: 14,
              padding: '16px 20px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'border-color 0.2s',
            }}
          >
            <FileText size={20} style={{ color: '#60a5fa', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ color: '#93c5fd', fontWeight: 700, fontSize: 14 }}>
                Resumen de Estado — Inventario del Proyecto
              </div>
              <div style={{ color: '#475569', fontSize: 11, marginTop: 2 }}>
                Actualizado: {TODAY} · Backend · Aliados · Modelos de negocio · Pendientes
              </div>
            </div>
            {inventarioOpen
              ? <ChevronUp size={18} style={{ color: '#60a5fa', flexShrink: 0 }} />
              : <ChevronDown size={18} style={{ color: '#60a5fa', flexShrink: 0 }} />}
          </button>

          {inventarioOpen && (
            <div style={{
              background: '#070d1a',
              border: '1.5px solid #1e3a6b',
              borderTop: 'none',
              borderRadius: '0 0 14px 14px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 22,
            }}>

              {/* Aliados activos */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#334155', marginBottom: 10 }}>
                  Aliados activos en la red (piloto)
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {ALIADOS.map(a => (
                    <span key={a} style={{
                      background: '#052e16', border: '1px solid #166534',
                      borderRadius: 20, padding: '4px 12px',
                      color: '#4ade80', fontSize: 11, fontWeight: 600,
                    }}>
                      {a}
                    </span>
                  ))}
                  <span style={{
                    background: '#1c1100', border: '1px solid #713f12',
                    borderRadius: 20, padding: '4px 12px',
                    color: '#fbbf24', fontSize: 11,
                  }}>
                    +1.053 potenciales (RNTs en la isla)
                  </span>
                </div>
              </div>

              {/* Modelos de negocio */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#334155', marginBottom: 10 }}>
                  Modelos de negocio activos
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
                  {MODELOS_NEGOCIO.map(m => (
                    <div key={m.plan} style={{
                      background: '#0a0f1e',
                      border: `1px solid ${m.color}44`,
                      borderRadius: 10,
                      padding: '10px 14px',
                    }}>
                      <div style={{ color: m.color, fontWeight: 700, fontSize: 12 }}>{m.plan}</div>
                      <div style={{ color: '#64748b', fontSize: 11, marginTop: 3 }}>{m.precio}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Estado backend */}
              <div>
                <button
                  onClick={() => setBackendOpen(v => !v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none',
                    cursor: 'pointer', padding: 0, marginBottom: backendOpen ? 10 : 0,
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#334155' }}>
                    Estado del backend ({BACKEND_STATUS.filter(b => b.estado === '✅').length}/{BACKEND_STATUS.length} activos)
                  </div>
                  {backendOpen ? <ChevronUp size={13} style={{ color: '#475569' }} /> : <ChevronDown size={13} style={{ color: '#475569' }} />}
                </button>
                {backendOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {BACKEND_STATUS.map(item => (
                      <div key={item.nombre} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 10,
                        background: '#0a0f1e', borderRadius: 8, padding: '8px 12px',
                        border: '1px solid #1e293b',
                      }}>
                        <EstadoBadge estado={item.estado} />
                        <div style={{ flex: 1 }}>
                          <div style={{ color: '#cbd5e1', fontSize: 12, fontWeight: 600 }}>{item.nombre}</div>
                          <div style={{ color: '#475569', fontSize: 11 }}>{item.detalle}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pendientes */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#334155', marginBottom: 10 }}>
                  Pendientes / bloqueantes antes de escalar
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {PENDIENTES.map(p => (
                    <div key={p.tarea} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      background: '#0a0f1e', borderRadius: 8, padding: '8px 12px',
                      border: '1px solid #1e293b',
                    }}>
                      <PrioridadDot p={p.prioridad} />
                      <div style={{ flex: 1, color: '#94a3b8', fontSize: 12, lineHeight: 1.4 }}>
                        {p.tarea}
                      </div>
                      <span style={{ color: '#475569', fontSize: 10, flexShrink: 0, marginTop: 2 }}>{p.esfuerzo}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10, display: 'flex', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                    <span style={{ color: '#64748b', fontSize: 11 }}>Crítico</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
                    <span style={{ color: '#64748b', fontSize: 11 }}>Importante</span>
                  </div>
                </div>
              </div>

              {/* Eventos */}
              <div style={{
                background: '#0a1628',
                border: '1px solid #1d4ed833',
                borderRadius: 10,
                padding: '14px 16px',
                display: 'flex', gap: 20, flexWrap: 'wrap',
              }}>
                <div>
                  <div style={{ color: '#60a5fa', fontWeight: 700, fontSize: 13 }}>🏆 Copa de la Isla</div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Diciembre 2026 · ~800 visitantes · Launch oficial Beta</div>
                </div>
                <div>
                  <div style={{ color: '#a78bfa', fontWeight: 700, fontSize: 13 }}>✈️ Grupo LAMA</div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>2026 TBD · ~150 internacionales · Operador logístico</div>
                </div>
              </div>

              {/* Stats resumen */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {[
                  { icon: <CheckCircle2 size={15} style={{ color: '#4ade80' }} />, label: 'Componentes activos', val: `${BACKEND_STATUS.filter(b => b.estado === '✅').length}` },
                  { icon: <AlertTriangle size={15} style={{ color: '#f87171' }} />, label: 'Bloqueantes críticos', val: `${PENDIENTES.filter(p => p.prioridad === 'rojo').length}` },
                  { icon: <Clock size={15} style={{ color: '#fbbf24' }} />, label: 'Tareas importantes', val: `${PENDIENTES.filter(p => p.prioridad === 'amarillo').length}` },
                  { icon: <Network size={15} style={{ color: '#60a5fa' }} />, label: 'Aliados piloto', val: `${ALIADOS.length}` },
                ].map(s => (
                  <div key={s.label} style={{
                    flex: '1 1 140px',
                    background: '#0a0f1e',
                    border: '1px solid #1e293b',
                    borderRadius: 10,
                    padding: '10px 14px',
                    display: 'flex', flexDirection: 'column', gap: 4,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {s.icon}
                      <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 18 }}>{s.val}</span>
                    </div>
                    <div style={{ color: '#64748b', fontSize: 10 }}>{s.label}</div>
                  </div>
                ))}
              </div>

            </div>
          )}
        </section>

        {/* ─── Accesos rápidos secundarios ────────────────────────────────────── */}
        <section>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#334155', marginBottom: 12 }}>
            Accesos rápidos
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { label: 'Mapa Mental', icon: <Network size={13} />, route: AppRoute.ADMIN_MAPA_MENTAL, color: '#38bdf8' },
              { label: 'Canvas',      icon: <BarChart2 size={13} />, route: AppRoute.ADMIN_ESTRATEGIA, color: '#00E5CC' },
              { label: 'Backend',     icon: <Database size={13} />, route: AppRoute.ADMIN_BACKEND, color: '#a78bfa' },
              { label: 'Torre',       icon: <TowerControl size={13} />, route: AppRoute.ADMIN_TORRE_CONTROL, color: '#60a5fa' },
              { label: 'Arquitectura', icon: <Layers size={13} />, route: AppRoute.ADMIN_APP_ARQUITECTURA, color: '#4ade80' },
            ].map(q => (
              <button
                key={q.label}
                onClick={() => onNavigate(q.route)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: '#0a0f1e',
                  border: `1px solid ${q.color}33`,
                  borderRadius: 20,
                  padding: '6px 14px',
                  cursor: 'pointer',
                  color: q.color,
                  fontSize: 12,
                  fontWeight: 600,
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = q.color; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = `${q.color}33`; }}
              >
                {q.icon} {q.label}
              </button>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}

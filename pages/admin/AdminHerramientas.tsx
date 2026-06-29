import React, { useState } from 'react';
import {
  ArrowLeft, Network, BarChart2, Database, TowerControl,
  Layers, FileText, ChevronDown, ChevronUp, ExternalLink,
  CheckCircle2, AlertTriangle, Clock, Wrench, Hotel,
  Users, Map, Handshake, Building2, Wifi,
} from 'lucide-react';
import { AppRoute } from '../../types';

interface Props {
  onBack: () => void;
  onNavigate: (route: AppRoute) => void;
}

const TODAY = new Date().toLocaleDateString('es-CO', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
});

// ─── Líneas de producto activas ───────────────────────────────────────────────

const LINEAS_PRODUCTO = [
  {
    emoji: '🌴',
    nombre: 'GuanaGO B2C',
    tagline: 'Plataforma de turismo San Andrés',
    estado: 'produccion',
    items: ['Mapa interactivo 40+ POIs', 'Catálogo tours y alojamientos', 'Concursos y embajadores', 'GuanaPoints wallet', 'Micrositios /aliado/:slug'],
    color: '#34d399',
    bg: '#022c22',
    border: '#166534',
  },
  {
    emoji: '🤝',
    nombre: 'Red de Aliados',
    tagline: 'Vincular y monetizar negocios locales',
    estado: 'activo',
    items: ['Plan Básico · Activo · Premium', 'RABR 8 aliados piloto', 'Kit de Aliados 2026', 'Diagnóstico y onboarding', 'Documentos & Kits editables'],
    color: '#fbbf24',
    bg: '#2d1800',
    border: '#92400e',
  },
  {
    emoji: '🏨',
    nombre: 'Hotel Suite',
    tagline: 'Revenue management y ops para hoteles',
    estado: 'propuesta',
    items: ['Suite del huésped (wallet PWA)', 'Suite interna (housekeeping, turnos)', 'Concierge con IA 24/7', 'Canal de aliados externos', 'Oferta por ocupación (temp. baja)'],
    color: '#60a5fa',
    bg: '#071728',
    border: '#1e3a5f',
  },
  {
    emoji: '🏢',
    nombre: 'GuiaSAI B2B',
    tagline: 'Portal agencias de viajes',
    estado: 'produccion',
    items: ['Cotizador OTA para agencias', 'Tarifas netas', 'PDF de cotización', 'Canal Cowork IA', 'RNT 48674'],
    color: '#a78bfa',
    bg: '#1a0533',
    border: '#4c1d95',
  },
];

// ─── Hotel Suite — módulos ────────────────────────────────────────────────────

const HOTEL_SUITE_HUESPED = [
  { modulo: 'Wallet instalable (PWA)',      resultado: 'Canal directo propio, sin depender de redes' },
  { modulo: 'Solicitudes a la habitación',  resultado: 'Room service, mucama, wifi — con trazabilidad' },
  { modulo: 'Conexión WhatsApp / email',    resultado: 'Recontacto sin fricción, incluso post checkout' },
  { modulo: 'Bonos y promos internas',      resultado: 'Upsell dentro del hotel (spa, bar, tours)' },
  { modulo: 'Concierge con IA',             resultado: 'Atención 24/7 en el idioma del huésped' },
  { modulo: 'Canal de aliados externos',    resultado: 'Comisión por venta dirigida a través del canal' },
  { modulo: 'Oferta por ocupación',         resultado: 'Ingreso adicional en temporada baja' },
  { modulo: 'Recordación post-estadía',     resultado: 'Recompra futura medible, no solo buena voluntad' },
];

const HOTEL_SUITE_INTERNA = [
  { modulo: 'Estado de habitaciones',  resultado: 'Ocupadas, huéspedes y limpieza en vivo' },
  { modulo: 'Solicitudes y soporte',   resultado: 'Cierra ciclo entre pedido del huésped y resolución' },
  { modulo: 'Housekeeping',            resultado: 'Asignación y seguimiento por habitación' },
  { modulo: 'Turnos y asistencia',     resultado: 'Control sin planillas físicas ni WhatsApp' },
];

const HOTEL_SUITE_MODELO = [
  { componente: 'Configuración inicial', detalle: 'Pago único · diagnóstico, branding, integración, curaduría aliados', cuando: 'Al inicio' },
  { componente: 'Mensualidad',           detalle: 'Ambas suites + panel reportes + acompañamiento continuo',           cuando: 'Recurrente' },
  { componente: 'Comisión upsell',       detalle: 'Sobre ventas a aliados generadas por el canal (tours, restaurantes)', cuando: 'Por transacción' },
  { componente: 'Comisión recompra',     detalle: 'Sobre noches trasladadas o nuevas reservas generadas',               cuando: 'Por reserva' },
];

// ─── Ecosistema de aliados ────────────────────────────────────────────────────

const PLANES_ALIADO = [
  { plan: 'Básico',         precio: 'Gratis',           include: 'Ficha directorio · QR · panel básico',                            color: '#6b7280' },
  { plan: 'Aliado Activo',  precio: '$49.900 COP/mes',  include: '+ Pin en mapa · GuanaPoints · insignia verificado',               color: '#34d399' },
  { plan: 'Aliado Premium', precio: '$129.900 COP/mes', include: '+ Paquete completo · estadísticas · paquetes de servicios',       color: '#fbbf24' },
];

const KIT_ALIADOS = [
  {
    titulo: 'Kit de Aliados 2026',
    sub: 'Pitch · Planes · Micrositios · Onboarding · Make',
    desc: 'Discurso de venta con manejo de objeciones, planes y precios, arquitectura de micrositios, base de datos y manual de onboarding.',
    emoji: '🧰',
    color: '#f87171',
  },
  {
    titulo: 'Sistema Operativo del Aliado',
    sub: 'Del registro a la rentabilidad permanente',
    desc: 'Ciclo de vida operativo del aliado dentro del ecosistema GuanaGO: flujos, panel y procesos día a día.',
    emoji: '⚙️',
    color: '#fbbf24',
  },
  {
    titulo: 'Taxonomía de Vitrinas & Embudo',
    sub: '2 familias · 11 tipos · 26 subtipos · Airtable',
    desc: 'Clasificación completa de vitrinas, mapa real del base Airtable, embudo de ofertas y escenarios Make.',
    emoji: '🗂️',
    color: '#a78bfa',
  },
];

const OFERTA_MAPA = [
  { item: 'Pin en el mapa',      desc: 'Visible para turistas que caminan la isla en este momento' },
  { item: 'Wallet de puntos',    desc: 'Clientes acumulan GuanaPoints y vuelven a comprar' },
  { item: 'Bonos y descuentos',  desc: 'El aliado decide la promo · GuanaGO la distribuye' },
  { item: 'Red de aliados',      desc: 'Referidos cruzados con otros negocios locales de confianza' },
  { item: 'Micrositio propio',   desc: 'Página pública /aliado/tu-negocio con WhatsApp, llamar y cómo llegar' },
];

// ─── Estado del backend ───────────────────────────────────────────────────────

const BACKEND_STATUS = [
  { nombre: 'API REST principal',         estado: '✅', detalle: 'Node.js + Express · Render.com' },
  { nombre: 'Directorio / Mapa',          estado: '✅', detalle: 'Lee Directorio_Mapa de Airtable, 40+ POIs' },
  { nombre: 'Micrositios /aliado/:slug',  estado: '✅', detalle: 'Página pública por negocio' },
  { nombre: 'Catálogo tours',             estado: '✅', detalle: 'ServiciosTuristicos_SAI' },
  { nombre: 'Catálogo alojamientos',      estado: '✅', detalle: 'AlojamientosTuristicos_SAI' },
  { nombre: 'Sistema de leads',           estado: '✅', detalle: 'CRM Airtable · ref GG-XXXXXX' },
  { nombre: 'Cotizaciones',               estado: '✅', detalle: 'Genera en Airtable con ítems desglosados' },
  { nombre: 'PayU (pagos)',               estado: '✅', detalle: 'Transacción real procesada · tubería a Alegra' },
  { nombre: 'Firebase Auth',              estado: '✅', detalle: 'Email + Google para turistas, residentes, admin' },
  { nombre: 'Chatbot Groq/Llama3',        estado: '✅', detalle: 'Base de conocimiento Raizal ES/EN/PT' },
  { nombre: 'Make.com (sync)',            estado: '⚠️', detalle: 'Webhook Users activo · Directorio sin confirmar' },
  { nombre: 'Registro aliado real',       estado: '❌', detalle: 'PartnerRegister es mock — no escribe en Airtable' },
  { nombre: 'Flujo aprobación socios',    estado: '❌', detalle: 'AdminApprovals gestiona reservas, no socios' },
  { nombre: 'Hotel Suite',                estado: '⚠️', detalle: 'En propuesta comercial — desarrollo pendiente' },
];

const PENDIENTES = [
  { tarea: 'Conectar PartnerRegister.tsx a Airtable',        esfuerzo: '1h',      prioridad: 'rojo' },
  { tarea: 'Escritura real en /api/partners/register',        esfuerzo: '2-3h',    prioridad: 'rojo' },
  { tarea: 'Vista aprobación aliados en panel admin',         esfuerzo: '3-4h',    prioridad: 'rojo' },
  { tarea: 'Poblar ID_Slug en 6 aliados activos',            esfuerzo: '30min',   prioridad: 'amarillo' },
  { tarea: 'Bug precios placeholder 700k COP alojamientos',  esfuerzo: '2h',      prioridad: 'amarillo' },
  { tarea: 'Confirmar webhook Make.com Directorio_Mapa',     esfuerzo: '30min',   prioridad: 'amarillo' },
  { tarea: 'Desplegar kits QR físicos a 8 aliados piloto',   esfuerzo: 'logística', prioridad: 'amarillo' },
  { tarea: 'Hotel Suite — MVP suite del huésped (PWA)',       esfuerzo: 'sprint',  prioridad: 'azul' },
  { tarea: 'Hotel Suite — suite interna (housekeeping)',      esfuerzo: 'sprint',  prioridad: 'azul' },
  { tarea: 'Diagnóstico de canales primer hotel piloto',      esfuerzo: '30min',   prioridad: 'azul' },
];

const ALIADOS_PILOTO = [
  'Bushi Food · Restaurante', 'Bobby Rock · Bar', 'Capy Beach · Restaurante',
  'Casa Las Palmas · Alojamiento', 'Capitán Mandy · Tour', 'Dreamer Hotel · Hotel',
  'Sweet Avenue Café · Cafetería',
];

// ─── Tool cards ───────────────────────────────────────────────────────────────

const TOOLS = [
  { emoji: '🗺️', label: 'Mapa Mental',               sub: 'Proyectos · Tareas · Arquitectura',              color: '#38bdf8', border: '#0369a1', bg: '#071728', route: AppRoute.ADMIN_MAPA_MENTAL },
  { emoji: '📊', label: 'Lean Canvas & Estrategia',   sub: 'Modelo negocio · Embajadores · Paquetes',        color: '#00E5CC', border: '#0f5c55', bg: '#061a17', route: AppRoute.ADMIN_ESTRATEGIA },
  { emoji: '🗄️', label: 'Backend / Sincronización',   sub: 'Estado Airtable · Sync · Cache',                 color: '#a78bfa', border: '#4c1d95', bg: '#120730', route: AppRoute.ADMIN_BACKEND },
  { emoji: '⚡', label: 'Torre de Control',            sub: 'Tareas · Sprints · Progreso',                    color: '#60a5fa', border: '#1e3a5f', bg: '#080f1e', route: AppRoute.ADMIN_TORRE_CONTROL },
  { emoji: '🏗️', label: 'App Arquitectura',            sub: 'Árbol componentes · Rutas · Estructura',         color: '#4ade80', border: '#14532d', bg: '#052e16', route: AppRoute.ADMIN_APP_ARQUITECTURA },
  { emoji: '🔧', label: 'Panel de Control',            sub: 'Config sistema · Permisos · Avanzado',           color: '#fb923c', border: '#7c2d12', bg: '#1c0a04', route: AppRoute.ADMIN_CONTROL_PANEL },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function EstadoBadge({ estado }: { estado: string }) {
  if (estado === '✅') return <span style={{ fontSize: 14 }}>✅</span>;
  if (estado === '❌') return <span style={{ fontSize: 14 }}>❌</span>;
  return <span style={{ fontSize: 14 }}>⚠️</span>;
}

function PrioridadDot({ p }: { p: string }) {
  const col = p === 'rojo' ? '#ef4444' : p === 'amarillo' ? '#f59e0b' : p === 'azul' ? '#60a5fa' : '#22c55e';
  return <div style={{ width: 8, height: 8, borderRadius: '50%', background: col, boxShadow: `0 0 6px ${col}88`, flexShrink: 0, marginTop: 3 }} />;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#334155', marginBottom: 14 }}>
      {children}
    </div>
  );
}

function EstadoPill({ estado }: { estado: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    produccion: { label: '✅ En producción', color: '#4ade80', bg: '#052e16' },
    activo:     { label: '🟡 Piloto activo', color: '#fbbf24', bg: '#2d1800' },
    propuesta:  { label: '🔵 En propuesta',  color: '#60a5fa', bg: '#071728' },
    diseno:     { label: '⚪ En diseño',      color: '#94a3b8', bg: '#0f172a' },
  };
  const s = map[estado] ?? map.diseno;
  return (
    <span style={{
      background: s.bg, color: s.color,
      border: `1px solid ${s.color}44`,
      borderRadius: 20, padding: '2px 10px',
      fontSize: 10, fontWeight: 700,
    }}>{s.label}</span>
  );
}

function Collapsible({ title, icon, defaultOpen = false, children }: {
  title: string; icon: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', border: '1.5px solid #1e293b' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          background: '#0a0f1e', border: 'none', padding: '14px 18px',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span>{icon}</span>
        <span style={{ flex: 1, color: '#e2e8f0', fontWeight: 700, fontSize: 13 }}>{title}</span>
        {open ? <ChevronUp size={16} style={{ color: '#475569', flexShrink: 0 }} /> : <ChevronDown size={16} style={{ color: '#475569', flexShrink: 0 }} />}
      </button>
      {open && (
        <div style={{ background: '#060d1a', padding: '16px 18px', borderTop: '1px solid #1e293b' }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function AdminHerramientas({ onBack, onNavigate }: Props) {

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
        <button onClick={onBack} style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13 }}>
          <ArrowLeft size={16} /> Volver
        </button>
        <div style={{ width: 1, height: 18, background: '#1e293b' }} />
        <Wrench size={17} style={{ color: '#38bdf8' }} />
        <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 15 }}>Herramientas del Proyecto</span>
        <span style={{ color: '#475569', fontSize: 11, marginLeft: 4 }}>GuanaGO 2026</span>
        <div style={{ flex: 1 }} />
        <span style={{ color: '#334155', fontSize: 11 }}>{TODAY}</span>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 20px', display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* ─── 1. Líneas de producto activas ──────────────────────────────────── */}
        <section>
          <SectionLabel>Líneas de producto activas</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {LINEAS_PRODUCTO.map(lp => (
              <div key={lp.nombre} style={{
                background: lp.bg,
                border: `1.5px solid ${lp.border}`,
                borderRadius: 14, padding: '16px',
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 22 }}>{lp.emoji}</span>
                  <EstadoPill estado={lp.estado} />
                </div>
                <div>
                  <div style={{ color: lp.color, fontWeight: 700, fontSize: 13 }}>{lp.nombre}</div>
                  <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>{lp.tagline}</div>
                </div>
                <ul style={{ margin: 0, padding: '0 0 0 14px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {lp.items.map(it => (
                    <li key={it} style={{ color: '#94a3b8', fontSize: 11, lineHeight: 1.4 }}>{it}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ─── 2. Hotel Suite ─────────────────────────────────────────────────── */}
        <section>
          <SectionLabel>Hotel Suite — Estrategia de desarrollo</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            <Collapsible title="Suite del Huésped — Revenue management" icon={<Hotel size={16} style={{ color: '#60a5fa' }} />}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {HOTEL_SUITE_HUESPED.map(m => (
                  <div key={m.modulo} style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
                    background: '#0a0f1e', borderRadius: 8, padding: '8px 12px',
                    border: '1px solid #1e293b',
                  }}>
                    <span style={{ color: '#93c5fd', fontSize: 12, fontWeight: 600 }}>{m.modulo}</span>
                    <span style={{ color: '#64748b', fontSize: 11 }}>{m.resultado}</span>
                  </div>
                ))}
              </div>
            </Collapsible>

            <Collapsible title="Suite Interna — Apoyo operativo al equipo del hotel" icon={<Building2 size={16} style={{ color: '#a78bfa' }} />}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {HOTEL_SUITE_INTERNA.map(m => (
                  <div key={m.modulo} style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
                    background: '#0a0f1e', borderRadius: 8, padding: '8px 12px',
                    border: '1px solid #1e293b',
                  }}>
                    <span style={{ color: '#c4b5fd', fontSize: 12, fontWeight: 600 }}>{m.modulo}</span>
                    <span style={{ color: '#64748b', fontSize: 11 }}>{m.resultado}</span>
                  </div>
                ))}
              </div>
            </Collapsible>

            <Collapsible title="Modelo Comercial Hotel Suite" icon={<FileText size={16} style={{ color: '#34d399' }} />}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                {HOTEL_SUITE_MODELO.map(m => (
                  <div key={m.componente} style={{
                    display: 'grid', gridTemplateColumns: '160px 1fr 100px', gap: 10, alignItems: 'start',
                    background: '#0a0f1e', borderRadius: 8, padding: '8px 12px',
                    border: '1px solid #1e293b',
                  }}>
                    <span style={{ color: '#4ade80', fontSize: 12, fontWeight: 600 }}>{m.componente}</span>
                    <span style={{ color: '#64748b', fontSize: 11 }}>{m.detalle}</span>
                    <span style={{ color: '#475569', fontSize: 10, textAlign: 'right' }}>{m.cuando}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: '#071728', border: '1px solid #1e3a5f', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ color: '#60a5fa', fontWeight: 700, fontSize: 12, marginBottom: 6 }}>
                  ¿Por qué GuiaSAI puede ofrecerlo?
                </div>
                <div style={{ color: '#64748b', fontSize: 11, lineHeight: 1.6 }}>
                  Hotel Suite se construye sobre infraestructura ya probada en GuanaGO — no es desarrollo desde cero.
                  El mismo Airtable, Make.com, Firebase Auth y la red de aliados ya existentes son la base.
                  El hotel no cambia su PMS ni su web — la suite se integra como capa adicional, activada por QR físico.
                </div>
              </div>
            </Collapsible>

          </div>
        </section>

        {/* ─── 3. Ecosistema de aliados ────────────────────────────────────────── */}
        <section>
          <SectionLabel>Ecosistema de aliados — Oferta y operación</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            <Collapsible title="Oferta del mapa — Lo que obtiene un aliado al vincularse" icon={<Map size={16} style={{ color: '#34d399' }} />} defaultOpen>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                {OFERTA_MAPA.map(o => (
                  <div key={o.item} style={{
                    display: 'flex', gap: 12, alignItems: 'flex-start',
                    background: '#0a0f1e', borderRadius: 8, padding: '8px 12px', border: '1px solid #1e293b',
                  }}>
                    <span style={{ color: '#34d399', fontWeight: 700, fontSize: 12, flexShrink: 0, minWidth: 140 }}>{o.item}</span>
                    <span style={{ color: '#64748b', fontSize: 11 }}>{o.desc}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                {PLANES_ALIADO.map(p => (
                  <div key={p.plan} style={{
                    background: '#0a0f1e', border: `1px solid ${p.color}44`, borderRadius: 10, padding: '12px 14px',
                  }}>
                    <div style={{ color: p.color, fontWeight: 700, fontSize: 13 }}>{p.plan}</div>
                    <div style={{ color: '#fbbf24', fontSize: 12, fontWeight: 600, margin: '3px 0' }}>{p.precio}</div>
                    <div style={{ color: '#64748b', fontSize: 11 }}>{p.include}</div>
                  </div>
                ))}
              </div>
            </Collapsible>

            <Collapsible title="Kit de Aliados 2026 — Documentos estratégicos" icon={<Handshake size={16} style={{ color: '#fbbf24' }} />}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {KIT_ALIADOS.map(k => (
                  <div key={k.titulo} style={{
                    display: 'flex', gap: 12, alignItems: 'flex-start',
                    background: '#0a0f1e', border: `1px solid ${k.color}22`, borderRadius: 10, padding: '12px 14px',
                  }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{k.emoji}</span>
                    <div>
                      <div style={{ color: k.color, fontWeight: 700, fontSize: 13 }}>{k.titulo}</div>
                      <div style={{ color: '#f59e0b', fontSize: 10, marginTop: 2, marginBottom: 4 }}>{k.sub}</div>
                      <div style={{ color: '#64748b', fontSize: 11, lineHeight: 1.5 }}>{k.desc}</div>
                    </div>
                  </div>
                ))}
                <div style={{ background: '#071728', border: '1px solid #1e3a5f', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ color: '#60a5fa', fontSize: 11 }}>
                    📂 Ver en la app: <strong>Aliados & Red → Documentos & Kits</strong> — editable en HTML directo desde el panel admin.
                  </div>
                </div>
              </div>
            </Collapsible>

            <Collapsible title="Aliados piloto activos + potencial de mercado" icon={<Users size={16} style={{ color: '#60a5fa' }} />}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {ALIADOS_PILOTO.map(a => (
                  <span key={a} style={{
                    background: '#052e16', border: '1px solid #166534',
                    borderRadius: 20, padding: '4px 12px', color: '#4ade80', fontSize: 11, fontWeight: 600,
                  }}>{a}</span>
                ))}
                <span style={{
                  background: '#1c1100', border: '1px solid #713f12',
                  borderRadius: 20, padding: '4px 12px', color: '#fbbf24', fontSize: 11,
                }}>+1.053 potenciales · RNTs isla</span>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1, background: '#0a0f1e', border: '1px solid #1e293b', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                  <div style={{ color: '#34d399', fontWeight: 700, fontSize: 20 }}>7</div>
                  <div style={{ color: '#64748b', fontSize: 10 }}>Aliados activos</div>
                </div>
                <div style={{ flex: 1, background: '#0a0f1e', border: '1px solid #1e293b', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                  <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: 20 }}>1.060</div>
                  <div style={{ color: '#64748b', fontSize: 10 }}>RNTs en la isla</div>
                </div>
                <div style={{ flex: 1, background: '#0a0f1e', border: '1px solid #1e293b', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                  <div style={{ color: '#60a5fa', fontWeight: 700, fontSize: 20 }}>1.053</div>
                  <div style={{ color: '#64748b', fontSize: 10 }}>Brecha de mercado</div>
                </div>
              </div>
            </Collapsible>

          </div>
        </section>

        {/* ─── 4. Herramientas de diseño ───────────────────────────────────────── */}
        <section>
          <SectionLabel>Herramientas de diseño y desarrollo</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
            {TOOLS.map(tool => (
              <button
                key={tool.route}
                onClick={() => onNavigate(tool.route)}
                style={{
                  background: tool.bg, border: `1.5px solid ${tool.border}`,
                  borderRadius: 14, padding: '16px 18px', cursor: 'pointer',
                  textAlign: 'left', transition: 'box-shadow 0.2s, border-color 0.2s',
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

        {/* ─── 5. Estado del proyecto ──────────────────────────────────────────── */}
        <section>
          <Collapsible
            title={`Resumen de estado del proyecto — ${TODAY}`}
            icon={<FileText size={16} style={{ color: '#60a5fa' }} />}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Backend */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#334155', marginBottom: 8 }}>
                  Estado del backend ({BACKEND_STATUS.filter(b => b.estado === '✅').length}/{BACKEND_STATUS.length} activos)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {BACKEND_STATUS.map(item => (
                    <div key={item.nombre} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      background: '#0a0f1e', borderRadius: 8, padding: '7px 12px', border: '1px solid #1e293b',
                    }}>
                      <EstadoBadge estado={item.estado} />
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#cbd5e1', fontSize: 12, fontWeight: 600 }}>{item.nombre}</div>
                        <div style={{ color: '#475569', fontSize: 11 }}>{item.detalle}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pendientes */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#334155', marginBottom: 8 }}>
                  Pendientes / próximos pasos
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {PENDIENTES.map(p => (
                    <div key={p.tarea} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      background: '#0a0f1e', borderRadius: 8, padding: '7px 12px', border: '1px solid #1e293b',
                    }}>
                      <PrioridadDot p={p.prioridad} />
                      <div style={{ flex: 1, color: '#94a3b8', fontSize: 12 }}>{p.tarea}</div>
                      <span style={{ color: '#475569', fontSize: 10, flexShrink: 0, marginTop: 2 }}>{p.esfuerzo}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10, display: 'flex', gap: 14 }}>
                  {[['rojo','Crítico'], ['amarillo','Importante'], ['azul','Hotel Suite']].map(([c,l]) => (
                    <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <PrioridadDot p={c} />
                      <span style={{ color: '#64748b', fontSize: 11 }}>{l}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[
                  { icon: <CheckCircle2 size={15} style={{ color: '#4ade80' }} />, label: 'Componentes activos', val: String(BACKEND_STATUS.filter(b => b.estado === '✅').length) },
                  { icon: <AlertTriangle size={15} style={{ color: '#f87171' }} />, label: 'Bloqueantes críticos', val: String(PENDIENTES.filter(p => p.prioridad === 'rojo').length) },
                  { icon: <Clock size={15} style={{ color: '#fbbf24' }} />,         label: 'Tareas importantes',  val: String(PENDIENTES.filter(p => p.prioridad === 'amarillo').length) },
                  { icon: <Hotel size={15} style={{ color: '#60a5fa' }} />,         label: 'Hotel Suite sprints', val: String(PENDIENTES.filter(p => p.prioridad === 'azul').length) },
                ].map(s => (
                  <div key={s.label} style={{
                    flex: '1 1 140px', background: '#0a0f1e', border: '1px solid #1e293b',
                    borderRadius: 10, padding: '10px 14px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {s.icon}
                      <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 18 }}>{s.val}</span>
                    </div>
                    <div style={{ color: '#64748b', fontSize: 10, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

            </div>
          </Collapsible>
        </section>

        {/* ─── 6. Accesos rápidos ──────────────────────────────────────────────── */}
        <section>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { label: 'Mapa Mental',    icon: <Network size={13} />,     route: AppRoute.ADMIN_MAPA_MENTAL,       color: '#38bdf8' },
              { label: 'Canvas',         icon: <BarChart2 size={13} />,    route: AppRoute.ADMIN_ESTRATEGIA,        color: '#00E5CC' },
              { label: 'Backend',        icon: <Database size={13} />,     route: AppRoute.ADMIN_BACKEND,           color: '#a78bfa' },
              { label: 'Torre',          icon: <TowerControl size={13} />, route: AppRoute.ADMIN_TORRE_CONTROL,     color: '#60a5fa' },
              { label: 'Arquitectura',   icon: <Layers size={13} />,       route: AppRoute.ADMIN_APP_ARQUITECTURA,  color: '#4ade80' },
              { label: 'Aliados & Red',  icon: <Handshake size={13} />,    route: AppRoute.ADMIN_ALIADOS,           color: '#fbbf24' },
              { label: 'WiFi Captivo',   icon: <Wifi size={13} />,         route: AppRoute.ADMIN_ALIADOS,           color: '#2dd4bf' },
            ].map(q => (
              <button
                key={q.label}
                onClick={() => onNavigate(q.route)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: '#0a0f1e', border: `1px solid ${q.color}33`,
                  borderRadius: 20, padding: '6px 14px', cursor: 'pointer',
                  color: q.color, fontSize: 12, fontWeight: 600,
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

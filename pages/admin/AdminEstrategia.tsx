import React, { useState } from 'react';
import { ArrowLeft, ExternalLink, FileText, ChevronRight } from 'lucide-react';
import { AppRoute } from '../../types';

interface Props {
  onBack: () => void;
  onNavigate: (route: AppRoute) => void;
}

interface DocEntry {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  url: string;
  date: string;
  color: string;
}

const DOCS: DocEntry[] = [
  {
    id: 'avance',
    title: 'Avance Estratégico',
    subtitle: 'Diagnóstico general · Sprints · Visión',
    description: 'Estado actual del proyecto, sprints de desarrollo y decisiones arquitectónicas de mayo 2026.',
    url: '/docs/09may-avance-estrategico.html',
    date: '09 May 2026',
    color: '#00E5CC',
  },
  {
    id: 'canvas',
    title: 'Lean Canvas',
    subtitle: 'Modelo de negocio en 9 bloques',
    description: '4 segmentos (turista, isleño, aliado, agencia B2B), propuesta de valor única y ventaja injusta.',
    url: '/docs/16may-lean-canvas.html',
    date: '16 May 2026',
    color: '#38BDF8',
  },
  {
    id: 'economico',
    title: 'Modelo Económico',
    subtitle: 'GuanaPoints · Economía circular · Proyección',
    description: 'GuanaPoints como utility token, CAC por canal, LTV/CAC 28x y proyección de $16M COP/mes en mes 6.',
    url: '/docs/16may-modelo-economico.html',
    date: '16 May 2026',
    color: '#4ADE80',
  },
  {
    id: 'paquetes',
    title: 'Paquetes & Promociones',
    subtitle: '3 paquetes B2C · Banco de promos · Distribución',
    description: 'Explorer $180K, Cultural $280K, VIP $480K. Sistema de aprobación y distribución automática en redes.',
    url: '/docs/16may-paquetes-promos.html',
    date: '16 May 2026',
    color: '#F5831F',
  },
  {
    id: 'embajadores',
    title: 'Programa de Embajadores',
    subtitle: '3 perfiles · Mecánica · Beneficios por nivel',
    description: 'Raizal ancestral, Residente OCCRE y Freelancer. Cupones 60 días, comisión en COP y 4 niveles de embajador.',
    url: '/docs/16may-embajadores.html',
    date: '16 May 2026',
    color: '#FFB74D',
  },
  {
    id: 'onboarding',
    title: 'Onboarding de Aliados',
    subtitle: 'Flujo · Categorías · Discurso de ventas',
    description: '5 min de registro, $0 costo, 20% comisión, activo en 24h. Guía completa para hoteles, tours, restaurantes y comercio.',
    url: '/docs/16may-onboarding-aliados.html',
    date: '16 May 2026',
    color: '#A78BFA',
  },
];

export default function AdminEstrategia({ onBack }: Props) {
  const [selected, setSelected] = useState<DocEntry>(DOCS[0]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const openExternal = () => {
    window.open(selected.url, '_blank');
  };

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', background: '#060E18' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 16px',
        background: '#0B1622',
        borderBottom: '1px solid rgba(0,229,204,0.14)',
        flexShrink: 0,
        zIndex: 10,
      }}>
        <button
          onClick={onBack}
          style={{ color: '#6B8A9E', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13 }}
        >
          <ArrowLeft size={16} /> Volver
        </button>

        <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.1)' }} />

        <span style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#00E5CC', fontWeight: 700 }}>
          GuanaGO
        </span>
        <span style={{ color: '#F0F4F8', fontWeight: 700, fontSize: 14 }}>
          {selected.title}
        </span>
        <span style={{ fontSize: 11, color: '#6B8A9E' }}>{selected.date}</span>

        <div style={{ flex: 1 }} />

        <button
          onClick={() => setSidebarOpen(o => !o)}
          style={{
            color: sidebarOpen ? '#00E5CC' : '#6B8A9E',
            background: sidebarOpen ? 'rgba(0,229,204,.08)' : 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            padding: '5px 10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 12,
          }}
        >
          <FileText size={13} /> Docs
        </button>

        <button
          onClick={openExternal}
          title="Abrir en pestaña nueva"
          style={{
            color: '#6B8A9E',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            padding: '5px 10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 12,
          }}
        >
          <ExternalLink size={13} /> Pantalla completa
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar */}
        {sidebarOpen && (
          <div style={{
            width: 260,
            flexShrink: 0,
            background: '#0B1622',
            borderRight: '1px solid rgba(0,229,204,0.1)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{ padding: '12px 14px 8px', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: '#6B8A9E', fontWeight: 700 }}>
              Documentos estratégicos
            </div>
            {DOCS.map(doc => (
              <button
                key={doc.id}
                onClick={() => setSelected(doc)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '12px 14px',
                  background: selected.id === doc.id ? 'rgba(0,229,204,0.06)' : 'none',
                  borderLeft: selected.id === doc.id ? `3px solid ${doc.color}` : '3px solid transparent',
                  border: 'none',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  transition: 'background .15s',
                }}
              >
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: `${doc.color}18`,
                  border: `1px solid ${doc.color}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 2,
                }}>
                  <FileText size={14} style={{ color: doc.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: selected.id === doc.id ? '#F0F4F8' : '#8BA4B8', marginBottom: 2, lineHeight: 1.3 }}>
                    {doc.title}
                  </div>
                  <div style={{ fontSize: 10, color: '#6B8A9E', lineHeight: 1.4 }}>{doc.subtitle}</div>
                  <div style={{ fontSize: 10, color: '#4A6070', marginTop: 3 }}>{doc.date}</div>
                </div>
                {selected.id === doc.id && (
                  <ChevronRight size={14} style={{ color: doc.color, marginTop: 8, flexShrink: 0 }} />
                )}
              </button>
            ))}

            {/* Mini-description of selected doc */}
            <div style={{ margin: '8px 14px 14px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: selected.color, fontWeight: 700, marginBottom: 6 }}>
                Sobre este doc
              </div>
              <p style={{ fontSize: 12, color: '#6B8A9E', lineHeight: 1.6 }}>
                {selected.description}
              </p>
            </div>
          </div>
        )}

        {/* iframe */}
        <iframe
          key={selected.url}
          src={selected.url}
          title={selected.title}
          style={{ flex: 1, border: 'none', width: '100%', height: '100%' }}
          allow="fullscreen"
        />
      </div>
    </div>
  );
}

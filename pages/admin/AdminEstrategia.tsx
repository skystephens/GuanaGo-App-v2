import React from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { AppRoute } from '../../types';

interface Props {
  onBack: () => void;
  onNavigate: (route: AppRoute) => void;
}

export default function AdminEstrategia({ onBack }: Props) {
  const openExternal = () => {
    window.open('/docs/09may-avance-estrategico.html', '_blank');
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
          style={{
            color: '#6B8A9E',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 13,
          }}
        >
          <ArrowLeft size={16} /> Volver
        </button>

        <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.1)' }} />

        <span style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#00E5CC', fontWeight: 700 }}>
          GuanaGO
        </span>
        <span style={{ color: '#F0F4F8', fontWeight: 700, fontSize: 15 }}>
          Documento Estratégico — Mayo 2026
        </span>

        <div style={{ flex: 1 }} />

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

      {/* iframe */}
      <iframe
        src="/docs/09may-avance-estrategico.html"
        title="GuanaGO — Documento Estratégico Mayo 2026"
        style={{
          flex: 1,
          border: 'none',
          width: '100%',
        }}
        allow="fullscreen"
      />
    </div>
  );
}

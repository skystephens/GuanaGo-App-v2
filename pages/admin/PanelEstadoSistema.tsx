import React, { useState, useCallback } from 'react';
import {
  RefreshCw, CheckCircle, XCircle, AlertTriangle, Wifi, WifiOff,
  Map, Package, Music, Users, Calendar, Globe, Handshake,
  Palette, ShoppingCart, Activity, Clock
} from 'lucide-react';

// ─── Tipos ───────────────────────────────────────────────────────────────────
type CheckStatus = 'idle' | 'loading' | 'ok' | 'warn' | 'error';

interface CheckResult {
  status: CheckStatus;
  value?: string | number;
  detail?: string;
  checkedAt?: string;
}

type SystemChecks = {
  backend:          CheckResult;
  servicios:        CheckResult;
  directorio:       CheckResult;
  caribbeanNight:   CheckResult;
  reservaciones:    CheckResult;
  airtable:         CheckResult;
};

const INITIAL: SystemChecks = {
  backend:        { status: 'idle' },
  servicios:      { status: 'idle' },
  directorio:     { status: 'idle' },
  caribbeanNight: { status: 'idle' },
  reservaciones:  { status: 'idle' },
  airtable:       { status: 'idle' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const now = () => new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

const StatusIcon: React.FC<{ status: CheckStatus; size?: number }> = ({ status, size = 14 }) => {
  if (status === 'loading') return <RefreshCw size={size} className="animate-spin text-blue-400" />;
  if (status === 'ok')      return <CheckCircle size={size} className="text-green-400" />;
  if (status === 'warn')    return <AlertTriangle size={size} className="text-yellow-400" />;
  if (status === 'error')   return <XCircle size={size} className="text-red-400" />;
  return <Clock size={size} className="text-gray-500" />;
};

const statusColor = (s: CheckStatus) =>
  s === 'ok' ? 'border-green-800 bg-green-950/30' :
  s === 'warn' ? 'border-yellow-800 bg-yellow-950/20' :
  s === 'error' ? 'border-red-800 bg-red-950/20' :
  s === 'loading' ? 'border-blue-800 bg-blue-950/10' :
  'border-gray-700 bg-gray-900';

const valueColor = (s: CheckStatus) =>
  s === 'ok' ? 'text-green-300' : s === 'warn' ? 'text-yellow-300' :
  s === 'error' ? 'text-red-300' : 'text-gray-400';

// ─── Módulos del sistema (estáticos - reflejan lo que ya está construido) ────
const MODULOS = [
  { id: 'b2c',     label: 'Acceso B2C',          sub: 'Turista / Local',        icon: <Globe size={16} />,     color: 'text-cyan-400',    activo: true,  nota: 'Home, mapa, tours, carrito, wallet' },
  { id: 'b2b',     label: 'Acceso B2B',           sub: 'Agencias externas',      icon: <Handshake size={16} />, color: 'text-emerald-400', activo: true,  nota: 'Cotizador GuiaSAI, portal agencias' },
  { id: 'partner', label: 'Portal Socios',        sub: 'Operadores & Aliados',   icon: <Users size={16} />,     color: 'text-blue-400',    activo: true,  nota: 'Dashboard partner, scanner QR, wallet socio' },
  { id: 'artista', label: 'Portal Artistas',      sub: 'RIMM Caribbean Night',   icon: <Palette size={16} />,   color: 'text-purple-400',  activo: true,  nota: 'Portafolio artistas, eventos, NFT pendiente' },
  { id: 'admin',   label: 'Panel Admin',          sub: 'SuperAdmin',             icon: <Activity size={16} />,  color: 'text-red-400',     activo: true,  nota: 'Dashboard, users, finanzas, backend, tareas' },
  { id: 'carrito', label: 'Carrito & Checkout',   sub: 'Sin pasarela real aún',  icon: <ShoppingCart size={16} />, color: 'text-orange-400', activo: false, nota: 'UI completa, pasarela de pago pendiente' },
  { id: 'cn',      label: 'Caribbean Night',      sub: 'Eventos & entradas',     icon: <Music size={16} />,     color: 'text-pink-400',    activo: true,  nota: 'Listado eventos, detalle artista, mock data' },
  { id: 'mapa',    label: 'Mapa Interactivo',     sub: 'Mapbox + POIs',          icon: <Map size={16} />,       color: 'text-teal-400',    activo: true,  nota: 'Directorio_Mapa en Airtable, filtros' },
];

// ─── Componente principal ────────────────────────────────────────────────────
const PanelEstadoSistema: React.FC = () => {
  const [checks, setChecks] = useState<SystemChecks>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [moduloDetalle, setModuloDetalle] = useState<string | null>(null);

  const set = (key: keyof SystemChecks, val: Partial<CheckResult>) =>
    setChecks(prev => ({ ...prev, [key]: { ...prev[key], ...val } }));

  const runDiagnostico = useCallback(async () => {
    setLoading(true);

    // Reset all to loading
    const keys: (keyof SystemChecks)[] = ['backend','servicios','directorio','caribbeanNight','reservaciones','airtable'];
    keys.forEach(k => set(k, { status: 'loading', value: undefined, detail: undefined }));

    // 1. Backend health
    try {
      const r = await fetch('/api/health', { signal: AbortSignal.timeout(5000) });
      const j = await r.json();
      set('backend', { status: r.ok ? 'ok' : 'error', value: r.ok ? 'Activo' : 'Error', detail: j?.environment || '', checkedAt: now() });
    } catch {
      set('backend', { status: 'error', value: 'Sin respuesta', checkedAt: now() });
    }

    // 2. Servicios turísticos
    try {
      const r = await fetch('/api/services', { signal: AbortSignal.timeout(8000) });
      const j = await r.json();
      const data = Array.isArray(j) ? j : (j?.data ?? []);
      const count = data.length;
      const tours  = data.filter((s: any) => s.category === 'tour').length;
      const hotels = data.filter((s: any) => s.category === 'hotel').length;
      const pkgs   = data.filter((s: any) => s.category === 'package').length;
      set('servicios', {
        status: count > 0 ? 'ok' : 'warn',
        value: count,
        detail: `Tours: ${tours} · Hoteles: ${hotels} · Paquetes: ${pkgs}`,
        checkedAt: now()
      });
    } catch {
      set('servicios', { status: 'error', value: 'Error', checkedAt: now() });
    }

    // 3. Directorio / Mapa
    try {
      const r = await fetch('/api/directory', { signal: AbortSignal.timeout(8000) });
      const j = await r.json();
      const data = Array.isArray(j) ? j : (j?.data ?? []);
      const count = data.length;
      const cats = [...new Set(data.map((d: any) => d.categoria || d.category || d.type).filter(Boolean))];
      set('directorio', {
        status: count > 0 ? 'ok' : 'warn',
        value: count,
        detail: cats.slice(0, 4).join(' · ') + (cats.length > 4 ? '…' : ''),
        checkedAt: now()
      });
    } catch {
      set('directorio', { status: 'error', value: 'Error', checkedAt: now() });
    }

    // 4. Caribbean Night / Eventos
    try {
      const r = await fetch('/api/services?category=music_event', { signal: AbortSignal.timeout(8000) });
      const j = await r.json();
      const data = Array.isArray(j) ? j : (j?.data ?? []);
      const count = data.length;
      set('caribbeanNight', {
        status: count > 0 ? 'ok' : 'warn',
        value: count,
        detail: count > 0 ? data.map((e: any) => e.title || e.eventName || e.nombre || '?').slice(0, 3).join(' · ') : 'Sin eventos',
        checkedAt: now()
      });
    } catch {
      set('caribbeanNight', { status: 'error', value: 'Error', checkedAt: now() });
    }

    // 5. Reservaciones
    try {
      const r = await fetch('/api/reservations/all', { signal: AbortSignal.timeout(8000) });
      const j = await r.json();
      const data = Array.isArray(j) ? j : (j?.data ?? []);
      const count = data.length;
      const confirmed = data.filter((rv: any) => (rv.status || rv.estado) === 'confirmed').length;
      const pending   = data.filter((rv: any) => (rv.status || rv.estado) === 'pending').length;
      set('reservaciones', {
        status: 'ok',
        value: count,
        detail: count > 0 ? `Confirmadas: ${confirmed} · Pendientes: ${pending}` : 'Sin reservas aún',
        checkedAt: now()
      });
    } catch {
      set('reservaciones', { status: 'error', value: 'Error', checkedAt: now() });
    }

    // 6. Airtable (via config-check)
    try {
      const r = await fetch('/api/config-check', { signal: AbortSignal.timeout(6000) });
      const j = await r.json();
      const hasKey  = j?.airtable?.hasApiKey  ?? j?.hasAirtableKey  ?? false;
      const hasBase = j?.airtable?.hasBaseId  ?? j?.hasBaseId       ?? false;
      const ok = hasKey && hasBase;
      set('airtable', {
        status: ok ? 'ok' : 'warn',
        value: ok ? 'Conectado' : 'Config incompleta',
        detail: `API Key: ${hasKey ? '✓' : '✗'} · Base ID: ${hasBase ? '✓' : '✗'}`,
        checkedAt: now()
      });
    } catch {
      set('airtable', { status: 'warn', value: 'No verificado', checkedAt: now() });
    }

    setLastRun(now());
    setLoading(false);
  }, []);

  // ── Métricas rápidas (top 4) ──────────────────────────────────────────────
  const metricas = [
    { label: 'Servicios Turísticos', icon: <Package size={18} />, check: checks.servicios,      color: 'text-cyan-400' },
    { label: 'Puntos en Mapa',       icon: <Map size={18} />,     check: checks.directorio,     color: 'text-teal-400' },
    { label: 'Caribbean Night',      icon: <Music size={18} />,   check: checks.caribbeanNight, color: 'text-pink-400' },
    { label: 'Reservaciones',        icon: <Calendar size={18} />, check: checks.reservaciones,  color: 'text-orange-400' },
  ];

  const allOk     = keys(checks).every(k => checks[k as keyof SystemChecks].status === 'ok');
  const anyError  = keys(checks).some(k => checks[k as keyof SystemChecks].status === 'error');
  const anyChecked = keys(checks).some(k => checks[k as keyof SystemChecks].status !== 'idle');

  return (
    <div className="space-y-3">

      {/* ── Header del panel ── */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${anyChecked ? (anyError ? 'bg-red-500' : allOk ? 'bg-green-500 animate-pulse' : 'bg-yellow-500') : 'bg-gray-600'}`} />
          <span className="text-sm font-bold text-white">Estado del Sistema</span>
          {lastRun && <span className="text-xs text-gray-600">· última vez {lastRun}</span>}
        </div>
        <button
          onClick={runDiagnostico}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs text-cyan-400 font-bold transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Verificando...' : 'Diagnosticar'}
        </button>
      </div>

      {/* ── Métricas top (números) ── */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {metricas.map(m => (
          <div key={m.label} className={`rounded-xl border p-3 transition-colors ${statusColor(m.check.status)}`}>
            <div className="flex items-center justify-between mb-1">
              <span className={m.color}>{m.icon}</span>
              <StatusIcon status={m.check.status} size={13} />
            </div>
            <p className={`text-2xl font-bold leading-none ${valueColor(m.check.status)}`}>
              {m.check.status === 'loading' ? '…' : m.check.value ?? '—'}
            </p>
            <p className="text-gray-500 text-xs mt-1 leading-tight">{m.label}</p>
            {m.check.detail && (
              <p className="text-gray-600 text-[10px] mt-0.5 truncate">{m.check.detail}</p>
            )}
          </div>
        ))}
      </div>

      {/* ── Checks de infraestructura ── */}
      <div className="grid grid-cols-2 gap-2">
        {([
          { key: 'backend' as const,  label: 'Backend API',   icon: <Wifi size={13} /> },
          { key: 'airtable' as const, label: 'Airtable DB',   icon: <Activity size={13} /> },
        ]).map(item => {
          const c = checks[item.key];
          return (
            <div key={item.key} className={`rounded-xl border px-3 py-2.5 flex items-center gap-2.5 transition-colors ${statusColor(c.status)}`}>
              <span className={valueColor(c.status)}>{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-300">{item.label}</p>
                <p className={`text-xs ${valueColor(c.status)}`}>{c.status === 'loading' ? 'Verificando…' : (c.value ?? 'No verificado')}</p>
              </div>
              <StatusIcon status={c.status} size={14} />
            </div>
          );
        })}
      </div>

      {/* ── Módulos del sistema ── */}
      <div className="bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-400 uppercase">Módulos implementados</span>
          <span className="text-xs text-gray-600">{MODULOS.filter(m => m.activo).length}/{MODULOS.length} activos</span>
        </div>
        <div className="divide-y divide-gray-800">
          {MODULOS.map(m => (
            <div key={m.id}>
              <button
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-800 transition-colors text-left"
                onClick={() => setModuloDetalle(moduloDetalle === m.id ? null : m.id)}
              >
                <span className={`flex-shrink-0 ${m.color}`}>{m.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{m.label}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                      ${m.activo ? 'bg-green-900 text-green-400' : 'bg-yellow-900 text-yellow-500'}`}>
                      {m.activo ? 'Activo' : 'Parcial'}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs">{m.sub}</p>
                </div>
                <span className="text-gray-700 text-xs">{moduloDetalle === m.id ? '▲' : '▼'}</span>
              </button>
              {moduloDetalle === m.id && (
                <div className="px-4 py-2.5 bg-gray-800/50 border-t border-gray-800">
                  <p className="text-xs text-gray-400">{m.nota}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Prompt inicial ── */}
      {!anyChecked && (
        <div className="text-center py-3">
          <p className="text-gray-600 text-xs">Presiona <strong className="text-gray-500">Diagnosticar</strong> para verificar el estado real del sistema</p>
        </div>
      )}
    </div>
  );
};

// helper para Object.keys tipado
function keys<T extends object>(o: T) { return Object.keys(o) as (keyof T)[]; }

export default PanelEstadoSistema;

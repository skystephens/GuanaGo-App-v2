/**
 * AdminCRM — Torre Comercial GuiaSAI (modo tycoon)
 *
 * · Fila de departamentos con métricas en vivo (Ventas, Finanzas, Operaciones,
 *   Atención, Marketing, Dirección) — el "mapa del juego"
 * · Kanban de leads por Etapa_CRM (CotizacionesGG)
 * · Ficha del lead: temperatura, etapa, notas, WhatsApp con guión de agencia
 *   (RNT 48674 · ecosistema local · turismo cultural)
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, RefreshCw, Loader2, Phone, Mail, X, Save,
  TrendingUp, Wallet, Ship, MessageCircle, Megaphone, Brain, Flame,
} from 'lucide-react';
import { AppRoute } from '../../types';

const API = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : '';

interface Lead {
  id: string; nombre: string; telefono: string; email: string;
  fechaCreacion: string; fechaViaje: string; adultos: number;
  precio: number; estado: string; numeroReserva: string;
  etapa: string; temperatura: string; notas: string;
  proximoSeguimiento: string;
}
interface Resumen {
  ventas: { hoy: number; sinAtender: number; pipeline: number; ganadosHoy: number };
  finanzas: { cajaHoy: number; cajaMes: number };
  atencion: { chatsPendientes: number };
  operaciones: { toursHoy: number; vouchersPendientes: number };
}
interface Props { onBack: () => void; onNavigate: (r: AppRoute) => void }

const ETAPAS = ['Nuevo', 'Contactado', 'Negociación', 'Pago enviado', 'Ganado', 'Perdido'];
const TEMPS: Record<string, string> = { Caliente: '🔥', Tibio: '🌡️', 'Frío': '❄️' };
const fmtCOP = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`;
const fmtCompacto = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : fmtCOP(n);

// ── Guiones de agencia (RNT 48674 · ecosistema local · turismo cultural) ──────
const guiones = (lead: Lead) => {
  const nombre = (lead.nombre || '').split(' ')[0];
  return [
    {
      titulo: '👋 Bienvenida de agencia',
      etapaSugerida: 'Contactado',
      diasSeguimiento: 2,
      texto: `Hola ${nombre} 🌴 Soy del equipo de GuíaSAI, recibimos tu cotización. Somos una agencia Raizal de San Andrés con Registro Nacional de Turismo 48674 — trabajamos únicamente con operadores oficiales de la isla y fomentamos el turismo cultural, así que cada servicio que reservas con nosotros apoya directamente al ecosistema local. ¿Te confirmo disponibilidad y tarifas para tus fechas?`,
    },
    {
      titulo: '🌦️ Garantía de clima',
      etapaSugerida: 'Negociación',
      diasSeguimiento: 2,
      texto: `${nombre}, un dato importante para tu tranquilidad: si la Capitanía de Puerto llegara a suspender las salidas al mar por clima, tu reserva está protegida — reprogramamos sin costo o la cambias por una experiencia cultural Raizal en tierra. Tu pago nunca se pierde con GuíaSAI ✅`,
    },
    {
      titulo: '💳 Empuje de cierre',
      etapaSugerida: 'Pago enviado',
      diasSeguimiento: 1,
      texto: `${nombre}, tu cotización está lista y las tarifas confirmadas 🎉 Para garantizar tu cupo transfiere a nuestra llave Bre-B: *@MPC846* (gratis e inmediato, desde cualquier banco o billetera). Cuando hagas la transferencia envíame el comprobante y te confirmo tu reserva al instante. Los cupos con pago confirmado tienen prioridad.`,
    },
    {
      titulo: '⏰ Seguimiento suave',
      etapaSugerida: null as string | null,
      diasSeguimiento: 3,
      texto: `Hola ${nombre} 🌴 ¿Cómo vas con la decisión de tu viaje a San Andrés? Sigo teniendo tus fechas apartadas de manera preliminar. Si tienes alguna duda sobre los tours, el alojamiento o la forma de pago, con gusto te la resuelvo — para eso estamos 🙌`,
    },
  ];
};

const AdminCRM: React.FC<Props> = ({ onBack, onNavigate }) => {
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<Lead | null>(null);
  const [notasDraft, setNotasDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const cargar = async () => {
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        fetch(`${API}/api/crm/resumen`).then(r => r.json()),
        fetch(`${API}/api/crm/leads`).then(r => r.json()),
      ]);
      if (r1 && !r1.error) setResumen(r1);
      if (Array.isArray(r2)) setLeads(r2);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);
  useEffect(() => { setNotasDraft(sel?.notas || ''); }, [sel?.id]);

  const porEtapa = useMemo(() => {
    const m: Record<string, Lead[]> = {};
    ETAPAS.forEach(e => (m[e] = []));
    leads.forEach(l => {
      const e = ETAPAS.includes(l.etapa) ? l.etapa : 'Nuevo';
      m[e].push(l);
    });
    return m;
  }, [leads]);

  const actualizar = async (id: string, cambios: Partial<Pick<Lead, 'etapa' | 'temperatura' | 'notas' | 'proximoSeguimiento'>>) => {
    setSaving(true);
    try {
      const r = await fetch(`${API}/api/crm/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cambios),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setLeads(prev => prev.map(l => (l.id === id ? data : l)));
      setSel(prev => (prev?.id === id ? data : prev));
    } catch (e: any) {
      alert(`Error guardando: ${e.message}`);
    } finally { setSaving(false); }
  };

  const abrirWA = (lead: Lead, texto: string) => {
    const tel = (lead.telefono || '').replace(/\D/g, '');
    const num = tel.startsWith('57') ? tel : `57${tel}`;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(texto)}`, '_blank');
  };

  // Envía el guion por WhatsApp y avanza el pipeline automáticamente:
  // - solo mueve la etapa hacia adelante (nunca retrocede un lead ya avanzado)
  // - siempre programa el próximo seguimiento, para que aparezca en el Super Admin
  const enviarGuion = (lead: Lead, g: ReturnType<typeof guiones>[number]) => {
    const cambios: Partial<Pick<Lead, 'etapa' | 'proximoSeguimiento'>> = {};
    if (g.etapaSugerida) {
      const actual = ETAPAS.indexOf(lead.etapa || 'Nuevo');
      const sugerida = ETAPAS.indexOf(g.etapaSugerida);
      if (sugerida > actual) cambios.etapa = g.etapaSugerida;
    }
    const prox = new Date();
    prox.setDate(prox.getDate() + g.diasSeguimiento);
    cambios.proximoSeguimiento = prox.toISOString().slice(0, 10);

    actualizar(lead.id, cambios);
    abrirWA(lead, g.texto);
  };

  const sinAtender = resumen?.ventas.sinAtender || 0;

  // ── Departamentos tycoon ──
  const deps = [
    { icon: <TrendingUp size={16} />, nombre: 'Ventas', valor: `${resumen?.ventas.hoy ?? '—'} hoy`, sub: `Pipeline ${fmtCompacto(resumen?.ventas.pipeline || 0)}`, alerta: sinAtender > 0, onClick: undefined },
    { icon: <Wallet size={16} />, nombre: 'Finanzas', valor: fmtCompacto(resumen?.finanzas.cajaHoy || 0), sub: `Mes: ${fmtCompacto(resumen?.finanzas.cajaMes || 0)}`, alerta: false, onClick: () => onNavigate(AppRoute.ADMIN_QUOTES) },
    { icon: <Ship size={16} />, nombre: 'Operaciones', valor: `${resumen?.operaciones.toursHoy ?? '—'} tours hoy`, sub: `${resumen?.operaciones.vouchersPendientes || 0} vouchers sin cerrar`, alerta: (resumen?.operaciones.vouchersPendientes || 0) > 0, onClick: () => onNavigate(AppRoute.ADMIN_VOUCHERS) },
    { icon: <MessageCircle size={16} />, nombre: 'Atención', valor: `${resumen?.atencion.chatsPendientes ?? '—'} chats`, sub: 'pendientes por responder', alerta: (resumen?.atencion.chatsPendientes || 0) > 0, onClick: () => onNavigate(AppRoute.ADMIN_CHATS_ATENCION) },
    { icon: <Megaphone size={16} />, nombre: 'Marketing', valor: 'Campañas', sub: 'copies + bandera del día', alerta: false, onClick: () => onNavigate(AppRoute.ADMIN_CAMPANAS) },
    { icon: <Brain size={16} />, nombre: 'Dirección', valor: 'Command', sub: 'tareas + estrategia', alerta: false, onClick: () => onNavigate(AppRoute.COMMAND_CENTER) },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-16">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 pt-10 pb-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center gap-3 flex-wrap">
          <button onClick={onBack} className="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center">
            <ArrowLeft size={16} />
          </button>
          <div className="flex-1 min-w-[180px]">
            <h1 className="font-black text-base">CRM · Torre Comercial 🏝️</h1>
            <p className="text-[10px] text-gray-500">GuiaSAI Tycoon — cada cotización es un lead, cada lead una venta por cerrar</p>
          </div>
          {sinAtender > 0 && (
            <div className="flex items-center gap-2 bg-red-950/60 border border-red-800 text-red-300 text-[11px] font-bold px-3 py-2 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {sinAtender} lead{sinAtender > 1 ? 's' : ''} sin atender
            </div>
          )}
          <button onClick={cargar} className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-4 space-y-5">
        {/* ── Fila de departamentos (tycoon) ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {deps.map(d => (
            <button
              key={d.nombre}
              onClick={d.onClick}
              disabled={!d.onClick}
              className={`text-left bg-gray-900 border rounded-2xl p-3 transition-colors ${
                d.alerta ? 'border-orange-600' : 'border-gray-800'
              } ${d.onClick ? 'hover:border-teal-500 cursor-pointer' : 'cursor-default'}`}
            >
              <div className="flex items-center gap-1.5 text-gray-400 mb-1.5">
                {d.icon}
                <span className="text-[9px] font-bold uppercase tracking-wider">{d.nombre}</span>
                {d.alerta && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse ml-auto" />}
              </div>
              <p className="font-black text-sm text-white leading-tight">{d.valor}</p>
              <p className="text-[9px] text-gray-500 mt-0.5">{d.sub}</p>
            </button>
          ))}
        </div>

        {/* ── Kanban ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
          {ETAPAS.map(etapa => (
            <div key={etapa} className={`bg-gray-900/60 border rounded-2xl p-2 min-h-[140px] ${etapa === 'Ganado' ? 'border-emerald-900' : etapa === 'Perdido' ? 'border-gray-800 opacity-70' : 'border-gray-800'}`}>
              <p className={`text-[10px] font-bold uppercase tracking-wider px-1.5 pb-2 flex justify-between ${etapa === 'Ganado' ? 'text-emerald-400' : 'text-gray-400'}`}>
                {etapa}
                <span className="text-gray-600">{porEtapa[etapa]?.length || 0}</span>
              </p>
              <div className="space-y-1.5">
                {(porEtapa[etapa] || []).slice(0, 12).map(l => (
                  <button
                    key={l.id}
                    onClick={() => setSel(l)}
                    className="w-full text-left bg-gray-900 border border-gray-800 hover:border-teal-500 rounded-xl p-2 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-[11px] font-bold truncate">{l.nombre}</p>
                      <span className="text-[11px]">{TEMPS[l.temperatura] || ''}</span>
                    </div>
                    <p className="text-[10px] text-cyan-300 font-bold">{fmtCOP(l.precio)}</p>
                    <p className="text-[8.5px] text-gray-500">
                      {l.adultos > 0 ? `${l.adultos} pax · ` : ''}{(l.fechaCreacion || '').slice(0, 10)}
                      {l.numeroReserva ? ` · ${l.numeroReserva}` : ''}
                    </p>
                  </button>
                ))}
                {(porEtapa[etapa]?.length || 0) > 12 && (
                  <p className="text-[9px] text-gray-600 px-1.5">+{porEtapa[etapa].length - 12} más</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Ficha del lead ── */}
      {sel && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end md:items-center justify-center p-0 md:p-6" onClick={() => setSel(null)}>
          <div className="bg-gray-900 border border-gray-700 rounded-t-3xl md:rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="font-black text-lg">{sel.nombre} {TEMPS[sel.temperatura] || ''}</h2>
                <p className="text-[11px] text-gray-400 flex items-center gap-3 mt-0.5">
                  {sel.telefono && <span className="flex items-center gap-1"><Phone size={10} /> {sel.telefono}</span>}
                  {sel.email && <span className="flex items-center gap-1"><Mail size={10} /> {sel.email}</span>}
                </p>
              </div>
              <button onClick={() => setSel(null)} className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center shrink-0"><X size={14} /></button>
            </div>

            <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-3 text-[11.5px] mb-4">
              <b className="text-teal-400">{fmtCOP(sel.precio)}</b>
              {sel.adultos > 0 && <> · {sel.adultos} adulto{sel.adultos > 1 ? 's' : ''}</>}
              {sel.fechaViaje && <> · viaja {String(sel.fechaViaje).slice(0, 10)}</>}
              {sel.numeroReserva && <> · <span className="text-emerald-400 font-bold">{sel.numeroReserva}</span></>}
              <span className="text-gray-500"> · creada {String(sel.fechaCreacion).slice(0, 10)}</span>
            </div>

            {/* Temperatura */}
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1"><Flame size={10} /> Temperatura</p>
            <div className="flex gap-2 mb-4">
              {Object.entries(TEMPS).map(([t, emoji]) => (
                <button key={t} onClick={() => actualizar(sel.id, { temperatura: t })}
                  className={`flex-1 py-2 rounded-xl border-2 text-xs font-bold transition-all ${sel.temperatura === t ? 'border-orange-500 bg-orange-950/40 text-orange-300' : 'border-gray-800 text-gray-500 hover:border-gray-600'}`}>
                  {emoji} {t}
                </button>
              ))}
            </div>

            {/* Etapa */}
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Etapa del pipeline</p>
            <div className="grid grid-cols-3 gap-1.5 mb-4">
              {ETAPAS.map(e => (
                <button key={e} onClick={() => actualizar(sel.id, { etapa: e })}
                  className={`py-2 rounded-xl border text-[10px] font-bold transition-all ${sel.etapa === e ? 'border-teal-500 bg-teal-950/40 text-teal-300' : 'border-gray-800 text-gray-500 hover:border-gray-600'}`}>
                  {e}
                </button>
              ))}
            </div>

            {/* Guiones de agencia */}
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">💬 WhatsApp con guión GuiaSAI</p>
            <div className="grid grid-cols-2 gap-1.5 mb-4">
              {guiones(sel).map(g => (
                <button key={g.titulo} onClick={() => enviarGuion(sel, g)}
                  disabled={!sel.telefono}
                  className="py-2.5 px-2 rounded-xl bg-emerald-900/40 border border-emerald-800 hover:border-emerald-500 text-[10.5px] font-bold text-emerald-200 disabled:opacity-40 transition-colors">
                  {g.titulo}
                  {g.etapaSugerida && <span className="block text-[8px] text-emerald-400/70 font-normal mt-0.5">→ {g.etapaSugerida}</span>}
                </button>
              ))}
            </div>

            {/* Notas */}
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Notas CRM</p>
            <textarea value={notasDraft} onChange={e => setNotasDraft(e.target.value)} rows={3}
              placeholder="Ej: fechas flexibles · verificar con propietario · llamar mañana 2pm"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-xs leading-relaxed mb-2" />
            <div className="flex gap-2 mb-2">
              <button onClick={() => actualizar(sel.id, { notas: notasDraft })} disabled={saving || notasDraft === sel.notas}
                className="flex-1 flex items-center justify-center gap-1.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 font-black text-xs py-3 rounded-xl">
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Guardar notas
              </button>
              <button onClick={() => onNavigate(AppRoute.ADMIN_QUOTES)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 font-bold text-xs py-3 rounded-xl">
                Ver cotización
              </button>
            </div>

            {/* Confirmación manual de pago Bre-B (@MPC846) — no hay webhook automático */}
            {sel.etapa !== 'Ganado' && (
              <button
                onClick={() => {
                  if (!confirm(`¿Confirmas que llegó la transferencia Bre-B de ${sel.nombre} (${fmtCOP(sel.precio)})? Esto moverá el lead a Ganado.`)) return;
                  actualizar(sel.id, { etapa: 'Ganado' });
                }}
                className="w-full flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 font-black text-xs py-3 rounded-xl"
              >
                ✅ Confirmar pago recibido (Bre-B @MPC846)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCRM;

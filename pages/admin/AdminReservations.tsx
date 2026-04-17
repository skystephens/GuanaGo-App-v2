/**
 * AdminReservations — Centro unificado de reservas
 * GuanaGO Super Admin · Abril 2026
 *
 * Tab 1 — Reservas: reservas internas (B2C + B2B) del backend
 * Tab 2 — Vouchers: Airtable Generador_vouchers (Civitatis + GuiaSAI + manuales)
 *   Misma base appij4vUx7GZEwf5x usada por GuiaSAI y GuanaGO
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  ArrowLeft, Calendar, Users, DollarSign, Loader2, AlertCircle,
  CheckCircle2, XCircle, Clock, RefreshCw, Plus, Search,
  MapPin, Phone, Mail, Hash, ChevronDown, X, Ticket, FileText,
  ArrowUpDown,
} from 'lucide-react';
import { AppRoute, Reservation } from '../../types';
import { api } from '../../services/api';

// ─── API base ─────────────────────────────────────────────────────────────────

const API = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : '';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminReservationsProps {
  onBack: () => void;
  onNavigate: (route: AppRoute) => void;
}

interface VoucherRecord {
  id: string;
  titular: string;
  reservaNum: string;
  pax: string;
  fecha: string;
  hora: string;
  puntoEncuentro: string;
  observaciones: string;
  notasAdicionales: string;
  tourName: string;
  estado: string;
  estadoVoucher: string;
  telefono: string;
  email: string;
  ultimaModificacion: string;
  createdTime: string;
}

interface CivitatisServicio {
  id: string;
  nombre: string;
  tipo: string;
  precioNeto: number;
  horarios: string[];
}

interface VoucherFormData {
  reservaNum: string;
  titular: string;
  telefono: string;
  email: string;
  pax: string;
  fecha: string;
  hora: string;
  tourId: string;
  tourName: string;
  puntoEncuentro: string;
  observaciones: string;
  notasAdicionales: string;
  estado: string;
}

interface EstadoCfg { label: string; bg: string; text: string; icon: React.ReactNode }

// ─── Constants ────────────────────────────────────────────────────────────────

const ESTADOS_VOUCHER = ['PENDIENTE', 'CONFIRMADO', 'CANCELADO', 'COMPLETADO'];

const PUNTOS = [
  'MUELLE CASA DE LA CULTURA',
  'MUELLE PORTOFINO',
  'MUELLE TONY',
  'AEROPUERTO GUSTAVO ROJAS PINILLA',
  'HOTEL DEL CLIENTE',
  'OTRO',
];

const VOUCHER_ESTADO_CFG: Record<string, EstadoCfg> = {
  PENDIENTE:   { label: 'Pendiente',   bg: 'bg-yellow-900/40', text: 'text-yellow-400', icon: <Clock size={11} /> },
  CONFIRMADO:  { label: 'Confirmado',  bg: 'bg-green-900/40',  text: 'text-green-400',  icon: <CheckCircle2 size={11} /> },
  CANCELADO:   { label: 'Cancelado',   bg: 'bg-red-900/40',    text: 'text-red-400',    icon: <XCircle size={11} /> },
  COMPLETADO:  { label: 'Completado',  bg: 'bg-blue-900/40',   text: 'text-blue-400',   icon: <CheckCircle2 size={11} /> },
};

const FORM_EMPTY: VoucherFormData = {
  reservaNum: '', titular: '', telefono: '', email: '',
  pax: '', fecha: '', hora: '', tourId: '', tourName: '',
  puntoEncuentro: '', observaciones: '', notasAdicionales: '',
  estado: 'PENDIENTE',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const normalizeReservation = (raw: any): Reservation => ({
  id: raw.id || raw.reservationId || `res-${Date.now()}`,
  tourName: raw.tourName || raw.serviceName || raw.service?.name || 'Servicio',
  clientName: raw.clientName || raw.customerName || raw.customer?.name || 'Cliente',
  date: raw.date || raw.fecha || raw.createdAt || new Date().toISOString(),
  status: (raw.status || raw.estado || 'pending').toLowerCase(),
  people: raw.people || raw.pax || raw.quantity || 1,
  price: raw.price || raw.valor || raw.total || undefined,
  hederaTransactionId: raw.hederaTransactionId,
  auditStatus: 'verified',
} as Reservation);

const statusChip = (status: string) => {
  switch (status) {
    case 'confirmed': return 'bg-green-900/50 text-green-400 border-green-700/40';
    case 'pending':   return 'bg-yellow-900/50 text-yellow-400 border-yellow-700/40';
    case 'cancelled': return 'bg-red-900/50 text-red-400 border-red-700/40';
    default:          return 'bg-gray-900/50 text-gray-400 border-gray-700/40';
  }
};

// ─── Component ────────────────────────────────────────────────────────────────

const AdminReservations: React.FC<AdminReservationsProps> = ({ onBack }) => {
  const [tab, setTab] = useState<'reservas' | 'vouchers'>('reservas');

  // ── Tab 1: Reservas ─────────────────────────────────────────────────────────
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loadingRes, setLoadingRes]     = useState(true);
  const [filterRes, setFilterRes]       = useState<'all' | 'confirmed' | 'pending' | 'cancelled'>('all');
  const [page, setPage]                 = useState(1);
  const [pageSize, setPageSize]         = useState(10);

  const loadReservations = useCallback(async () => {
    try {
      setLoadingRes(true);
      const list = await (api.reservations as any).listAll?.();
      const normalized = Array.isArray(list) ? list.map(normalizeReservation) : [];
      setReservations(normalized);
    } catch (e) {
      console.error('Error loading reservations:', e);
    } finally {
      setLoadingRes(false);
    }
  }, []);

  // ── Tab 2: Vouchers ─────────────────────────────────────────────────────────
  const [vouchers, setVouchers]         = useState<VoucherRecord[]>([]);
  const [loadingVou, setLoadingVou]     = useState(false);
  const [vouchersLoaded, setVouchersLoaded] = useState(false);
  const [searchVou, setSearchVou]       = useState('');
  const [servicios, setServicios]       = useState<CivitatisServicio[]>([]);
  const [loadingServ, setLoadingServ]   = useState(false);
  const [showForm, setShowForm]         = useState(false);
  const [form, setForm]                 = useState<VoucherFormData>(FORM_EMPTY);
  const [saving, setSaving]             = useState(false);
  const [saveError, setSaveError]       = useState('');
  const [saveOk, setSaveOk]             = useState(false);
  const [selectedVoucher, setSelected]  = useState<VoucherRecord | null>(null);
  const [sortOrder, setSortOrder]       = useState<'asc' | 'desc'>('desc');

  const loadVouchers = useCallback(async () => {
    setLoadingVou(true);
    try {
      const res = await fetch(`${API}/api/reservations/vouchers`);
      const json = await res.json();
      if (json.success) setVouchers(json.data || []);
    } catch (e) {
      console.error('Error cargando vouchers:', e);
    } finally {
      setLoadingVou(false);
      setVouchersLoaded(true);
    }
  }, []);

  const loadServicios = useCallback(async () => {
    setLoadingServ(true);
    try {
      const res = await fetch(`${API}/api/reservations/vouchers/civitatis-servicios`);
      const json = await res.json();
      if (json.success) setServicios(json.data || []);
    } catch (e) {
      console.error('Error cargando servicios:', e);
    } finally {
      setLoadingServ(false);
    }
  }, []);

  // Cargar reservas al montar; vouchers solo cuando se abre el tab
  useEffect(() => { loadReservations(); }, [loadReservations]);

  useEffect(() => {
    if (tab === 'vouchers' && !vouchersLoaded) {
      loadVouchers();
      loadServicios();
    }
  }, [tab, vouchersLoaded, loadVouchers, loadServicios]);

  // ── Form helpers ───────────────────────────────────────────────────────────
  const setField = (key: keyof VoucherFormData, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleServicioChange = (id: string) => {
    const s = servicios.find(x => x.id === id);
    if (!s) { setField('tourId', ''); setField('tourName', ''); return; }
    setForm(prev => ({ ...prev, tourId: s.id, tourName: s.nombre }));
  };

  const openNewForm = () => {
    setForm(FORM_EMPTY);
    setSaveError('');
    setSaveOk(false);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.titular.trim()) { setSaveError('El nombre del cliente es obligatorio.'); return; }
    if (!form.fecha.trim())   { setSaveError('La fecha es obligatoria.'); return; }
    setSaving(true);
    setSaveError('');
    try {
      const payload: Record<string, string> = {
        titular: form.titular, telefono: form.telefono, email: form.email,
        pax: form.pax, fecha: form.fecha, hora: form.hora,
        puntoEncuentro: form.puntoEncuentro, observaciones: form.observaciones,
        notasAdicionales: form.notasAdicionales, tourName: form.tourName,
        estado: form.estado,
      };
      if (form.tourId)    payload.tourId    = form.tourId;
      if (form.reservaNum) payload.reservaNum = form.reservaNum;

      const res = await fetch(`${API}/api/reservations/vouchers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Error guardando');
      setSaveOk(true);
      setShowForm(false);
      loadVouchers();
    } catch (e: any) {
      setSaveError(e.message || 'Error desconocido');
    } finally {
      setSaving(false);
    }
  };

  // ── Derived data ───────────────────────────────────────────────────────────
  const filteredRes  = reservations.filter(r => filterRes === 'all' ? true : r.status === filterRes);
  const totalPages   = Math.max(1, Math.ceil(filteredRes.length / pageSize));
  const paginated    = filteredRes.slice((page - 1) * pageSize, page * pageSize);
  const resStats     = {
    total:     reservations.length,
    confirmed: reservations.filter(r => r.status === 'confirmed').length,
    pending:   reservations.filter(r => r.status === 'pending').length,
    cancelled: reservations.filter(r => r.status === 'cancelled').length,
  };

  const filteredVou = vouchers
    .filter(v => {
      if (!searchVou.trim()) return true;
      const q = searchVou.toLowerCase();
      return (
        v.titular.toLowerCase().includes(q) ||
        v.reservaNum.toLowerCase().includes(q) ||
        v.tourName.toLowerCase().includes(q) ||
        v.fecha.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      // Fecha de servicio (campo "fecha") o createdTime como fallback
      const da = a.fecha ? new Date(a.fecha).getTime() : new Date(a.createdTime).getTime();
      const db = b.fecha ? new Date(b.fecha).getTime() : new Date(b.createdTime).getTime();
      return sortOrder === 'asc' ? da - db : db - da;
    });

  const vStats = {
    total:      vouchers.length,
    pendiente:  vouchers.filter(v => v.estado === 'PENDIENTE').length,
    confirmado: vouchers.filter(v => v.estado === 'CONFIRMADO').length,
    completado: vouchers.filter(v => v.estado === 'COMPLETADO').length,
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="bg-gray-950 min-h-screen text-white pb-24 font-sans">

      {/* Header */}
      <header className="sticky top-0 z-20 bg-gray-950/90 backdrop-blur-md border-b border-gray-800 px-4 py-4 flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-gray-900 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Calendar size={22} className="text-blue-500" />
            Reservas
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Centro unificado · reservas directas y vouchers</p>
        </div>
        <button
          onClick={() => tab === 'reservas' ? loadReservations() : loadVouchers()}
          className="p-2 hover:bg-gray-900 rounded-lg transition-colors text-gray-400"
        >
          <RefreshCw size={16} className={(loadingRes || loadingVou) ? 'animate-spin' : ''} />
        </button>
        {tab === 'vouchers' && (
          <button
            onClick={openNewForm}
            className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold px-3 py-2 rounded-xl transition-colors"
          >
            <Plus size={15} /> Nueva
          </button>
        )}
      </header>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 px-4 sticky top-[69px] z-10 bg-gray-950">
        <button
          onClick={() => setTab('reservas')}
          className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
            tab === 'reservas'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          Reservas directas
          {resStats.total > 0 && (
            <span className="ml-2 bg-blue-900/50 text-blue-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {resStats.total}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('vouchers')}
          className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
            tab === 'vouchers'
              ? 'border-orange-500 text-orange-400'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          Vouchers
          {vStats.total > 0 && (
            <span className="ml-2 bg-orange-900/50 text-orange-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {vStats.total}
            </span>
          )}
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1 — RESERVAS DIRECTAS
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'reservas' && (
        <div className="px-4 pt-5 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {([
              { key: 'all',       label: 'Total',       value: resStats.total,     color: 'blue'   },
              { key: 'confirmed', label: 'Confirmadas', value: resStats.confirmed, color: 'green'  },
              { key: 'pending',   label: 'Pendientes',  value: resStats.pending,   color: 'yellow' },
              { key: 'cancelled', label: 'Canceladas',  value: resStats.cancelled, color: 'red'    },
            ] as const).map(({ key, label, value, color }) => (
              <button
                key={key}
                onClick={() => { setFilterRes(key); setPage(1); }}
                className={`p-4 rounded-xl border transition-all text-left ${
                  filterRes === key
                    ? `bg-${color}-500/20 border-${color}-500`
                    : 'bg-gray-900 border-gray-800 hover:border-gray-600'
                }`}
              >
                <div className={`text-2xl font-bold text-${color}-400`}>{value}</div>
                <div className="text-[10px] font-bold text-gray-400 uppercase mt-1">{label}</div>
              </button>
            ))}
          </div>

          {/* List */}
          {loadingRes ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-gray-900 rounded-xl border border-gray-800 p-4 animate-pulse">
                  <div className="h-3 w-24 bg-gray-800 rounded mb-3" />
                  <div className="h-3 w-48 bg-gray-800 rounded mb-2" />
                  <div className="h-3 w-32 bg-gray-800 rounded" />
                </div>
              ))}
            </div>
          ) : filteredRes.length === 0 ? (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center">
              <AlertCircle size={32} className="mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400 font-medium">No hay reservas para mostrar</p>
              <p className="text-gray-500 text-sm mt-1">Intenta cambiar los filtros</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {paginated.map(res => (
                  <div key={res.id} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden hover:border-gray-700 transition-all">
                    <div className="p-4 border-b border-gray-800 flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase border ${statusChip(res.status)}`}>
                            {res.status === 'confirmed' ? '✅ Confirmada' : res.status === 'pending' ? '⏳ Pendiente' : '❌ Cancelada'}
                          </span>
                        </div>
                        <h3 className="font-bold text-sm text-white truncate">{res.tourName}</h3>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(res.date).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-950/50 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="flex items-start gap-2">
                        <Users size={14} className="text-gray-500 mt-1 shrink-0" />
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-bold">Cliente</p>
                          <p className="text-sm font-medium text-white">{res.clientName}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Calendar size={14} className="text-blue-500 mt-1 shrink-0" />
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-bold">Personas</p>
                          <p className="text-sm font-medium text-white">{res.people}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <DollarSign size={14} className="text-green-500 mt-1 shrink-0" />
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-bold">Valor</p>
                          <p className="text-sm font-medium text-white">
                            {res.price ? `$${res.price.toLocaleString('es-CO')}` : '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 border-t border-gray-800 text-xs text-gray-600 text-center font-medium">
                      ID: {res.id}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-gray-500">Página {page} de {totalPages}</div>
                <div className="flex items-center gap-2">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 text-xs bg-gray-800 border border-gray-700 rounded disabled:opacity-50">Anterior</button>
                  <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 text-xs bg-gray-800 border border-gray-700 rounded disabled:opacity-50">Siguiente</button>
                  <select value={pageSize} onChange={e => { setPageSize(parseInt(e.target.value)); setPage(1); }} className="text-xs bg-gray-900 border border-gray-800 rounded px-2 py-1">
                    {[10, 20, 50].map(sz => <option key={sz} value={sz}>{sz}/pág</option>)}
                  </select>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2 — VOUCHERS (Civitatis + GuiaSAI + manuales)
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'vouchers' && (
        <div className="px-4 pt-5 space-y-4">

          {/* Info */}
          <div className="bg-orange-950/30 border border-orange-800/30 rounded-xl px-4 py-3 text-xs text-orange-300">
            Vouchers creados en GuiaSAI, vía Civitatis o manualmente. ID de reserva Civitatis: formato <span className="font-mono">A38417694</span>.
          </div>

          {/* Mini stats */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Total',      value: vStats.total,      color: 'text-white' },
              { label: 'Pendientes', value: vStats.pendiente,  color: 'text-yellow-400' },
              { label: 'Confirm.',   value: vStats.confirmado, color: 'text-green-400' },
              { label: 'Completos',  value: vStats.completado, color: 'text-blue-400' },
            ].map(s => (
              <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-gray-500 uppercase font-bold mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Search + Sort */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={searchVou}
                onChange={e => setSearchVou(e.target.value)}
                placeholder="Buscar por cliente, reserva #, tour…"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:border-orange-500"
              />
            </div>
            <button
              onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
              title={sortOrder === 'asc' ? 'Más antiguos primero' : 'Más recientes primero'}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-800 border border-gray-700 hover:border-orange-500 rounded-xl text-xs font-medium text-gray-300 transition-colors whitespace-nowrap"
            >
              <ArrowUpDown size={14} className="text-orange-400" />
              {sortOrder === 'asc' ? 'Más antiguo' : 'Más reciente'}
            </button>
          </div>

          {/* Voucher list */}
          {loadingVou ? (
            <div className="flex justify-center py-16">
              <Loader2 size={28} className="animate-spin text-orange-400" />
            </div>
          ) : filteredVou.length === 0 ? (
            <div className="text-center text-gray-500 py-16">
              <Ticket size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No hay vouchers aún.</p>
              <button onClick={openNewForm} className="mt-4 text-orange-400 text-sm underline">
                Crear el primero
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredVou.map(v => {
                const cfg: EstadoCfg = VOUCHER_ESTADO_CFG[v.estado] || { label: v.estado, bg: 'bg-gray-800', text: 'text-gray-300', icon: null };
                return (
                  <button
                    key={v.id}
                    onClick={() => setSelected(v)}
                    className="w-full text-left bg-gray-900 border border-gray-800 hover:border-orange-700/50 rounded-2xl p-4 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-semibold text-sm">{v.titular || 'Sin nombre'}</p>
                        {v.reservaNum && (
                          <p className="text-xs text-orange-400 font-mono mt-0.5">#{v.reservaNum}</p>
                        )}
                      </div>
                      <span className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 font-medium mb-2 truncate">{v.tourName || '—'}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      {v.fecha && (
                        <span className="flex items-center gap-1">
                          <Calendar size={11} /> {v.fecha}
                          {v.hora && <span className="ml-1 text-gray-400">{v.hora}</span>}
                        </span>
                      )}
                      {v.pax && <span className="flex items-center gap-1"><Users size={11} /> {v.pax} pax</span>}
                      {v.puntoEncuentro && <span className="flex items-center gap-1"><MapPin size={11} /> {v.puntoEncuentro}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── New Voucher Form Modal ─────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 sticky top-0 bg-gray-900">
              <div className="flex items-center gap-2">
                <Plus size={18} className="text-orange-400" />
                <h2 className="font-bold text-base">Nueva reserva / voucher</h2>
              </div>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-800 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">

              {/* Reserva # */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block font-medium">
                  <Hash size={11} className="inline mr-1" />Reserva # (Civitatis u otro origen)
                </label>
                <input
                  value={form.reservaNum}
                  onChange={e => setField('reservaNum', e.target.value)}
                  placeholder="Ej: A38417694"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500 font-mono"
                />
              </div>

              {/* Servicio */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block font-medium">
                  <Ticket size={11} className="inline mr-1" />Servicio / Tour
                </label>
                {loadingServ ? (
                  <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
                    <Loader2 size={14} className="animate-spin" /> Cargando servicios…
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={form.tourId}
                      onChange={e => handleServicioChange(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm appearance-none focus:outline-none focus:border-orange-500"
                    >
                      <option value="">— Selecciona un servicio —</option>
                      {servicios.map(s => (
                        <option key={s.id} value={s.id}>{s.nombre}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                )}
              </div>

              {/* Titular */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block font-medium">
                  <FileText size={11} className="inline mr-1" />Nombre del cliente *
                </label>
                <input
                  value={form.titular}
                  onChange={e => setField('titular', e.target.value)}
                  placeholder="Nombre completo"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Contacto */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block font-medium">
                    <Phone size={11} className="inline mr-1" />Teléfono
                  </label>
                  <input
                    value={form.telefono}
                    onChange={e => setField('telefono', e.target.value)}
                    placeholder="+57 …"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block font-medium">
                    <Mail size={11} className="inline mr-1" />Email
                  </label>
                  <input
                    value={form.email}
                    onChange={e => setField('email', e.target.value)}
                    placeholder="email@…"
                    type="email"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Fecha / Hora / Pax */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="text-xs text-gray-400 mb-1 block font-medium">
                    <Calendar size={11} className="inline mr-1" />Fecha *
                  </label>
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={e => setField('fecha', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block font-medium">Hora</label>
                  <input
                    type="time"
                    value={form.hora}
                    onChange={e => setField('hora', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block font-medium">
                    <Users size={11} className="inline mr-1" />Pax
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.pax}
                    onChange={e => setField('pax', e.target.value)}
                    placeholder="1"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Punto de encuentro */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block font-medium">
                  <MapPin size={11} className="inline mr-1" />Punto de encuentro
                </label>
                <div className="relative">
                  <select
                    value={form.puntoEncuentro}
                    onChange={e => setField('puntoEncuentro', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm appearance-none focus:outline-none focus:border-orange-500"
                  >
                    <option value="">— Selecciona —</option>
                    {PUNTOS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* Estado */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block font-medium">Estado</label>
                <div className="flex gap-2 flex-wrap">
                  {ESTADOS_VOUCHER.map(e => {
                    const cfg: EstadoCfg = VOUCHER_ESTADO_CFG[e] || { label: e, bg: 'bg-gray-800', text: 'text-gray-300', icon: null };
                    const active = form.estado === e;
                    return (
                      <button
                        key={e}
                        type="button"
                        onClick={() => setField('estado', e)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          active ? `${cfg.bg} ${cfg.text} border-current` : 'border-gray-700 text-gray-500 hover:border-gray-500'
                        }`}
                      >
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block font-medium">Observaciones del cliente</label>
                <textarea
                  value={form.observaciones}
                  onChange={e => setField('observaciones', e.target.value)}
                  rows={3}
                  placeholder="Necesidades especiales, alergias…"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Notas internas */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block font-medium">Notas internas</label>
                <textarea
                  value={form.notasAdicionales}
                  onChange={e => setField('notasAdicionales', e.target.value)}
                  rows={2}
                  placeholder="Notas para el operador…"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-orange-500"
                />
              </div>

              {saveError && (
                <div className="bg-red-900/40 border border-red-700/50 rounded-xl px-4 py-3 text-sm text-red-300">
                  {saveError}
                </div>
              )}
              {saveOk && (
                <div className="bg-green-900/40 border border-green-700/50 rounded-xl px-4 py-3 text-sm text-green-300 flex items-center gap-2">
                  <CheckCircle2 size={15} /> Reserva creada correctamente
                </div>
              )}

              <div className="flex gap-3 pt-2 pb-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-700 text-sm text-gray-400 hover:bg-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  {saving ? 'Guardando…' : 'Crear reserva'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Voucher Detail Modal ───────────────────────────────────────────── */}
      {selectedVoucher && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto">

            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 sticky top-0 bg-gray-900">
              <div>
                <h2 className="font-bold text-base">{selectedVoucher.titular}</h2>
                {selectedVoucher.reservaNum && (
                  <p className="text-xs text-orange-400 font-mono">#{selectedVoucher.reservaNum}</p>
                )}
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-gray-800 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3 text-sm">

              {selectedVoucher.tourName && (
                <div className="bg-orange-950/40 border border-orange-800/30 rounded-xl px-4 py-3">
                  <p className="text-xs text-orange-400 font-medium mb-0.5">Tour / Servicio</p>
                  <p className="font-semibold">{selectedVoucher.tourName}</p>
                </div>
              )}

              {(() => {
                const cfg: EstadoCfg = VOUCHER_ESTADO_CFG[selectedVoucher.estado] || { label: selectedVoucher.estado, bg: 'bg-gray-800', text: 'text-gray-300', icon: null };
                return (
                  <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${cfg.bg}`}>
                    {cfg.icon}
                    <span className={`font-medium ${cfg.text}`}>{cfg.label}</span>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-3">
                {selectedVoucher.fecha && (
                  <div className="bg-gray-800 rounded-xl px-3 py-2.5">
                    <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1"><Calendar size={10} /> Fecha</p>
                    <p className="font-medium">{selectedVoucher.fecha}</p>
                    {selectedVoucher.hora && <p className="text-xs text-gray-400">{selectedVoucher.hora}</p>}
                  </div>
                )}
                {selectedVoucher.pax && (
                  <div className="bg-gray-800 rounded-xl px-3 py-2.5">
                    <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1"><Users size={10} /> Personas</p>
                    <p className="font-medium">{selectedVoucher.pax}</p>
                  </div>
                )}
                {selectedVoucher.puntoEncuentro && (
                  <div className="bg-gray-800 rounded-xl px-3 py-2.5 col-span-2">
                    <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1"><MapPin size={10} /> Punto de encuentro</p>
                    <p className="font-medium text-xs">{selectedVoucher.puntoEncuentro}</p>
                  </div>
                )}
              </div>

              {(selectedVoucher.telefono || selectedVoucher.email) && (
                <div className="bg-gray-800 rounded-xl px-4 py-3 space-y-1">
                  <p className="text-xs text-gray-500 font-medium mb-1">Contacto</p>
                  {selectedVoucher.telefono && (
                    <p className="flex items-center gap-2 text-xs">
                      <Phone size={11} className="text-gray-500" />
                      <a href={`tel:${selectedVoucher.telefono}`} className="text-blue-400 hover:underline">{selectedVoucher.telefono}</a>
                    </p>
                  )}
                  {selectedVoucher.email && (
                    <p className="flex items-center gap-2 text-xs">
                      <Mail size={11} className="text-gray-500" />
                      <a href={`mailto:${selectedVoucher.email}`} className="text-blue-400 hover:underline">{selectedVoucher.email}</a>
                    </p>
                  )}
                </div>
              )}

              {selectedVoucher.observaciones && (
                <div className="bg-amber-950/30 border border-amber-800/30 rounded-xl px-4 py-3">
                  <p className="text-xs text-amber-400 font-medium mb-1">Observaciones</p>
                  <p className="text-xs text-gray-300 whitespace-pre-wrap">{selectedVoucher.observaciones}</p>
                </div>
              )}

              {selectedVoucher.notasAdicionales && (
                <div className="bg-gray-800 rounded-xl px-4 py-3">
                  <p className="text-xs text-gray-500 font-medium mb-1">Notas internas</p>
                  <p className="text-xs text-gray-300 whitespace-pre-wrap">{selectedVoucher.notasAdicionales}</p>
                </div>
              )}

              <button
                onClick={() => setSelected(null)}
                className="w-full py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-sm font-medium transition-colors mt-2"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReservations;

import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft, Search, Package, Users, Globe, FileText,
  Building2, MessageCircle, ToggleLeft, ToggleRight,
  Mail, Loader2, AlertCircle, RefreshCw, Plus,
  MapPin, Clock, CheckCircle2, XCircle, Hotel,
  Home, Tent, BedDouble, Tag, ChevronDown, ChevronUp,
  DollarSign, Edit3, TrendingUp, Info,
} from 'lucide-react';
import { AppRoute } from '../../types';
import { getServices, getAllLeads } from '../../services/airtableService';
import { getCotizaciones } from '../../services/quotesService';

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'catalogo' | 'channels' | 'crm' | 'cotizaciones' | 'tarifas';
type ServiceCategory = 'all' | 'tour' | 'hotel' | 'taxi' | 'package';

interface Service {
  id: string;
  title: string;
  name: string;
  category: string;
  type: string;
  tipoServicio?: string;
  accommodationType?: string;
  price: number;
  image: string;
  description: string;
  location: string;
  duration?: string;
  active?: boolean;
  rating?: number;
}

interface ChannelConfig {
  b2c: boolean;
  b2b: boolean;
  whatsapp: boolean;
}

const CHANNEL_KEY = 'guanago_channels_v1';
const loadChannels = (): Record<string, ChannelConfig> => {
  try { return JSON.parse(localStorage.getItem(CHANNEL_KEY) || '{}'); } catch { return {}; }
};
const saveChannels = (d: Record<string, ChannelConfig>) => localStorage.setItem(CHANNEL_KEY, JSON.stringify(d));

// ─── TRM (Tasa Representativa del Mercado) ────────────────────────────────────
const TRM_KEY = 'guanago_trm_v1';
const TRM_DEFAULT = 4200;
const loadTrm = (): number => {
  try { const v = parseFloat(localStorage.getItem(TRM_KEY) || ''); return v > 0 ? v : TRM_DEFAULT; } catch { return TRM_DEFAULT; }
};
const saveTrm = (v: number) => localStorage.setItem(TRM_KEY, String(v));

// Fórmula de tarifa para agencias en USD:
//   precio_agencia_cop = precio_cop * 1.10  (colchón 10% por volatilidad)
//   precio_usd = precio_agencia_cop / TRM
const BUFFER_FACTOR = 1.10;
const calcAgenciaCOP = (precioCOP: number) => Math.ceil(precioCOP * BUFFER_FACTOR);
const calcAgenciaUSD = (precioCOP: number, trm: number) =>
  trm > 0 ? (precioCOP * BUFFER_FACTOR) / trm : 0;

// ─── Category & accommodation config ─────────────────────────────────────────
const CAT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  tour:    { label: 'Tour',      color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
  hotel:   { label: 'Alojamiento', color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
  taxi:    { label: 'Traslado',  color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
  package: { label: 'Paquete',   color: '#c084fc', bg: 'rgba(192,132,252,0.15)' },
  default: { label: 'Servicio',  color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
};

// Normaliza tipos de alojamiento al valor canónico
const normalizeAccomType = (raw: string): string => {
  const v = (raw || '').toLowerCase().trim();
  if (v.includes('apart') && v.includes('hotel')) return 'Aparta Hotel';
  if (v.includes('apart')) return 'Apartamento';
  if (v.includes('hotel')) return 'Hotel';
  if (v.includes('habitac') || v.includes('room')) return 'Habitación';
  if (v.includes('caba') || v.includes('villa')) return 'Cabaña / Villa';
  if (v.includes('hostal') || v.includes('hostel')) return 'Hostal';
  if (v.includes('casa')) return 'Casa';
  return raw || 'Otro';
};

const ACCOM_COLORS: Record<string, { color: string; bg: string }> = {
  'Hotel':         { color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
  'Aparta Hotel':  { color: '#818cf8', bg: 'rgba(129,140,248,0.15)' },
  'Apartamento':   { color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
  'Habitación':    { color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
  'Cabaña / Villa':{ color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
  'Hostal':        { color: '#fb923c', bg: 'rgba(249,115,22,0.15)' },
  'Casa':          { color: '#f472b6', bg: 'rgba(244,114,182,0.15)' },
  'Otro':          { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
};

const catOf = (s: Service) => CAT_CONFIG[s.category] ?? CAT_CONFIG.default;

// ─── Lead status colors ───────────────────────────────────────────────────────
const ROLE_COLOR: Record<string, string> = {
  SuperAdmin: '#f472b6', admin: '#f87171', Socio: '#fbbf24',
  Turista: '#34d399', Local: '#22d3ee', Artista: '#c084fc', default: '#94a3b8',
};

const LEAD_STATUS_COLOR: Record<string, { color: string; bg: string }> = {
  'Prospecto':   { color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
  'Contactado':  { color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
  'Interesado':  { color: '#fb923c', bg: 'rgba(249,115,22,0.15)' },
  'Cliente':     { color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
  'Inactivo':    { color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
  'Recurrente':  { color: '#c084fc', bg: 'rgba(192,132,252,0.15)' },
};

// Campos de Airtable que NO queremos mostrar en el panel raw (ya se muestran en campos fijos)
const HIDDEN_RAW = new Set([
  'Nombre', 'nombre', 'Email', 'email', 'Telefono', 'telefono', 'Phone',
  'WhatsApp', 'Whatsapp', 'Role', 'Rol', 'Saldo_GUANA', 'Saldo GUANA',
  'Puntos_Acumulados', 'Puntos Acumulados', 'Puntos_Canjeados', 'Puntos Canjeados',
  'Guana_ID', 'ID_Usuario', 'Verificado', 'Fecha',
]);

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props {
  onBack: () => void;
  onNavigate: (route: AppRoute, data?: any) => void;
}

export default function AdminOperaciones({ onBack, onNavigate }: Props) {
  const [tab, setTab] = useState<Tab>('catalogo');

  // ── Catálogo ──
  const [services, setServices]     = useState<Service[]>([]);
  const [svcLoading, setSvcLoading] = useState(true);
  const [svcError, setSvcError]     = useState('');
  const [svcSearch, setSvcSearch]   = useState('');
  const [svcCat, setSvcCat]         = useState<ServiceCategory>('all');
  const [accomType, setAccomType]   = useState<string>('all');

  // ── Channel ──
  const [channels, setChannels]         = useState<Record<string, ChannelConfig>>(loadChannels);
  const [channelsDirty, setChannelsDirty] = useState(false);

  // ── CRM ──
  const [leads, setLeads]             = useState<any[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsError, setLeadsError]   = useState('');
  const [leadsSearch, setLeadsSearch] = useState('');
  const [leadStatus, setLeadStatus]   = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<any | null>(null);

  // ── Quotes ──
  const [quotes, setQuotes]           = useState<any[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(false);

  // ── Tarifas Agencias ──
  const [trm, setTrm]                 = useState<number>(loadTrm);
  const [trmInput, setTrmInput]       = useState<string>(String(loadTrm()));
  const [trmEditing, setTrmEditing]   = useState(false);
  const [tarifasSearch, setTarifasSearch] = useState('');

  // ── Load per tab ──
  useEffect(() => {
    if ((tab === 'catalogo' || tab === 'channels' || tab === 'tarifas') && services.length === 0) fetchServices();
    if (tab === 'crm' && leads.length === 0) fetchLeads();
    if (tab === 'cotizaciones' && quotes.length === 0) fetchQuotes();
  }, [tab]);

  const fetchServices = async () => {
    setSvcLoading(true); setSvcError('');
    try {
      const data = await getServices();
      setServices((data || []).map((s: any) => ({
        ...s,
        active: s.active !== false,
        accommodationType: s.accommodationType ? normalizeAccomType(s.accommodationType) : '',
      })));
    } catch { setSvcError('No se pudo cargar el catálogo'); }
    finally { setSvcLoading(false); }
  };

  const fetchLeads = async () => {
    setLeadsLoading(true); setLeadsError('');
    try { setLeads((await getAllLeads(150)) || []); }
    catch { setLeadsError('No se pudo cargar el CRM'); }
    finally { setLeadsLoading(false); }
  };

  const fetchQuotes = async () => {
    setQuotesLoading(true);
    try { setQuotes((await getCotizaciones()) || []); } catch { setQuotes([]); }
    finally { setQuotesLoading(false); }
  };

  // ── Filtered services ──
  const accomTypes = useMemo(() => {
    const types = new Set<string>();
    services.filter(s => s.category === 'hotel' && s.accommodationType).forEach(s => types.add(s.accommodationType!));
    return Array.from(types).sort();
  }, [services]);

  const filteredServices = useMemo(() => {
    return services.filter(s => {
      const matchCat = svcCat === 'all' || s.category === svcCat;
      const matchAccom = svcCat !== 'hotel' || accomType === 'all' || s.accommodationType === accomType;
      const q = svcSearch.toLowerCase();
      const matchQ = !q || (s.title + s.name + s.type + s.location + (s.accommodationType || '')).toLowerCase().includes(q);
      return matchCat && matchAccom && matchQ;
    });
  }, [services, svcCat, accomType, svcSearch]);

  const catCounts = useMemo(() => {
    const c: Record<string, number> = { all: services.length };
    services.forEach(s => { c[s.category] = (c[s.category] || 0) + 1; });
    return c;
  }, [services]);

  // ── Filtered leads ──
  const leadStatuses = useMemo(() => {
    const s = new Set<string>();
    leads.forEach(l => {
      const st = l._raw?.Estado_Lead || l._raw?.['Estado Lead'] || l._raw?.Estado || l._raw?.Status || '';
      if (st) s.add(st);
    });
    return Array.from(s).sort();
  }, [leads]);

  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      const q = leadsSearch.toLowerCase();
      const matchQ = !q || (l.nombre + l.email + l.telefono + l.role + (l._raw?.Origen || '') + (l._raw?.Canal || '')).toLowerCase().includes(q);
      const st = l._raw?.Estado_Lead || l._raw?.['Estado Lead'] || l._raw?.Estado || l._raw?.Status || '';
      const matchSt = leadStatus === 'all' || st === leadStatus;
      return matchQ && matchSt;
    });
  }, [leads, leadsSearch, leadStatus]);

  // ── TRM helpers ──
  const saveTrmValue = () => {
    const v = parseFloat(trmInput);
    if (v > 0) { setTrm(v); saveTrm(v); }
    setTrmEditing(false);
  };

  const filteredTarifas = useMemo(() => {
    const q = tarifasSearch.toLowerCase();
    return services.filter(s => !q || (s.title + s.name + s.category).toLowerCase().includes(q));
  }, [services, tarifasSearch]);

  // ── Channel helpers ──
  const getChannel = (id: string): ChannelConfig => channels[id] ?? { b2c: true, b2b: false, whatsapp: false };
  const toggleChannel = (id: string, key: keyof ChannelConfig) => {
    const cur = getChannel(id);
    setChannels(prev => ({ ...prev, [id]: { ...cur, [key]: !cur[key] } }));
    setChannelsDirty(true);
  };

  // ── Tab button ──
  const TabBtn = ({ id, label, icon }: { id: Tab; label: string; icon: React.ReactNode }) => (
    <button
      onClick={() => setTab(id)}
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all flex-shrink-0"
      style={{
        background: tab === id ? 'rgba(52,211,153,0.15)' : 'transparent',
        color: tab === id ? '#34d399' : '#64748b',
        border: tab === id ? '1px solid rgba(52,211,153,0.3)' : '1px solid transparent',
      }}
    >
      {icon} {label}
    </button>
  );

  // ── Raw fields display for lead detail ──
  const RawField = ({ label, value }: { label: string; value: any }) => {
    if (!value || value === '' || value === 0 || (Array.isArray(value) && value.length === 0)) return null;
    const display = Array.isArray(value) ? value.join(', ') : String(value);
    return (
      <div>
        <p style={{ color: '#475569', fontSize: 10 }}>{label}</p>
        <p className="font-medium text-white" style={{ fontSize: 12 }}>{display}</p>
      </div>
    );
  };

  // ─── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-24" style={{ background: '#020617', color: '#e2e8f0' }}>

      {/* Header */}
      <div style={{ background: '#0a0f1e', borderBottom: '1px solid #1e293b', position: 'sticky', top: 0, zIndex: 20 }}>
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm" style={{ color: '#64748b' }}>
            <ArrowLeft size={16} /> Volver
          </button>
          <div className="flex-1">
            <h1 className="font-black text-base text-white">Operaciones</h1>
            <p className="text-xs" style={{ color: '#64748b' }}>Catálogo · Channels · CRM · Cotizaciones</p>
          </div>
          <button
            onClick={() => onNavigate(AppRoute.ADMIN_QUOTES)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold"
            style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399' }}
          >
            <Plus size={13} /> Cotización
          </button>
        </div>
        <div className="flex gap-1 px-4 pb-3 overflow-x-auto no-scrollbar">
          <TabBtn id="catalogo"     label="Catálogo"    icon={<Package size={13} />} />
          <TabBtn id="channels"     label="Channels"    icon={<Globe size={13} />} />
          <TabBtn id="crm"          label="CRM"          icon={<Users size={13} />} />
          <TabBtn id="cotizaciones" label="Cotizaciones" icon={<FileText size={13} />} />
          <TabBtn id="tarifas"      label="Tarifas USD"  icon={<DollarSign size={13} />} />
        </div>
      </div>

      {/* ════════════════════════════════════════════
          CATÁLOGO
      ════════════════════════════════════════════ */}
      {tab === 'catalogo' && (
        <div className="px-4 pt-4">

          {/* Search */}
          <div className="flex gap-2 mb-3">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: '#0f172a', border: '1px solid #1e293b' }}>
              <Search size={14} style={{ color: '#475569' }} />
              <input value={svcSearch} onChange={e => setSvcSearch(e.target.value)} placeholder="Buscar servicio..."
                className="flex-1 bg-transparent text-sm outline-none" style={{ color: '#e2e8f0' }} />
            </div>
            <button onClick={fetchServices} className="p-2.5 rounded-xl" style={{ background: '#0f172a', border: '1px solid #1e293b', color: '#64748b' }}>
              <RefreshCw size={15} />
            </button>
          </div>

          {/* Tipo de servicio pills */}
          <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
            {(['all', 'tour', 'hotel', 'taxi', 'package'] as ServiceCategory[]).map(cat => {
              const cfg = cat === 'all' ? { label: 'Todos', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' } : CAT_CONFIG[cat];
              const active = svcCat === cat;
              return (
                <button key={cat}
                  onClick={() => { setSvcCat(cat); setAccomType('all'); }}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{ background: active ? cfg.bg : 'transparent', color: active ? cfg.color : '#475569', border: `1px solid ${active ? cfg.color + '50' : '#1e293b'}` }}>
                  {cfg.label} ({catCounts[cat] ?? 0})
                </button>
              );
            })}
          </div>

          {/* Sub-tipo alojamiento — solo cuando svcCat === 'hotel' */}
          {svcCat === 'hotel' && accomTypes.length > 0 && (
            <div className="mb-4 rounded-xl p-3" style={{ background: '#0a1628', border: '1px solid rgba(96,165,250,0.2)' }}>
              <p className="text-[10px] font-bold uppercase mb-2" style={{ color: '#475569' }}>Tipo de alojamiento</p>
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setAccomType('all')}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{ background: accomType === 'all' ? 'rgba(96,165,250,0.2)' : 'transparent', color: accomType === 'all' ? '#60a5fa' : '#475569', border: `1px solid ${accomType === 'all' ? 'rgba(96,165,250,0.4)' : '#1e293b'}` }}>
                  Todos ({services.filter(s => s.category === 'hotel').length})
                </button>
                {accomTypes.map(t => {
                  const cfg = ACCOM_COLORS[t] ?? ACCOM_COLORS['Otro'];
                  const count = services.filter(s => s.category === 'hotel' && s.accommodationType === t).length;
                  return (
                    <button key={t}
                      onClick={() => setAccomType(t)}
                      className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold"
                      style={{ background: accomType === t ? cfg.bg : 'transparent', color: accomType === t ? cfg.color : '#475569', border: `1px solid ${accomType === t ? cfg.color + '50' : '#1e293b'}` }}>
                      {t} ({count})
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {svcLoading && (
            <div className="flex items-center justify-center py-16 gap-3">
              <Loader2 size={24} className="animate-spin" style={{ color: '#34d399' }} />
              <span className="text-sm" style={{ color: '#64748b' }}>Cargando catálogo desde Airtable...</span>
            </div>
          )}
          {svcError && !svcLoading && (
            <div className="flex items-center gap-3 p-4 rounded-xl mb-4" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
              <span className="text-sm text-red-300 flex-1">{svcError}</span>
              <button onClick={fetchServices} className="text-xs text-red-400 underline">Reintentar</button>
            </div>
          )}

          {!svcLoading && !svcError && (
            <>
              <p className="text-xs mb-3" style={{ color: '#475569' }}>{filteredServices.length} servicios</p>
              <div className="space-y-3">
                {filteredServices.map(s => {
                  const cfg = catOf(s);
                  const accomCfg = s.accommodationType ? ACCOM_COLORS[s.accommodationType] ?? ACCOM_COLORS['Otro'] : null;
                  return (
                    <div key={s.id} className="rounded-xl overflow-hidden" style={{ background: '#0f172a', border: '1px solid #1e293b' }}>
                      <div className="flex gap-3 p-3">
                        <div className="flex-shrink-0 rounded-xl overflow-hidden" style={{ width: 72, height: 72 }}>
                          {s.image
                            ? <img src={s.image} alt={s.title} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center" style={{ background: cfg.bg }}>
                                <Package size={24} style={{ color: cfg.color }} />
                              </div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2 mb-1">
                            <p className="font-bold text-sm leading-tight text-white flex-1 truncate">{s.title || s.name}</p>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                              {s.accommodationType && accomCfg && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: accomCfg.bg, color: accomCfg.color }}>{s.accommodationType}</span>
                              )}
                            </div>
                          </div>
                          {s.description && <p className="text-xs line-clamp-1 mb-1" style={{ color: '#64748b' }}>{s.description}</p>}
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-black text-sm" style={{ color: '#34d399' }}>${(s.price || 0).toLocaleString()} COP</span>
                            {s.location && <span className="flex items-center gap-1 text-[10px]" style={{ color: '#475569' }}><MapPin size={10} />{s.location}</span>}
                            {s.duration && <span className="flex items-center gap-1 text-[10px]" style={{ color: '#475569' }}><Clock size={10} />{s.duration}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between px-3 py-2" style={{ borderTop: '1px solid #1e293b' }}>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ background: s.active !== false ? '#22c55e' : '#6b7280' }} />
                          <span className="text-[11px]" style={{ color: s.active !== false ? '#22c55e' : '#6b7280' }}>
                            {s.active !== false ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        <button onClick={() => onNavigate(AppRoute.ADMIN_QUOTES)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold"
                          style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }}>
                          <FileText size={11} /> Cotizar
                        </button>
                      </div>
                    </div>
                  );
                })}
                {filteredServices.length === 0 && (
                  <div className="text-center py-12">
                    <Package size={36} className="mx-auto mb-3 opacity-30" style={{ color: '#475569' }} />
                    <p className="text-sm" style={{ color: '#475569' }}>Sin servicios con ese filtro</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════
          CHANNEL MANAGER
      ════════════════════════════════════════════ */}
      {tab === 'channels' && (
        <div className="px-4 pt-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-bold text-sm text-white">Channel Manager</h2>
              <p className="text-xs mt-0.5" style={{ color: '#475569' }}>Define en qué canales se vende cada servicio</p>
            </div>
            {channelsDirty && (
              <button onClick={() => { saveChannels(channels); setChannelsDirty(false); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold"
                style={{ background: 'rgba(52,211,153,0.2)', color: '#34d399', border: '1px solid rgba(52,211,153,0.4)' }}>
                <CheckCircle2 size={13} /> Guardar
              </button>
            )}
          </div>

          <div className="flex gap-4 mb-4 text-xs">
            {[{ icon: <Globe size={12} />, label: 'B2C Web', color: '#60a5fa' },
              { icon: <Building2 size={12} />, label: 'B2B Agencias', color: '#fbbf24' },
              { icon: <MessageCircle size={12} />, label: 'WhatsApp', color: '#4ade80' }].map(c => (
              <span key={c.label} className="flex items-center gap-1" style={{ color: c.color }}>{c.icon}{c.label}</span>
            ))}
          </div>

          {svcLoading ? (
            <div className="flex items-center justify-center py-16 gap-3">
              <Loader2 size={24} className="animate-spin" style={{ color: '#34d399' }} />
              <span className="text-sm" style={{ color: '#64748b' }}>Cargando servicios...</span>
            </div>
          ) : (
            <div className="space-y-2">
              {services.map(s => {
                const ch = getChannel(s.id);
                const cfg = catOf(s);
                const accomCfg = s.accommodationType ? ACCOM_COLORS[s.accommodationType] ?? ACCOM_COLORS['Otro'] : null;
                return (
                  <div key={s.id} className="rounded-xl p-3" style={{ background: '#0f172a', border: '1px solid #1e293b' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                      {s.accommodationType && accomCfg && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: accomCfg.bg, color: accomCfg.color }}>{s.accommodationType}</span>
                      )}
                      <p className="font-semibold text-sm text-white truncate flex-1">{s.title || s.name}</p>
                      <span className="text-xs font-black" style={{ color: '#34d399' }}>${(s.price || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex gap-4">
                      {([['b2c', 'B2C Web', '#60a5fa'], ['b2b', 'B2B', '#fbbf24'], ['whatsapp', 'WhatsApp', '#4ade80']] as [keyof ChannelConfig, string, string][]).map(([key, label, color]) => (
                        <button key={key} onClick={() => toggleChannel(s.id, key)} className="flex items-center gap-1.5">
                          {ch[key]
                            ? <ToggleRight size={22} style={{ color }} />
                            : <ToggleLeft size={22} style={{ color: '#334155' }} />}
                          <span className="text-[11px] font-medium" style={{ color: ch[key] ? color : '#475569' }}>{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {channelsDirty && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
              <button onClick={() => { saveChannels(channels); setChannelsDirty(false); }}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm shadow-2xl"
                style={{ background: '#34d399', color: '#022c22' }}>
                <CheckCircle2 size={16} /> Guardar configuración de canales
              </button>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════
          CRM
      ════════════════════════════════════════════ */}
      {tab === 'crm' && (
        <div className="px-4 pt-4">

          {/* Search + refresh */}
          <div className="flex gap-2 mb-3">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: '#0f172a', border: '1px solid #1e293b' }}>
              <Search size={14} style={{ color: '#475569' }} />
              <input value={leadsSearch} onChange={e => setLeadsSearch(e.target.value)}
                placeholder="Nombre, email, origen, canal..."
                className="flex-1 bg-transparent text-sm outline-none" style={{ color: '#e2e8f0' }} />
            </div>
            <button onClick={fetchLeads} className="p-2.5 rounded-xl" style={{ background: '#0f172a', border: '1px solid #1e293b', color: '#64748b' }}>
              <RefreshCw size={15} />
            </button>
          </div>

          {/* Estado lead filter */}
          {leadStatuses.length > 0 && (
            <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
              <button onClick={() => setLeadStatus('all')}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ background: leadStatus === 'all' ? 'rgba(148,163,184,0.2)' : 'transparent', color: leadStatus === 'all' ? '#94a3b8' : '#475569', border: `1px solid ${leadStatus === 'all' ? '#475569' : '#1e293b'}` }}>
                Todos ({leads.length})
              </button>
              {leadStatuses.map(st => {
                const cfg = LEAD_STATUS_COLOR[st] ?? { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' };
                const cnt = leads.filter(l => (l._raw?.Estado_Lead || l._raw?.['Estado Lead'] || l._raw?.Estado || l._raw?.Status) === st).length;
                return (
                  <button key={st} onClick={() => setLeadStatus(st)}
                    className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold"
                    style={{ background: leadStatus === st ? cfg.bg : 'transparent', color: leadStatus === st ? cfg.color : '#475569', border: `1px solid ${leadStatus === st ? cfg.color + '50' : '#1e293b'}` }}>
                    {st} ({cnt})
                  </button>
                );
              })}
            </div>
          )}

          {leadsLoading && (
            <div className="flex items-center justify-center py-16 gap-3">
              <Loader2 size={24} className="animate-spin" style={{ color: '#34d399' }} />
              <span className="text-sm" style={{ color: '#64748b' }}>Cargando leads desde Airtable...</span>
            </div>
          )}
          {leadsError && !leadsLoading && (
            <div className="flex items-center gap-3 p-4 rounded-xl mb-4" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
              <span className="text-sm text-red-300 flex-1">{leadsError}</span>
              <button onClick={fetchLeads} className="text-xs text-red-400 underline">Reintentar</button>
            </div>
          )}

          {!leadsLoading && !leadsError && (
            <>
              <p className="text-xs mb-3" style={{ color: '#475569' }}>{filteredLeads.length} leads</p>

              {/* Lead detail panel */}
              {selectedLead && (
                <div className="rounded-2xl p-4 mb-4" style={{ background: '#0c1628', border: '1px solid rgba(52,211,153,0.3)' }}>
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl flex-shrink-0"
                      style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}>
                      {(selectedLead.nombre || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-white text-base">{selectedLead.nombre || 'Sin nombre'}</p>
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(52,211,153,0.08)', color: ROLE_COLOR[selectedLead.role] || ROLE_COLOR.default }}>
                          {selectedLead.role || 'Turista'}
                        </span>
                        {(() => {
                          const st = selectedLead._raw?.Estado_Lead || selectedLead._raw?.['Estado Lead'] || selectedLead._raw?.Estado;
                          if (!st) return null;
                          const cfg = LEAD_STATUS_COLOR[st] ?? { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' };
                          return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>{st}</span>;
                        })()}
                        {selectedLead.verificado && <span className="text-[10px] font-bold" style={{ color: '#22c55e' }}>✓ verificado</span>}
                      </div>
                    </div>
                    <button onClick={() => setSelectedLead(null)} style={{ color: '#475569' }}>
                      <XCircle size={18} />
                    </button>
                  </div>

                  {/* Fixed fields */}
                  <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                    <RawField label="Email" value={selectedLead.email} />
                    <RawField label="Teléfono" value={selectedLead.telefono} />
                    <RawField label="WhatsApp" value={selectedLead.whatsapp !== selectedLead.telefono ? selectedLead.whatsapp : undefined} />
                    <RawField label="Nivel GuanaGO" value={selectedLead.nivel} />
                    <RawField label="GuanaPoints" value={selectedLead.saldoGuana > 0 ? `${selectedLead.saldoGuana.toLocaleString()} pts` : undefined} />
                    <RawField label="Registro" value={selectedLead.fechaRegistro ? new Date(selectedLead.fechaRegistro).toLocaleDateString('es-CO') : undefined} />
                  </div>

                  {/* Dynamic raw fields from Airtable */}
                  {selectedLead._raw && (() => {
                    const extraFields = Object.entries(selectedLead._raw)
                      .filter(([k, v]) => !HIDDEN_RAW.has(k) && v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0))
                      .map(([k, v]) => ({ key: k, value: v }));

                    if (extraFields.length === 0) return null;
                    return (
                      <div className="mb-4">
                        <p className="text-[10px] font-bold uppercase mb-2" style={{ color: '#334155' }}>Datos adicionales (Airtable)</p>
                        <div className="grid grid-cols-2 gap-3 text-xs p-3 rounded-xl" style={{ background: '#0a1220' }}>
                          {extraFields.map(({ key, value }) => (
                            <RawField key={key} label={key.replace(/_/g, ' ')} value={value} />
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {selectedLead.email && (
                      <a href={`mailto:${selectedLead.email}`}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold"
                        style={{ background: 'rgba(96,165,250,0.12)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.25)' }}>
                        <Mail size={13} /> Email
                      </a>
                    )}
                    {selectedLead.whatsapp && (
                      <a href={`https://wa.me/${String(selectedLead.whatsapp).replace(/\D/g, '')}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold"
                        style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.25)' }}>
                        <MessageCircle size={13} /> WhatsApp
                      </a>
                    )}
                    <button onClick={() => onNavigate(AppRoute.ADMIN_QUOTES)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold"
                      style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }}>
                      <FileText size={13} /> Cotizar
                    </button>
                  </div>
                </div>
              )}

              {/* Leads list */}
              <div className="space-y-2">
                {filteredLeads.map(lead => {
                  const raw = lead._raw || {};
                  const origen = raw.Origen || raw.Canal || raw.Source || raw['Canal de origen'] || '';
                  const estado = raw.Estado_Lead || raw['Estado Lead'] || raw.Estado || raw.Status || '';
                  const stCfg = estado ? (LEAD_STATUS_COLOR[estado] ?? { color: '#94a3b8', bg: '' }) : null;
                  const isSelected = selectedLead?.id === lead.id;

                  return (
                    <button key={lead.id}
                      onClick={() => setSelectedLead(isSelected ? null : lead)}
                      className="w-full text-left rounded-xl p-3 transition-all"
                      style={{ background: isSelected ? 'rgba(52,211,153,0.05)' : '#0f172a', border: `1px solid ${isSelected ? 'rgba(52,211,153,0.25)' : '#1e293b'}` }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black flex-shrink-0"
                          style={{ background: 'rgba(52,211,153,0.08)', color: '#34d399', fontSize: 15 }}>
                          {(lead.nombre || '?')[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-bold text-sm text-white truncate">{lead.nombre || 'Sin nombre'}</p>
                            {estado && stCfg && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                                style={{ background: stCfg.bg || 'rgba(148,163,184,0.1)', color: stCfg.color }}>{estado}</span>
                            )}
                          </div>
                          <p className="text-xs truncate" style={{ color: '#64748b' }}>
                            {lead.email || lead.telefono || '—'}
                            {origen ? <span style={{ color: '#334155' }}> · {origen}</span> : ''}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: 'rgba(52,211,153,0.06)', color: ROLE_COLOR[lead.role] || ROLE_COLOR.default }}>
                            {lead.role || 'Turista'}
                          </span>
                          {lead.saldoGuana > 0 && (
                            <span className="text-[10px] font-black" style={{ color: '#fbbf24' }}>{lead.saldoGuana.toLocaleString()} pts</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
                {filteredLeads.length === 0 && (
                  <div className="text-center py-12">
                    <Users size={36} className="mx-auto mb-3 opacity-30" style={{ color: '#475569' }} />
                    <p className="text-sm" style={{ color: '#475569' }}>
                      {leadsSearch || leadStatus !== 'all' ? 'Sin resultados' : 'No hay leads registrados'}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════
          COTIZACIONES
      ════════════════════════════════════════════ */}
      {tab === 'cotizaciones' && (
        <div className="px-4 pt-4">
          <button onClick={() => onNavigate(AppRoute.ADMIN_QUOTES)}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base mb-5"
            style={{ background: 'linear-gradient(135deg, rgba(52,211,153,0.18), rgba(34,211,238,0.12))', border: '1px solid rgba(52,211,153,0.35)', color: '#34d399' }}>
            <Plus size={18} /> Crear nueva cotización / voucher
          </button>

          <h3 className="font-bold text-sm mb-3 text-white">Cotizaciones recientes</h3>

          {quotesLoading ? (
            <div className="flex items-center justify-center py-12 gap-3">
              <Loader2 size={22} className="animate-spin" style={{ color: '#34d399' }} />
              <span className="text-sm" style={{ color: '#64748b' }}>Cargando...</span>
            </div>
          ) : (
            <div className="space-y-2">
              {quotes.slice(0, 20).map((q: any) => {
                const SC: Record<string, string> = { borrador: '#64748b', enviada: '#60a5fa', aceptada: '#22c55e', rechazada: '#ef4444', vencida: '#f59e0b' };
                const st = q.estado || q.status || 'borrador';
                return (
                  <button key={q.id} onClick={() => onNavigate(AppRoute.ADMIN_QUOTES)}
                    className="w-full text-left rounded-xl p-3" style={{ background: '#0f172a', border: '1px solid #1e293b' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(52,211,153,0.08)' }}>
                        <FileText size={16} style={{ color: '#34d399' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-white truncate">{q.nombre || q.clientName || 'Sin nombre'}</p>
                        <p className="text-xs" style={{ color: '#64748b' }}>
                          {q.id?.substring(0, 10)} · {q.fechaInicio ? new Date(q.fechaInicio).toLocaleDateString('es-CO') : '—'}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs font-black" style={{ color: '#34d399' }}>${(q.precioTotal || 0).toLocaleString()}</span>
                        <span className="text-[10px] font-bold capitalize px-2 py-0.5 rounded-full"
                          style={{ background: `${SC[st] || '#64748b'}20`, color: SC[st] || '#64748b' }}>{st}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
              {quotes.length === 0 && (
                <div className="text-center py-12">
                  <FileText size={36} className="mx-auto mb-3 opacity-30" style={{ color: '#475569' }} />
                  <p className="text-sm" style={{ color: '#475569' }}>No hay cotizaciones aún</p>
                  <button onClick={() => onNavigate(AppRoute.ADMIN_QUOTES)} className="mt-3 text-xs font-bold underline" style={{ color: '#34d399' }}>Crear la primera →</button>
                </div>
              )}
              {quotes.length > 20 && (
                <button onClick={() => onNavigate(AppRoute.ADMIN_QUOTES)}
                  className="w-full py-3 rounded-xl text-sm font-bold"
                  style={{ background: '#0f172a', border: '1px solid #1e293b', color: '#64748b' }}>
                  Ver todas en cotizador avanzado →
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════
          TARIFAS AGENCIAS USD
      ════════════════════════════════════════════ */}
      {tab === 'tarifas' && (
        <div className="px-4 pt-4">

          {/* TRM Banner */}
          <div className="rounded-2xl p-4 mb-4" style={{ background: '#0c1a0c', border: '1px solid rgba(250,204,21,0.3)' }}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="text-xs font-black uppercase tracking-widest mb-0.5" style={{ color: '#facc15' }}>
                  TRM — Tasa de Cambio
                </p>
                <p className="text-[10px]" style={{ color: '#64748b' }}>
                  Actualiza manualmente según la TRM del día
                </p>
              </div>
              <DollarSign size={20} style={{ color: '#facc15', flexShrink: 0 }} />
            </div>

            {trmEditing ? (
              <div className="flex gap-2 mt-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: '#020617', border: '1px solid rgba(250,204,21,0.4)' }}>
                  <span className="text-xs font-bold" style={{ color: '#facc15' }}>COP $</span>
                  <input
                    type="number"
                    value={trmInput}
                    onChange={e => setTrmInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveTrmValue()}
                    className="flex-1 bg-transparent text-sm font-black outline-none"
                    style={{ color: '#facc15' }}
                    autoFocus
                  />
                  <span className="text-[10px]" style={{ color: '#475569' }}>/ USD</span>
                </div>
                <button onClick={saveTrmValue}
                  className="px-4 py-2 rounded-xl text-xs font-black"
                  style={{ background: 'rgba(250,204,21,0.2)', color: '#facc15', border: '1px solid rgba(250,204,21,0.4)' }}>
                  Guardar
                </button>
                <button onClick={() => setTrmEditing(false)}
                  className="px-3 py-2 rounded-xl text-xs"
                  style={{ background: 'transparent', color: '#475569', border: '1px solid #1e293b' }}>
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between mt-2">
                <div>
                  <span className="text-2xl font-black" style={{ color: '#facc15' }}>
                    ${trm.toLocaleString('es-CO')}
                  </span>
                  <span className="text-xs ml-2" style={{ color: '#475569' }}>COP por USD</span>
                </div>
                <button onClick={() => { setTrmInput(String(trm)); setTrmEditing(true); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
                  style={{ background: 'rgba(250,204,21,0.1)', color: '#facc15', border: '1px solid rgba(250,204,21,0.25)' }}>
                  <Edit3 size={12} /> Editar TRM
                </button>
              </div>
            )}

            {/* Fórmula explicada */}
            <div className="mt-3 p-3 rounded-xl flex items-start gap-2" style={{ background: 'rgba(250,204,21,0.06)', border: '1px solid rgba(250,204,21,0.15)' }}>
              <Info size={12} style={{ color: '#facc15', flexShrink: 0, marginTop: 2 }} />
              <p className="text-[10px] leading-relaxed" style={{ color: '#94a3b8' }}>
                <span style={{ color: '#facc15' }}>Fórmula:</span> Precio COP + 10% colchón cambiario ÷ TRM = <span style={{ color: '#4ade80' }}>Precio USD Agencia</span>. El 10% cubre volatilidad del dólar y costos de pasarela.
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="flex gap-2 mb-4">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: '#0f172a', border: '1px solid #1e293b' }}>
              <Search size={14} style={{ color: '#475569' }} />
              <input value={tarifasSearch} onChange={e => setTarifasSearch(e.target.value)}
                placeholder="Buscar servicio..."
                className="flex-1 bg-transparent text-sm outline-none" style={{ color: '#e2e8f0' }} />
            </div>
            <button onClick={fetchServices} className="p-2.5 rounded-xl" style={{ background: '#0f172a', border: '1px solid #1e293b', color: '#64748b' }}>
              <RefreshCw size={15} />
            </button>
          </div>

          {svcLoading && (
            <div className="flex items-center justify-center py-16 gap-3">
              <Loader2 size={24} className="animate-spin" style={{ color: '#facc15' }} />
              <span className="text-sm" style={{ color: '#64748b' }}>Cargando catálogo...</span>
            </div>
          )}

          {!svcLoading && !svcError && (
            <>
              {/* Column headers */}
              <div className="grid gap-2 mb-2 px-1" style={{ gridTemplateColumns: '1fr 90px 90px 80px' }}>
                <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#475569' }}>Servicio</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-right" style={{ color: '#475569' }}>COP base</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-right" style={{ color: '#fbbf24' }}>+10% COP</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-right" style={{ color: '#4ade80' }}>USD</span>
              </div>

              <div className="space-y-2">
                {filteredTarifas.map(s => {
                  const cfg = catOf(s);
                  const precioCOP = s.price || 0;
                  const precioAgenciaCOP = calcAgenciaCOP(precioCOP);
                  const precioUSD = calcAgenciaUSD(precioCOP, trm);
                  return (
                    <div key={s.id} className="rounded-xl overflow-hidden" style={{ background: '#0f172a', border: '1px solid #1e293b' }}>
                      <div className="grid items-center gap-2 px-3 py-3" style={{ gridTemplateColumns: '1fr 90px 90px 80px' }}>
                        {/* Nombre */}
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-white truncate leading-tight">{s.title || s.name}</p>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-0.5 inline-block"
                            style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                        </div>
                        {/* COP base */}
                        <div className="text-right">
                          <p className="text-xs font-bold" style={{ color: '#94a3b8' }}>
                            {precioCOP > 0 ? `$${precioCOP.toLocaleString('es-CO')}` : <span style={{ color: '#475569' }}>—</span>}
                          </p>
                        </div>
                        {/* COP + 10% */}
                        <div className="text-right">
                          <p className="text-xs font-black" style={{ color: '#fbbf24' }}>
                            {precioCOP > 0 ? `$${precioAgenciaCOP.toLocaleString('es-CO')}` : <span style={{ color: '#475569' }}>—</span>}
                          </p>
                        </div>
                        {/* USD */}
                        <div className="text-right">
                          <p className="text-sm font-black" style={{ color: '#4ade80' }}>
                            {precioCOP > 0 && trm > 0
                              ? `$${precioUSD.toFixed(2)}`
                              : <span style={{ color: '#475569' }}>—</span>}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredTarifas.length === 0 && !svcLoading && (
                  <div className="text-center py-12">
                    <DollarSign size={36} className="mx-auto mb-3 opacity-20" style={{ color: '#facc15' }} />
                    <p className="text-sm" style={{ color: '#475569' }}>Sin servicios con ese filtro</p>
                  </div>
                )}
              </div>

              {/* Summary footer */}
              {filteredTarifas.length > 0 && (
                <div className="mt-4 p-3 rounded-xl" style={{ background: '#0a0f1e', border: '1px solid #1e293b' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={13} style={{ color: '#4ade80' }} />
                    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#475569' }}>
                      Resumen — {filteredTarifas.length} servicios
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {(() => {
                      const conPrecio = filteredTarifas.filter(s => (s.price || 0) > 0);
                      const promCOP = conPrecio.length > 0
                        ? conPrecio.reduce((acc, s) => acc + calcAgenciaCOP(s.price || 0), 0) / conPrecio.length
                        : 0;
                      const promUSD = trm > 0 ? promCOP / trm : 0;
                      const minUSD  = conPrecio.length > 0 ? Math.min(...conPrecio.map(s => calcAgenciaUSD(s.price || 0, trm))) : 0;
                      const maxUSD  = conPrecio.length > 0 ? Math.max(...conPrecio.map(s => calcAgenciaUSD(s.price || 0, trm))) : 0;
                      return (
                        <>
                          <div>
                            <p className="text-[9px] uppercase font-bold mb-0.5" style={{ color: '#475569' }}>Promedio USD</p>
                            <p className="text-sm font-black" style={{ color: '#4ade80' }}>${promUSD.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-[9px] uppercase font-bold mb-0.5" style={{ color: '#475569' }}>Mínimo USD</p>
                            <p className="text-sm font-black" style={{ color: '#60a5fa' }}>${minUSD.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-[9px] uppercase font-bold mb-0.5" style={{ color: '#475569' }}>Máximo USD</p>
                            <p className="text-sm font-black" style={{ color: '#f472b6' }}>${maxUSD.toFixed(2)}</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

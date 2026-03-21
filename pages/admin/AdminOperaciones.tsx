import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft, Search, Package, Users, LayoutGrid, FileText,
  Globe, Building2, MessageCircle, ToggleLeft, ToggleRight,
  Phone, Mail, Star, ChevronRight, Loader2, AlertCircle,
  RefreshCw, Plus, Tag, MapPin, Clock, CheckCircle2,
  XCircle, Edit3, Filter,
} from 'lucide-react';
import { AppRoute } from '../../types';
import { getServices, getAllLeads } from '../../services/airtableService';
import { getCotizaciones } from '../../services/quotesService';

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'catalogo' | 'channels' | 'crm' | 'cotizaciones';
type ServiceCategory = 'all' | 'tour' | 'hotel' | 'taxi' | 'package';

interface Service {
  id: string;
  title: string;
  name: string;
  category: string;
  type: string;
  price: number;
  image: string;
  description: string;
  location: string;
  duration?: string;
  active?: boolean;
}

interface ChannelConfig {
  b2c: boolean;
  b2b: boolean;
  whatsapp: boolean;
  precioB2B?: number;
}

const CHANNEL_KEY = 'guanago_channels_v1';

const loadChannels = (): Record<string, ChannelConfig> => {
  try { return JSON.parse(localStorage.getItem(CHANNEL_KEY) || '{}'); } catch { return {}; }
};
const saveChannels = (data: Record<string, ChannelConfig>) => {
  localStorage.setItem(CHANNEL_KEY, JSON.stringify(data));
};

// ─── Category config ──────────────────────────────────────────────────────────
const CAT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  tour:    { label: 'Tour',       color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
  hotel:   { label: 'Hotel',      color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
  taxi:    { label: 'Traslado',   color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
  package: { label: 'Paquete',    color: '#c084fc', bg: 'rgba(192,132,252,0.15)' },
  default: { label: 'Servicio',   color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
};
const catOf = (s: Service) => CAT_CONFIG[s.category] ?? CAT_CONFIG.default;

const ROLE_COLOR: Record<string, string> = {
  SuperAdmin: '#f472b6', admin: '#f87171', Socio: '#fbbf24',
  Turista: '#34d399', Local: '#22d3ee', Artista: '#c084fc', default: '#94a3b8',
};

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props {
  onBack: () => void;
  onNavigate: (route: AppRoute, data?: any) => void;
}

export default function AdminOperaciones({ onBack, onNavigate }: Props) {
  const [tab, setTab] = useState<Tab>('catalogo');

  // ── Catálogo state ──
  const [services, setServices] = useState<Service[]>([]);
  const [svcLoading, setSvcLoading] = useState(true);
  const [svcError, setSvcError] = useState('');
  const [svcSearch, setSvcSearch] = useState('');
  const [svcCat, setSvcCat] = useState<ServiceCategory>('all');

  // ── Channel state ──
  const [channels, setChannels] = useState<Record<string, ChannelConfig>>(loadChannels);
  const [channelsDirty, setChannelsDirty] = useState(false);

  // ── CRM state ──
  const [leads, setLeads] = useState<any[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsError, setLeadsError] = useState('');
  const [leadsSearch, setLeadsSearch] = useState('');
  const [selectedLead, setSelectedLead] = useState<any | null>(null);

  // ── Quotes state ──
  const [quotes, setQuotes] = useState<any[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(false);

  // ── Load data per tab ──
  useEffect(() => {
    if (tab === 'catalogo' || tab === 'channels') {
      if (services.length === 0) fetchServices();
    }
    if (tab === 'crm' && leads.length === 0) fetchLeads();
    if (tab === 'cotizaciones' && quotes.length === 0) fetchQuotes();
  }, [tab]);

  const fetchServices = async () => {
    setSvcLoading(true); setSvcError('');
    try {
      const data = await getServices();
      setServices((data || []).map((s: any) => ({ ...s, active: s.active !== false })));
    } catch { setSvcError('No se pudo cargar el catálogo'); }
    finally { setSvcLoading(false); }
  };

  const fetchLeads = async () => {
    setLeadsLoading(true); setLeadsError('');
    try {
      const data = await getAllLeads(150);
      setLeads(data || []);
    } catch { setLeadsError('No se pudo cargar el CRM'); }
    finally { setLeadsLoading(false); }
  };

  const fetchQuotes = async () => {
    setQuotesLoading(true);
    try { setQuotes((await getCotizaciones()) || []); } catch { setQuotes([]); }
    finally { setQuotesLoading(false); }
  };

  // ── Filtered services ──
  const filteredServices = useMemo(() => {
    return services.filter(s => {
      const matchCat = svcCat === 'all' || s.category === svcCat;
      const matchQ = !svcSearch || (s.title + s.name + s.type + s.location).toLowerCase().includes(svcSearch.toLowerCase());
      return matchCat && matchQ;
    });
  }, [services, svcCat, svcSearch]);

  const filteredLeads = useMemo(() => {
    if (!leadsSearch) return leads;
    const q = leadsSearch.toLowerCase();
    return leads.filter(l => (l.nombre + l.email + l.telefono + l.role).toLowerCase().includes(q));
  }, [leads, leadsSearch]);

  // ── Channel helpers ──
  const getChannel = (id: string): ChannelConfig =>
    channels[id] ?? { b2c: true, b2b: false, whatsapp: false };

  const toggleChannel = (id: string, key: keyof ChannelConfig) => {
    const current = getChannel(id);
    const updated = { ...channels, [id]: { ...current, [key]: !current[key as 'b2c'] } };
    setChannels(updated);
    setChannelsDirty(true);
  };

  const saveChannelConfig = () => {
    saveChannels(channels);
    setChannelsDirty(false);
  };

  // ── Render helpers ──
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

  const catCounts = useMemo(() => {
    const c: Record<string, number> = { all: services.length };
    services.forEach(s => { c[s.category] = (c[s.category] || 0) + 1; });
    return c;
  }, [services]);

  return (
    <div className="min-h-screen pb-20" style={{ background: '#020617', color: '#e2e8f0' }}>

      {/* ── Header ── */}
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
            <Plus size={13} /> Nueva cotización
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pb-3 overflow-x-auto no-scrollbar">
          <TabBtn id="catalogo"     label="Catálogo"      icon={<Package size={13} />} />
          <TabBtn id="channels"     label="Channel Mgr"   icon={<Globe size={13} />} />
          <TabBtn id="crm"          label="CRM"            icon={<Users size={13} />} />
          <TabBtn id="cotizaciones" label="Cotizaciones"   icon={<FileText size={13} />} />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: CATÁLOGO
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'catalogo' && (
        <div className="px-4 pt-4">

          {/* Search + refresh */}
          <div className="flex gap-2 mb-3">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: '#0f172a', border: '1px solid #1e293b' }}>
              <Search size={14} style={{ color: '#475569' }} />
              <input
                value={svcSearch} onChange={e => setSvcSearch(e.target.value)}
                placeholder="Buscar servicio..."
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: '#e2e8f0' }}
              />
            </div>
            <button onClick={fetchServices} className="p-2.5 rounded-xl" style={{ background: '#0f172a', border: '1px solid #1e293b', color: '#64748b' }}>
              <RefreshCw size={15} />
            </button>
          </div>

          {/* Category filter */}
          <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
            {(['all', 'tour', 'hotel', 'taxi', 'package'] as ServiceCategory[]).map(cat => {
              const cfg = cat === 'all' ? { label: 'Todos', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' } : CAT_CONFIG[cat];
              const active = svcCat === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSvcCat(cat)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                  style={{
                    background: active ? cfg.bg : 'transparent',
                    color: active ? cfg.color : '#475569',
                    border: `1px solid ${active ? cfg.color + '50' : '#1e293b'}`,
                  }}
                >
                  {cfg.label} {catCounts[cat] !== undefined ? `(${catCounts[cat]})` : ''}
                </button>
              );
            })}
          </div>

          {/* Loading / Error */}
          {svcLoading && (
            <div className="flex items-center justify-center py-16 gap-3">
              <Loader2 size={24} className="animate-spin" style={{ color: '#34d399' }} />
              <span className="text-sm" style={{ color: '#64748b' }}>Cargando catálogo desde Airtable...</span>
            </div>
          )}
          {svcError && !svcLoading && (
            <div className="flex items-center gap-3 p-4 rounded-xl mb-4" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle size={18} className="text-red-400" />
              <span className="text-sm text-red-300">{svcError}</span>
              <button onClick={fetchServices} className="ml-auto text-xs text-red-400 underline">Reintentar</button>
            </div>
          )}

          {/* Service cards */}
          {!svcLoading && !svcError && (
            <>
              <p className="text-xs mb-3" style={{ color: '#475569' }}>{filteredServices.length} servicios encontrados</p>
              <div className="space-y-3">
                {filteredServices.map(s => {
                  const cfg = catOf(s);
                  return (
                    <div key={s.id} className="rounded-xl overflow-hidden" style={{ background: '#0f172a', border: '1px solid #1e293b' }}>
                      <div className="flex gap-3 p-3">
                        {/* Image */}
                        <div className="flex-shrink-0 rounded-xl overflow-hidden" style={{ width: 72, height: 72 }}>
                          {s.image
                            ? <img src={s.image} alt={s.title} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center" style={{ background: cfg.bg }}>
                                <Package size={24} style={{ color: cfg.color }} />
                              </div>
                          }
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-bold text-sm leading-tight truncate text-white">{s.title || s.name}</p>
                            <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
                              {cfg.label}
                            </span>
                          </div>
                          {s.description && (
                            <p className="text-xs mt-1 line-clamp-2" style={{ color: '#64748b' }}>{s.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            <span className="font-black text-sm" style={{ color: '#34d399' }}>
                              ${(s.price || 0).toLocaleString()} COP
                            </span>
                            {s.location && (
                              <span className="flex items-center gap-1 text-[10px]" style={{ color: '#475569' }}>
                                <MapPin size={10} /> {s.location}
                              </span>
                            )}
                            {s.duration && (
                              <span className="flex items-center gap-1 text-[10px]" style={{ color: '#475569' }}>
                                <Clock size={10} /> {s.duration}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions bar */}
                      <div className="flex items-center justify-between px-3 py-2" style={{ borderTop: '1px solid #1e293b' }}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: s.active !== false ? '#22c55e' : '#6b7280' }} />
                          <span className="text-[11px] font-medium" style={{ color: s.active !== false ? '#22c55e' : '#6b7280' }}>
                            {s.active !== false ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => onNavigate(AppRoute.ADMIN_QUOTES)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold"
                            style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }}
                          >
                            <FileText size={11} /> Cotizar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredServices.length === 0 && (
                  <div className="text-center py-12">
                    <Package size={36} className="mx-auto mb-3 opacity-30" style={{ color: '#475569' }} />
                    <p className="text-sm" style={{ color: '#475569' }}>No hay servicios con ese filtro</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: CHANNEL MANAGER
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'channels' && (
        <div className="px-4 pt-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-sm text-white">Channel Manager</h2>
              <p className="text-xs mt-0.5" style={{ color: '#475569' }}>Controla en qué canales aparece cada servicio</p>
            </div>
            {channelsDirty && (
              <button
                onClick={saveChannelConfig}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold"
                style={{ background: 'rgba(52,211,153,0.2)', color: '#34d399', border: '1px solid rgba(52,211,153,0.4)' }}
              >
                <CheckCircle2 size={13} /> Guardar cambios
              </button>
            )}
          </div>

          {/* Channel legend */}
          <div className="flex gap-3 mb-4 flex-wrap">
            {[
              { icon: <Globe size={12} />, label: 'B2C Web',      color: '#60a5fa' },
              { icon: <Building2 size={12} />, label: 'B2B Agencias', color: '#fbbf24' },
              { icon: <MessageCircle size={12} />, label: 'WhatsApp',    color: '#4ade80' },
            ].map(ch => (
              <div key={ch.label} className="flex items-center gap-1.5 text-xs" style={{ color: ch.color }}>
                {ch.icon} {ch.label}
              </div>
            ))}
          </div>

          {svcLoading && (
            <div className="flex items-center justify-center py-16 gap-3">
              <Loader2 size={24} className="animate-spin" style={{ color: '#34d399' }} />
              <span className="text-sm" style={{ color: '#64748b' }}>Cargando servicios...</span>
            </div>
          )}

          {!svcLoading && (
            <div className="space-y-2">
              {services.map(s => {
                const ch = getChannel(s.id);
                const cfg = catOf(s);
                return (
                  <div key={s.id} className="rounded-xl p-3" style={{ background: '#0f172a', border: '1px solid #1e293b' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                      <p className="font-semibold text-sm text-white truncate flex-1">{s.title || s.name}</p>
                      <span className="text-xs font-black" style={{ color: '#34d399' }}>${(s.price || 0).toLocaleString()}</span>
                    </div>

                    <div className="flex gap-4">
                      {/* B2C toggle */}
                      <button onClick={() => toggleChannel(s.id, 'b2c')} className="flex items-center gap-1.5">
                        {ch.b2c
                          ? <ToggleRight size={22} style={{ color: '#60a5fa' }} />
                          : <ToggleLeft size={22} style={{ color: '#334155' }} />
                        }
                        <span className="text-[11px] font-medium" style={{ color: ch.b2c ? '#60a5fa' : '#475569' }}>B2C Web</span>
                      </button>

                      {/* B2B toggle */}
                      <button onClick={() => toggleChannel(s.id, 'b2b')} className="flex items-center gap-1.5">
                        {ch.b2b
                          ? <ToggleRight size={22} style={{ color: '#fbbf24' }} />
                          : <ToggleLeft size={22} style={{ color: '#334155' }} />
                        }
                        <span className="text-[11px] font-medium" style={{ color: ch.b2b ? '#fbbf24' : '#475569' }}>B2B</span>
                      </button>

                      {/* WhatsApp toggle */}
                      <button onClick={() => toggleChannel(s.id, 'whatsapp')} className="flex items-center gap-1.5">
                        {ch.whatsapp
                          ? <ToggleRight size={22} style={{ color: '#4ade80' }} />
                          : <ToggleLeft size={22} style={{ color: '#334155' }} />
                        }
                        <span className="text-[11px] font-medium" style={{ color: ch.whatsapp ? '#4ade80' : '#475569' }}>WhatsApp</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {services.length === 0 && (
                <div className="text-center py-12">
                  <Globe size={36} className="mx-auto mb-3 opacity-30" style={{ color: '#475569' }} />
                  <p className="text-sm" style={{ color: '#475569' }}>Sin servicios cargados</p>
                  <button onClick={fetchServices} className="mt-3 text-xs underline" style={{ color: '#34d399' }}>Cargar catálogo</button>
                </div>
              )}
            </div>
          )}

          {channelsDirty && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
              <button
                onClick={saveChannelConfig}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm shadow-2xl"
                style={{ background: '#34d399', color: '#022c22' }}
              >
                <CheckCircle2 size={16} /> Guardar configuración de canales
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: CRM
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'crm' && (
        <div className="px-4 pt-4">
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-4" style={{ background: '#0f172a', border: '1px solid #1e293b' }}>
            <Search size={14} style={{ color: '#475569' }} />
            <input
              value={leadsSearch} onChange={e => setLeadsSearch(e.target.value)}
              placeholder="Buscar por nombre, email, rol..."
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: '#e2e8f0' }}
            />
            <button onClick={fetchLeads}>
              <RefreshCw size={14} style={{ color: '#475569' }} />
            </button>
          </div>

          {leadsLoading && (
            <div className="flex items-center justify-center py-16 gap-3">
              <Loader2 size={24} className="animate-spin" style={{ color: '#34d399' }} />
              <span className="text-sm" style={{ color: '#64748b' }}>Cargando clientes desde Airtable...</span>
            </div>
          )}
          {leadsError && !leadsLoading && (
            <div className="flex items-center gap-3 p-4 rounded-xl mb-4" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle size={18} className="text-red-400" />
              <span className="text-sm text-red-300">{leadsError}</span>
              <button onClick={fetchLeads} className="ml-auto text-xs text-red-400 underline">Reintentar</button>
            </div>
          )}

          {!leadsLoading && !leadsError && (
            <>
              <p className="text-xs mb-3" style={{ color: '#475569' }}>{filteredLeads.length} clientes registrados</p>

              {/* Lead detail panel */}
              {selectedLead && (
                <div className="rounded-2xl p-4 mb-4" style={{ background: '#0f172a', border: '1px solid rgba(52,211,153,0.3)' }}>
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg flex-shrink-0"
                      style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}>
                      {(selectedLead.nombre || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-white">{selectedLead.nombre || 'Sin nombre'}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(52,211,153,0.1)', color: ROLE_COLOR[selectedLead.role] || ROLE_COLOR.default }}>
                        {selectedLead.role || 'Turista'}
                      </span>
                    </div>
                    <button onClick={() => setSelectedLead(null)} style={{ color: '#475569' }}>
                      <XCircle size={18} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p style={{ color: '#475569' }}>Email</p>
                      <p className="font-medium text-white truncate">{selectedLead.email || '—'}</p>
                    </div>
                    <div>
                      <p style={{ color: '#475569' }}>Teléfono</p>
                      <p className="font-medium text-white">{selectedLead.telefono || '—'}</p>
                    </div>
                    <div>
                      <p style={{ color: '#475569' }}>GuanaPoints</p>
                      <p className="font-black" style={{ color: '#fbbf24' }}>{(selectedLead.saldoGuana || 0).toLocaleString()} pts</p>
                    </div>
                    <div>
                      <p style={{ color: '#475569' }}>Nivel</p>
                      <p className="font-bold" style={{ color: '#34d399' }}>{selectedLead.nivel || 'Explorador'}</p>
                    </div>
                    <div>
                      <p style={{ color: '#475569' }}>Verificado</p>
                      <p className="font-medium" style={{ color: selectedLead.verificado ? '#22c55e' : '#f59e0b' }}>
                        {selectedLead.verificado ? 'Verificado' : 'Pendiente'}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: '#475569' }}>Registro</p>
                      <p className="font-medium text-white">
                        {selectedLead.fechaRegistro ? new Date(selectedLead.fechaRegistro).toLocaleDateString('es-CO') : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <a href={`mailto:${selectedLead.email}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold"
                      style={{ background: 'rgba(96,165,250,0.15)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.25)' }}>
                      <Mail size={13} /> Email
                    </a>
                    {selectedLead.whatsapp && (
                      <a href={`https://wa.me/${selectedLead.whatsapp?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold"
                        style={{ background: 'rgba(74,222,128,0.15)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.25)' }}>
                        <MessageCircle size={13} /> WhatsApp
                      </a>
                    )}
                    <button
                      onClick={() => onNavigate(AppRoute.ADMIN_QUOTES)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold"
                      style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }}>
                      <FileText size={13} /> Cotizar
                    </button>
                  </div>
                </div>
              )}

              {/* Leads list */}
              <div className="space-y-2">
                {filteredLeads.map(lead => (
                  <button
                    key={lead.id}
                    onClick={() => setSelectedLead(selectedLead?.id === lead.id ? null : lead)}
                    className="w-full text-left rounded-xl p-3 transition-all"
                    style={{
                      background: selectedLead?.id === lead.id ? 'rgba(52,211,153,0.06)' : '#0f172a',
                      border: `1px solid ${selectedLead?.id === lead.id ? 'rgba(52,211,153,0.25)' : '#1e293b'}`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black flex-shrink-0"
                        style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', fontSize: 15 }}>
                        {(lead.nombre || '?')[0].toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-white truncate">{lead.nombre || 'Sin nombre'}</p>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: 'rgba(52,211,153,0.08)', color: ROLE_COLOR[lead.role] || ROLE_COLOR.default }}>
                            {lead.role || 'Turista'}
                          </span>
                        </div>
                        <p className="text-xs truncate" style={{ color: '#64748b' }}>{lead.email || lead.telefono || '—'}</p>
                      </div>

                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {lead.saldoGuana > 0 && (
                          <span className="text-[10px] font-black" style={{ color: '#fbbf24' }}>
                            {lead.saldoGuana.toLocaleString()} pts
                          </span>
                        )}
                        <span className="text-[10px]" style={{ color: lead.verificado ? '#22c55e' : '#64748b' }}>
                          {lead.verificado ? '✓ verificado' : 'pendiente'}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}

                {filteredLeads.length === 0 && (
                  <div className="text-center py-12">
                    <Users size={36} className="mx-auto mb-3 opacity-30" style={{ color: '#475569' }} />
                    <p className="text-sm" style={{ color: '#475569' }}>
                      {leadsSearch ? 'Sin resultados para esa búsqueda' : 'No hay clientes registrados'}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: COTIZACIONES
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'cotizaciones' && (
        <div className="px-4 pt-4">

          {/* CTA nueva cotización */}
          <button
            onClick={() => onNavigate(AppRoute.ADMIN_QUOTES)}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base mb-5"
            style={{ background: 'linear-gradient(135deg, rgba(52,211,153,0.2), rgba(34,211,238,0.15))', border: '1px solid rgba(52,211,153,0.35)', color: '#34d399' }}
          >
            <Plus size={18} /> Crear nueva cotización / voucher
          </button>

          <h3 className="font-bold text-sm mb-3 text-white">Cotizaciones recientes</h3>

          {quotesLoading && (
            <div className="flex items-center justify-center py-12 gap-3">
              <Loader2 size={22} className="animate-spin" style={{ color: '#34d399' }} />
              <span className="text-sm" style={{ color: '#64748b' }}>Cargando cotizaciones...</span>
            </div>
          )}

          {!quotesLoading && (
            <div className="space-y-2">
              {quotes.slice(0, 20).map((q: any) => {
                const statusColor: Record<string, string> = {
                  borrador: '#64748b', enviada: '#60a5fa', aceptada: '#22c55e',
                  rechazada: '#ef4444', vencida: '#f59e0b',
                };
                const st = q.estado || q.status || 'borrador';
                return (
                  <button
                    key={q.id}
                    onClick={() => onNavigate(AppRoute.ADMIN_QUOTES)}
                    className="w-full text-left rounded-xl p-3 transition-all"
                    style={{ background: '#0f172a', border: '1px solid #1e293b' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(52,211,153,0.08)' }}>
                        <FileText size={16} style={{ color: '#34d399' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-white truncate">{q.nombre || q.clientName || 'Sin nombre'}</p>
                        <p className="text-xs" style={{ color: '#64748b' }}>
                          {q.id?.substring(0, 10)} · {q.fechaInicio ? new Date(q.fechaInicio).toLocaleDateString('es-CO') : '—'}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-xs font-black" style={{ color: '#34d399' }}>
                          ${(q.precioTotal || 0).toLocaleString()} COP
                        </span>
                        <span className="text-[10px] font-bold capitalize px-2 py-0.5 rounded-full"
                          style={{ background: `${statusColor[st] || '#64748b'}20`, color: statusColor[st] || '#64748b' }}>
                          {st}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}

              {quotes.length === 0 && (
                <div className="text-center py-12">
                  <FileText size={36} className="mx-auto mb-3 opacity-30" style={{ color: '#475569' }} />
                  <p className="text-sm" style={{ color: '#475569' }}>No hay cotizaciones aún</p>
                  <button
                    onClick={() => onNavigate(AppRoute.ADMIN_QUOTES)}
                    className="mt-3 text-xs font-bold underline"
                    style={{ color: '#34d399' }}
                  >
                    Crear la primera →
                  </button>
                </div>
              )}

              {quotes.length > 20 && (
                <button
                  onClick={() => onNavigate(AppRoute.ADMIN_QUOTES)}
                  className="w-full py-3 rounded-xl text-sm font-bold"
                  style={{ background: '#0f172a', border: '1px solid #1e293b', color: '#64748b' }}
                >
                  Ver todas en cotizador avanzado →
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

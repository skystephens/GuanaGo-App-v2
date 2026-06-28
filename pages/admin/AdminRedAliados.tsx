import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, MapPin, Users, Edit3, Plus, Trash2, RefreshCw,
  Search, CheckCircle, XCircle, MessageCircle, Save, X,
  Store, ClipboardList, LayoutList, ChevronRight,
} from 'lucide-react';
import { AppRoute } from '../../types';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';

interface Props {
  onBack: () => void;
  onNavigate: (route: AppRoute) => void;
}

const API_BASE = import.meta.env.VITE_API_URL || '';

const CATEGORIAS = ['Restaurante', 'Hotel', 'Tour', 'Transporte', 'Tienda', 'Bar', 'Experiencia', 'Servicios', 'General'];
const PLANES     = ['', 'Básico', 'Activo', 'Premium'];
const ESTADOS    = ['activo', 'inactivo', 'pendiente'];

const ALIADOS_DEFAULT = ['Bushi Food', 'Bobby Rock', 'Capy Beach', 'Casa Las Palmas', 'Capitán Mandy', 'Dreamer', 'Sweet Avenue Café'];

type Tab = 'directorio' | 'inscritos' | 'contenido';

interface DirEntry {
  id: string; name: string; category: string; address: string; phone: string;
  email: string; description: string; website: string; hours: string;
  estado: string; plan: string; rnt: string; responsable: string;
  slug: string; whatsapp: string;
}

interface Lead {
  id: string; nombre: string; whatsapp: string; tipo: string; estado: string;
  ref: string; detalles: string; createdTime: string;
}

const EMPTY_FORM: Omit<DirEntry, 'id' | 'slug' | 'whatsapp'> = {
  name: '', category: 'General', address: '', phone: '', email: '',
  description: '', website: '', hours: '', estado: 'activo', plan: '', rnt: '', responsable: '',
};

function parseDetalles(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of (raw || '').split('\n')) {
    const i = line.indexOf(': ');
    if (i > -1) out[line.slice(0, i).trim()] = line.slice(i + 2).trim();
  }
  return out;
}

const PLAN_COLOR: Record<string, string> = {
  'Básico':   'bg-teal-900/50 text-teal-400',
  'Activo':   'bg-orange-900/50 text-orange-400',
  'Premium':  'bg-indigo-900/50 text-indigo-400',
};

const ESTADO_COLOR: Record<string, string> = {
  activo:    'bg-green-900/50 text-green-400',
  inactivo:  'bg-gray-800 text-gray-500',
  pendiente: 'bg-yellow-900/50 text-yellow-400',
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function FormField({ label, value, onChange, placeholder = '', textarea = false, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; textarea?: boolean; type?: string;
}) {
  const cls = 'w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500 text-white placeholder-gray-600';
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
      {textarea
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={2} className={cls + ' resize-none'} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cls} />
      }
    </div>
  );
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500 text-white">
        {options.map(o => <option key={o} value={o}>{o || '— sin plan —'}</option>)}
      </select>
    </div>
  );
}

// ─── AdminRedAliados ───────────────────────────────────────────────────────────

const AdminRedAliados: React.FC<Props> = ({ onBack, onNavigate }) => {
  const [tab, setTab] = useState<Tab>('directorio');

  // ── Directorio ────────────────────────────────────────────────────────────────
  const [dirList, setDirList]       = useState<DirEntry[]>([]);
  const [dirLoading, setDirLoading] = useState(false);
  const [dirSearch, setDirSearch]   = useState('');
  const [dirCat, setDirCat]         = useState('Todos');
  const [formOpen, setFormOpen]     = useState(false);
  const [editing, setEditing]       = useState<DirEntry | null>(null);
  const [form, setForm]             = useState({ ...EMPTY_FORM });
  const [saving, setSaving]         = useState(false);
  const [saveMsg, setSaveMsg]       = useState('');

  const loadDirectorio = useCallback(async () => {
    setDirLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/directory`);
      const d = await r.json();
      setDirList(d.success ? d.data : []);
    } catch { setDirList([]); }
    finally { setDirLoading(false); }
  }, []);

  useEffect(() => { if (tab === 'directorio') loadDirectorio(); }, [tab, loadDirectorio]);

  const openNew = () => { setEditing(null); setForm({ ...EMPTY_FORM }); setFormOpen(true); };
  const openEdit = (e: DirEntry) => {
    setEditing(e);
    setForm({ name: e.name, category: e.category, address: e.address, phone: e.phone,
      email: e.email, description: e.description, website: e.website, hours: e.hours,
      estado: e.estado, plan: e.plan, rnt: e.rnt, responsable: e.responsable });
    setFormOpen(true);
  };
  const closeForm = () => { setFormOpen(false); setEditing(null); setSaveMsg(''); };

  const handleSave = async () => {
    if (!form.name.trim()) { setSaveMsg('El nombre es requerido'); return; }
    setSaving(true); setSaveMsg('');
    try {
      const url  = editing ? `${API_BASE}/api/directory/${editing.id}` : `${API_BASE}/api/directory`;
      const method = editing ? 'PATCH' : 'POST';
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const d = await r.json();
      if (d.success) { setSaveMsg(editing ? '✅ Actualizado' : '✅ Creado'); loadDirectorio(); setTimeout(closeForm, 1200); }
      else setSaveMsg('❌ ' + (d.error || 'Error al guardar'));
    } catch { setSaveMsg('❌ Error de conexión'); }
    finally { setSaving(false); }
  };

  const filteredDir = dirList.filter(e => {
    const q = dirSearch.toLowerCase();
    const matchSearch = !q || e.name?.toLowerCase().includes(q) || e.responsable?.toLowerCase().includes(q);
    const matchCat    = dirCat === 'Todos' || e.category === dirCat;
    return matchSearch && matchCat;
  });

  // ── Inscritos ─────────────────────────────────────────────────────────────────
  const [leads, setLeads]               = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsMsg, setLeadsMsg]         = useState('');

  const loadLeads = useCallback(async () => {
    setLeadsLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/leads?tipo=Aliado_Diagnostico&limit=100`);
      const d = await r.json();
      setLeads(d.success ? d.records : []);
    } catch { setLeads([]); }
    finally { setLeadsLoading(false); }
  }, []);

  useEffect(() => { if (tab === 'inscritos') loadLeads(); }, [tab, loadLeads]);

  const handleCrearDesdeInscrito = (lead: Lead) => {
    const det = parseDetalles(lead.detalles);
    setForm({
      name:        det['NEGOCIO'] || lead.nombre,
      category:    det['TIPO']    || 'General',
      address:     '',
      phone:       lead.whatsapp,
      email:       '',
      description: det['CANAL'] ? `Canal actual: ${det['CANAL']}` : '',
      website:     '',
      hours:       '',
      estado:      'pendiente',
      plan:        det['PLAN_RECOMENDADO'] || '',
      rnt:         '',
      responsable: lead.nombre,
    });
    setEditing(null);
    setTab('directorio');
    setFormOpen(true);
  };

  // ── Contenido ─────────────────────────────────────────────────────────────────
  const [aliados, setAliados]           = useState<string[]>(ALIADOS_DEFAULT);
  const [aliadosLoaded, setAliadosLoaded] = useState(false);
  const [newAliado, setNewAliado]       = useState('');
  const [contSaving, setContSaving]     = useState(false);
  const [contMsg, setContMsg]           = useState('');

  useEffect(() => {
    if (tab !== 'contenido' || aliadosLoaded) return;
    getDoc(doc(db, 'docs_content', 'vinculacion-config'))
      .then(snap => {
        if (snap.exists()) {
          const d = snap.data();
          if (Array.isArray(d.aliadosDestacados)) setAliados(d.aliadosDestacados);
        }
        setAliadosLoaded(true);
      })
      .catch(() => setAliadosLoaded(true));
  }, [tab, aliadosLoaded]);

  const saveContenido = async () => {
    setContSaving(true); setContMsg('');
    try {
      await setDoc(doc(db, 'docs_content', 'vinculacion-config'), {
        aliadosDestacados: aliados,
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser?.email || 'admin',
      });
      setContMsg('✅ Guardado. Los cambios se verán en la página de vinculación.');
    } catch { setContMsg('❌ Error al guardar en Firestore'); }
    finally { setContSaving(false); }
  };

  // ─── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="bg-gray-900 min-h-screen text-white pb-24">

      {/* Header */}
      <header className="px-5 pt-12 pb-4 bg-gradient-to-b from-teal-950/40 to-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-xl transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-black">Red de Aliados</h1>
            <p className="text-xs text-gray-500">Directorio · Inscritos · Contenido landing</p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 px-5 py-3 border-b border-gray-800 overflow-x-auto">
        {([
          { id: 'directorio', label: 'Directorio', icon: LayoutList },
          { id: 'inscritos',  label: 'Inscritos',  icon: ClipboardList },
          { id: 'contenido',  label: 'Contenido',  icon: Edit3 },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t.id ? 'bg-teal-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
            <t.icon size={15} /> {t.label}
            {t.id === 'inscritos' && leads.length > 0 && (
              <span className="bg-orange-500 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                {leads.length > 9 ? '9+' : leads.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="px-5 py-4">

        {/* ── TAB: DIRECTORIO ─────────────────────────────────────────────────── */}
        {tab === 'directorio' && (
          <div className="space-y-4">

            {/* Toolbar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input value={dirSearch} onChange={e => setDirSearch(e.target.value)}
                  placeholder="Buscar negocio..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-teal-500 placeholder-gray-600" />
              </div>
              <select value={dirCat} onChange={e => setDirCat(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
                <option value="Todos">Todos</option>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button onClick={() => loadDirectorio()}
                className="p-2 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-700 transition-colors">
                <RefreshCw size={16} className={dirLoading ? 'animate-spin text-teal-400' : 'text-gray-400'} />
              </button>
              <button onClick={openNew}
                className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-500 rounded-xl text-sm font-bold transition-colors whitespace-nowrap">
                <Plus size={15} /> Agregar
              </button>
            </div>

            {/* Stats strip */}
            <div className="flex gap-3 text-xs text-gray-500">
              <span>{filteredDir.length} / {dirList.length} negocios</span>
              <span>·</span>
              <span>{dirList.filter(e => e.plan === 'Activo' || e.plan === 'Premium').length} en mapa</span>
              <span>·</span>
              <span>{dirList.filter(e => e.plan === 'Premium').length} premium</span>
            </div>

            {/* List */}
            {dirLoading ? (
              <div className="flex justify-center py-16"><RefreshCw size={28} className="animate-spin text-teal-500" /></div>
            ) : filteredDir.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">
                {dirSearch || dirCat !== 'Todos' ? 'Sin resultados para el filtro aplicado' : 'No hay negocios en el directorio'}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredDir.map(e => (
                  <div key={e.id} className="bg-gray-800 border border-gray-700 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-700 flex items-center justify-center shrink-0">
                      <Store size={16} className="text-teal-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{e.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[10px] text-gray-500">{e.category}</span>
                        {e.plan && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${PLAN_COLOR[e.plan] || 'bg-gray-700 text-gray-400'}`}>
                            {e.plan}
                          </span>
                        )}
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${ESTADO_COLOR[e.estado] || 'bg-gray-700 text-gray-400'}`}>
                          {e.estado}
                        </span>
                        {e.whatsapp && (
                          <a href={`https://wa.me/${e.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                            className="text-green-400" onClick={ev => ev.stopPropagation()}>
                            <MessageCircle size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                    <button onClick={() => openEdit(e)}
                      className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors shrink-0">
                      <Edit3 size={14} className="text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Form modal */}
            {formOpen && (
              <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center">
                <div className="bg-gray-900 w-full max-w-lg rounded-t-3xl max-h-[92vh] overflow-y-auto">
                  <div className="sticky top-0 bg-gray-900 px-5 pt-5 pb-3 border-b border-gray-800 flex items-center justify-between z-10">
                    <h2 className="font-black text-base">{editing ? 'Editar negocio' : 'Agregar negocio'}</h2>
                    <button onClick={closeForm} className="p-2 hover:bg-gray-800 rounded-xl">
                      <X size={18} />
                    </button>
                  </div>
                  <div className="px-5 py-4 space-y-3">
                    <FormField label="Nombre del negocio *" value={form.name} onChange={v => setForm(f => ({...f, name: v}))} placeholder="Ej: Bushi Food" />
                    <div className="grid grid-cols-2 gap-3">
                      <SelectField label="Categoría" value={form.category} onChange={v => setForm(f => ({...f, category: v}))} options={CATEGORIAS} />
                      <SelectField label="Plan" value={form.plan} onChange={v => setForm(f => ({...f, plan: v}))} options={PLANES} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Teléfono / WhatsApp" value={form.phone} onChange={v => setForm(f => ({...f, phone: v}))} placeholder="+57 310..." />
                      <FormField label="Email" value={form.email} onChange={v => setForm(f => ({...f, email: v}))} placeholder="correo@..." type="email" />
                    </div>
                    <FormField label="Dirección" value={form.address} onChange={v => setForm(f => ({...f, address: v}))} placeholder="Ej: Av. Colón #5-12" />
                    <FormField label="Descripción" value={form.description} onChange={v => setForm(f => ({...f, description: v}))} placeholder="Breve descripción del negocio..." textarea />
                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Horarios" value={form.hours} onChange={v => setForm(f => ({...f, hours: v}))} placeholder="Lun–Sab 8am–8pm" />
                      <FormField label="RNT" value={form.rnt} onChange={v => setForm(f => ({...f, rnt: v}))} placeholder="Número RNT" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Responsable" value={form.responsable} onChange={v => setForm(f => ({...f, responsable: v}))} placeholder="Nombre del encargado" />
                      <SelectField label="Estado" value={form.estado} onChange={v => setForm(f => ({...f, estado: v}))} options={ESTADOS} />
                    </div>
                    <FormField label="Sitio web" value={form.website} onChange={v => setForm(f => ({...f, website: v}))} placeholder="https://..." type="url" />

                    {saveMsg && (
                      <p className={`text-sm font-medium ${saveMsg.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>{saveMsg}</p>
                    )}
                    <button onClick={handleSave} disabled={saving}
                      className="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-black text-sm flex items-center justify-center gap-2 transition-colors">
                      {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                      {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear en directorio'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: INSCRITOS ──────────────────────────────────────────────────── */}
        {tab === 'inscritos' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Diagnósticos recibidos</h3>
                <p className="text-xs text-gray-500 mt-0.5">Formulario "Hacer mi diagnóstico" desde guanago.travel</p>
              </div>
              <button onClick={loadLeads}
                className="p-2 hover:bg-gray-800 rounded-xl transition-colors">
                <RefreshCw size={16} className={leadsLoading ? 'animate-spin text-teal-400' : 'text-gray-400'} />
              </button>
            </div>

            {leadsMsg && <p className="text-sm text-green-400">{leadsMsg}</p>}

            {leadsLoading ? (
              <div className="flex justify-center py-12"><RefreshCw size={24} className="animate-spin text-orange-500" /></div>
            ) : leads.length === 0 ? (
              <div className="text-center py-12 bg-gray-800/40 rounded-xl border border-gray-700">
                <ClipboardList size={40} className="mx-auto text-gray-600 mb-3" />
                <p className="text-gray-400 text-sm font-medium">Sin diagnósticos aún</p>
                <p className="text-gray-600 text-xs mt-1">Cuando alguien use el formulario aparecerá aquí</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leads.map(lead => {
                  const det = parseDetalles(lead.detalles);
                  return (
                    <div key={lead.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <p className="font-bold text-sm truncate">{det['NEGOCIO'] || lead.nombre}</p>
                            <p className="text-xs text-gray-500">por {lead.nombre}</p>
                          </div>
                          <span className="text-[10px] bg-orange-900/50 text-orange-400 border border-orange-700/40 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                            {lead.ref}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-400 mt-2">
                          {det['TIPO']              && <p>Tipo: <span className="text-gray-300">{det['TIPO']}</span></p>}
                          {det['CANAL']             && <p>Canal: <span className="text-gray-300">{det['CANAL']}</span></p>}
                          {det['TEMPORADA_BAJA']    && <p>Temporada baja: <span className="text-gray-300">{det['TEMPORADA_BAJA']}</span></p>}
                          {det['PLAN_RECOMENDADO']  && (
                            <p>Plan recomendado: <span className={`font-bold ${det['PLAN_RECOMENDADO'] === 'Premium' ? 'text-indigo-400' : det['PLAN_RECOMENDADO'] === 'Aliado Activo' ? 'text-orange-400' : 'text-teal-400'}`}>{det['PLAN_RECOMENDADO']}</span></p>
                          )}
                        </div>
                        {lead.whatsapp && (
                          <p className="text-xs text-gray-400 mt-1.5">📞 {lead.whatsapp}</p>
                        )}
                      </div>
                      <div className="flex border-t border-gray-700">
                        <button onClick={() => handleCrearDesdeInscrito(lead)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-teal-400 hover:bg-teal-900/20 transition-colors">
                          <Plus size={13} /> Crear en directorio
                        </button>
                        <div className="w-px bg-gray-700" />
                        {lead.whatsapp && (
                          <a href={`https://wa.me/${lead.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${lead.nombre.split(' ')[0]}, soy del equipo GuanaGO. Vi tu diagnóstico (ref: ${lead.ref}) y queremos ayudarte a unirte a la red. ¿Cuándo podemos hablar?`)}`}
                            target="_blank" rel="noreferrer"
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-green-400 hover:bg-green-900/20 transition-colors">
                            <MessageCircle size={13} /> WhatsApp
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: CONTENIDO ──────────────────────────────────────────────────── */}
        {tab === 'contenido' && (
          <div className="space-y-5">
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
              <h3 className="font-bold text-sm mb-1">Negocios destacados en la landing</h3>
              <p className="text-xs text-gray-500">Estos nombres aparecen en la sección "Negocios que ya están en la red" de la página <strong>Vincular tu negocio</strong>.</p>
            </div>

            {/* Lista editable */}
            <div className="space-y-2">
              {aliados.map((a, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5">
                  <MapPin size={14} className="text-teal-400 shrink-0" />
                  <input value={a} onChange={e => setAliados(prev => prev.map((x, j) => j === i ? e.target.value : x))}
                    className="flex-1 bg-transparent text-sm text-white focus:outline-none placeholder-gray-600" />
                  <button onClick={() => setAliados(prev => prev.filter((_, j) => j !== i))}
                    className="p-1 hover:bg-gray-700 rounded-lg text-gray-500 hover:text-red-400 transition-colors shrink-0">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            {/* Agregar */}
            <div className="flex gap-2">
              <input value={newAliado} onChange={e => setNewAliado(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && newAliado.trim()) { setAliados(p => [...p, newAliado.trim()]); setNewAliado(''); } }}
                placeholder="Nombre del negocio..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 text-white placeholder-gray-600" />
              <button
                onClick={() => { if (newAliado.trim()) { setAliados(p => [...p, newAliado.trim()]); setNewAliado(''); } }}
                disabled={!newAliado.trim()}
                className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 rounded-xl text-sm font-bold text-white transition-colors">
                <Plus size={16} />
              </button>
            </div>

            {contMsg && (
              <p className={`text-sm font-medium ${contMsg.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>{contMsg}</p>
            )}

            <button onClick={saveContenido} disabled={contSaving}
              className="w-full py-4 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-black text-sm flex items-center justify-center gap-2 transition-colors">
              {contSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              {contSaving ? 'Guardando...' : 'Guardar cambios en la landing'}
            </button>

            <p className="text-xs text-gray-600 text-center">
              Los cambios se reflejan en guanago.travel en la próxima carga de la página.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminRedAliados;

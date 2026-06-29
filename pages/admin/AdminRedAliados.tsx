import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, MapPin, Edit3, Plus, Trash2, RefreshCw,
  Search, MessageCircle, Save, X, Store, ClipboardList,
  LayoutList, ChevronRight, FileText, Camera, Hash,
  CheckSquare, Square, Globe, Instagram, DollarSign,
  Type, Wrench, ChevronDown, ChevronUp,
} from 'lucide-react';
import { AppRoute } from '../../types';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';

interface Props {
  onBack: () => void;
  onNavigate: (route: AppRoute) => void;
}

const API_BASE = import.meta.env.VITE_API_URL || '';

const CATEGORIAS_NEGOCIO = [
  'Restaurante', 'Bar', 'Hotel', 'Alojamiento', 'Tour', 'Transporte',
  'Tienda', 'Artesanías', 'Experiencia', 'Servicios', 'General',
];
const CATEGORIAS_POI = [
  'Playa', 'Monumento', 'Iglesia', 'Aviso / Letrero', 'Mirador',
  'Parque', 'Atractivo Natural', 'Otro lugar',
];
const PLANES  = ['', 'Básico', 'Activo', 'Premium'];
const ESTADOS = ['activo', 'inactivo', 'pendiente'];
const TIPO_ENTRADA = ['Negocio', 'Punto de Interés'] as const;

const DOCS_CHECKLIST = [
  'Cámara de Comercio',
  'Cédula del propietario',
  'RUT',
  'RNT vigente',
  'Cuenta bancaria',
  'Contrato firmado',
  'Fotos del negocio',
  'Logo alta resolución',
];

const ALIADOS_DEFAULT = [
  'Bushi Food', 'Bobby Rock', 'Capy Beach',
  'Casa Las Palmas', 'Capitán Mandy', 'Dreamer', 'Sweet Avenue Café',
];

type Tab = 'directorio' | 'inscritos' | 'contenido';

interface DirEntry {
  id: string; name: string; category: string; tipo_entrada: string;
  address: string; phone: string; email: string; description: string;
  servicios: string; website: string; instagram: string; facebook: string;
  tiktok: string; hours: string; estado: string; plan: string;
  rnt: string; responsable: string; slug: string; whatsapp: string;
  documentos: string;
}

interface Lead {
  id: string; nombre: string; whatsapp: string; tipo: string; estado: string;
  ref: string; detalles: string; createdTime: string;
}

const EMPTY_FORM: Omit<DirEntry, 'id' | 'slug' | 'whatsapp'> = {
  tipo_entrada: 'Negocio', name: '', category: 'General', address: '',
  phone: '', email: '', description: '', servicios: '', website: '',
  instagram: '', facebook: '', tiktok: '', hours: '', estado: 'activo',
  plan: '', rnt: '', responsable: '', documentos: '',
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
  'Básico':  'bg-teal-900/50 text-teal-400',
  'Activo':  'bg-orange-900/50 text-orange-400',
  'Premium': 'bg-indigo-900/50 text-indigo-400',
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

  const upd = (field: string) => (v: string) => setForm(f => ({ ...f, [field]: v }));

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
    setForm({
      tipo_entrada: e.tipo_entrada || 'Negocio',
      name: e.name, category: e.category, address: e.address,
      phone: e.phone, email: e.email, description: e.description,
      servicios: e.servicios || '', website: e.website,
      instagram: e.instagram || '', facebook: e.facebook || '',
      tiktok: e.tiktok || '', hours: e.hours, estado: e.estado,
      plan: e.plan, rnt: e.rnt, responsable: e.responsable,
      documentos: e.documentos || '',
    });
    setFormOpen(true);
  };
  const closeForm = () => { setFormOpen(false); setEditing(null); setSaveMsg(''); };

  const handleSave = async () => {
    if (!form.name.trim()) { setSaveMsg('El nombre es requerido'); return; }
    setSaving(true); setSaveMsg('');
    try {
      const url    = editing ? `${API_BASE}/api/directory/${editing.id}` : `${API_BASE}/api/directory`;
      const method = editing ? 'PATCH' : 'POST';
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const d = await r.json();
      if (d.success) { setSaveMsg(editing ? '✅ Actualizado' : '✅ Creado'); loadDirectorio(); setTimeout(closeForm, 1200); }
      else setSaveMsg('❌ ' + (d.error || 'Error al guardar'));
    } catch { setSaveMsg('❌ Error de conexión'); }
    finally { setSaving(false); }
  };

  const toggleDoc = (docName: string) => {
    const list = form.documentos ? form.documentos.split(',').map(s => s.trim()).filter(Boolean) : [];
    const next = list.includes(docName) ? list.filter(x => x !== docName) : [...list, docName];
    setForm(f => ({ ...f, documentos: next.join(', ') }));
  };
  const hasDoc = (docName: string) =>
    form.documentos ? form.documentos.split(',').map(s => s.trim()).includes(docName) : false;

  const categoriasActuales = form.tipo_entrada === 'Punto de Interés' ? CATEGORIAS_POI : CATEGORIAS_NEGOCIO;

  const filteredDir = dirList.filter(e => {
    const q = dirSearch.toLowerCase();
    const matchSearch = !q || e.name?.toLowerCase().includes(q) || e.responsable?.toLowerCase().includes(q);
    const matchCat    = dirCat === 'Todos' || e.category === dirCat;
    return matchSearch && matchCat;
  });

  const negociosCount = dirList.filter(e => (e.tipo_entrada || 'Negocio') === 'Negocio').length;
  const poiCount      = dirList.filter(e => e.tipo_entrada === 'Punto de Interés').length;

  // ── Inscritos ─────────────────────────────────────────────────────────────────
  const [leads, setLeads]               = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);

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
      tipo_entrada: 'Negocio',
      name: det['NEGOCIO'] || lead.nombre, category: det['TIPO'] || 'General',
      address: '', phone: lead.whatsapp, email: '',
      description: det['CANAL'] ? `Canal actual: ${det['CANAL']}` : '',
      servicios: '', website: '', instagram: '', facebook: '', tiktok: '',
      hours: '', estado: 'pendiente', plan: det['PLAN_RECOMENDADO'] || '',
      rnt: '', responsable: lead.nombre, documentos: '',
    });
    setEditing(null);
    setTab('directorio');
    setFormOpen(true);
  };

  // ── Contenido ─────────────────────────────────────────────────────────────────
  type ContSec = 'landing' | 'planes' | 'servicios' | 'diagnostico';
  const [contSec, setContSec] = useState<ContSec>('landing');
  const [contLoaded, setContLoaded] = useState(false);

  // Landing
  const [aliadosDestacados, setAliadosDestacados] = useState<string[]>(ALIADOS_DEFAULT);
  const [newAliado, setNewAliado]                 = useState('');
  const [textos, setTextos] = useState({
    heroTitulo:    'Tu negocio en el mapa de San Andrés',
    heroSubtitulo: 'Únete a la red de negocios locales que conectan con miles de turistas que visitan la isla cada mes.',
    waNumero:      '573153836043',
    subtituloPlanes: 'Sin contratos. Cancela cuando quieras.',
  });
  const [landingSaving, setLandingSaving] = useState(false);
  const [landingMsg, setLandingMsg]       = useState('');

  // Planes
  const PLANES_DEFAULT = [
    { id: 'basico',   nombre: 'Básico',         precio: 0,      label: 'Gratis',         descripcion: 'Empieza a ser visible en GuanaGO', popular: false,
      features: [
        { texto: 'Ficha en directorio GuanaGO', ok: true },
        { texto: 'Código QR personalizado',     ok: true },
        { texto: 'Visibilidad digital básica',  ok: true },
        { texto: 'Panel de negocio básico',     ok: true },
        { texto: 'Pin en mapa interactivo',     ok: false },
        { texto: 'GuanaPoints para clientes',   ok: false },
        { texto: 'Creación de contenido',       ok: false },
      ]},
    { id: 'activo',   nombre: 'Aliado Activo',  precio: 49900,  label: '$49.900/mes',    descripcion: 'Con pin en el mapa para turistas que caminan la isla', popular: true,
      features: [
        { texto: 'Todo lo del plan Básico',          ok: true },
        { texto: 'Pin de ubicación en el mapa',      ok: true },
        { texto: 'GuanaPoints para tus clientes',    ok: true },
        { texto: 'Prioridad en búsquedas',           ok: true },
        { texto: 'Insignia "Aliado Verificado"',     ok: true },
        { texto: 'Notificaciones en tiempo real',    ok: true },
        { texto: 'Soporte prioritario WhatsApp',     ok: true },
        { texto: 'Creación de contenido mensual',    ok: false },
      ]},
    { id: 'premium',  nombre: 'Aliado Premium', precio: 129900, label: '$129.900/mes',   descripcion: 'El paquete completo para crecer de verdad', popular: false,
      features: [
        { texto: 'Todo lo del plan Activo',              ok: true },
        { texto: 'Posición destacada (aparece primero)', ok: true },
        { texto: 'Creación de contenido mensual',        ok: true },
        { texto: 'Analytics de visitas e interacciones', ok: true },
        { texto: 'Gestor de cuenta dedicado',            ok: true },
        { texto: 'Badge verificado Premium',             ok: true },
        { texto: 'Material impreso QR + sticker',        ok: true },
      ]},
  ];
  const [planes, setPlanes]       = useState(PLANES_DEFAULT);
  const [openPlanEdit, setOpenPlanEdit] = useState<string | null>('activo');
  const [planesSaving, setPlanesSaving] = useState(false);
  const [planesMsg, setPlanesMsg]       = useState('');

  // Servicios adicionales
  const SERVICIOS_DEFAULT = [
    { id: 'social',  titulo: 'Gestión de redes sociales',  descripcion: 'Publicaciones semanales en Instagram y Facebook con diseño profesional.', precio: 'Desde $120.000/mes', activo: true },
    { id: 'reels',   titulo: 'Producción de Reels',        descripcion: 'Un Reel mensual filmado y editado en tu negocio para Instagram y TikTok.', precio: 'Desde $200.000/Reel', activo: true },
    { id: 'web',     titulo: 'Micrositio Pro',             descripcion: 'Página personalizada con menú, galería, reservas y whatsapp directo.', precio: 'Desde $350.000', activo: true },
    { id: 'fotog',   titulo: 'Sesión fotográfica',         descripcion: 'Fotos profesionales de tu negocio, platos o experiencias para redes y mapa.', precio: 'Desde $180.000', activo: false },
  ];
  const [serviciosAd, setServiciosAd]   = useState(SERVICIOS_DEFAULT);
  const [servSaving, setServSaving]     = useState(false);
  const [servMsg, setServMsg]           = useState('');
  const [newServ, setNewServ] = useState({ titulo: '', descripcion: '', precio: '' });

  // Diagnóstico
  const PREGUNTAS_DEFAULT = [
    { id: 'tipo',    texto: '¿Qué tipo de negocio tienes?',            opciones: ['Restaurante / bar', 'Hotel / alojamiento', 'Tour / excursión / buceo', 'Transporte (taxis, lanchas)', 'Tienda / artesanías', 'Experiencia cultural / música', 'Otro'] },
    { id: 'canal',   texto: '¿Cómo consigues clientes hoy?',           opciones: ['Recomendaciones de boca en boca', 'Redes sociales (Instagram / TikTok)', 'Agencias / tour operadores', 'Sin canal digital definido'] },
    { id: 'interes', texto: '¿Qué te interesa más de la red GuanaGO?', opciones: ['Solo quiero estar en el mapa', 'Me interesa recibir referidos de otros negocios', 'Quiero el paquete completo (crecer de verdad)'] },
  ];
  const [preguntas, setPreguntas]   = useState(PREGUNTAS_DEFAULT);
  const [diagSaving, setDiagSaving] = useState(false);
  const [diagMsg, setDiagMsg]       = useState('');

  useEffect(() => {
    if (tab !== 'contenido' || contLoaded) return;
    getDoc(doc(db, 'docs_content', 'vinculacion-config'))
      .then(snap => {
        if (snap.exists()) {
          const d = snap.data();
          if (Array.isArray(d.aliadosDestacados) && d.aliadosDestacados.length > 0) setAliadosDestacados(d.aliadosDestacados);
          if (d.textos) setTextos(t => ({ ...t, ...d.textos }));
          if (Array.isArray(d.planes) && d.planes.length > 0) setPlanes(d.planes);
          if (Array.isArray(d.serviciosAdicionales) && d.serviciosAdicionales.length > 0) setServiciosAd(d.serviciosAdicionales);
        }
        setContLoaded(true);
      }).catch(() => setContLoaded(true));

    getDoc(doc(db, 'docs_content', 'diagnostico-config'))
      .then(snap => {
        if (snap.exists()) {
          const d = snap.data();
          if (Array.isArray(d.preguntas) && d.preguntas.length > 0) setPreguntas(d.preguntas);
        }
      }).catch(() => {});
  }, [tab, contLoaded]);

  const saveLanding = async () => {
    setLandingSaving(true); setLandingMsg('');
    try {
      const snap = await getDoc(doc(db, 'docs_content', 'vinculacion-config'));
      const existing = snap.exists() ? snap.data() : {};
      await setDoc(doc(db, 'docs_content', 'vinculacion-config'), {
        ...existing, aliadosDestacados, textos,
        updatedAt: serverTimestamp(), updatedBy: auth.currentUser?.email || 'admin',
      });
      setLandingMsg('✅ Guardado.');
    } catch { setLandingMsg('❌ Error al guardar'); }
    finally { setLandingSaving(false); }
  };

  const savePlanes = async () => {
    setPlanesSaving(true); setPlanesMsg('');
    try {
      const snap = await getDoc(doc(db, 'docs_content', 'vinculacion-config'));
      const existing = snap.exists() ? snap.data() : {};
      await setDoc(doc(db, 'docs_content', 'vinculacion-config'), {
        ...existing, planes,
        updatedAt: serverTimestamp(), updatedBy: auth.currentUser?.email || 'admin',
      });
      setPlanesMsg('✅ Planes guardados. La landing los usa en la próxima carga.');
    } catch { setPlanesMsg('❌ Error al guardar'); }
    finally { setPlanesSaving(false); }
  };

  const saveServicios = async () => {
    setServSaving(true); setServMsg('');
    try {
      const snap = await getDoc(doc(db, 'docs_content', 'vinculacion-config'));
      const existing = snap.exists() ? snap.data() : {};
      await setDoc(doc(db, 'docs_content', 'vinculacion-config'), {
        ...existing, serviciosAdicionales: serviciosAd,
        updatedAt: serverTimestamp(), updatedBy: auth.currentUser?.email || 'admin',
      });
      setServMsg('✅ Servicios guardados.');
    } catch { setServMsg('❌ Error al guardar'); }
    finally { setServSaving(false); }
  };

  const saveDiagnostico = async () => {
    setDiagSaving(true); setDiagMsg('');
    try {
      await setDoc(doc(db, 'docs_content', 'diagnostico-config'), {
        preguntas, updatedAt: serverTimestamp(), updatedBy: auth.currentUser?.email || 'admin',
      });
      setDiagMsg('✅ Preguntas guardadas.');
    } catch { setDiagMsg('❌ Error al guardar'); }
    finally { setDiagSaving(false); }
  };

  // Helpers — planes
  const updFeature   = (pi: number, fi: number, field: 'texto' | 'ok', val: string | boolean) =>
    setPlanes(ps => ps.map((p, i) => i !== pi ? p : { ...p, features: p.features.map((f, j) => j !== fi ? f : { ...f, [field]: val }) }));
  const addFeature   = (pi: number) =>
    setPlanes(ps => ps.map((p, i) => i !== pi ? p : { ...p, features: [...p.features, { texto: 'Nuevo beneficio', ok: true }] }));
  const removeFeature = (pi: number, fi: number) =>
    setPlanes(ps => ps.map((p, i) => i !== pi ? p : { ...p, features: p.features.filter((_, j) => j !== fi) }));
  const updPlan = (pi: number, field: string, val: string | number | boolean) =>
    setPlanes(ps => ps.map((p, i) => i !== pi ? p : { ...p, [field]: val }));

  // Helpers — diagnóstico
  const updOpcion    = (pi: number, oi: number, val: string) =>
    setPreguntas(ps => ps.map((p, i) => i !== pi ? p : { ...p, opciones: p.opciones.map((o, j) => j !== oi ? o : val) }));
  const removeOpcion = (pi: number, oi: number) =>
    setPreguntas(ps => ps.map((p, i) => i !== pi ? p : { ...p, opciones: p.opciones.filter((_, j) => j !== oi) }));
  const addOpcion    = (pi: number) =>
    setPreguntas(ps => ps.map((p, i) => i !== pi ? p : { ...p, opciones: [...p.opciones, 'Nueva opción'] }));
  const updPregunta  = (pi: number, texto: string) =>
    setPreguntas(ps => ps.map((p, i) => i !== pi ? p : { ...p, texto }));

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
            <p className="text-xs text-gray-500">Directorio · Inscritos · Contenido</p>
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
                  placeholder="Buscar..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-teal-500 placeholder-gray-600" />
              </div>
              <select value={dirCat} onChange={e => setDirCat(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
                <option value="Todos">Todos</option>
                <optgroup label="Negocios">{CATEGORIAS_NEGOCIO.map(c => <option key={c}>{c}</option>)}</optgroup>
                <optgroup label="POI">{CATEGORIAS_POI.map(c => <option key={c}>{c}</option>)}</optgroup>
              </select>
              <button onClick={loadDirectorio} className="p-2 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-700 transition-colors">
                <RefreshCw size={16} className={dirLoading ? 'animate-spin text-teal-400' : 'text-gray-400'} />
              </button>
              <button onClick={openNew}
                className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-500 rounded-xl text-sm font-bold transition-colors whitespace-nowrap">
                <Plus size={15} /> Agregar
              </button>
            </div>

            {/* Stats */}
            <div className="flex gap-3 text-xs text-gray-500">
              <span>{filteredDir.length} / {dirList.length} total</span>
              <span>·</span>
              <span>{negociosCount} negocios</span>
              <span>·</span>
              <span>{poiCount} POI</span>
              <span>·</span>
              <span>{dirList.filter(e => e.plan === 'Activo' || e.plan === 'Premium').length} en mapa</span>
            </div>

            {/* List */}
            {dirLoading ? (
              <div className="flex justify-center py-16"><RefreshCw size={28} className="animate-spin text-teal-500" /></div>
            ) : filteredDir.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">Sin resultados</div>
            ) : (
              <div className="space-y-2">
                {filteredDir.map(e => {
                  const isPOI = e.tipo_entrada === 'Punto de Interés';
                  return (
                    <div key={e.id} className="bg-gray-800 border border-gray-700 rounded-xl p-3 flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isPOI ? 'bg-cyan-900/40' : 'bg-gray-700'}`}>
                        {isPOI ? <MapPin size={16} className="text-cyan-400" /> : <Store size={16} className="text-teal-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{e.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[10px] text-gray-500">{e.category}</span>
                          {isPOI && <span className="text-[9px] bg-cyan-900/40 text-cyan-400 px-1.5 py-0.5 rounded-full font-bold">POI</span>}
                          {e.plan && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${PLAN_COLOR[e.plan] || 'bg-gray-700 text-gray-400'}`}>{e.plan}</span>}
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${ESTADO_COLOR[e.estado] || 'bg-gray-700 text-gray-400'}`}>{e.estado}</span>
                          {e.instagram && <Instagram size={11} className="text-pink-400" />}
                          {e.website && <Globe size={11} className="text-blue-400" />}
                          {(e.whatsapp || e.phone) && (
                            <a href={`https://wa.me/${(e.whatsapp || e.phone).replace(/\D/g, '')}`}
                              target="_blank" rel="noreferrer"
                              className="text-green-400" onClick={ev => ev.stopPropagation()}>
                              <MessageCircle size={12} />
                            </a>
                          )}
                        </div>
                      </div>
                      <button onClick={() => openEdit(e)} className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors shrink-0">
                        <Edit3 size={14} className="text-gray-400" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Form modal */}
            {formOpen && (
              <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center">
                <div className="bg-gray-900 w-full max-w-lg rounded-t-3xl max-h-[94vh] overflow-y-auto">
                  <div className="sticky top-0 bg-gray-900 px-5 pt-5 pb-3 border-b border-gray-800 flex items-center justify-between z-10">
                    <h2 className="font-black text-base">{editing ? 'Editar registro' : 'Agregar registro'}</h2>
                    <button onClick={closeForm} className="p-2 hover:bg-gray-800 rounded-xl"><X size={18} /></button>
                  </div>
                  <div className="px-5 py-4 space-y-4">

                    {/* Tipo de entrada */}
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Tipo de registro</label>
                      <div className="flex gap-2">
                        {TIPO_ENTRADA.map(t => (
                          <button key={t} onClick={() => setForm(f => ({
                            ...f, tipo_entrada: t,
                            category: t === 'Punto de Interés' ? 'Playa' : 'General',
                          }))}
                            className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition-colors ${
                              form.tipo_entrada === t
                                ? t === 'Punto de Interés'
                                  ? 'border-cyan-500 bg-cyan-900/30 text-cyan-300'
                                  : 'border-teal-500 bg-teal-900/30 text-teal-300'
                                : 'border-gray-700 text-gray-500 hover:border-gray-600'}`}>
                            {t === 'Negocio' ? '🏪 Negocio' : '📍 Punto de Interés'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <FormField label="Nombre *" value={form.name} onChange={upd('name')}
                      placeholder={form.tipo_entrada === 'Negocio' ? 'Ej: Bushi Food' : 'Ej: Playa Spratt Bight'} />

                    <div className="grid grid-cols-2 gap-3">
                      <SelectField label="Categoría" value={form.category} onChange={upd('category')} options={categoriasActuales} />
                      {form.tipo_entrada === 'Negocio'
                        ? <SelectField label="Plan" value={form.plan} onChange={upd('plan')} options={PLANES} />
                        : <SelectField label="Estado" value={form.estado} onChange={upd('estado')} options={ESTADOS} />
                      }
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Teléfono / WhatsApp" value={form.phone} onChange={upd('phone')} placeholder="+57 310..." />
                      <FormField label="Email" value={form.email} onChange={upd('email')} placeholder="correo@..." type="email" />
                    </div>

                    <FormField label="Dirección" value={form.address} onChange={upd('address')} placeholder="Ej: Av. Colón #5-12" />
                    <FormField label="Descripción" value={form.description} onChange={upd('description')} placeholder="Breve descripción..." textarea />

                    {form.tipo_entrada === 'Negocio' && (
                      <FormField label="Productos / Servicios" value={form.servicios} onChange={upd('servicios')}
                        placeholder="Ej: Almuerzo ejecutivo, ceviche, jugos naturales..." textarea />
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Horarios" value={form.hours} onChange={upd('hours')} placeholder="Lun–Sab 8am–8pm" />
                      {form.tipo_entrada === 'Negocio' && (
                        <FormField label="RNT" value={form.rnt} onChange={upd('rnt')} placeholder="Número RNT" />
                      )}
                    </div>

                    <FormField label="Sitio web" value={form.website} onChange={upd('website')} placeholder="https://..." type="url" />

                    {form.tipo_entrada === 'Negocio' && (
                      <div className="grid grid-cols-3 gap-2">
                        <FormField label="Instagram" value={form.instagram} onChange={upd('instagram')} placeholder="@usuario" />
                        <FormField label="Facebook"  value={form.facebook}  onChange={upd('facebook')}  placeholder="@pagina"  />
                        <FormField label="TikTok"    value={form.tiktok}    onChange={upd('tiktok')}    placeholder="@usuario" />
                      </div>
                    )}

                    {form.tipo_entrada === 'Negocio' && (
                      <div className="grid grid-cols-2 gap-3">
                        <FormField label="Responsable" value={form.responsable} onChange={upd('responsable')} placeholder="Nombre del encargado" />
                        <SelectField label="Estado" value={form.estado} onChange={upd('estado')} options={ESTADOS} />
                      </div>
                    )}

                    {/* Documentos recibidos */}
                    {form.tipo_entrada === 'Negocio' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">Documentos recibidos</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {DOCS_CHECKLIST.map(d => (
                            <button key={d} onClick={() => toggleDoc(d)}
                              className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-xs text-left transition-colors ${
                                hasDoc(d)
                                  ? 'border-teal-600/60 bg-teal-900/20 text-teal-300'
                                  : 'border-gray-700 text-gray-500 hover:border-gray-600'}`}>
                              {hasDoc(d)
                                ? <CheckSquare size={13} className="text-teal-400 shrink-0" />
                                : <Square size={13} className="text-gray-600 shrink-0" />}
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {saveMsg && (
                      <p className={`text-sm font-medium ${saveMsg.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>{saveMsg}</p>
                    )}

                    <button onClick={handleSave} disabled={saving}
                      className="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-black text-sm flex items-center justify-center gap-2 transition-colors">
                      {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                      {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear registro'}
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
                <p className="text-xs text-gray-500 mt-0.5">Formulario "Hacer mi diagnóstico" desde la landing</p>
              </div>
              <button onClick={loadLeads} className="p-2 hover:bg-gray-800 rounded-xl transition-colors">
                <RefreshCw size={16} className={leadsLoading ? 'animate-spin text-teal-400' : 'text-gray-400'} />
              </button>
            </div>

            {leadsLoading ? (
              <div className="flex justify-center py-12"><RefreshCw size={24} className="animate-spin text-orange-500" /></div>
            ) : leads.length === 0 ? (
              <div className="text-center py-12 bg-gray-800/40 rounded-xl border border-gray-700">
                <ClipboardList size={40} className="mx-auto text-gray-600 mb-3" />
                <p className="text-gray-400 text-sm font-medium">Sin diagnósticos aún</p>
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
                          {det['TIPO']             && <p>Tipo: <span className="text-gray-300">{det['TIPO']}</span></p>}
                          {det['CANAL']            && <p>Canal: <span className="text-gray-300">{det['CANAL']}</span></p>}
                          {det['TEMPORADA_BAJA']   && <p>Temporada baja: <span className="text-gray-300">{det['TEMPORADA_BAJA']}</span></p>}
                          {det['PLAN_RECOMENDADO'] && (
                            <p>Plan: <span className={`font-bold ${
                              det['PLAN_RECOMENDADO'] === 'Aliado Premium' ? 'text-indigo-400'
                              : det['PLAN_RECOMENDADO'] === 'Aliado Activo' ? 'text-orange-400'
                              : 'text-teal-400'}`}>{det['PLAN_RECOMENDADO']}</span></p>
                          )}
                        </div>
                        {lead.whatsapp && <p className="text-xs text-gray-400 mt-1.5">📞 {lead.whatsapp}</p>}
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
          <div className="space-y-4">

            {/* Sub-nav */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {([
                { id: 'landing',     label: 'Landing',    icon: Type        },
                { id: 'planes',      label: 'Planes',     icon: DollarSign  },
                { id: 'servicios',   label: 'Servicios+', icon: Wrench      },
                { id: 'diagnostico', label: 'Diagnóstico',icon: ClipboardList },
              ] as const).map(s => (
                <button key={s.id} onClick={() => setContSec(s.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    contSec === s.id ? 'bg-gray-700 text-white' : 'bg-gray-800/60 text-gray-500 hover:text-gray-300'}`}>
                  <s.icon size={12} /> {s.label}
                </button>
              ))}
            </div>

            {/* ── LANDING ── */}
            {contSec === 'landing' && (
              <div className="space-y-5">
                {/* Textos del hero */}
                <div className="space-y-3">
                  <h3 className="font-bold text-sm">Textos principales</h3>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Título del hero</label>
                    <input value={textos.heroTitulo} onChange={e => setTextos(t => ({ ...t, heroTitulo: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500 text-white" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Subtítulo del hero</label>
                    <textarea value={textos.heroSubtitulo} onChange={e => setTextos(t => ({ ...t, heroSubtitulo: e.target.value }))}
                      rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500 text-white resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">WhatsApp (sin +)</label>
                      <input value={textos.waNumero} onChange={e => setTextos(t => ({ ...t, waNumero: e.target.value }))}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500 text-white" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Subtítulo sección planes</label>
                      <input value={textos.subtituloPlanes} onChange={e => setTextos(t => ({ ...t, subtituloPlanes: e.target.value }))}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500 text-white" />
                    </div>
                  </div>
                </div>

                {/* Aliados destacados */}
                <div className="border-t border-gray-800 pt-4 space-y-3">
                  <h3 className="font-bold text-sm">Negocios destacados</h3>
                  <p className="text-xs text-gray-500 -mt-2">Aparecen como chips en "Negocios que ya están en la red"</p>
                  {aliadosDestacados.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5">
                      <MapPin size={14} className="text-teal-400 shrink-0" />
                      <input value={a} onChange={e => setAliadosDestacados(prev => prev.map((x, j) => j === i ? e.target.value : x))}
                        className="flex-1 bg-transparent text-sm text-white focus:outline-none" />
                      <button onClick={() => setAliadosDestacados(prev => prev.filter((_, j) => j !== i))}
                        className="p-1 hover:bg-gray-700 rounded-lg text-gray-500 hover:text-red-400 shrink-0">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input value={newAliado} onChange={e => setNewAliado(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && newAliado.trim()) { setAliadosDestacados(p => [...p, newAliado.trim()]); setNewAliado(''); } }}
                      placeholder="Nombre del negocio..."
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 text-white placeholder-gray-600" />
                    <button onClick={() => { if (newAliado.trim()) { setAliadosDestacados(p => [...p, newAliado.trim()]); setNewAliado(''); } }}
                      disabled={!newAliado.trim()}
                      className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 rounded-xl font-bold text-white transition-colors">
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {landingMsg && <p className={`text-sm font-medium ${landingMsg.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>{landingMsg}</p>}
                <button onClick={saveLanding} disabled={landingSaving}
                  className="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-black text-sm flex items-center justify-center gap-2 transition-colors">
                  {landingSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                  {landingSaving ? 'Guardando...' : 'Guardar textos + aliados'}
                </button>

                {/* Link Documentos */}
                <div className="border-t border-gray-800 pt-4">
                  <button onClick={() => { onBack(); setTimeout(() => onNavigate(AppRoute.ADMIN_ALIADOS), 50); }}
                    className="w-full flex items-center gap-4 bg-gray-800/50 border border-gray-700 rounded-2xl p-4 hover:bg-gray-800 transition-colors text-left">
                    <FileText size={22} className="text-purple-400 shrink-0" />
                    <div className="flex-1">
                      <p className="font-bold text-sm">Documentos & Kits</p>
                      <p className="text-xs text-gray-500 mt-0.5">Contratos, kits de bienvenida, material impreso</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-600 shrink-0" />
                  </button>
                  <div className="flex items-center gap-3 bg-gray-800/40 border border-dashed border-gray-700 rounded-xl p-3 mt-2">
                    <Camera size={16} className="text-gray-600 shrink-0" />
                    <p className="text-xs text-gray-600">Fotos → campo <code className="bg-gray-700 px-1 rounded text-[10px]">Imagen</code> en Airtable Directorio_Mapa.</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── PLANES ── */}
            {contSec === 'planes' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-sm">Editor de planes</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Edita nombres, precios y beneficios de cada plan</p>
                </div>
                {planes.map((plan, pi) => (
                  <div key={plan.id} className="bg-gray-800/60 border border-gray-700 rounded-xl overflow-hidden">
                    <button onClick={() => setOpenPlanEdit(openPlanEdit === plan.id ? null : plan.id)}
                      className="w-full px-4 py-3 flex items-center gap-3 text-left">
                      <div className="flex-1">
                        <p className="font-bold text-sm text-white">{plan.nombre}</p>
                        <p className="text-xs text-gray-400">{plan.label}</p>
                      </div>
                      {plan.popular && <span className="text-[9px] bg-orange-500 text-white px-2 py-0.5 rounded-full font-black">Popular</span>}
                      {openPlanEdit === plan.id ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
                    </button>
                    {openPlanEdit === plan.id && (
                      <div className="px-4 pb-4 border-t border-gray-700 space-y-3 pt-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Nombre del plan</label>
                            <input value={plan.nombre} onChange={e => updPlan(pi, 'nombre', e.target.value)}
                              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500 text-white" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Etiqueta precio (ej: $49.900/mes)</label>
                            <input value={plan.label} onChange={e => updPlan(pi, 'label', e.target.value)}
                              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500 text-white" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Precio en COP (número)</label>
                            <input type="number" value={plan.precio} onChange={e => updPlan(pi, 'precio', Number(e.target.value))}
                              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500 text-white" />
                          </div>
                          <div className="flex items-center gap-2 mt-4">
                            <button onClick={() => updPlan(pi, 'popular', !plan.popular)}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold transition-colors ${plan.popular ? 'border-orange-500 bg-orange-900/20 text-orange-400' : 'border-gray-700 text-gray-500'}`}>
                              {plan.popular ? <CheckSquare size={13} /> : <Square size={13} />}
                              Popular
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Descripción breve</label>
                          <input value={plan.descripcion} onChange={e => updPlan(pi, 'descripcion', e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500 text-white" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-2">Beneficios</label>
                          <div className="space-y-1.5">
                            {plan.features.map((f, fi) => (
                              <div key={fi} className="flex items-center gap-2">
                                <button onClick={() => updFeature(pi, fi, 'ok', !f.ok)}
                                  className={`shrink-0 p-1 rounded transition-colors ${f.ok ? 'text-teal-400' : 'text-gray-600'}`}>
                                  {f.ok ? <CheckSquare size={14} /> : <Square size={14} />}
                                </button>
                                <input value={f.texto} onChange={e => updFeature(pi, fi, 'texto', e.target.value)}
                                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-teal-500 text-white" />
                                <button onClick={() => removeFeature(pi, fi)} className="p-1 text-gray-600 hover:text-red-400 shrink-0"><X size={11} /></button>
                              </div>
                            ))}
                            <button onClick={() => addFeature(pi)}
                              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-teal-400 transition-colors pl-7 py-1">
                              <Plus size={11} /> Agregar beneficio
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {planesMsg && <p className={`text-sm font-medium ${planesMsg.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>{planesMsg}</p>}
                <button onClick={savePlanes} disabled={planesSaving}
                  className="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-black text-sm flex items-center justify-center gap-2 transition-colors">
                  {planesSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                  {planesSaving ? 'Guardando...' : 'Guardar planes'}
                </button>
              </div>
            )}

            {/* ── SERVICIOS ADICIONALES ── */}
            {contSec === 'servicios' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-sm">Servicios adicionales</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Aparecen en una sección extra de la landing — desarrollo web, redes, fotografía, etc.</p>
                </div>
                {serviciosAd.map((s, si) => (
                  <div key={s.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 space-y-2">
                        <input value={s.titulo} onChange={e => setServiciosAd(ss => ss.map((x, i) => i !== si ? x : { ...x, titulo: e.target.value }))}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:border-teal-500 text-white" placeholder="Título del servicio" />
                        <textarea value={s.descripcion} onChange={e => setServiciosAd(ss => ss.map((x, i) => i !== si ? x : { ...x, descripcion: e.target.value }))}
                          rows={2} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-teal-500 text-white resize-none placeholder-gray-500" placeholder="Descripción" />
                        <input value={s.precio} onChange={e => setServiciosAd(ss => ss.map((x, i) => i !== si ? x : { ...x, precio: e.target.value }))}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-teal-500 text-white" placeholder="Precio (ej: Desde $120.000/mes)" />
                      </div>
                      <div className="flex flex-col gap-1.5 shrink-0">
                        <button onClick={() => setServiciosAd(ss => ss.map((x, i) => i !== si ? x : { ...x, activo: !x.activo }))}
                          className={`px-2 py-1.5 rounded-lg border text-[10px] font-bold transition-colors ${s.activo ? 'border-green-600/60 bg-green-900/20 text-green-400' : 'border-gray-700 text-gray-500'}`}>
                          {s.activo ? 'Visible' : 'Oculto'}
                        </button>
                        <button onClick={() => setServiciosAd(ss => ss.filter((_, i) => i !== si))}
                          className="p-1.5 bg-gray-700 hover:bg-red-900/30 rounded-lg text-gray-500 hover:text-red-400 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Agregar nuevo */}
                <div className="bg-gray-800/40 border border-dashed border-gray-700 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-bold text-gray-400">Nuevo servicio</p>
                  <input value={newServ.titulo} onChange={e => setNewServ(s => ({ ...s, titulo: e.target.value }))}
                    placeholder="Título *" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500 text-white placeholder-gray-600" />
                  <input value={newServ.descripcion} onChange={e => setNewServ(s => ({ ...s, descripcion: e.target.value }))}
                    placeholder="Descripción" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-teal-500 text-white placeholder-gray-600" />
                  <input value={newServ.precio} onChange={e => setNewServ(s => ({ ...s, precio: e.target.value }))}
                    placeholder="Precio (ej: Desde $120.000/mes)" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-teal-500 text-white placeholder-gray-600" />
                  <button onClick={() => {
                    if (!newServ.titulo.trim()) return;
                    setServiciosAd(ss => [...ss, { id: Date.now().toString(), ...newServ, activo: true }]);
                    setNewServ({ titulo: '', descripcion: '', precio: '' });
                  }} disabled={!newServ.titulo.trim()}
                    className="w-full py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 rounded-lg text-sm font-bold text-white transition-colors flex items-center justify-center gap-1.5">
                    <Plus size={14} /> Agregar servicio
                  </button>
                </div>

                {servMsg && <p className={`text-sm font-medium ${servMsg.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>{servMsg}</p>}
                <button onClick={saveServicios} disabled={servSaving}
                  className="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-black text-sm flex items-center justify-center gap-2 transition-colors">
                  {servSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                  {servSaving ? 'Guardando...' : 'Guardar servicios adicionales'}
                </button>
              </div>
            )}

            {/* ── DIAGNÓSTICO ── */}
            {contSec === 'diagnostico' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-sm">Preguntas del diagnóstico</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Edita el formulario "Hacer mi diagnóstico" para aliados</p>
                </div>
                {preguntas.map((p, pi) => (
                  <div key={p.id} className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 space-y-2">
                    <input value={p.texto} onChange={e => updPregunta(pi, e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:border-teal-500 text-white" />
                    <div className="space-y-1.5 pl-1">
                      {p.opciones.map((o, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <Hash size={12} className="text-gray-600 shrink-0" />
                          <input value={o} onChange={e => updOpcion(pi, oi, e.target.value)}
                            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-teal-500 text-white" />
                          <button onClick={() => removeOpcion(pi, oi)} className="p-1 text-gray-600 hover:text-red-400 shrink-0"><X size={12} /></button>
                        </div>
                      ))}
                      <button onClick={() => addOpcion(pi)}
                        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-teal-400 transition-colors pl-5 py-1">
                        <Plus size={11} /> Agregar opción
                      </button>
                    </div>
                  </div>
                ))}
                {diagMsg && <p className={`text-sm font-medium ${diagMsg.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>{diagMsg}</p>}
                <button onClick={saveDiagnostico} disabled={diagSaving}
                  className="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-black text-sm flex items-center justify-center gap-2 transition-colors">
                  {diagSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                  {diagSaving ? 'Guardando...' : 'Guardar preguntas'}
                </button>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};

export default AdminRedAliados;

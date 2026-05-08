import React, { useState, useEffect } from 'react';
import {
  MapPin, Phone, Mail, Globe, Clock, LogOut, Loader2, RefreshCw,
  QrCode, Zap, Crown, Check, X, MessageCircle, Tag, HeadphonesIcon,
  Store, Plus, Trash2, Send, ChevronRight, Star, Gift, Percent,
  Calendar, AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AppRoute } from '../../types';

interface NegocioLocalPerfilProps {
  onLogout: () => void;
  onBack?: () => void;
  onNavigate?: (route: AppRoute) => void;
}

// ─── Planes ────────────────────────────────────────────────────────────────────
const PLANES_INFO = [
  {
    id: 'Básico',
    icon: QrCode,
    precio: 'Gratis',
    color: 'teal' as const,
    features: ['Ficha en directorio', 'Código QR personalizado', 'Visibilidad digital básica'],
    missing: ['Pin en mapa interactivo', 'GuanaPoints para clientes', 'Creación de contenido', 'Analytics avanzados'],
  },
  {
    id: 'Activo',
    icon: Zap,
    precio: '$49.900/mes',
    color: 'orange' as const,
    features: ['Todo lo de Básico', 'Pin en mapa interactivo', 'GuanaPoints para clientes', 'Prioridad en búsquedas', 'Insignia Aliado Verificado'],
    missing: ['Creación de contenido', 'Analytics avanzados'],
  },
  {
    id: 'Premium',
    icon: Crown,
    precio: '$129.900/mes',
    color: 'indigo' as const,
    features: ['Todo lo de Activo', 'Posición destacada', 'Creación de contenido mensual', 'Analytics de visitas', 'Gestor de cuenta dedicado'],
    missing: [],
  },
] as const;

const planColorMap = {
  teal:   { border: 'border-teal-600/60',   text: 'text-teal-400',   bg: 'bg-teal-900/30',   badge: 'bg-teal-600',   btn: 'bg-teal-700 hover:bg-teal-600' },
  orange: { border: 'border-orange-500/70', text: 'text-orange-400', bg: 'bg-orange-900/30', badge: 'bg-orange-500', btn: 'bg-orange-700 hover:bg-orange-600' },
  indigo: { border: 'border-indigo-600/60', text: 'text-indigo-400', bg: 'bg-indigo-900/30', badge: 'bg-indigo-600', btn: 'bg-indigo-700 hover:bg-indigo-600' },
};

// ─── Tipos de pestaña ──────────────────────────────────────────────────────────
type Tab = 'negocio' | 'planes' | 'promociones' | 'soporte';

interface Promocion {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: 'descuento' | 'premio' | 'oferta';
  descuento?: number;
  vencimiento: string;
  creadaEn: string;
}

const TIPO_PROMO_CONFIG = {
  descuento: { label: 'Descuento', icon: Percent, color: 'text-orange-400', bg: 'bg-orange-900/30', border: 'border-orange-700/50' },
  premio:    { label: 'Premio',    icon: Gift,    color: 'text-purple-400', bg: 'bg-purple-900/30', border: 'border-purple-700/50' },
  oferta:    { label: 'Oferta',    icon: Tag,     color: 'text-teal-400',   bg: 'bg-teal-900/30',   border: 'border-teal-700/50' },
};

const SOPORTE_CATEGORIAS = ['Mi ficha en el directorio', 'Cambio de plan', 'Facturación', 'Problema técnico', 'Promociones', 'Otro'];

// ─── Componente principal ──────────────────────────────────────────────────────
const NegocioLocalPerfil: React.FC<NegocioLocalPerfilProps> = ({ onLogout, onNavigate }) => {
  const { firebaseUser, userRole } = useAuth();
  const [activeTab, setActiveTab]     = useState<Tab>('negocio');
  const [negocio, setNegocio]         = useState<any>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');

  // Planes
  const [planSeleccionado, setPlanSeleccionado] = useState<string | null>(null);

  // Promociones
  const [promociones, setPromociones]   = useState<Promocion[]>([]);
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [newPromo, setNewPromo]         = useState<Omit<Promocion, 'id' | 'creadaEn'>>({
    titulo: '', descripcion: '', tipo: 'descuento', descuento: undefined, vencimiento: '',
  });

  // Soporte
  const [soporteCategoria, setSoporteCategoria] = useState('');
  const [soporteMensaje, setSoporteMensaje]     = useState('');
  const [soporteEnviado, setSoporteEnviado]     = useState(false);

  const userEmail = firebaseUser?.email || '';
  const userName  = firebaseUser?.displayName || userEmail.split('@')[0] || 'Negocio';
  const PROMO_KEY = `guanago_promos_${userEmail}`;

  // ── Carga de datos ─────────────────────────────────────────────────────────
  const load = async () => {
    if (!userEmail) { setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const res  = await fetch(`/api/directory?email=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      if (data.success && data.data?.length > 0) setNegocio(data.data[0]);
      else setNegocio(null);
    } catch {
      setError('No se pudo cargar tu ficha. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [userEmail]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PROMO_KEY);
      if (saved) setPromociones(JSON.parse(saved));
    } catch {}
  }, [PROMO_KEY]);

  // ── Handlers de Promociones ───────────────────────────────────────────────
  const savePromos = (list: Promocion[]) => {
    setPromociones(list);
    localStorage.setItem(PROMO_KEY, JSON.stringify(list));
  };

  const addPromo = () => {
    if (!newPromo.titulo || !newPromo.vencimiento) return;
    const promo: Promocion = { ...newPromo, id: crypto.randomUUID(), creadaEn: new Date().toISOString() };
    savePromos([promo, ...promociones]);
    setNewPromo({ titulo: '', descripcion: '', tipo: 'descuento', descuento: undefined, vencimiento: '' });
    setShowPromoForm(false);
  };

  const deletePromo = (id: string) => savePromos(promociones.filter(p => p.id !== id));

  const isPromoVencida = (p: Promocion) => p.vencimiento && new Date(p.vencimiento) < new Date();

  // ── Handler de Soporte ────────────────────────────────────────────────────
  const enviarSoporte = () => {
    if (!soporteMensaje.trim()) return;
    const texto = `*Consulta GuanaGO — Aliado*\n\n👤 *Negocio:* ${userName}\n📧 *Email:* ${userEmail}\n🏷 *Categoría:* ${soporteCategoria || 'General'}\n\n📝 *Mensaje:*\n${soporteMensaje}`;
    window.open(`https://wa.me/573153836043?text=${encodeURIComponent(texto)}`, '_blank');
    setSoporteEnviado(true);
    setSoporteMensaje('');
    setSoporteCategoria('');
    setTimeout(() => setSoporteEnviado(false), 4000);
  };

  // ── Plan actual ───────────────────────────────────────────────────────────
  const planActual   = negocio?.plan || 'Básico';
  const planKey      = planActual.replace('Aliado ', '') as 'Básico' | 'Activo' | 'Premium';
  const planInfo     = PLANES_INFO.find(p => p.id === planKey) || PLANES_INFO[0];
  const planColors   = planColorMap[planInfo.color];

  // ── Renderizado de pestañas ───────────────────────────────────────────────
  const renderNegocio = () => (
    <div className="space-y-4">
      {loading && (
        <div className="bg-gray-800 rounded-2xl p-8 flex flex-col items-center gap-3 text-gray-500">
          <Loader2 size={24} className="animate-spin text-teal-400" />
          <p className="text-sm">Cargando tu ficha en GuanaGO...</p>
        </div>
      )}
      {!loading && error && (
        <div className="bg-red-900/20 border border-red-700 rounded-2xl p-4 text-red-400 text-sm text-center">{error}</div>
      )}
      {!loading && !error && negocio && (
        <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
          {negocio.image && <img src={negocio.image} alt={negocio.name} className="w-full h-44 object-cover" />}
          <div className="p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <h2 className="text-lg font-black text-white leading-tight">{negocio.name}</h2>
                <p className="text-xs text-teal-400 font-semibold mt-0.5">{negocio.category}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                (negocio.estado || '').toLowerCase() === 'activo' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-gray-700 text-gray-400'
              }`}>{negocio.estado || 'Activo'}</span>
            </div>
            {negocio.description && <p className="text-sm text-gray-400 mb-5 leading-relaxed">{negocio.description}</p>}
            <div className="space-y-2.5 text-sm text-gray-400">
              {negocio.address && <div className="flex items-start gap-2.5"><MapPin size={14} className="text-teal-400 shrink-0 mt-0.5" /><span>{negocio.address}</span></div>}
              {negocio.phone && <div className="flex items-center gap-2.5"><Phone size={14} className="text-teal-400 shrink-0" /><span>{negocio.phone}</span></div>}
              {negocio.email && <div className="flex items-center gap-2.5"><Mail size={14} className="text-teal-400 shrink-0" /><span className="truncate">{negocio.email}</span></div>}
              {negocio.website && <div className="flex items-center gap-2.5"><Globe size={14} className="text-teal-400 shrink-0" /><a href={negocio.website} target="_blank" rel="noreferrer" className="text-teal-400 underline truncate">{negocio.website}</a></div>}
              {negocio.hours && <div className="flex items-center gap-2.5"><Clock size={14} className="text-teal-400 shrink-0" /><span>{negocio.hours}</span></div>}
            </div>
            {(negocio.plan || negocio.rnt || negocio.rating > 0) && (
              <div className="mt-5 pt-4 border-t border-gray-700 flex gap-6 text-xs">
                {negocio.plan && <div><p className="text-gray-600 uppercase tracking-wide mb-0.5">Plan</p><p className="text-white font-bold">{negocio.plan}</p></div>}
                {negocio.rnt  && <div><p className="text-gray-600 uppercase tracking-wide mb-0.5">RNT</p><p className="text-white font-bold">{negocio.rnt}</p></div>}
                {negocio.rating > 0 && <div><p className="text-gray-600 uppercase tracking-wide mb-0.5">Rating</p><p className="text-yellow-400 font-bold">★ {negocio.rating}</p></div>}
              </div>
            )}
            <p className="mt-5 text-[10px] text-gray-600 text-center">Para actualizar tu ficha contacta al administrador de GuanaGO</p>
          </div>
        </div>
      )}
      {!loading && !error && !negocio && (
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 text-center">
          <MapPin size={36} className="mx-auto mb-3 text-gray-600" />
          <p className="text-sm font-semibold text-gray-400 mb-2">Tu negocio no está en el directorio</p>
          <p className="text-xs text-gray-600 leading-relaxed">Contacta al administrador de GuanaGO para agregar tu ficha.</p>
        </div>
      )}
      <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-4 bg-red-900/20 border border-red-800 hover:bg-red-900/40 text-red-400 rounded-xl text-sm font-bold transition-colors">
        <LogOut size={16} /> Cerrar Sesión
      </button>
    </div>
  );

  const renderPlanes = () => (
    <div className="space-y-4">
      {/* Plan actual */}
      <div className={`rounded-2xl border ${planColors.border} ${planColors.bg} p-4`}>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Tu plan actual</p>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gray-900/50 flex items-center justify-center`}>
            <planInfo.icon size={20} className={planColors.text} />
          </div>
          <div>
            <p className="font-black text-white">{planActual}</p>
            <p className={`text-xs font-semibold ${planColors.text}`}>{planInfo.precio}</p>
          </div>
          <span className={`ml-auto px-2.5 py-1 rounded-full text-[10px] font-black text-white ${planColors.badge}`}>Activo</span>
        </div>
        <ul className="mt-4 space-y-2">
          {planInfo.features.map(f => (
            <li key={f} className="flex items-center gap-2 text-xs text-gray-300">
              <Check size={12} className={planColors.text} />{f}
            </li>
          ))}
        </ul>
      </div>

      {/* Seleccionar otro plan */}
      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Cambiar plan</p>
      {PLANES_INFO.map((plan) => {
        const pc = planColorMap[plan.color];
        const esCurrent = plan.id === planKey;
        const isSelected = planSeleccionado === plan.id;
        return (
          <button
            key={plan.id}
            onClick={() => !esCurrent && setPlanSeleccionado(isSelected ? null : plan.id)}
            className={`w-full text-left rounded-2xl border p-4 transition-all ${
              esCurrent ? `${pc.border} ${pc.bg} opacity-60 cursor-default`
              : isSelected ? `${pc.border} ${pc.bg}`
              : 'border-gray-700 bg-gray-800 hover:border-gray-500'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <plan.icon size={16} className={esCurrent || isSelected ? pc.text : 'text-gray-500'} />
              <span className={`text-sm font-black ${esCurrent || isSelected ? 'text-white' : 'text-gray-400'}`}>
                {plan.id === 'Básico' ? 'Básico' : `Aliado ${plan.id}`}
              </span>
              <span className={`ml-auto text-xs font-bold ${esCurrent || isSelected ? pc.text : 'text-gray-600'}`}>{plan.precio}</span>
              {esCurrent && <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black text-white ${pc.badge}`}>Actual</span>}
            </div>
            <ul className="space-y-1">
              {plan.features.slice(0, 3).map(f => (
                <li key={f} className={`flex items-center gap-1.5 text-[11px] ${esCurrent || isSelected ? 'text-gray-300' : 'text-gray-600'}`}>
                  <Check size={10} className={esCurrent || isSelected ? pc.text : 'text-gray-700'} />{f}
                </li>
              ))}
            </ul>
          </button>
        );
      })}

      {planSeleccionado && (
        <button
          onClick={() => {
            const texto = `*Solicitud cambio de plan — GuanaGO*\n\n👤 *Negocio:* ${userName}\n📧 *Email:* ${userEmail}\n\n🔄 Quiero cambiar del plan *${planActual}* al plan *${planSeleccionado}*`;
            window.open(`https://wa.me/573153836043?text=${encodeURIComponent(texto)}`, '_blank');
          }}
          className="w-full py-4 rounded-2xl bg-teal-700 hover:bg-teal-600 text-white font-black text-sm transition-colors active:scale-95 flex items-center justify-center gap-2"
        >
          <MessageCircle size={16} />
          Solicitar cambio a plan {planSeleccionado}
        </button>
      )}
      {onNavigate && (
        <button
          onClick={() => onNavigate(AppRoute.VINCULAR_COMERCIO)}
          className="w-full py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
        >
          Ver comparativa de planes <ChevronRight size={14} />
        </button>
      )}
    </div>
  );

  const renderPromociones = () => (
    <div className="space-y-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
        <p className="text-xs text-gray-400 leading-relaxed">
          Las promociones que crees aquí serán visibles en tu ficha del directorio y en la sección de descuentos de GuanaGO — tanto para turistas como para visitantes sin sesión.
        </p>
      </div>

      {/* Botón agregar */}
      {!showPromoForm && (
        <button
          onClick={() => setShowPromoForm(true)}
          className="w-full py-3 rounded-2xl border border-dashed border-teal-700 text-teal-400 font-semibold text-sm hover:bg-teal-900/20 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Nueva Promoción
        </button>
      )}

      {/* Formulario */}
      {showPromoForm && (
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 space-y-3">
          <p className="text-xs font-black text-white uppercase tracking-widest">Nueva Promoción</p>

          <input
            type="text" placeholder="Título *" value={newPromo.titulo}
            onChange={e => setNewPromo(p => ({ ...p, titulo: e.target.value }))}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-teal-500 outline-none"
          />
          <textarea
            placeholder="Descripción de la promoción" value={newPromo.descripcion}
            onChange={e => setNewPromo(p => ({ ...p, descripcion: e.target.value }))}
            rows={3}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-teal-500 outline-none resize-none"
          />

          {/* Tipo */}
          <div className="grid grid-cols-3 gap-2">
            {(['descuento', 'premio', 'oferta'] as const).map(tipo => {
              const cfg = TIPO_PROMO_CONFIG[tipo];
              return (
                <button key={tipo} onClick={() => setNewPromo(p => ({ ...p, tipo }))}
                  className={`py-2 rounded-xl border text-xs font-bold transition-all ${newPromo.tipo === tipo ? `${cfg.bg} ${cfg.border} ${cfg.color}` : 'border-gray-700 text-gray-500 bg-gray-900'}`}>
                  {cfg.label}
                </button>
              );
            })}
          </div>

          {newPromo.tipo === 'descuento' && (
            <div className="flex items-center gap-2">
              <input
                type="number" min={1} max={100} placeholder="% descuento" value={newPromo.descuento ?? ''}
                onChange={e => setNewPromo(p => ({ ...p, descuento: Number(e.target.value) || undefined }))}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-teal-500 outline-none"
              />
              <span className="text-gray-500 text-sm shrink-0">%</span>
            </div>
          )}

          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">Válida hasta *</label>
            <input
              type="date" value={newPromo.vencimiento}
              onChange={e => setNewPromo(p => ({ ...p, vencimiento: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:border-teal-500 outline-none"
              style={{ colorScheme: 'dark' }}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={() => setShowPromoForm(false)}
              className="flex-1 py-3 rounded-xl bg-gray-700 text-gray-300 font-semibold text-sm hover:bg-gray-600 transition-colors">
              Cancelar
            </button>
            <button onClick={addPromo} disabled={!newPromo.titulo || !newPromo.vencimiento}
              className="flex-1 py-3 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-black text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Guardar
            </button>
          </div>
        </div>
      )}

      {/* Lista de promociones */}
      {promociones.length === 0 && !showPromoForm && (
        <div className="text-center py-10 text-gray-600">
          <Tag size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Aún no tienes promociones activas</p>
        </div>
      )}
      {promociones.map(promo => {
        const cfg = TIPO_PROMO_CONFIG[promo.tipo];
        const vencida = isPromoVencida(promo);
        return (
          <div key={promo.id} className={`rounded-2xl border p-4 ${vencida ? 'border-gray-700/40 bg-gray-900/40 opacity-60' : `${cfg.border} ${cfg.bg}`}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 mb-1">
                <cfg.icon size={14} className={vencida ? 'text-gray-600' : cfg.color} />
                <span className={`text-xs font-bold uppercase tracking-wide ${vencida ? 'text-gray-600' : cfg.color}`}>{cfg.label}</span>
                {vencida && <span className="text-[9px] bg-gray-700 text-gray-500 px-1.5 py-0.5 rounded-full font-bold">Vencida</span>}
              </div>
              <button onClick={() => deletePromo(promo.id)} className="text-gray-600 hover:text-red-400 transition-colors shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
            <p className="text-sm font-bold text-white">{promo.titulo}</p>
            {promo.descripcion && <p className="text-xs text-gray-400 mt-1 leading-relaxed">{promo.descripcion}</p>}
            <div className="flex items-center gap-3 mt-3 text-[11px] text-gray-500">
              {promo.descuento && <span className="flex items-center gap-1"><Percent size={10} /> {promo.descuento}% off</span>}
              <span className="flex items-center gap-1"><Calendar size={10} /> Hasta {new Date(promo.vencimiento).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderSoporte = () => (
    <div className="space-y-4">
      {/* Banner */}
      <div className="bg-gradient-to-br from-teal-900/50 to-blue-900/50 border border-teal-800/50 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-teal-800/60 flex items-center justify-center">
            <HeadphonesIcon size={20} className="text-teal-300" />
          </div>
          <div>
            <p className="font-black text-white text-sm">Equipo GuanaGO</p>
            <p className="text-xs text-teal-400">Respuesta en menos de 24h</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">
          ¿Tienes dudas sobre tu plan, tu ficha o algún inconveniente técnico? Escríbenos y nuestro equipo te atenderá por WhatsApp.
        </p>
      </div>

      {soporteEnviado && (
        <div className="bg-emerald-900/30 border border-emerald-700 rounded-2xl p-4 flex items-center gap-3">
          <Check size={18} className="text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-400 font-semibold">¡Mensaje enviado! Te responderemos pronto.</p>
        </div>
      )}

      <div className="space-y-3">
        {/* Categoría */}
        <div>
          <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1.5">Tema de la consulta</label>
          <div className="grid grid-cols-2 gap-2">
            {SOPORTE_CATEGORIAS.map(cat => (
              <button key={cat} onClick={() => setSoporteCategoria(cat)}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                  soporteCategoria === cat
                    ? 'border-teal-500 bg-teal-900/40 text-teal-300'
                    : 'border-gray-700 bg-gray-800 text-gray-500 hover:border-gray-500'
                }`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Mensaje */}
        <div>
          <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1.5">Tu mensaje *</label>
          <textarea
            placeholder="Cuéntanos en qué te podemos ayudar..."
            value={soporteMensaje}
            onChange={e => setSoporteMensaje(e.target.value)}
            rows={5}
            className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-teal-500 outline-none resize-none"
          />
        </div>

        <button
          onClick={enviarSoporte}
          disabled={!soporteMensaje.trim()}
          className="w-full py-4 rounded-2xl bg-teal-700 hover:bg-teal-600 text-white font-black text-sm transition-colors active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Send size={16} /> Enviar por WhatsApp
        </button>
      </div>

      {/* Info de contacto directo */}
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 space-y-3 text-sm">
        <p className="text-[10px] text-gray-500 uppercase tracking-widest">Contacto directo</p>
        <a href="https://wa.me/573153836043" target="_blank" rel="noreferrer"
          className="flex items-center gap-3 text-gray-300 hover:text-teal-400 transition-colors">
          <MessageCircle size={16} className="text-teal-500" />
          <span>+57 315 383 6043</span>
        </a>
        <a href="mailto:info@guiasai.com"
          className="flex items-center gap-3 text-gray-300 hover:text-teal-400 transition-colors">
          <Mail size={16} className="text-teal-500" />
          <span>info@guiasai.com</span>
        </a>
      </div>
    </div>
  );

  // ── Tab nav items ─────────────────────────────────────────────────────────
  const TABS: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'negocio',     label: 'Mi Negocio',   icon: <Store size={22} /> },
    { id: 'planes',      label: 'Planes',        icon: <Crown size={22} /> },
    { id: 'promociones', label: 'Promociones',   icon: <Tag size={22} />, badge: promociones.filter(p => !isPromoVencida(p)).length || undefined },
    { id: 'soporte',     label: 'Soporte',       icon: <HeadphonesIcon size={22} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-36">

      {/* Header */}
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 px-5 pt-10 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-2xl font-black text-white shadow-lg shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-teal-400 font-bold uppercase tracking-widest mb-0.5">
              {userRole === 'Operador' ? 'Operador' : 'Aliado / Socio'}
            </p>
            <h1 className="text-lg font-black truncate">{userName}</h1>
            <p className="text-xs text-gray-500 truncate">{userEmail}</p>
          </div>
          <button onClick={load} className="p-2 hover:bg-gray-700 rounded-lg text-gray-500 shrink-0" title="Actualizar">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Plan badge en header */}
        <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${planColors.border} ${planColors.bg} ${planColors.text}`}>
          <planInfo.icon size={12} />
          Plan {planActual}
          {planInfo.id !== 'Premium' && (
            <button onClick={() => setActiveTab('planes')} className="ml-1 flex items-center gap-0.5 text-gray-500 hover:text-white transition-colors">
              <ChevronRight size={10} /> Mejorar
            </button>
          )}
        </div>
      </div>

      {/* Contenido de la pestaña activa */}
      <div className="px-5 mt-4">
        {activeTab === 'negocio'     && renderNegocio()}
        {activeTab === 'planes'      && renderPlanes()}
        {activeTab === 'promociones' && renderPromociones()}
        {activeTab === 'soporte'     && renderSoporte()}
      </div>

      {/* Barra de navegación inferior */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md md:max-w-2xl lg:max-w-5xl xl:max-w-7xl z-50 bg-gray-900 border-t border-gray-800">
        <div className="flex justify-around items-center py-2 px-2">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all relative ${
                activeTab === tab.id ? 'text-teal-400' : 'text-gray-600 hover:text-gray-400'
              }`}
            >
              {tab.badge ? (
                <span className="absolute top-1 right-2 bg-teal-500 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                  {tab.badge}
                </span>
              ) : null}
              {tab.icon}
              <span className="text-[10px] font-semibold">{tab.label}</span>
              {activeTab === tab.id && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-teal-400 rounded-full" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NegocioLocalPerfil;

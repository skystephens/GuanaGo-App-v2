import React, { useState } from 'react';
import {
  ArrowLeft, QrCode, Zap, Crown, Check, X, Users, TrendingUp,
  Wifi, Star, Gift, ChevronDown, ChevronUp, MessageCircle,
  Calendar, Camera, FileText, BarChart3, Smartphone, Globe,
  Pencil, Save, Plus, Trash2,
} from 'lucide-react';
import { AppRoute } from '../../types';

type BeneficioRow = { id: string; label: string; basico: boolean; activo: boolean; premium: boolean };

const BENEFICIOS_DEFAULT: BeneficioRow[] = [
  { id: 'b1',  label: 'Ficha en directorio GuanaGO',       basico: true,  activo: true,  premium: true  },
  { id: 'b2',  label: 'QR personalizado (sticker incluido)',basico: true,  activo: true,  premium: true  },
  { id: 'b3',  label: 'Visibilidad digital básica',         basico: true,  activo: true,  premium: true  },
  { id: 'b4',  label: 'Panel de negocio',                   basico: true,  activo: true,  premium: true  },
  { id: 'b5',  label: 'Aparece en búsquedas generales',     basico: true,  activo: true,  premium: true  },
  { id: 'b6',  label: 'Pin en mapa interactivo',            basico: false, activo: true,  premium: true  },
  { id: 'b7',  label: 'GuanaPoints para clientes',          basico: false, activo: true,  premium: true  },
  { id: 'b8',  label: 'Prioridad en búsquedas',             basico: false, activo: true,  premium: true  },
  { id: 'b9',  label: 'Insignia Aliado Verificado',         basico: false, activo: true,  premium: true  },
  { id: 'b10', label: 'Notificaciones en tiempo real',      basico: false, activo: true,  premium: true  },
  { id: 'b11', label: 'Soporte WhatsApp prioritario',       basico: false, activo: true,  premium: true  },
  { id: 'b12', label: 'Posición destacada en categoría',    basico: false, activo: false, premium: true  },
  { id: 'b13', label: 'Contenido mensual (2 piezas)',        basico: false, activo: false, premium: true  },
  { id: 'b14', label: 'Analytics de visitas',               basico: false, activo: false, premium: true  },
  { id: 'b15', label: 'Gestor de cuenta dedicado',          basico: false, activo: false, premium: true  },
  { id: 'b16', label: 'Badge Premium en perfil',            basico: false, activo: false, premium: true  },
  { id: 'b17', label: 'Material impreso adicional',         basico: false, activo: false, premium: true  },
];

interface Props {
  onBack: () => void;
  onNavigate: (route: AppRoute) => void;
}

type Tab = 'planes' | 'estrategia' | 'guanapoints' | 'wifi';

// ─── Planes ───────────────────────────────────────────────────────────────────

const PLANES = [
  {
    id: 'Básico',
    icon: QrCode,
    precio: 'Gratis',
    precioNum: 0,
    color: '#00A8A0',      // turquesa GuanaGO
    colorBg: '#00A8A01a',
    colorBorder: '#00A8A040',
    descripcion: 'Entrada al ecosistema GuanaGO. Para negocios que quieren empezar a ser visibles.',
    features: [
      'Ficha en directorio GuanaGO',
      'Código QR personalizado (sticker incluido)',
      'Visibilidad digital básica',
      'Panel de negocio básico',
      'Aparece en búsquedas generales',
    ],
    noIncluye: [
      'Pin en mapa interactivo',
      'GuanaPoints para clientes',
      'Prioridad en búsquedas',
      'Creación de contenido',
      'Analytics de visitas',
    ],
    aliados: 0,
    ingresoMensual: 0,
    tag: '',
  },
  {
    id: 'Activo',
    icon: Zap,
    precio: '$49.900/mes',
    precioNum: 49900,
    color: '#F5831F',      // naranja GuanaGO
    colorBg: '#F5831F1a',
    colorBorder: '#F5831F60',
    descripcion: 'Para negocios que quieren que los turistas los encuentren caminando por la isla.',
    features: [
      'Todo lo del plan Básico',
      'Pin de ubicación en mapa interactivo',
      'GuanaPoints — clientes acumulan puntos contigo',
      'Prioridad en búsquedas y listados',
      'Insignia "Aliado Verificado"',
      'Notificaciones de nuevos clientes en tiempo real',
      'Soporte prioritario por WhatsApp',
    ],
    noIncluye: [
      'Creación de contenido mensual',
      'Analytics avanzados de visitas',
      'Gestor de cuenta dedicado',
      'Posición destacada (primero en categoría)',
    ],
    aliados: 0,
    ingresoMensual: 0,
    tag: 'Popular',
  },
  {
    id: 'Premium',
    icon: Crown,
    precio: '$129.900/mes',
    precioNum: 129900,
    color: '#6366f1',
    colorBg: '#6366f11a',
    colorBorder: '#6366f160',
    descripcion: 'El paquete completo. Para negocios que quieren crecer de verdad con GuanaGO.',
    features: [
      'Todo lo del plan Activo',
      'Posición destacada (aparece primero en su categoría)',
      '2 piezas de contenido mensuales (posts, stories, copys)',
      'Analytics de visitas e interacciones',
      'Gestor de cuenta dedicado',
      'Badge verificado Premium en perfil',
      'Descuento especial en tours y experiencias GuanaGO',
      'Material impreso adicional (tarjetones + stickers)',
    ],
    noIncluye: [],
    aliados: 0,
    ingresoMensual: 0,
    tag: 'Completo',
  },
];

// ─── Estrategia de Contenido ──────────────────────────────────────────────────

const EMBUDOS = [
  {
    tipo: 'Restaurante / Bar',
    emoji: '🍽️',
    pasos: [
      'Turista ve pin en mapa → abre ficha del restaurante',
      'Lee reseñas y foto del plato estrella',
      'Llama o va directo al lugar',
      'Paga con descuento GuanaPoints',
      'Deja reseña → retroalimenta el ciclo',
    ],
  },
  {
    tipo: 'Tienda / Artesanías',
    emoji: '🛍️',
    pasos: [
      'Turista busca "artesanías" en GuanaGO',
      'Ve tienda destacada con foto y descripción',
      'Navega al local con ayuda del mapa',
      'Compra y recibe GuanaPoints',
      'Comparte en redes con QR de la tienda',
    ],
  },
  {
    tipo: 'Taxi / Transporte',
    emoji: '🚖',
    pasos: [
      'Turista recién llega al aeropuerto',
      'Abre GuanaGO → ve zonas y tarifas de taxi',
      'Contacta al conductor directamente',
      'Confirma servicio y paga',
      'Conductor acumula puntos como Aliado',
    ],
  },
  {
    tipo: 'Agencia B2B',
    emoji: '✈️',
    pasos: [
      'Agencia mayorista busca paquetes San Andrés',
      'Accede a catálogo B2B GuiaSAI con tarifas netas',
      'Arma paquete y lo vende a sus clientes',
      'GuanaGO recibe comisión 12%',
      'Operador local recibe la reserva',
    ],
  },
];

const CALENDARIO = [
  { dia: 'Lunes', tipo: 'Educativo', descripcion: 'Tips para turistas, datos de la isla, historia Raizal', color: '#00A8A0' },
  { dia: 'Miércoles', tipo: 'Aliados', descripcion: 'Spotlight de un negocio aliado, detrás de cámaras', color: '#F5831F' },
  { dia: 'Viernes', tipo: 'Experiencias', descripcion: 'Reels de tours, fotos de atardeceres, reseñas', color: '#6366f1' },
  { dia: 'Domingo', tipo: 'Comunidad', descripcion: 'Preguntas frecuentes, testimonios, concursos', color: '#22c55e' },
];

// ─── GuanaPoints ──────────────────────────────────────────────────────────────

const GUANAPOINTS_TIERS = [
  {
    nivel: 'Turista',
    icon: '🏄',
    color: '#00A8A0',
    como: 'Cualquier persona que visita o se registra',
    beneficios: [
      'Acumula puntos por cada servicio contratado',
      'Canjea puntos por descuentos en próximas compras',
      'Acceso al catálogo completo de experiencias',
      'Historial de viajes en GuanaGO',
    ],
    puntosPorAccion: [
      { accion: 'Registrarse', puntos: 100 },
      { accion: 'Reservar tour', puntos: 500 },
      { accion: 'Dejar reseña', puntos: 150 },
      { accion: 'Referir amigo', puntos: 300 },
    ],
  },
  {
    nivel: 'Promotor',
    icon: '📣',
    color: '#F5831F',
    como: 'Turista o local que refiere 3+ nuevos usuarios',
    beneficios: [
      'Todo lo de Turista',
      'Código de referido único (ref_code)',
      '8% de comisión por cada venta referida',
      'Acceso a materiales de marketing descargables',
      'Dashboard de comisiones en tiempo real',
    ],
    puntosPorAccion: [
      { accion: 'Venta referida', puntos: 800 },
      { accion: 'Nuevo Aliado referido', puntos: 2000 },
      { accion: 'Reseña verificada', puntos: 200 },
      { accion: 'Post en redes con etiqueta', puntos: 250 },
    ],
  },
  {
    nivel: 'Aliado',
    icon: '🤝',
    color: '#6366f1',
    como: 'Negocio local registrado (plan Básico o superior)',
    beneficios: [
      'Todo lo de Promotor',
      'Panel de negocio completo',
      'Los clientes acumulan puntos en tu establecimiento',
      'Visibilidad garantizada en el mapa (plan Activo+)',
      'Acceso a estadísticas de clientes',
      'Insignia de Aliado Verificado',
    ],
    puntosPorAccion: [
      { accion: 'Cliente visita tu negocio', puntos: 200 },
      { accion: 'Cliente deja reseña 5★', puntos: 400 },
      { accion: 'Subir fotos del negocio', puntos: 300 },
      { accion: 'Mes activo sin interrupciones', puntos: 1000 },
    ],
  },
  {
    nivel: 'Agencia',
    icon: '🏢',
    color: '#eab308',
    como: 'Agencia de viajes con acceso B2B (GuiaSAI)',
    beneficios: [
      'Todo lo de Aliado',
      'Tarifas netas en catálogo B2B',
      'Portal de cotizaciones GuiaSAI',
      'Facturación consolidada mensual',
      'Gestor de cuenta B2B dedicado',
      'Acceso anticipado a nuevos productos',
    ],
    puntosPorAccion: [
      { accion: 'Reserva confirmada', puntos: 1200 },
      { accion: 'Paquete grupal +10 pax', puntos: 5000 },
      { accion: 'Año activo sin incidencias', puntos: 10000 },
      { accion: 'Recomendación a otra agencia', puntos: 3000 },
    ],
  },
];

// ─── WiFi Captivo ─────────────────────────────────────────────────────────────

const WIFI_PASOS = [
  { num: '01', titulo: 'Turista llega al negocio aliado', desc: 'Restaurante, tienda, hotel — cualquier Aliado con router configurado.' },
  { num: '02', titulo: 'Se conecta al WiFi del local', desc: 'El router redirige automáticamente al portal captivo de GuanaGO.' },
  { num: '03', titulo: 'Ve la pantalla de bienvenida', desc: 'Pantalla con logo GuanaGO, nombre del negocio y CTA: "Acceder con cuenta GuanaGO".' },
  { num: '04', titulo: 'Se registra o hace login', desc: 'Si es usuario nuevo, crea cuenta. Si ya existe, confirma y accede.' },
  { num: '05', titulo: 'Obtiene acceso a internet', desc: 'El turista navega y automáticamente queda vinculado al negocio.' },
  { num: '06', titulo: 'Recibe puntos y oferta del local', desc: '50 GuanaPoints + notificación de la oferta del día del negocio.' },
];

// ─── Component ───────────────────────────────────────────────────────────────

const AdminAliados: React.FC<Props> = ({ onBack, onNavigate }) => {
  const [tab, setTab] = useState<Tab>('planes');
  const [planOpen, setPlanOpen] = useState<string | null>('Activo');
  const [tierOpen, setTierOpen] = useState<string | null>('Turista');

  // ── Editor de beneficios ───────────────────────────────────────────────────
  const [beneficios, setBeneficios] = useState<BeneficioRow[]>(BENEFICIOS_DEFAULT);
  const [editMode, setEditMode] = useState(false);
  const [editDraft, setEditDraft] = useState<BeneficioRow[]>([]);
  const [newLabel, setNewLabel] = useState('');

  const startEdit = () => { setEditDraft(JSON.parse(JSON.stringify(beneficios))); setEditMode(true); };
  const cancelEdit = () => { setEditMode(false); setNewLabel(''); };
  const saveEdit = () => { setBeneficios(editDraft); setEditMode(false); setNewLabel(''); };

  const toggleCheck = (id: string, plan: 'basico' | 'activo' | 'premium') => {
    setEditDraft(prev => prev.map(r => r.id === id ? { ...r, [plan]: !r[plan] } : r));
  };
  const removeRow = (id: string) => setEditDraft(prev => prev.filter(r => r.id !== id));
  const addRow = () => {
    const label = newLabel.trim();
    if (!label) return;
    setEditDraft(prev => [...prev, { id: `b${Date.now()}`, label, basico: false, activo: false, premium: false }]);
    setNewLabel('');
  };

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'planes', label: 'Planes', icon: Crown },
    { id: 'estrategia', label: 'Estrategia', icon: BarChart3 },
    { id: 'guanapoints', label: 'GuanaPoints', icon: Gift },
    { id: 'wifi', label: 'WiFi Captivo', icon: Wifi },
  ];

  const totalIngresoPotencial = (aliados: number) =>
    PLANES.reduce((acc, p) => acc + p.precioNum * aliados, 0);

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-28">

      {/* Header */}
      <div className="sticky top-0 z-30 bg-gray-900/90 backdrop-blur border-b border-gray-800 px-5 py-3">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-xl transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="font-black text-base">Estrategia Aliados</h1>
            <p className="text-[10px] text-gray-500">Planes · Contenido · GuanaPoints · WiFi Captivo</p>
          </div>
          <button
            onClick={() => onNavigate(AppRoute.VINCULAR_COMERCIO)}
            className="ml-auto px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-600 text-xs font-bold transition-colors"
          >
            Ver página pública
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                tab === t.id ? 'bg-teal-700 text-white' : 'text-gray-400 hover:bg-gray-800'
              }`}
            >
              <t.icon size={13} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 mt-5 space-y-4">

        {/* ── TAB: PLANES ────────────────────────────────────────────────── */}
        {tab === 'planes' && (
          <>
            {/* Resumen financiero */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Planes activos', value: '–', sub: 'Conectar Airtable', color: 'text-teal-400' },
                { label: 'Ingreso mensual', value: '–', sub: 'Membresías activas', color: 'text-orange-400' },
                { label: 'Potencial 10 activos', value: '$499K', sub: '/mes (plan Activo)', color: 'text-indigo-400' },
              ].map((s) => (
                <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-3 text-center">
                  <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-gray-400 font-semibold">{s.label}</p>
                  <p className="text-[9px] text-gray-600 mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Planes detalle */}
            {PLANES.map((plan) => {
              const isOpen = planOpen === plan.id;
              return (
                <div
                  key={plan.id}
                  className="rounded-2xl border overflow-hidden"
                  style={{ borderColor: plan.colorBorder, backgroundColor: plan.colorBg }}
                >
                  <button
                    className="w-full px-5 py-4 flex items-center gap-3 text-left"
                    onClick={() => setPlanOpen(isOpen ? null : plan.id)}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: plan.colorBg, border: `1px solid ${plan.colorBorder}` }}>
                      <plan.icon size={18} style={{ color: plan.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm text-white">
                          {plan.id === 'Básico' ? 'Básico' : `Aliado ${plan.id}`}
                        </span>
                        {plan.tag && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black text-white"
                            style={{ backgroundColor: plan.color }}>
                            {plan.tag}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold" style={{ color: plan.color }}>{plan.precio}</span>
                    </div>
                    {isOpen
                      ? <ChevronUp size={15} className="text-gray-500 shrink-0" />
                      : <ChevronDown size={15} className="text-gray-500 shrink-0" />
                    }
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 border-t border-white/5">
                      <p className="text-xs text-gray-400 mt-3 mb-4 leading-relaxed">{plan.descripcion}</p>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-[10px] font-black text-gray-500 uppercase mb-2">Incluye</p>
                          <ul className="space-y-2">
                            {plan.features.map((f) => (
                              <li key={f} className="flex items-start gap-2 text-xs text-gray-300">
                                <Check size={12} style={{ color: plan.color }} className="shrink-0 mt-0.5" />
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                        {plan.noIncluye.length > 0 && (
                          <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase mb-2">No incluye</p>
                            <ul className="space-y-2">
                              {plan.noIncluye.map((f) => (
                                <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                                  <X size={12} className="text-gray-700 shrink-0 mt-0.5" />
                                  {f}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {plan.precioNum > 0 && (
                        <div className="mt-4 p-3 rounded-xl bg-gray-900/60 text-xs">
                          <p className="text-gray-500 mb-1">Proyección de ingresos</p>
                          <div className="flex gap-4 flex-wrap">
                            {[5, 10, 20, 50].map((n) => (
                              <div key={n}>
                                <span className="text-gray-400">{n} aliados: </span>
                                <span className="font-black" style={{ color: plan.color }}>
                                  ${(plan.precioNum * n).toLocaleString('es-CO')}/mes
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Tabla comparativa editable */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              {/* Header con botón editar */}
              <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                <p className="font-black text-sm">Beneficios por plan</p>
                {!editMode ? (
                  <button
                    onClick={startEdit}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-bold text-gray-300 transition-colors"
                  >
                    <Pencil size={12} /> Editar
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={cancelEdit}
                      className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-bold text-gray-400 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={saveEdit}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-600 text-xs font-bold text-white transition-colors"
                    >
                      <Save size={12} /> Guardar
                    </button>
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-800">
                      {editMode && <th className="w-8" />}
                      <th className="text-left px-4 py-2.5 text-gray-500 font-semibold">Función / Beneficio</th>
                      <th className="text-center px-3 py-2.5 text-teal-400 font-black">Básico</th>
                      <th className="text-center px-3 py-2.5 font-black" style={{ color: '#F5831F' }}>Activo</th>
                      <th className="text-center px-3 py-2.5 text-indigo-400 font-black">Premium</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/40">
                    {(editMode ? editDraft : beneficios).map((row) => (
                      <tr key={row.id} className={editMode ? 'hover:bg-gray-800/40' : ''}>

                        {/* Botón eliminar (solo en modo edición) */}
                        {editMode && (
                          <td className="pl-2 pr-0 py-2">
                            <button
                              onClick={() => removeRow(row.id)}
                              className="p-1 rounded hover:bg-red-900/40 text-gray-700 hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={11} />
                            </button>
                          </td>
                        )}

                        {/* Nombre de la función */}
                        <td className="px-4 py-2.5 text-gray-300 leading-snug">{row.label}</td>

                        {/* Plan Básico */}
                        <td className="text-center px-3 py-2.5">
                          {editMode ? (
                            <input
                              type="checkbox"
                              checked={row.basico}
                              onChange={() => toggleCheck(row.id, 'basico')}
                              className="w-4 h-4 rounded accent-teal-500 cursor-pointer"
                            />
                          ) : row.basico
                            ? <Check size={13} className="mx-auto text-teal-400" />
                            : <X size={13} className="mx-auto text-gray-700" />
                          }
                        </td>

                        {/* Plan Activo */}
                        <td className="text-center px-3 py-2.5">
                          {editMode ? (
                            <input
                              type="checkbox"
                              checked={row.activo}
                              onChange={() => toggleCheck(row.id, 'activo')}
                              className="w-4 h-4 rounded cursor-pointer"
                              style={{ accentColor: '#F5831F' }}
                            />
                          ) : row.activo
                            ? <Check size={13} className="mx-auto" style={{ color: '#F5831F' }} />
                            : <X size={13} className="mx-auto text-gray-700" />
                          }
                        </td>

                        {/* Plan Premium */}
                        <td className="text-center px-3 py-2.5">
                          {editMode ? (
                            <input
                              type="checkbox"
                              checked={row.premium}
                              onChange={() => toggleCheck(row.id, 'premium')}
                              className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
                            />
                          ) : row.premium
                            ? <Check size={13} className="mx-auto text-indigo-400" />
                            : <X size={13} className="mx-auto text-gray-700" />
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Agregar nueva fila (solo en modo edición) */}
              {editMode && (
                <div className="px-4 py-3 border-t border-gray-800 flex gap-2">
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addRow()}
                    placeholder="Nueva función o beneficio..."
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-600 outline-none focus:border-teal-600 transition-colors"
                  />
                  <button
                    onClick={addRow}
                    disabled={!newLabel.trim()}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-teal-800 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-white transition-colors"
                  >
                    <Plus size={12} /> Agregar
                  </button>
                </div>
              )}

              {/* Nota en modo vista */}
              {!editMode && (
                <div className="px-4 py-2.5 border-t border-gray-800/50">
                  <p className="text-[10px] text-gray-600">
                    {beneficios.length} beneficios configurados · Toca <span className="text-gray-500">Editar</span> para modificar
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── TAB: ESTRATEGIA ────────────────────────────────────────────── */}
        {tab === 'estrategia' && (
          <>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
              <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Filosofía</p>
              <p className="text-sm text-gray-300 leading-relaxed">
                GuanaGO no es solo un directorio — es la <span className="text-teal-400 font-bold">infraestructura digital de la economía turística raizal</span>.
                El contenido es el puente entre el turista y el negocio local.
              </p>
            </div>

            {/* Calendario editorial */}
            <div>
              <h3 className="font-black text-sm mb-3 flex items-center gap-2">
                <Calendar size={15} className="text-teal-400" /> Calendario editorial semanal
              </h3>
              <div className="space-y-2">
                {CALENDARIO.map((c) => (
                  <div key={c.dia} className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex items-start gap-3">
                    <div className="w-16 shrink-0">
                      <p className="text-xs font-black" style={{ color: c.color }}>{c.dia}</p>
                      <p className="text-[10px] text-gray-600">{c.tipo}</p>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{c.descripcion}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Embudos por tipo de negocio */}
            <div>
              <h3 className="font-black text-sm mb-3 flex items-center gap-2">
                <TrendingUp size={15} className="text-orange-400" /> Embudos por tipo de negocio
              </h3>
              <div className="space-y-3">
                {EMBUDOS.map((e) => (
                  <div key={e.tipo} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                    <p className="font-black text-sm mb-3">{e.emoji} {e.tipo}</p>
                    <div className="space-y-2">
                      {e.pasos.map((paso, i) => (
                        <div key={paso} className="flex items-start gap-2.5">
                          <div className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center shrink-0">
                            <span className="text-[9px] font-black text-gray-500">{i + 1}</span>
                          </div>
                          <p className="text-xs text-gray-400 leading-relaxed pt-0.5">{paso}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stack de herramientas */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
              <h3 className="font-black text-sm mb-3 flex items-center gap-2">
                <Camera size={15} className="text-indigo-400" /> Stack de producción de contenido
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { tool: 'Canva Pro', uso: 'Piezas gráficas, stories, tarjetas de aliados' },
                  { tool: 'Claude API', uso: 'Generación automática de copys desde Airtable' },
                  { tool: 'Make.com', uso: 'Automatización: Airtable → post programado' },
                  { tool: 'Groq AI', uso: 'Chatbot turista en tiempo real' },
                  { tool: 'Mapbox', uso: 'Mapa interactivo con pins de aliados' },
                  { tool: 'Firebase', uso: 'Notificaciones push a turistas' },
                ].map((item) => (
                  <div key={item.tool} className="bg-gray-800 rounded-xl p-2.5">
                    <p className="text-xs font-black text-white">{item.tool}</p>
                    <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{item.uso}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── TAB: GUANAPOINTS ───────────────────────────────────────────── */}
        {tab === 'guanapoints' && (
          <>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
              <p className="text-[10px] font-black text-gray-500 uppercase mb-1">¿Qué son?</p>
              <p className="text-sm text-gray-300 leading-relaxed">
                GuanaPoints es el sistema de lealtad multinivel de GuanaGO.
                Los puntos se acumulan por acciones (visitar, comprar, referir, reseñar)
                y se canjean por descuentos. Genera <span className="text-yellow-400 font-bold">retención y viralidad</span>.
              </p>
            </div>

            <div className="space-y-3">
              {GUANAPOINTS_TIERS.map((tier) => {
                const isOpen = tierOpen === tier.nivel;
                return (
                  <div key={tier.nivel} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                    <button
                      className="w-full px-5 py-4 flex items-center gap-3 text-left"
                      onClick={() => setTierOpen(isOpen ? null : tier.nivel)}
                    >
                      <span className="text-2xl">{tier.icon}</span>
                      <div className="flex-1">
                        <p className="font-black text-sm" style={{ color: tier.color }}>{tier.nivel}</p>
                        <p className="text-[10px] text-gray-500">{tier.como}</p>
                      </div>
                      {isOpen
                        ? <ChevronUp size={15} className="text-gray-500" />
                        : <ChevronDown size={15} className="text-gray-500" />
                      }
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 border-t border-gray-800/50">
                        <div className="grid grid-cols-1 gap-4 mt-4 sm:grid-cols-2">
                          <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase mb-2">Beneficios</p>
                            <ul className="space-y-1.5">
                              {tier.beneficios.map((b) => (
                                <li key={b} className="flex items-start gap-2 text-xs text-gray-400">
                                  <Star size={10} style={{ color: tier.color }} className="shrink-0 mt-0.5" />
                                  {b}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase mb-2">Puntos por acción</p>
                            <div className="space-y-1.5">
                              {tier.puntosPorAccion.map((p) => (
                                <div key={p.accion} className="flex items-center justify-between text-xs">
                                  <span className="text-gray-500">{p.accion}</span>
                                  <span className="font-black" style={{ color: tier.color }}>+{p.puntos} pts</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Flujo de canje */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
              <h3 className="font-black text-sm mb-3 flex items-center gap-2">
                <Gift size={15} className="text-yellow-400" /> Cómo se canjean los puntos
              </h3>
              <div className="space-y-2">
                {[
                  { pts: '500 pts', valor: '5% descuento en próxima reserva' },
                  { pts: '1.000 pts', valor: '$5.000 COP de descuento directo' },
                  { pts: '2.500 pts', valor: 'Acceso gratis a 1 experiencia básica' },
                  { pts: '5.000 pts', valor: 'Tour gratis para 1 persona (valor hasta $60K)' },
                  { pts: '10.000 pts', valor: 'Paquete VIP — experiencia exclusiva GuanaGO' },
                ].map((c) => (
                  <div key={c.pts} className="flex items-center gap-3 text-xs">
                    <span className="font-black text-yellow-400 w-20 shrink-0">{c.pts}</span>
                    <span className="text-gray-400">{c.valor}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── TAB: WIFI CAPTIVO ──────────────────────────────────────────── */}
        {tab === 'wifi' && (
          <>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
              <p className="text-[10px] font-black text-gray-500 uppercase mb-1">¿Qué es?</p>
              <p className="text-sm text-gray-300 leading-relaxed">
                El portal WiFi captivo convierte cualquier negocio aliado en un
                <span className="text-teal-400 font-bold"> punto de captación digital</span> automático.
                Cuando un turista se conecta al WiFi del local, GuanaGO aparece primero.
              </p>
            </div>

            {/* Flujo visual */}
            <div>
              <h3 className="font-black text-sm mb-3 flex items-center gap-2">
                <Wifi size={15} className="text-teal-400" /> Flujo del portal captivo
              </h3>
              <div className="space-y-3">
                {WIFI_PASOS.map((paso, i) => (
                  <div key={paso.num} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-xl bg-teal-900/40 border border-teal-700/40 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-black text-teal-400">{paso.num}</span>
                      </div>
                      {i < WIFI_PASOS.length - 1 && (
                        <div className="w-px flex-1 mt-1 bg-gray-800" />
                      )}
                    </div>
                    <div className="pb-3">
                      <p className="font-black text-xs text-white mb-0.5">{paso.titulo}</p>
                      <p className="text-xs text-gray-500 leading-relaxed">{paso.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Requisitos técnicos */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
              <h3 className="font-black text-sm mb-3 flex items-center gap-2">
                <Smartphone size={15} className="text-indigo-400" /> Requisitos técnicos
              </h3>
              <div className="space-y-2">
                {[
                  { item: 'Router con soporte Hotspot / Portal Captivo', detail: 'TP-Link Omada, Mikrotik, Ubiquiti — desde $80K COP' },
                  { item: 'Página de bienvenida (landing GuanaGO)', detail: 'Ya construida — desplegable desde backend' },
                  { item: 'SSID del negocio configurado', detail: 'El aliado solo cambia la contraseña WiFi' },
                  { item: 'Conexión a internet estable', detail: 'Mínimo 10 Mbps para buena experiencia' },
                ].map((r) => (
                  <div key={r.item} className="bg-gray-800 rounded-xl p-3">
                    <p className="text-xs font-bold text-white">{r.item}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{r.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA implementación */}
            <div className="bg-teal-950/40 border border-teal-800/40 rounded-2xl p-4 flex items-start gap-3">
              <Globe size={18} className="text-teal-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-black text-sm mb-1">Pendiente de implementar</p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  La landing page del portal captivo y la integración con el router están pendientes.
                  Prioridad: después de Wompi y notificaciones WhatsApp.
                </p>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default AdminAliados;

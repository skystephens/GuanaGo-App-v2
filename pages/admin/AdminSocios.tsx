import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Users, Music, MapPin, Building2, Utensils, Car, 
  ShoppingBag, Waves, Calendar, Search, Plus, RefreshCw,
  CheckCircle, XCircle, Clock, Eye, Edit3, Settings,
  ChevronRight, Star, DollarSign, Package, Filter,
  UserPlus, Shield, Wallet, FileText, X, Check
} from 'lucide-react';
import { AppRoute, TipoSocio, Socio, SocioConfig } from '../../types';

interface AdminSociosProps {
  onBack: () => void;
  onNavigate: (route: AppRoute, data?: any) => void;
}

// Configuración de cada tipo de socio
const SOCIOS_CONFIG: SocioConfig[] = [
  {
    tipo: 'artista_musical',
    label: 'Artista Musical',
    icon: '🎵',
    color: 'from-purple-600 to-pink-600',
    camposRequeridos: ['contrato', 'cesion_derechos', 'identificacion', 'foto_perfil', 'biografia', 'contenido_musical'],
    camposOpcionales: ['wallet_hedera', 'video_promocional', 'redes_sociales'],
    portalRoute: AppRoute.ARTISTA_PORTAL
  },
  {
    tipo: 'tour_operador',
    label: 'Tour Operador',
    icon: '🗺️',
    color: 'from-green-600 to-emerald-600',
    camposRequeridos: ['rnt', 'poliza_seguro', 'identificacion', 'fotos_tours', 'descripcion_servicios'],
    camposOpcionales: ['certificaciones', 'guias_registrados', 'vehiculos'],
    portalRoute: AppRoute.SOCIO_PORTAL
  },
  {
    tipo: 'alojamiento',
    label: 'Alojamiento',
    icon: '🏨',
    color: 'from-blue-600 to-cyan-600',
    camposRequeridos: ['rnt', 'identificacion', 'fotos_propiedad', 'descripcion', 'capacidad', 'direccion'],
    camposOpcionales: ['amenidades', 'politicas_cancelacion', 'check_in_out'],
    portalRoute: AppRoute.SOCIO_PORTAL
  },
  {
    tipo: 'restaurante',
    label: 'Restaurante / Bar',
    icon: '🍽️',
    color: 'from-orange-600 to-red-600',
    camposRequeridos: ['registro_sanitario', 'identificacion', 'fotos_local', 'menu', 'horarios', 'direccion'],
    camposOpcionales: ['reservaciones', 'delivery', 'eventos_especiales'],
    portalRoute: AppRoute.SOCIO_PORTAL
  },
  {
    tipo: 'transporte',
    label: 'Transporte',
    icon: '🚕',
    color: 'from-yellow-600 to-amber-600',
    camposRequeridos: ['licencia_conduccion', 'tarjeta_operacion', 'soat', 'tecnicomecanica', 'fotos_vehiculo'],
    camposOpcionales: ['rutas_frecuentes', 'tarifas'],
    portalRoute: AppRoute.SOCIO_PORTAL
  },
  {
    tipo: 'comercio',
    label: 'Comercio / Artesanía',
    icon: '🛍️',
    color: 'from-pink-600 to-rose-600',
    camposRequeridos: ['rut', 'identificacion', 'fotos_productos', 'catalogo', 'direccion'],
    camposOpcionales: ['envios', 'personalizacion'],
    portalRoute: AppRoute.SOCIO_PORTAL
  },
  {
    tipo: 'experiencia',
    label: 'Experiencia / Actividad',
    icon: '🤿',
    color: 'from-teal-600 to-cyan-600',
    camposRequeridos: ['certificaciones', 'poliza_seguro', 'identificacion', 'fotos_actividad', 'descripcion', 'equipos'],
    camposOpcionales: ['niveles_dificultad', 'grupos_minmax', 'restricciones'],
    portalRoute: AppRoute.SOCIO_PORTAL
  },
  {
    tipo: 'evento',
    label: 'Organizador Eventos',
    icon: '🎉',
    color: 'from-violet-600 to-purple-600',
    camposRequeridos: ['identificacion', 'portafolio_eventos', 'referencias'],
    camposOpcionales: ['venues_aliados', 'proveedores'],
    portalRoute: AppRoute.SOCIO_PORTAL
  }
];

// Campos con labels legibles
const CAMPOS_LABELS: Record<string, string> = {
  contrato: 'Contrato de Colaboración',
  cesion_derechos: 'Cesión de Derechos Digitales',
  identificacion: 'Identificación (Cédula/Pasaporte)',
  foto_perfil: 'Foto de Perfil Profesional',
  biografia: 'Biografía / Descripción',
  contenido_musical: 'Contenido Musical (MP3/WAV)',
  wallet_hedera: 'Wallet Hedera',
  video_promocional: 'Video Promocional',
  redes_sociales: 'Redes Sociales',
  rnt: 'Registro Nacional de Turismo (RNT)',
  poliza_seguro: 'Póliza de Seguro',
  fotos_tours: 'Fotos de Tours/Servicios',
  descripcion_servicios: 'Descripción de Servicios',
  certificaciones: 'Certificaciones',
  guias_registrados: 'Guías Registrados',
  vehiculos: 'Vehículos Registrados',
  fotos_propiedad: 'Fotos del Alojamiento',
  descripcion: 'Descripción',
  capacidad: 'Capacidad (Huéspedes)',
  direccion: 'Dirección',
  amenidades: 'Amenidades',
  politicas_cancelacion: 'Políticas de Cancelación',
  check_in_out: 'Horarios Check-in/out',
  registro_sanitario: 'Registro Sanitario',
  fotos_local: 'Fotos del Local',
  menu: 'Menú / Carta',
  horarios: 'Horarios de Atención',
  reservaciones: 'Sistema de Reservaciones',
  delivery: 'Servicio Delivery',
  eventos_especiales: 'Eventos Especiales',
  licencia_conduccion: 'Licencia de Conducción',
  tarjeta_operacion: 'Tarjeta de Operación',
  soat: 'SOAT Vigente',
  tecnicomecanica: 'Técnico-mecánica',
  fotos_vehiculo: 'Fotos del Vehículo',
  rutas_frecuentes: 'Rutas Frecuentes',
  tarifas: 'Tarifas',
  rut: 'RUT',
  fotos_productos: 'Fotos de Productos',
  catalogo: 'Catálogo',
  envios: 'Envíos Disponibles',
  personalizacion: 'Personalización',
  fotos_actividad: 'Fotos de la Actividad',
  equipos: 'Equipos Disponibles',
  niveles_dificultad: 'Niveles de Dificultad',
  grupos_minmax: 'Tamaño de Grupos',
  restricciones: 'Restricciones',
  portafolio_eventos: 'Portafolio de Eventos',
  referencias: 'Referencias',
  venues_aliados: 'Venues Aliados',
  proveedores: 'Proveedores'
};

const AdminSocios: React.FC<AdminSociosProps> = ({ onBack, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'lista' | 'nuevo' | 'configuracion'>('lista');
  const [socios, setSocios] = useState<Socio[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [estadoFilter, setEstadoFilter] = useState<string>('all');
  const [showDetail, setShowDetail] = useState(false);
  const [selectedSocio, setSelectedSocio] = useState<Socio | null>(null);
  
  // Form para nuevo socio
  const [nuevoSocio, setNuevoSocio] = useState({
    nombre: '',
    nombreComercial: '',
    tipo: '' as TipoSocio | '',
    email: '',
    telefono: '',
    comisionGuanaGO: 15
  });

  useEffect(() => {
    loadSocios();
  }, []);

  const loadSocios = async () => {
    setLoading(true);
    try {
      // Demo data - en producción cargaría de Airtable
      const demoSocios: Socio[] = [
        {
          id: 'socio-001',
          nombre: 'Jah Melody',
          nombreComercial: 'Jah Melody Music',
          tipo: 'artista_musical',
          email: 'jah@melody.com',
          telefono: '+57 310 123 4567',
          estado: 'activo',
          verificado: true,
          comisionGuanaGO: 15,
          walletHedera: '0.0.123456',
          documentosCompletados: ['contrato', 'cesion_derechos', 'identificacion', 'foto_perfil', 'biografia', 'contenido_musical'],
          documentosPendientes: ['wallet_hedera'],
          productosActivos: 3,
          ventasTotales: 2500000,
          calificacionPromedio: 4.8,
          createdAt: '2026-01-10T10:00:00Z',
          updatedAt: '2026-01-13T15:00:00Z'
        },
        {
          id: 'socio-002',
          nombre: 'Carlos Rodríguez',
          nombreComercial: 'Caribe Tours SAI',
          tipo: 'tour_operador',
          email: 'carlos@caribetours.com',
          telefono: '+57 315 987 6543',
          estado: 'activo',
          verificado: true,
          comisionGuanaGO: 12,
          documentosCompletados: ['rnt', 'poliza_seguro', 'identificacion', 'fotos_tours', 'descripcion_servicios'],
          documentosPendientes: [],
          productosActivos: 8,
          ventasTotales: 15000000,
          calificacionPromedio: 4.9,
          createdAt: '2025-06-15T10:00:00Z',
          updatedAt: '2026-01-12T10:00:00Z'
        },
        {
          id: 'socio-003',
          nombre: 'María Hernández',
          nombreComercial: 'Hotel Decameron',
          tipo: 'alojamiento',
          email: 'maria@decameron.com',
          telefono: '+57 320 456 7890',
          estado: 'activo',
          verificado: true,
          comisionGuanaGO: 10,
          documentosCompletados: ['rnt', 'identificacion', 'fotos_propiedad', 'descripcion', 'capacidad', 'direccion'],
          documentosPendientes: ['amenidades'],
          productosActivos: 12,
          ventasTotales: 45000000,
          calificacionPromedio: 4.5,
          createdAt: '2025-03-20T10:00:00Z',
          updatedAt: '2026-01-13T10:00:00Z'
        },
        {
          id: 'socio-004',
          nombre: 'Pedro Gómez',
          nombreComercial: 'Buceo San Andrés',
          tipo: 'experiencia',
          email: 'pedro@buceosai.com',
          telefono: '+57 318 234 5678',
          estado: 'prospecto',
          verificado: false,
          comisionGuanaGO: 15,
          documentosCompletados: ['identificacion'],
          documentosPendientes: ['certificaciones', 'poliza_seguro', 'fotos_actividad', 'descripcion', 'equipos'],
          productosActivos: 0,
          ventasTotales: 0,
          calificacionPromedio: 0,
          createdAt: '2026-01-12T10:00:00Z',
          updatedAt: '2026-01-12T10:00:00Z'
        }
      ];
      setSocios(demoSocios);
    } catch (error) {
      console.error('Error cargando socios:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConfigByTipo = (tipo: TipoSocio): SocioConfig | undefined => {
    return SOCIOS_CONFIG.find(c => c.tipo === tipo);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activo': return 'bg-green-900/50 text-green-400';
      case 'prospecto': return 'bg-blue-900/50 text-blue-400';
      case 'pausado': return 'bg-yellow-900/50 text-yellow-400';
      case 'suspendido': return 'bg-red-900/50 text-red-400';
      default: return 'bg-gray-900/50 text-gray-400';
    }
  };

  const getOnboardingProgress = (socio: Socio) => {
    const config = getConfigByTipo(socio.tipo);
    if (!config) return 0;
    const total = config.camposRequeridos.length;
    const completados = socio.documentosCompletados.filter(d => 
      config.camposRequeridos.includes(d)
    ).length;
    return Math.round((completados / total) * 100);
  };

  const filteredSocios = socios.filter(s => {
    const matchSearch = s.nombreComercial.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       s.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTipo = tipoFilter === 'all' || s.tipo === tipoFilter;
    const matchEstado = estadoFilter === 'all' || s.estado === estadoFilter;
    return matchSearch && matchTipo && matchEstado;
  });

  const handleCrearSocio = async () => {
    if (!nuevoSocio.nombre || !nuevoSocio.tipo || !nuevoSocio.email) {
      alert('Complete los campos requeridos');
      return;
    }
    
    const newSocio: Socio = {
      id: `socio-${Date.now()}`,
      nombre: nuevoSocio.nombre,
      nombreComercial: nuevoSocio.nombreComercial || nuevoSocio.nombre,
      tipo: nuevoSocio.tipo as TipoSocio,
      email: nuevoSocio.email,
      telefono: nuevoSocio.telefono,
      estado: 'prospecto',
      verificado: false,
      comisionGuanaGO: nuevoSocio.comisionGuanaGO,
      documentosCompletados: [],
      documentosPendientes: getConfigByTipo(nuevoSocio.tipo as TipoSocio)?.camposRequeridos || [],
      productosActivos: 0,
      ventasTotales: 0,
      calificacionPromedio: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setSocios([...socios, newSocio]);
    setNuevoSocio({
      nombre: '',
      nombreComercial: '',
      tipo: '',
      email: '',
      telefono: '',
      comisionGuanaGO: 15
    });
    setActiveTab('lista');
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white pb-24 font-sans">
      {/* Header */}
      <header className="px-6 pt-12 pb-4 bg-gradient-to-b from-blue-900/30 to-gray-900">
        <div className="flex items-center gap-4 mb-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Gestión de Socios</h1>
            <p className="text-gray-400 text-sm">Operadores, Artistas, Alojamientos...</p>
          </div>
          <button 
            onClick={loadSocios}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          <div className="bg-gray-800/50 p-3 rounded-xl border border-gray-700">
            <p className="text-[10px] text-gray-400">Total Socios</p>
            <p className="text-lg font-bold">{socios.length}</p>
          </div>
          <div className="bg-gray-800/50 p-3 rounded-xl border border-gray-700">
            <p className="text-[10px] text-gray-400">Activos</p>
            <p className="text-lg font-bold text-green-400">{socios.filter(s => s.estado === 'activo').length}</p>
          </div>
          <div className="bg-gray-800/50 p-3 rounded-xl border border-gray-700">
            <p className="text-[10px] text-gray-400">Prospectos</p>
            <p className="text-lg font-bold text-blue-400">{socios.filter(s => s.estado === 'prospecto').length}</p>
          </div>
          <div className="bg-gray-800/50 p-3 rounded-xl border border-gray-700">
            <p className="text-[10px] text-gray-400">Tipos</p>
            <p className="text-lg font-bold">{new Set(socios.map(s => s.tipo)).size}</p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-6 py-3 flex gap-2 overflow-x-auto border-b border-gray-800">
        {[
          { id: 'lista', label: 'Socios', icon: Users },
          { id: 'nuevo', label: 'Nuevo Socio', icon: UserPlus },
          { id: 'configuracion', label: 'Perfiles', icon: Settings }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors
              ${activeTab === tab.id 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw size={32} className="animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            {/* Tab: Lista de Socios */}
            {activeTab === 'lista' && (
              <div className="space-y-4">
                {/* Search & Filters */}
                <div className="space-y-3">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Buscar socio..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    <select
                      value={tipoFilter}
                      onChange={(e) => setTipoFilter(e.target.value)}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs"
                    >
                      <option value="all">Todos los tipos</option>
                      {SOCIOS_CONFIG.map(c => (
                        <option key={c.tipo} value={c.tipo}>{c.icon} {c.label}</option>
                      ))}
                    </select>
                    <select
                      value={estadoFilter}
                      onChange={(e) => setEstadoFilter(e.target.value)}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs"
                    >
                      <option value="all">Todos los estados</option>
                      <option value="activo">Activo</option>
                      <option value="prospecto">Prospecto</option>
                      <option value="pausado">Pausado</option>
                      <option value="suspendido">Suspendido</option>
                    </select>
                  </div>
                </div>

                {/* Lista */}
                {filteredSocios.length === 0 ? (
                  <div className="text-center py-12">
                    <Users size={48} className="mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400">No hay socios registrados</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredSocios.map(socio => {
                      const config = getConfigByTipo(socio.tipo);
                      const progress = getOnboardingProgress(socio);
                      
                      return (
                        <div 
                          key={socio.id}
                          onClick={() => { setSelectedSocio(socio); setShowDetail(true); }}
                          className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-blue-500/50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config?.color || 'from-gray-600 to-gray-700'} flex items-center justify-center text-xl`}>
                              {config?.icon || '👤'}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="font-bold">{socio.nombreComercial}</h3>
                                  <p className="text-xs text-gray-400">{config?.label || socio.tipo}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getEstadoColor(socio.estado)}`}>
                                    {socio.estado}
                                  </span>
                                  {socio.verificado && (
                                    <span className="flex items-center gap-1 text-[10px] text-green-400">
                                      <CheckCircle size={10} /> Verificado
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              {/* Progress bar */}
                              {progress < 100 && (
                                <div className="mt-2">
                                  <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                                    <span>Onboarding</span>
                                    <span>{progress}%</span>
                                  </div>
                                  <div className="w-full bg-gray-700 rounded-full h-1.5">
                                    <div 
                                      className="h-1.5 rounded-full bg-blue-500"
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                              
                              {/* Stats */}
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Package size={12} />
                                  {socio.productosActivos} productos
                                </span>
                                <span className="flex items-center gap-1">
                                  <DollarSign size={12} />
                                  ${(socio.ventasTotales / 1000000).toFixed(1)}M
                                </span>
                                {socio.calificacionPromedio > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Star size={12} className="text-yellow-400" />
                                    {socio.calificacionPromedio.toFixed(1)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <ChevronRight size={16} className="text-gray-500 mt-4" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Nuevo Socio */}
            {activeTab === 'nuevo' && (
              <div className="space-y-4">
                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <UserPlus size={18} className="text-blue-400" />
                    Registrar Nuevo Socio
                  </h3>

                  {/* Seleccionar tipo primero */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Tipo de Socio *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {SOCIOS_CONFIG.map(config => (
                        <button
                          key={config.tipo}
                          type="button"
                          onClick={() => setNuevoSocio({ ...nuevoSocio, tipo: config.tipo })}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            nuevoSocio.tipo === config.tipo
                              ? `bg-gradient-to-br ${config.color} border-white/20`
                              : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                          }`}
                        >
                          <p className="text-lg">{config.icon}</p>
                          <p className="font-bold text-sm mt-1">{config.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {nuevoSocio.tipo && (
                    <>
                      {/* Campos básicos */}
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Nombre del Responsable *</label>
                          <input
                            type="text"
                            value={nuevoSocio.nombre}
                            onChange={(e) => setNuevoSocio({ ...nuevoSocio, nombre: e.target.value })}
                            placeholder="Juan Pérez"
                            className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Nombre Comercial</label>
                          <input
                            type="text"
                            value={nuevoSocio.nombreComercial}
                            onChange={(e) => setNuevoSocio({ ...nuevoSocio, nombreComercial: e.target.value })}
                            placeholder="Mi Negocio SAI"
                            className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Email *</label>
                          <input
                            type="email"
                            value={nuevoSocio.email}
                            onChange={(e) => setNuevoSocio({ ...nuevoSocio, email: e.target.value })}
                            placeholder="correo@ejemplo.com"
                            className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Teléfono</label>
                          <input
                            type="tel"
                            value={nuevoSocio.telefono}
                            onChange={(e) => setNuevoSocio({ ...nuevoSocio, telefono: e.target.value })}
                            placeholder="+57 310 123 4567"
                            className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Comisión GuanaGO (%)</label>
                          <input
                            type="number"
                            value={nuevoSocio.comisionGuanaGO}
                            onChange={(e) => setNuevoSocio({ ...nuevoSocio, comisionGuanaGO: parseInt(e.target.value) || 15 })}
                            min={5}
                            max={30}
                            className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* Preview de requisitos */}
                      <div className="mt-4 p-3 bg-gray-700/50 rounded-xl">
                        <p className="text-sm font-bold text-gray-400 mb-2">Documentos requeridos para este perfil:</p>
                        <div className="flex flex-wrap gap-1">
                          {getConfigByTipo(nuevoSocio.tipo as TipoSocio)?.camposRequeridos.map(campo => (
                            <span key={campo} className="text-[10px] bg-blue-900/50 text-blue-400 px-2 py-1 rounded">
                              {CAMPOS_LABELS[campo] || campo}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={handleCrearSocio}
                        className="w-full mt-4 bg-gradient-to-r from-blue-600 to-cyan-600 p-4 rounded-xl font-bold flex items-center justify-center gap-2"
                      >
                        <Plus size={20} />
                        Crear Socio
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Tab: Configuración de Perfiles */}
            {activeTab === 'configuracion' && (
              <div className="space-y-4">
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                  <h3 className="font-bold mb-2">Perfiles de Socio Disponibles</h3>
                  <p className="text-sm text-gray-400">
                    Cada tipo de socio tiene requisitos específicos y un portal personalizado.
                  </p>
                </div>

                {SOCIOS_CONFIG.map(config => (
                  <div 
                    key={config.tipo}
                    className={`bg-gradient-to-br ${config.color} rounded-xl p-4 border border-white/10`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{config.icon}</span>
                      <div>
                        <h3 className="font-bold text-lg">{config.label}</h3>
                        <p className="text-xs text-white/70">{config.tipo}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-bold text-white/80 mb-1">Campos Requeridos:</p>
                        <div className="flex flex-wrap gap-1">
                          {config.camposRequeridos.map(campo => (
                            <span key={campo} className="text-[10px] bg-white/20 px-2 py-0.5 rounded">
                              {CAMPOS_LABELS[campo] || campo}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white/80 mb-1">Campos Opcionales:</p>
                        <div className="flex flex-wrap gap-1">
                          {config.camposOpcionales.map(campo => (
                            <span key={campo} className="text-[10px] bg-white/10 px-2 py-0.5 rounded">
                              {CAMPOS_LABELS[campo] || campo}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Detalle Socio */}
      {showDetail && selectedSocio && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center">
          <div className="bg-gray-900 w-full max-w-lg rounded-t-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Detalle del Socio</h2>
                <button onClick={() => setShowDetail(false)} className="p-2 hover:bg-gray-800 rounded-full">
                  <X size={20} />
                </button>
              </div>

              {/* Header del socio */}
              {(() => {
                const config = getConfigByTipo(selectedSocio.tipo);
                return (
                  <div className={`bg-gradient-to-br ${config?.color || 'from-gray-600 to-gray-700'} rounded-xl p-4 mb-6`}>
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{config?.icon || '👤'}</span>
                      <div>
                        <h3 className="text-xl font-bold">{selectedSocio.nombreComercial}</h3>
                        <p className="text-sm text-white/70">{config?.label}</p>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 inline-block ${getEstadoColor(selectedSocio.estado)}`}>
                          {selectedSocio.estado}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-gray-800 p-3 rounded-xl text-center">
                  <p className="text-xs text-gray-400">Productos</p>
                  <p className="text-xl font-bold">{selectedSocio.productosActivos}</p>
                </div>
                <div className="bg-gray-800 p-3 rounded-xl text-center">
                  <p className="text-xs text-gray-400">Ventas</p>
                  <p className="text-xl font-bold text-green-400">${(selectedSocio.ventasTotales / 1000000).toFixed(1)}M</p>
                </div>
                <div className="bg-gray-800 p-3 rounded-xl text-center">
                  <p className="text-xs text-gray-400">Comisión</p>
                  <p className="text-xl font-bold text-blue-400">{selectedSocio.comisionGuanaGO}%</p>
                </div>
              </div>

              {/* Onboarding Progress */}
              {(() => {
                const config = getConfigByTipo(selectedSocio.tipo);
                const progress = getOnboardingProgress(selectedSocio);
                
                return (
                  <div className="bg-gray-800 rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-sm">Progreso de Onboarding</h4>
                      <span className={`font-bold ${progress === 100 ? 'text-green-400' : 'text-yellow-400'}`}>
                        {progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                      <div 
                        className={`h-2 rounded-full ${progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      {config?.camposRequeridos.map(campo => {
                        const completado = selectedSocio.documentosCompletados.includes(campo);
                        return (
                          <div key={campo} className="flex items-center gap-2 text-sm">
                            {completado ? (
                              <CheckCircle size={14} className="text-green-400" />
                            ) : (
                              <Clock size={14} className="text-gray-500" />
                            )}
                            <span className={completado ? 'text-gray-400 line-through' : ''}>
                              {CAMPOS_LABELS[campo] || campo}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Acciones */}
              <div className="space-y-3">
                <button 
                  onClick={() => {
                    const config = getConfigByTipo(selectedSocio.tipo);
                    setShowDetail(false);
                    if (config) {
                      onNavigate(config.portalRoute, { socioId: selectedSocio.id, tipo: selectedSocio.tipo });
                    }
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 p-3 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <Eye size={18} />
                  Ver Portal del Socio
                </button>
                <button className="w-full bg-purple-600 p-3 rounded-xl font-bold flex items-center justify-center gap-2">
                  <Edit3 size={18} />
                  Editar Socio
                </button>
                <button className="w-full bg-gray-800 p-3 rounded-xl font-medium flex items-center justify-center gap-2">
                  <Shield size={18} />
                  Cambiar Estado
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSocios;

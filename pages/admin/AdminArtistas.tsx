import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Users, Music, Package, DollarSign, Search,
  Filter, Eye, CheckCircle, XCircle, Clock, Plus,
  TrendingUp, RefreshCw, AlertCircle, ChevronDown, 
  Edit3, FileText, Shield, Wallet, Image, Link2,
  Check, X, ChevronRight, Star, Upload, Award
} from 'lucide-react';
import { AppRoute } from '../../types';
import { 
  airtableService, 
  ArtistaPortafolio, 
  ProductoArtista, 
  VentaArtista,
  EstadoGestion,
  TipoProducto,
  CategoriaProducto
} from '../../services/airtableService';

interface AdminArtistasProps {
  onBack: () => void;
  onNavigate: (route: AppRoute, data?: any) => void;
}

// Checklist de requisitos para mintear
interface OnboardingStep {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: 'legal' | 'contenido' | 'financiero' | 'blockchain';
  obligatorio: boolean;
  completado: boolean;
}

const DEFAULT_ONBOARDING_STEPS: OnboardingStep[] = [
  // Legal
  { id: 'step-1', titulo: 'Contrato de Colaboración', descripcion: 'Firmar acuerdo de distribución de ingresos (70/15/15)', categoria: 'legal', obligatorio: true, completado: false },
  { id: 'step-2', titulo: 'Cesión de Derechos Digitales', descripcion: 'Autorización para distribución digital y NFTs', categoria: 'legal', obligatorio: true, completado: false },
  { id: 'step-3', titulo: 'Identificación Verificada', descripcion: 'Cédula o pasaporte escaneado', categoria: 'legal', obligatorio: true, completado: false },
  { id: 'step-4', titulo: 'Declaración de Originalidad', descripcion: 'Confirmar que el contenido es original', categoria: 'legal', obligatorio: true, completado: false },
  // Contenido
  { id: 'step-5', titulo: 'Foto Profesional', descripcion: 'Imagen de perfil en alta resolución', categoria: 'contenido', obligatorio: true, completado: false },
  { id: 'step-6', titulo: 'Biografía Artística', descripcion: 'Texto de 100-300 palabras', categoria: 'contenido', obligatorio: true, completado: false },
  { id: 'step-7', titulo: 'Archivo Musical (WAV/MP3)', descripcion: 'Al menos 1 canción en alta calidad', categoria: 'contenido', obligatorio: true, completado: false },
  { id: 'step-8', titulo: 'Cover Art', descripcion: 'Imagen para el NFT (1000x1000 mínimo)', categoria: 'contenido', obligatorio: true, completado: false },
  { id: 'step-9', titulo: 'Video Promocional', descripcion: 'Video corto opcional para redes', categoria: 'contenido', obligatorio: false, completado: false },
  // Financiero
  { id: 'step-10', titulo: 'Datos Bancarios', descripcion: 'Cuenta para recibir pagos tradicionales', categoria: 'financiero', obligatorio: true, completado: false },
  { id: 'step-11', titulo: 'RUT o Documento Fiscal', descripcion: 'Para facturación (si aplica)', categoria: 'financiero', obligatorio: false, completado: false },
  // Blockchain
  { id: 'step-12', titulo: 'Wallet Hedera Creada', descripcion: 'Cuenta para recibir royalties crypto', categoria: 'blockchain', obligatorio: false, completado: false },
  { id: 'step-13', titulo: 'KYC Verificado', descripcion: 'Verificación de identidad para blockchain', categoria: 'blockchain', obligatorio: false, completado: false },
];

const AdminArtistas: React.FC<AdminArtistasProps> = ({ onBack, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'portafolio' | 'productos' | 'ventas' | 'onboarding'>('portafolio');
  const [artistas, setArtistas] = useState<ArtistaPortafolio[]>([]);
  const [productos, setProductos] = useState<ProductoArtista[]>([]);
  const [ventas, setVentas] = useState<VentaArtista[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('all');
  const [selectedArtista, setSelectedArtista] = useState<ArtistaPortafolio | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingSteps, setOnboardingSteps] = useState<OnboardingStep[]>(DEFAULT_ONBOARDING_STEPS);
  
  // Modal crear producto
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    artistaId: '',
    nombre: '',
    descripcion: '',
    categoria: 'digital' as CategoriaProducto,
    tipo: 'nft_musica' as TipoProducto,
    precioCOP: 0,
    precioGUANA: 0,
    stock: -1,
    fechaExperiencia: '',
    ubicacion: '',
    duracion: ''
  });

  // Resumen financiero
  const [resumen, setResumen] = useState({
    totalVentas: 0,
    ventasCount: 0,
    gananciasArtista: 0,
    gananciasGuanaGO: 0,
    gananciasCluster: 0,
    pendientesPago: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar datos desde Airtable
      const [artistasData, productosData, ventasData, resumenData] = await Promise.all([
        airtableService.getArtistasPortafolio(),
        airtableService.getProductosArtista({ activos: true }),
        airtableService.getVentasArtista({ limit: 50 }),
        airtableService.getResumenVentas()
      ]);
      
      setArtistas(artistasData);
      setProductos(productosData);
      setVentas(ventasData);
      setResumen(resumenData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      // Datos demo para desarrollo
      setArtistas([]);
      setProductos([]);
      setVentas([]);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado: EstadoGestion) => {
    switch (estado) {
      case 'activo': return 'bg-green-900/50 text-green-400';
      case 'en_negociacion': return 'bg-yellow-900/50 text-yellow-400';
      case 'prospecto': return 'bg-blue-900/50 text-blue-400';
      case 'pausado': return 'bg-orange-900/50 text-orange-400';
      case 'terminado': return 'bg-red-900/50 text-red-400';
      default: return 'bg-gray-900/50 text-gray-400';
    }
  };

  const getEstadoLabel = (estado: EstadoGestion) => {
    switch (estado) {
      case 'activo': return 'Activo';
      case 'en_negociacion': return 'En Negociación';
      case 'prospecto': return 'Prospecto';
      case 'pausado': return 'Pausado';
      case 'terminado': return 'Terminado';
      default: return estado;
    }
  };

  const getCategoriaIcon = (categoria: CategoriaProducto) => {
    switch (categoria) {
      case 'digital': return <Music size={14} />;
      case 'fisico': return <Package size={14} />;
      case 'experiencia': return <Star size={14} />;
      case 'acceso': return <Award size={14} />;
      default: return <Package size={14} />;
    }
  };

  const toggleStep = (stepId: string) => {
    setOnboardingSteps(prev => 
      prev.map(step => 
        step.id === stepId ? { ...step, completado: !step.completado } : step
      )
    );
  };

  const getOnboardingProgress = () => {
    const obligatorios = onboardingSteps.filter(s => s.obligatorio);
    const completados = obligatorios.filter(s => s.completado);
    return Math.round((completados.length / obligatorios.length) * 100);
  };

  const canMintear = () => {
    return onboardingSteps.filter(s => s.obligatorio).every(s => s.completado);
  };

  const filteredArtistas = artistas.filter(a => {
    const matchSearch = a.nombreArtistico.toLowerCase().includes(searchTerm.toLowerCase());
    const matchEstado = estadoFilter === 'all' || a.estadoGestion === estadoFilter;
    return matchSearch && matchEstado;
  });

  return (
    <div className="bg-gray-900 min-h-screen text-white pb-24 font-sans">
      {/* Header */}
      <header className="px-6 pt-12 pb-4 bg-gradient-to-b from-purple-900/30 to-gray-900">
        <div className="flex items-center gap-4 mb-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Gestión de Artistas</h1>
            <p className="text-gray-400 text-sm">NFTs & Portafolio RIMM</p>
          </div>
          <button 
            onClick={loadData}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          <div className="bg-gray-800/50 p-3 rounded-xl border border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <Users size={14} className="text-purple-400" />
              <span className="text-[10px] text-gray-400">Artistas</span>
            </div>
            <p className="text-lg font-bold">{artistas.length}</p>
          </div>
          <div className="bg-gray-800/50 p-3 rounded-xl border border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <Package size={14} className="text-blue-400" />
              <span className="text-[10px] text-gray-400">Productos</span>
            </div>
            <p className="text-lg font-bold">{productos.length}</p>
          </div>
          <div className="bg-gray-800/50 p-3 rounded-xl border border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={14} className="text-green-400" />
              <span className="text-[10px] text-gray-400">Ventas</span>
            </div>
            <p className="text-lg font-bold">{resumen.ventasCount}</p>
          </div>
          <div className="bg-gray-800/50 p-3 rounded-xl border border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={14} className="text-yellow-400" />
              <span className="text-[10px] text-gray-400">Tu Comisión</span>
            </div>
            <p className="text-sm font-bold text-green-400">
              ${(resumen.gananciasGuanaGO / 1000).toFixed(0)}K
            </p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-6 py-3 flex gap-2 overflow-x-auto border-b border-gray-800">
        {[
          { id: 'portafolio', label: 'Portafolio', icon: Users },
          { id: 'productos', label: 'Productos', icon: Package },
          { id: 'ventas', label: 'Ventas', icon: DollarSign },
          { id: 'onboarding', label: 'Onboarding', icon: CheckCircle }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors
              ${activeTab === tab.id 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Filters */}
      {activeTab !== 'onboarding' && (
        <div className="px-6 py-4 space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
          
          {activeTab === 'portafolio' && (
            <div className="flex gap-2 overflow-x-auto">
              {['all', 'activo', 'en_negociacion', 'prospecto', 'pausado'].map(estado => (
                <button
                  key={estado}
                  onClick={() => setEstadoFilter(estado)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors
                    ${estadoFilter === estado 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-800 text-gray-400'}`}
                >
                  {estado === 'all' ? 'Todos' : getEstadoLabel(estado as EstadoGestion)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="px-6 pb-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw size={32} className="animate-spin text-purple-500" />
          </div>
        ) : (
          <>
            {/* Tab: Portafolio de Artistas */}
            {activeTab === 'portafolio' && (
              <div className="space-y-3">
                {/* Botón agregar nuevo */}
                <button
                  onClick={() => setShowOnboarding(true)}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <Plus size={20} />
                  <span className="font-bold">Agregar Nuevo Artista</span>
                </button>

                {filteredArtistas.length === 0 ? (
                  <div className="text-center py-12">
                    <Music size={48} className="mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400">No hay artistas en el portafolio</p>
                    <p className="text-gray-500 text-sm mt-1">Agrega tu primer artista para comenzar</p>
                  </div>
                ) : (
                  filteredArtistas.map(artista => (
                    <div 
                      key={artista.id}
                      onClick={() => { setSelectedArtista(artista); setShowDetail(true); }}
                      className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-purple-500/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-lg font-bold">
                          {artista.nombreArtistico.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold">{artista.nombreArtistico}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getEstadoColor(artista.estadoGestion)}`}>
                              {getEstadoLabel(artista.estadoGestion)}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Package size={12} />
                              {artista.productosActivos} productos
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign size={12} />
                              ${(artista.ventasTotales / 1000).toFixed(0)}K ventas
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            {artista.contratoFirmado && (
                              <span className="flex items-center gap-1 text-[10px] text-green-400">
                                <CheckCircle size={10} /> Contrato ✓
                              </span>
                            )}
                            {artista.walletHedera && (
                              <span className="flex items-center gap-1 text-[10px] text-blue-400">
                                <Wallet size={10} /> Hedera ✓
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-gray-500" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab: Productos */}
            {activeTab === 'productos' && (
              <div className="space-y-3">
                {/* Botón crear producto */}
                <button
                  onClick={() => setShowCreateProduct(true)}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <Plus size={20} />
                  <span className="font-bold">Crear Nuevo Producto</span>
                </button>

                {productos.length === 0 ? (
                  <div className="text-center py-12">
                    <Package size={48} className="mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400">No hay productos creados</p>
                    <p className="text-gray-500 text-sm mt-1">Los productos aparecerán aquí</p>
                  </div>
                ) : (
                  productos.map(producto => (
                    <div 
                      key={producto.id}
                      className="bg-gray-800 rounded-xl p-4 border border-gray-700"
                    >
                      <div className="flex items-start gap-3">
                        {producto.imagenPrincipal ? (
                          <img 
                            src={producto.imagenPrincipal} 
                            alt={producto.nombre}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
                            {getCategoriaIcon(producto.categoria)}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-bold text-sm">{producto.nombre}</h3>
                              <p className="text-xs text-gray-400">{producto.artistaNombre}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium
                              ${producto.activo ? 'bg-green-900/50 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                              {producto.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-sm font-bold text-green-400">
                              ${producto.precioCOP.toLocaleString()}
                            </span>
                            {producto.precioGUANA && (
                              <span className="text-xs text-yellow-400">
                                {producto.precioGUANA} GUANA
                              </span>
                            )}
                            <span className="text-xs text-gray-500">
                              {producto.stock === -1 ? '∞' : producto.stock} disponibles
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] bg-gray-700 text-gray-300`}>
                              {producto.tipo.replace('_', ' ')}
                            </span>
                            {producto.ipfsCID && (
                              <span className="flex items-center gap-1 text-[10px] text-purple-400">
                                <Link2 size={10} /> IPFS
                              </span>
                            )}
                            {producto.hederaTokenId && (
                              <span className="flex items-center gap-1 text-[10px] text-blue-400">
                                <Shield size={10} /> NFT
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab: Ventas */}
            {activeTab === 'ventas' && (
              <div className="space-y-4">
                {/* Resumen financiero */}
                <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-xl p-4 border border-green-800/50">
                  <h3 className="font-bold text-green-400 mb-3">💰 Resumen Financiero</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-400">Ventas Totales</p>
                      <p className="text-lg font-bold">${resumen.totalVentas.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Tu Comisión (15%)</p>
                      <p className="text-lg font-bold text-green-400">${resumen.gananciasGuanaGO.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Para Artistas (70%)</p>
                      <p className="text-sm font-bold text-purple-400">${resumen.gananciasArtista.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Para Clúster (15%)</p>
                      <p className="text-sm font-bold text-blue-400">${resumen.gananciasCluster.toLocaleString()}</p>
                    </div>
                  </div>
                  {resumen.pendientesPago > 0 && (
                    <div className="mt-3 pt-3 border-t border-green-800/50">
                      <p className="text-xs text-yellow-400 flex items-center gap-2">
                        <AlertCircle size={14} />
                        Pendiente pagar a artistas: ${resumen.pendientesPago.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Lista de ventas */}
                {ventas.length === 0 ? (
                  <div className="text-center py-12">
                    <DollarSign size={48} className="mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400">No hay ventas registradas</p>
                  </div>
                ) : (
                  ventas.map(venta => (
                    <div 
                      key={venta.id}
                      className="bg-gray-800 rounded-xl p-4 border border-gray-700"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-sm">{venta.productoNombre || 'Producto'}</p>
                          <p className="text-xs text-gray-400">{venta.artistaNombre}</p>
                          <p className="text-[10px] text-gray-500 mt-1">{venta.idVenta}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-400">${venta.precioTotal.toLocaleString()}</p>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium
                            ${venta.estadoPago === 'pagado' ? 'bg-green-900/50 text-green-400' : 
                              venta.estadoPago === 'pendiente' ? 'bg-yellow-900/50 text-yellow-400' :
                              'bg-red-900/50 text-red-400'}`}>
                            {venta.estadoPago}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-700 text-xs">
                        <span className="text-purple-400">Artista: ${venta.montoArtista.toLocaleString()}</span>
                        <span className="text-green-400">Tú: ${venta.montoGuanaGO.toLocaleString()}</span>
                        <span className="text-blue-400">Clúster: ${venta.montoCluster.toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab: Onboarding */}
            {activeTab === 'onboarding' && (
              <div className="space-y-4">
                {/* Progress */}
                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold">Progreso de Onboarding</h3>
                    <span className={`text-lg font-bold ${getOnboardingProgress() === 100 ? 'text-green-400' : 'text-yellow-400'}`}>
                      {getOnboardingProgress()}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${getOnboardingProgress() === 100 ? 'bg-green-500' : 'bg-purple-500'}`}
                      style={{ width: `${getOnboardingProgress()}%` }}
                    />
                  </div>
                  {canMintear() ? (
                    <p className="text-green-400 text-sm mt-3 flex items-center gap-2">
                      <CheckCircle size={16} />
                      ¡Listo para mintear NFTs!
                    </p>
                  ) : (
                    <p className="text-yellow-400 text-sm mt-3 flex items-center gap-2">
                      <AlertCircle size={16} />
                      Completa los requisitos obligatorios para mintear
                    </p>
                  )}
                </div>

                {/* Checklist por categoría */}
                {['legal', 'contenido', 'financiero', 'blockchain'].map(cat => (
                  <div key={cat} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-700 flex items-center gap-3">
                      {cat === 'legal' && <Shield size={18} className="text-red-400" />}
                      {cat === 'contenido' && <Image size={18} className="text-blue-400" />}
                      {cat === 'financiero' && <DollarSign size={18} className="text-green-400" />}
                      {cat === 'blockchain' && <Wallet size={18} className="text-purple-400" />}
                      <h3 className="font-bold capitalize">{cat}</h3>
                      <span className="text-xs text-gray-500 ml-auto">
                        {onboardingSteps.filter(s => s.categoria === cat && s.completado).length}/
                        {onboardingSteps.filter(s => s.categoria === cat).length}
                      </span>
                    </div>
                    <div className="divide-y divide-gray-700">
                      {onboardingSteps
                        .filter(step => step.categoria === cat)
                        .map(step => (
                          <div 
                            key={step.id}
                            onClick={() => toggleStep(step.id)}
                            className="p-4 flex items-center gap-3 hover:bg-gray-750 cursor-pointer transition-colors"
                          >
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                              ${step.completado 
                                ? 'bg-green-600 border-green-600' 
                                : 'border-gray-600'}`}
                            >
                              {step.completado && <Check size={14} />}
                            </div>
                            <div className="flex-1">
                              <p className={`font-medium text-sm ${step.completado ? 'text-gray-400 line-through' : ''}`}>
                                {step.titulo}
                                {step.obligatorio && <span className="text-red-400 ml-1">*</span>}
                              </p>
                              <p className="text-xs text-gray-500">{step.descripcion}</p>
                            </div>
                            {step.completado ? (
                              <CheckCircle size={16} className="text-green-400" />
                            ) : (
                              <Clock size={16} className="text-gray-500" />
                            )}
                          </div>
                        ))
                      }
                    </div>
                  </div>
                ))}

                {/* Botón mintear */}
                <button
                  disabled={!canMintear()}
                  className={`w-full p-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
                    ${canMintear() 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90' 
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                >
                  <Shield size={20} />
                  {canMintear() ? 'Crear Primer NFT' : 'Completa los requisitos primero'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Detalle Artista */}
      {showDetail && selectedArtista && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center">
          <div className="bg-gray-900 w-full max-w-lg rounded-t-3xl max-h-[85vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Detalle del Artista</h2>
                <button onClick={() => setShowDetail(false)} className="p-2 hover:bg-gray-800 rounded-full">
                  <X size={20} />
                </button>
              </div>
              
              {/* Info del artista */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-2xl font-bold">
                  {selectedArtista.nombreArtistico.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedArtista.nombreArtistico}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getEstadoColor(selectedArtista.estadoGestion)}`}>
                    {getEstadoLabel(selectedArtista.estadoGestion)}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-800 p-4 rounded-xl">
                  <p className="text-xs text-gray-400">% Artista</p>
                  <p className="text-2xl font-bold text-purple-400">{selectedArtista.porcentajeArtista}%</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-xl">
                  <p className="text-xs text-gray-400">% GuanaGO</p>
                  <p className="text-2xl font-bold text-green-400">{selectedArtista.porcentajeGuanaGO}%</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-xl">
                  <p className="text-xs text-gray-400">Ventas Totales</p>
                  <p className="text-lg font-bold">${selectedArtista.ventasTotales.toLocaleString()}</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-xl">
                  <p className="text-xs text-gray-400">Tu Ganancia</p>
                  <p className="text-lg font-bold text-green-400">${selectedArtista.gananciasGuanaGO.toLocaleString()}</p>
                </div>
              </div>

              {/* Estado */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between bg-gray-800 p-3 rounded-xl">
                  <span className="text-sm">Contrato Firmado</span>
                  {selectedArtista.contratoFirmado ? (
                    <CheckCircle size={20} className="text-green-400" />
                  ) : (
                    <XCircle size={20} className="text-red-400" />
                  )}
                </div>
                <div className="flex items-center justify-between bg-gray-800 p-3 rounded-xl">
                  <span className="text-sm">Wallet Hedera</span>
                  {selectedArtista.walletHedera ? (
                    <span className="text-xs text-blue-400 font-mono">{selectedArtista.walletHedera}</span>
                  ) : (
                    <XCircle size={20} className="text-gray-500" />
                  )}
                </div>
                {selectedArtista.telefono && (
                  <div className="flex items-center justify-between bg-gray-800 p-3 rounded-xl">
                    <span className="text-sm">Teléfono</span>
                    <span className="text-xs text-gray-400">{selectedArtista.telefono}</span>
                  </div>
                )}
              </div>

              {/* Acciones */}
              <div className="space-y-3">
                <button 
                  onClick={() => {
                    setShowDetail(false);
                    onNavigate(AppRoute.ARTISTA_PORTAL, { artistaId: selectedArtista.id });
                  }}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <Eye size={18} />
                  Ver Portal del Artista
                </button>
                <button className="w-full bg-purple-600 p-3 rounded-xl font-bold flex items-center justify-center gap-2">
                  <Edit3 size={18} />
                  Editar Artista
                </button>
                <button className="w-full bg-gray-800 p-3 rounded-xl font-medium flex items-center justify-center gap-2">
                  <Package size={18} />
                  Ver Productos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear Producto */}
      {showCreateProduct && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center">
          <div className="bg-gray-900 w-full max-w-lg rounded-t-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Crear Producto</h2>
                <button onClick={() => setShowCreateProduct(false)} className="p-2 hover:bg-gray-800 rounded-full">
                  <X size={20} />
                </button>
              </div>

              {/* Seleccionar Artista */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">Artista *</label>
                <select
                  value={productForm.artistaId}
                  onChange={(e) => setProductForm({ ...productForm, artistaId: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">Seleccionar artista...</option>
                  {artistas.filter(a => a.estadoGestion === 'activo').map(a => (
                    <option key={a.id} value={a.id}>{a.nombreArtistico}</option>
                  ))}
                </select>
              </div>

              {/* Categoría */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">Categoría *</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'digital', label: '🎵 Digital / NFT', desc: 'Música, arte, video' },
                    { id: 'experiencia', label: '⭐ Experiencia', desc: 'Cenas, clases, tours' },
                    { id: 'acceso', label: '🎫 Acceso', desc: 'Membresías, backstage' },
                    { id: 'fisico', label: '📦 Físico', desc: 'Merch, vinilos, posters' }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setProductForm({ 
                        ...productForm, 
                        categoria: cat.id as CategoriaProducto,
                        tipo: cat.id === 'digital' ? 'nft_musica' :
                              cat.id === 'experiencia' ? 'cena_artista' :
                              cat.id === 'acceso' ? 'membresia' : 'merchandise'
                      })}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        productForm.categoria === cat.id
                          ? 'bg-purple-900/50 border-purple-500'
                          : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <p className="font-bold text-sm">{cat.label}</p>
                      <p className="text-[10px] text-gray-400">{cat.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tipo específico según categoría */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">Tipo de Producto *</label>
                <select
                  value={productForm.tipo}
                  onChange={(e) => setProductForm({ ...productForm, tipo: e.target.value as TipoProducto })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                >
                  {productForm.categoria === 'digital' && (
                    <>
                      <option value="nft_musica">🎵 NFT Música - Canción tokenizada</option>
                      <option value="nft_arte">🎨 NFT Arte - Obra visual digital</option>
                      <option value="nft_video">🎬 NFT Video - Video musical exclusivo</option>
                      <option value="nft_coleccionable">💎 NFT Coleccionable - Edición limitada</option>
                    </>
                  )}
                  {productForm.categoria === 'experiencia' && (
                    <>
                      <option value="cena_artista">🍽️ Cena con Artista - Cena privada</option>
                      <option value="clase_privada">🎓 Clase Privada - Masterclass 1:1</option>
                      <option value="tour_privado">🚶 Tour Privado - Recorrido exclusivo</option>
                      <option value="backstage">🎤 Backstage - Acceso a concierto</option>
                      <option value="meet_greet">🤝 Meet & Greet - Encuentro con artista</option>
                    </>
                  )}
                  {productForm.categoria === 'acceso' && (
                    <>
                      <option value="membresia">🌟 Membresía - Fan club anual</option>
                      <option value="early_access">⚡ Early Access - Acceso anticipado</option>
                    </>
                  )}
                  {productForm.categoria === 'fisico' && (
                    <>
                      <option value="merchandise">👕 Merchandise - Productos firmados</option>
                      <option value="vinilo">💿 Vinilo - Disco edición limitada</option>
                      <option value="poster_firmado">🖼️ Póster Firmado - Autografiado</option>
                      <option value="usb_coleccion">💾 USB Colección - Discografía completa</option>
                    </>
                  )}
                </select>
              </div>

              {/* Nombre y Descripción */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">Nombre del Producto *</label>
                <input
                  type="text"
                  value={productForm.nombre}
                  onChange={(e) => setProductForm({ ...productForm, nombre: e.target.value })}
                  placeholder="Ej: Reggae Sunrise - Edición Coleccionista"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">Descripción</label>
                <textarea
                  value={productForm.descripcion}
                  onChange={(e) => setProductForm({ ...productForm, descripcion: e.target.value })}
                  placeholder="Describe el producto..."
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              {/* Campos específicos para Experiencias */}
              {productForm.categoria === 'experiencia' && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Fecha de la Experiencia</label>
                    <input
                      type="date"
                      value={productForm.fechaExperiencia}
                      onChange={(e) => setProductForm({ ...productForm, fechaExperiencia: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Ubicación</label>
                    <input
                      type="text"
                      value={productForm.ubicacion}
                      onChange={(e) => setProductForm({ ...productForm, ubicacion: e.target.value })}
                      placeholder="Ej: Restaurante Miss Celia, San Andrés"
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Duración</label>
                    <input
                      type="text"
                      value={productForm.duracion}
                      onChange={(e) => setProductForm({ ...productForm, duracion: e.target.value })}
                      placeholder="Ej: 2 horas"
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </>
              )}

              {/* Precios */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Precio COP *</label>
                  <input
                    type="number"
                    value={productForm.precioCOP || ''}
                    onChange={(e) => setProductForm({ ...productForm, precioCOP: parseInt(e.target.value) || 0 })}
                    placeholder="150000"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Precio GUANA (opcional)</label>
                  <input
                    type="number"
                    value={productForm.precioGUANA || ''}
                    onChange={(e) => setProductForm({ ...productForm, precioGUANA: parseInt(e.target.value) || 0 })}
                    placeholder="1500"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Stock */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">Stock (-1 = ilimitado)</label>
                <input
                  type="number"
                  value={productForm.stock}
                  onChange={(e) => setProductForm({ ...productForm, stock: parseInt(e.target.value) })}
                  placeholder="-1"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Preview de distribución */}
              <div className="bg-gray-800/50 rounded-xl p-4 mb-6 border border-gray-700">
                <h4 className="text-sm font-bold text-gray-400 mb-3">Distribución por venta:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Artista (70%)</span>
                    <span className="text-purple-400 font-bold">${(productForm.precioCOP * 0.7).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">GuanaGO (15%)</span>
                    <span className="text-green-400 font-bold">${(productForm.precioCOP * 0.15).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Clúster RIMM (15%)</span>
                    <span className="text-blue-400 font-bold">${(productForm.precioCOP * 0.15).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="space-y-3">
                <button 
                  onClick={async () => {
                    try {
                      await airtableService.createProducto({
                        artistaId: productForm.artistaId,
                        nombre: productForm.nombre,
                        descripcion: productForm.descripcion,
                        tipo: productForm.tipo,
                        categoria: productForm.categoria,
                        precioCOP: productForm.precioCOP,
                        precioGUANA: productForm.precioGUANA || undefined,
                        stock: productForm.stock,
                        experienciaFecha: productForm.fechaExperiencia || undefined,
                        ubicacion: productForm.ubicacion || undefined,
                        duracion: productForm.duracion || undefined
                      });
                      setShowCreateProduct(false);
                      loadData();
                    } catch (error) {
                      console.error('Error creando producto:', error);
                    }
                  }}
                  disabled={!productForm.artistaId || !productForm.nombre || !productForm.precioCOP}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={20} />
                  Crear Producto
                </button>
                <button 
                  onClick={() => setShowCreateProduct(false)}
                  className="w-full bg-gray-800 p-3 rounded-xl font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminArtistas;

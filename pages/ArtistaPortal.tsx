import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Music, Package, DollarSign, TrendingUp,
  RefreshCw, CheckCircle, XCircle, Clock, Plus,
  Eye, Edit3, Shield, Wallet, Image, Link2,
  AlertCircle, ChevronRight, Star, Award, 
  Calendar, Percent, User, FileText, Upload
} from 'lucide-react';
import { AppRoute } from '../types';
import { 
  airtableService, 
  ArtistaPortafolio, 
  ProductoArtista, 
  VentaArtista,
  TipoProducto,
  CategoriaProducto
} from '../services/airtableService';

interface ArtistaPortalProps {
  onBack: () => void;
  onNavigate: (route: AppRoute, data?: any) => void;
  artistaId?: string; // ID del artista logueado
}

// Checklist de onboarding para el artista
interface OnboardingItem {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: 'legal' | 'contenido' | 'financiero' | 'blockchain';
  obligatorio: boolean;
  completado: boolean;
  accion?: string;
}

const ARTISTA_ONBOARDING: OnboardingItem[] = [
  { id: 'ao-1', titulo: 'Firmar Contrato', descripcion: 'Acuerdo de colaboración 70/15/15', categoria: 'legal', obligatorio: true, completado: false, accion: 'Descargar PDF' },
  { id: 'ao-2', titulo: 'Cesión de Derechos', descripcion: 'Autorización para NFTs', categoria: 'legal', obligatorio: true, completado: false, accion: 'Firmar' },
  { id: 'ao-3', titulo: 'Subir Identificación', descripcion: 'Cédula o pasaporte', categoria: 'legal', obligatorio: true, completado: false, accion: 'Subir' },
  { id: 'ao-4', titulo: 'Foto de Perfil', descripcion: 'Imagen HD profesional', categoria: 'contenido', obligatorio: true, completado: false, accion: 'Subir' },
  { id: 'ao-5', titulo: 'Biografía', descripcion: '100-300 palabras', categoria: 'contenido', obligatorio: true, completado: false, accion: 'Escribir' },
  { id: 'ao-6', titulo: 'Primera Canción', descripcion: 'WAV o MP3 de alta calidad', categoria: 'contenido', obligatorio: true, completado: false, accion: 'Subir' },
  { id: 'ao-7', titulo: 'Cover Art', descripcion: 'Imagen 1000x1000 mínimo', categoria: 'contenido', obligatorio: true, completado: false, accion: 'Subir' },
  { id: 'ao-8', titulo: 'Datos Bancarios', descripcion: 'Cuenta para recibir pagos', categoria: 'financiero', obligatorio: true, completado: false, accion: 'Agregar' },
  { id: 'ao-9', titulo: 'Crear Wallet Hedera', descripcion: 'Para royalties crypto (opcional)', categoria: 'blockchain', obligatorio: false, completado: false, accion: 'Crear' },
];

const ArtistaPortal: React.FC<ArtistaPortalProps> = ({ onBack, onNavigate, artistaId }) => {
  const [activeTab, setActiveTab] = useState<'resumen' | 'productos' | 'ventas' | 'onboarding'>('resumen');
  const [artista, setArtista] = useState<ArtistaPortafolio | null>(null);
  const [productos, setProductos] = useState<ProductoArtista[]>([]);
  const [ventas, setVentas] = useState<VentaArtista[]>([]);
  const [loading, setLoading] = useState(true);
  const [onboardingItems, setOnboardingItems] = useState<OnboardingItem[]>(ARTISTA_ONBOARDING);
  
  // Stats
  const [stats, setStats] = useState({
    ventasTotales: 0,
    gananciasNetas: 0,
    productosActivos: 0,
    pendientePago: 0,
    ventasMes: 0
  });

  useEffect(() => {
    loadArtistaData();
  }, [artistaId]);

  const loadArtistaData = async () => {
    setLoading(true);
    try {
      // En producción, cargaríamos datos del artista logueado
      // Por ahora usamos datos demo
      const demoArtista: ArtistaPortafolio = {
        id: artistaId || 'demo-001',
        artistaId: 'art-001',
        nombreArtistico: 'Jah Melody',
        estadoGestion: 'activo',
        porcentajeArtista: 70,
        porcentajeGuanaGO: 15,
        porcentajeCluster: 15,
        contratoFirmado: true,
        fechaContrato: '2026-01-10',
        walletHedera: '0.0.123456',
        productosActivos: 3,
        ventasTotales: 2500000,
        gananciasArtista: 1750000,
        gananciasGuanaGO: 375000,
        gananciasCluster: 375000,
        createdAt: '2026-01-10T10:00:00Z',
        updatedAt: '2026-01-13T15:00:00Z'
      };

      const demoProductos: ProductoArtista[] = [
        {
          id: 'prod-001',
          artistaId: 'art-001',
          artistaNombre: 'Jah Melody',
          nombre: 'Reggae Sunrise',
          descripcion: 'Canción original inspirada en los amaneceres de San Andrés',
          tipo: 'nft_musica',
          categoria: 'digital',
          precioCOP: 150000,
          precioGUANA: 1500,
          stock: 100,
          vendidos: 23,
          imagenPrincipal: '',
          activo: true,
          createdAt: '2026-01-10T10:00:00Z'
        },
        {
          id: 'prod-002',
          artistaId: 'art-001',
          artistaNombre: 'Jah Melody',
          nombre: 'Cena con Jah Melody',
          descripcion: 'Disfruta una cena privada con el artista en restaurante local',
          tipo: 'cena_artista',
          categoria: 'experiencia',
          precioCOP: 800000,
          stock: 10,
          vendidos: 2,
          fechaExperiencia: '2026-02-14',
          ubicacion: 'Restaurante Miss Celia, San Andrés',
          activo: true,
          createdAt: '2026-01-11T10:00:00Z'
        },
        {
          id: 'prod-003',
          artistaId: 'art-001',
          artistaNombre: 'Jah Melody',
          nombre: 'Membresía Fan Club 2026',
          descripcion: 'Acceso exclusivo a contenido, early access y descuentos',
          tipo: 'membresia',
          categoria: 'acceso',
          precioCOP: 200000,
          stock: -1, // Ilimitado
          vendidos: 45,
          activo: true,
          createdAt: '2026-01-12T10:00:00Z'
        }
      ];

      const demoVentas: VentaArtista[] = [
        {
          id: 'vnt-001',
          idVenta: 'VNT-20260113-0001',
          productoId: 'prod-001',
          productoNombre: 'Reggae Sunrise',
          artistaId: 'art-001',
          artistaNombre: 'Jah Melody',
          compradorId: 'usr-001',
          precioTotal: 150000,
          montoArtista: 105000,
          montoGuanaGO: 22500,
          montoCluster: 22500,
          metodoPago: 'tarjeta',
          estadoPago: 'pagado',
          createdAt: '2026-01-13T10:00:00Z'
        },
        {
          id: 'vnt-002',
          idVenta: 'VNT-20260113-0002',
          productoId: 'prod-003',
          productoNombre: 'Membresía Fan Club 2026',
          artistaId: 'art-001',
          artistaNombre: 'Jah Melody',
          compradorId: 'usr-002',
          precioTotal: 200000,
          montoArtista: 140000,
          montoGuanaGO: 30000,
          montoCluster: 30000,
          metodoPago: 'pse',
          estadoPago: 'pendiente',
          createdAt: '2026-01-13T14:00:00Z'
        }
      ];

      setArtista(demoArtista);
      setProductos(demoProductos);
      setVentas(demoVentas);
      setStats({
        ventasTotales: demoArtista.ventasTotales,
        gananciasNetas: demoArtista.gananciasArtista,
        productosActivos: demoArtista.productosActivos,
        pendientePago: 140000,
        ventasMes: 350000
      });

      // Simular algunos items completados
      setOnboardingItems(prev => prev.map((item, idx) => ({
        ...item,
        completado: idx < 6 // Primeros 6 completados
      })));

    } catch (error) {
      console.error('Error cargando datos del artista:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOnboardingProgress = () => {
    const obligatorios = onboardingItems.filter(i => i.obligatorio);
    const completados = obligatorios.filter(i => i.completado);
    return Math.round((completados.length / obligatorios.length) * 100);
  };

  const canPublish = () => {
    return onboardingItems.filter(i => i.obligatorio).every(i => i.completado);
  };

  const getCategoriaColor = (categoria: CategoriaProducto) => {
    switch (categoria) {
      case 'digital': return 'bg-purple-900/50 text-purple-400 border-purple-700';
      case 'experiencia': return 'bg-orange-900/50 text-orange-400 border-orange-700';
      case 'acceso': return 'bg-blue-900/50 text-blue-400 border-blue-700';
      case 'fisico': return 'bg-green-900/50 text-green-400 border-green-700';
      default: return 'bg-gray-900/50 text-gray-400 border-gray-700';
    }
  };

  const getCategoriaIcon = (categoria: CategoriaProducto) => {
    switch (categoria) {
      case 'digital': return <Music size={16} />;
      case 'experiencia': return <Star size={16} />;
      case 'acceso': return <Award size={16} />;
      case 'fisico': return <Package size={16} />;
      default: return <Package size={16} />;
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="bg-gray-900 min-h-screen text-white flex items-center justify-center">
        <RefreshCw size={32} className="animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen text-white pb-24 font-sans">
      {/* Header con info del artista */}
      <header className="px-6 pt-12 pb-6 bg-gradient-to-b from-purple-900/40 to-gray-900">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <p className="text-purple-400 text-xs font-bold uppercase">Mi Portal</p>
            <h1 className="text-xl font-bold">{artista?.nombreArtistico || 'Artista'}</h1>
          </div>
          <button 
            onClick={loadArtistaData}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Stats principales */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-green-900/40 to-green-800/20 p-4 rounded-xl border border-green-700/50">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={16} className="text-green-400" />
              <span className="text-xs text-green-400/80">Mis Ganancias</span>
            </div>
            <p className="text-xl font-bold text-green-400">{formatMoney(stats.gananciasNetas)}</p>
            <p className="text-[10px] text-gray-500 mt-1">70% de ventas totales</p>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-blue-400" />
              <span className="text-xs text-gray-400">Este Mes</span>
            </div>
            <p className="text-xl font-bold">{formatMoney(stats.ventasMes)}</p>
            <p className="text-[10px] text-gray-500 mt-1">{ventas.length} ventas</p>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <Package size={16} className="text-purple-400" />
              <span className="text-xs text-gray-400">Productos</span>
            </div>
            <p className="text-xl font-bold">{stats.productosActivos}</p>
            <p className="text-[10px] text-gray-500 mt-1">activos</p>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={16} className="text-yellow-400" />
              <span className="text-xs text-gray-400">Pendiente</span>
            </div>
            <p className="text-xl font-bold text-yellow-400">{formatMoney(stats.pendientePago)}</p>
            <p className="text-[10px] text-gray-500 mt-1">por recibir</p>
          </div>
        </div>

        {/* Progreso onboarding */}
        {!canPublish() && (
          <div className="mt-4 bg-yellow-900/30 border border-yellow-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-yellow-400">Completa tu perfil</span>
              <span className="text-sm font-bold text-yellow-400">{getOnboardingProgress()}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-yellow-500 transition-all"
                style={{ width: `${getOnboardingProgress()}%` }}
              />
            </div>
            <button 
              onClick={() => setActiveTab('onboarding')}
              className="mt-2 text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
            >
              Ver pasos pendientes <ChevronRight size={14} />
            </button>
          </div>
        )}
      </header>

      {/* Tabs */}
      <div className="px-6 py-3 flex gap-2 overflow-x-auto border-b border-gray-800">
        {[
          { id: 'resumen', label: 'Resumen', icon: TrendingUp },
          { id: 'productos', label: 'Mis Productos', icon: Package },
          { id: 'ventas', label: 'Ventas', icon: DollarSign },
          { id: 'onboarding', label: 'Mi Perfil', icon: User }
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

      {/* Content */}
      <div className="px-6 py-4">
        {/* Tab: Resumen */}
        {activeTab === 'resumen' && (
          <div className="space-y-4">
            {/* Acciones rápidas */}
            <div className="grid grid-cols-2 gap-3">
              <button className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-xl flex items-center gap-3 hover:opacity-90 transition-opacity">
                <Plus size={20} />
                <span className="font-bold text-sm">Crear Producto</span>
              </button>
              <button className="bg-gray-800 p-4 rounded-xl flex items-center gap-3 hover:bg-gray-750 transition-colors border border-gray-700">
                <Eye size={20} className="text-blue-400" />
                <span className="font-bold text-sm">Ver Mi Perfil</span>
              </button>
            </div>

            {/* Ventas recientes */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <h3 className="font-bold">Ventas Recientes</h3>
                <button 
                  onClick={() => setActiveTab('ventas')}
                  className="text-xs text-purple-400 hover:text-purple-300"
                >
                  Ver todas
                </button>
              </div>
              <div className="divide-y divide-gray-700">
                {ventas.slice(0, 3).map(venta => (
                  <div key={venta.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{venta.productoNombre}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(venta.createdAt).toLocaleDateString('es-CO')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-400">{formatMoney(venta.montoArtista)}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded ${
                        venta.estadoPago === 'pagado' ? 'bg-green-900/50 text-green-400' : 'bg-yellow-900/50 text-yellow-400'
                      }`}>
                        {venta.estadoPago}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mis productos destacados */}
            <div>
              <h3 className="font-bold mb-3">Mis Productos</h3>
              <div className="space-y-3">
                {productos.slice(0, 3).map(producto => (
                  <div key={producto.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getCategoriaColor(producto.categoria)}`}>
                        {getCategoriaIcon(producto.categoria)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-sm">{producto.nombre}</h4>
                            <span className="text-[10px] text-gray-500 capitalize">{producto.categoria}</span>
                          </div>
                          <span className="text-sm font-bold text-green-400">{formatMoney(producto.precioCOP)}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span>{producto.vendidos || 0} vendidos</span>
                          <span>{producto.stock === -1 ? '∞' : producto.stock} disponibles</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Info de distribución */}
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Percent size={16} className="text-purple-400" />
                Distribución de Ingresos
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Tú recibes</span>
                  <span className="font-bold text-green-400">{artista?.porcentajeArtista || 70}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">GuanaGO (plataforma)</span>
                  <span className="font-medium text-gray-400">{artista?.porcentajeGuanaGO || 15}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Clúster RIMM</span>
                  <span className="font-medium text-gray-400">{artista?.porcentajeCluster || 15}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Productos */}
        {activeTab === 'productos' && (
          <div className="space-y-4">
            <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
              <Plus size={20} />
              <span className="font-bold">Crear Nuevo Producto</span>
            </button>

            {/* Lista de productos por categoría */}
            {['digital', 'experiencia', 'acceso', 'fisico'].map(cat => {
              const catProductos = productos.filter(p => p.categoria === cat);
              if (catProductos.length === 0) return null;
              
              return (
                <div key={cat} className="space-y-2">
                  <h3 className="font-bold text-sm capitalize flex items-center gap-2">
                    {getCategoriaIcon(cat as CategoriaProducto)}
                    {cat === 'digital' ? 'NFTs Digitales' : 
                     cat === 'experiencia' ? 'Experiencias' :
                     cat === 'acceso' ? 'Accesos & Membresías' : 'Productos Físicos'}
                  </h3>
                  {catProductos.map(producto => (
                    <div key={producto.id} className={`rounded-xl p-4 border ${getCategoriaColor(producto.categoria)}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold">{producto.nombre}</h4>
                          <p className="text-xs text-gray-400 mt-1">{producto.descripcion}</p>
                        </div>
                        <button className="p-2 hover:bg-gray-700 rounded-lg">
                          <Edit3 size={16} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700">
                        <div className="flex items-center gap-4 text-xs">
                          <span className="font-bold text-green-400">{formatMoney(producto.precioCOP)}</span>
                          {producto.precioGUANA && (
                            <span className="text-yellow-400">{producto.precioGUANA} GUANA</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span>{producto.vendidos || 0} vendidos</span>
                          <span className={`px-2 py-0.5 rounded ${producto.activo ? 'bg-green-900/50 text-green-400' : 'bg-gray-700 text-gray-500'}`}>
                            {producto.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}

            {productos.length === 0 && (
              <div className="text-center py-12">
                <Package size={48} className="mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400">No tienes productos aún</p>
                <p className="text-gray-500 text-sm mt-1">Crea tu primer NFT o experiencia</p>
              </div>
            )}
          </div>
        )}

        {/* Tab: Ventas */}
        {activeTab === 'ventas' && (
          <div className="space-y-4">
            {/* Resumen del mes */}
            <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-xl p-4 border border-green-800/50">
              <h3 className="font-bold text-green-400 mb-3">💰 Resumen del Mes</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400">Ventas Totales</p>
                  <p className="text-xl font-bold">{formatMoney(stats.ventasMes)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Tu Ganancia (70%)</p>
                  <p className="text-xl font-bold text-green-400">{formatMoney(stats.ventasMes * 0.7)}</p>
                </div>
              </div>
            </div>

            {/* Lista de ventas */}
            <div className="space-y-3">
              <h3 className="font-bold">Historial de Ventas</h3>
              {ventas.map(venta => (
                <div key={venta.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-sm">{venta.productoNombre}</p>
                      <p className="text-[10px] text-gray-500 font-mono">{venta.idVenta}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-400">{formatMoney(venta.montoArtista)}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded ${
                        venta.estadoPago === 'pagado' ? 'bg-green-900/50 text-green-400' : 
                        venta.estadoPago === 'pendiente' ? 'bg-yellow-900/50 text-yellow-400' :
                        'bg-red-900/50 text-red-400'
                      }`}>
                        {venta.estadoPago}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-700 text-xs text-gray-400">
                    <span>{new Date(venta.createdAt).toLocaleDateString('es-CO')}</span>
                    <span className="capitalize">{venta.metodoPago}</span>
                    <span>Total: {formatMoney(venta.precioTotal)}</span>
                  </div>
                </div>
              ))}

              {ventas.length === 0 && (
                <div className="text-center py-12">
                  <DollarSign size={48} className="mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400">No tienes ventas aún</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Onboarding / Mi Perfil */}
        {activeTab === 'onboarding' && (
          <div className="space-y-4">
            {/* Progreso */}
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold">Progreso de Registro</h3>
                <span className={`text-lg font-bold ${getOnboardingProgress() === 100 ? 'text-green-400' : 'text-yellow-400'}`}>
                  {getOnboardingProgress()}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all ${getOnboardingProgress() === 100 ? 'bg-green-500' : 'bg-purple-500'}`}
                  style={{ width: `${getOnboardingProgress()}%` }}
                />
              </div>
              {canPublish() ? (
                <p className="text-green-400 text-sm mt-3 flex items-center gap-2">
                  <CheckCircle size={16} />
                  ¡Perfil completo! Puedes publicar productos
                </p>
              ) : (
                <p className="text-yellow-400 text-sm mt-3 flex items-center gap-2">
                  <AlertCircle size={16} />
                  Completa los pasos para publicar productos
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
                    {onboardingItems.filter(i => i.categoria === cat && i.completado).length}/
                    {onboardingItems.filter(i => i.categoria === cat).length}
                  </span>
                </div>
                <div className="divide-y divide-gray-700">
                  {onboardingItems
                    .filter(item => item.categoria === cat)
                    .map(item => (
                      <div 
                        key={item.id}
                        className="p-4 flex items-center gap-3"
                      >
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                          ${item.completado ? 'bg-green-600 border-green-600' : 'border-gray-600'}`}
                        >
                          {item.completado && <CheckCircle size={14} />}
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium text-sm ${item.completado ? 'text-gray-400 line-through' : ''}`}>
                            {item.titulo}
                            {item.obligatorio && <span className="text-red-400 ml-1">*</span>}
                          </p>
                          <p className="text-xs text-gray-500">{item.descripcion}</p>
                        </div>
                        {!item.completado && item.accion && (
                          <button className="px-3 py-1.5 bg-purple-600 rounded-lg text-xs font-bold hover:bg-purple-500">
                            {item.accion}
                          </button>
                        )}
                      </div>
                    ))
                  }
                </div>
              </div>
            ))}

            {/* Wallet info */}
            {artista?.walletHedera && (
              <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl p-4 border border-purple-700/50">
                <div className="flex items-center gap-3 mb-2">
                  <Wallet size={20} className="text-purple-400" />
                  <h3 className="font-bold">Wallet Hedera</h3>
                </div>
                <p className="text-sm font-mono text-purple-400">{artista.walletHedera}</p>
                <p className="text-xs text-gray-500 mt-1">Recibirás royalties automáticos aquí</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtistaPortal;

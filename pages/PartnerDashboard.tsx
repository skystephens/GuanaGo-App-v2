import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  Calendar,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Download,
  Filter,
  ChevronRight,
  Store,
  MessageSquare,
  Star,
  MapPin,
  Settings,
  Bell,
  CreditCard
} from 'lucide-react';
import { partnerService } from '../services/partnerService';

interface DashboardStats {
  totalRevenue: number;
  monthlyRevenue: number;
  revenueChange: number;
  totalProducts: number;
  activeProducts: number;
  pendingProducts: number;
  totalSales: number;
  monthlySales: number;
  salesChange: number;
  pendingPayouts: number;
  nextPayoutDate: string;
  avgRating: number;
  totalReviews: number;
}

interface RecentSale {
  id: string;
  productName: string;
  customerName: string;
  amount: number;
  commission: number;
  date: string;
  status: 'completed' | 'pending' | 'cancelled';
  bookingDate: string;
}

interface ProductPerformance {
  id: string;
  name: string;
  sales: number;
  revenue: number;
  views: number;
  conversionRate: number;
  status: 'active' | 'paused' | 'pending';
}

const PartnerDashboard: React.FC<{ onBack: () => void; partnerId: string }> = ({ onBack, partnerId }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [topProducts, setTopProducts] = useState<ProductPerformance[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [partnerId, selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, salesData, productsData] = await Promise.all([
        partnerService.getDashboardStats(partnerId, selectedPeriod),
        partnerService.getRecentSales(partnerId, 10),
        partnerService.getTopProducts(partnerId, 5)
      ]);

      setStats(statsData);
      setRecentSales(salesData);
      setTopProducts(productsData);
    } catch (err: any) {
      console.error('Error loading dashboard:', err);
      setError(err.message || 'Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { color: 'bg-green-500/20 text-green-300', icon: CheckCircle, label: 'Completado' },
      pending: { color: 'bg-yellow-500/20 text-yellow-300', icon: Clock, label: 'Pendiente' },
      cancelled: { color: 'bg-red-500/20 text-red-300', icon: XCircle, label: 'Cancelado' },
      active: { color: 'bg-green-500/20 text-green-300', icon: CheckCircle, label: 'Activo' },
      paused: { color: 'bg-gray-500/20 text-gray-300', icon: AlertCircle, label: 'Pausado' },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    const Icon = config.icon;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${config.color}`}>
        <Icon size={14} />
        {config.label}
      </span>
    );
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin text-blue-500 mx-auto mb-4" size={48} />
          <p className="text-gray-400 text-lg">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="max-w-md mx-auto mt-20 bg-red-500/10 border border-red-500/50 rounded-lg p-6">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
          <h3 className="text-xl font-bold text-white mb-2 text-center">Error al cargar</h3>
          <p className="text-gray-400 text-center mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-semibold transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-gradient-to-r from-gray-950 to-gray-900 border-b border-gray-800 px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-900 rounded-lg transition-colors">
            <ArrowLeft size={24} className="text-gray-400" />
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 hover:bg-gray-900 rounded-lg transition-colors"
            >
              <RefreshCw size={20} className={`text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button className="p-2 hover:bg-gray-900 rounded-lg transition-colors relative">
              <Bell size={20} className="text-gray-400" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button className="p-2 hover:bg-gray-900 rounded-lg transition-colors">
              <Settings size={20} className="text-gray-400" />
            </button>
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-black mb-1">Dashboard Socio</h1>
          <p className="text-gray-400">Resumen de tu negocio en GuanaGO</p>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2 mt-4">
          {(['week', 'month', 'year'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                selectedPeriod === period
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {period === 'week' ? 'Semana' : period === 'month' ? 'Mes' : 'Año'}
            </button>
          ))}
        </div>
      </header>

      <div className="px-6 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Revenue Card */}
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <DollarSign size={24} className="text-blue-400" />
              </div>
              {stats && stats.revenueChange !== 0 && (
                <div className={`flex items-center gap-1 text-sm font-semibold ${
                  stats.revenueChange > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {stats.revenueChange > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {Math.abs(stats.revenueChange)}%
                </div>
              )}
            </div>
            <h3 className="text-gray-400 text-sm mb-1">Ingresos del Mes</h3>
            <p className="text-3xl font-black text-white">
              {stats ? formatCurrency(stats.monthlyRevenue) : '$0'}
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Total: {stats ? formatCurrency(stats.totalRevenue) : '$0'}
            </p>
          </div>

          {/* Products Card */}
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Package size={24} className="text-purple-400" />
              </div>
            </div>
            <h3 className="text-gray-400 text-sm mb-1">Productos</h3>
            <p className="text-3xl font-black text-white">
              {stats?.activeProducts || 0}
            </p>
            <div className="flex gap-3 text-xs mt-2">
              <span className="text-yellow-400">
                {stats?.pendingProducts || 0} pendientes
              </span>
              <span className="text-gray-500">
                {stats?.totalProducts || 0} total
              </span>
            </div>
          </div>

          {/* Sales Card */}
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <Calendar size={24} className="text-green-400" />
              </div>
              {stats && stats.salesChange !== 0 && (
                <div className={`flex items-center gap-1 text-sm font-semibold ${
                  stats.salesChange > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {stats.salesChange > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {Math.abs(stats.salesChange)}%
                </div>
              )}
            </div>
            <h3 className="text-gray-400 text-sm mb-1">Ventas del Mes</h3>
            <p className="text-3xl font-black text-white">
              {stats?.monthlySales || 0}
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Total: {stats?.totalSales || 0} ventas
            </p>
          </div>

          {/* Payout Card */}
          <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <CreditCard size={24} className="text-orange-400" />
              </div>
            </div>
            <h3 className="text-gray-400 text-sm mb-1">Pago Pendiente</h3>
            <p className="text-3xl font-black text-white">
              {stats ? formatCurrency(stats.pendingPayouts) : '$0'}
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Próximo: {stats?.nextPayoutDate ? formatDate(stats.nextPayoutDate) : 'N/A'}
            </p>
          </div>
        </div>

        {/* Rating Card */}
        {stats && stats.avgRating > 0 && (
          <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-500/20 rounded-lg">
                  <Star size={24} className="text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-gray-400 text-sm mb-1">Calificación Promedio</h3>
                  <div className="flex items-center gap-2">
                    <p className="text-3xl font-black text-white">{stats.avgRating.toFixed(1)}</p>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={20}
                          className={i < Math.round(stats.avgRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-sm">Reseñas</p>
                <p className="text-2xl font-bold text-white">{stats.totalReviews}</p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Sales */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Calendar size={24} className="text-blue-400" />
              Ventas Recientes
            </h2>
            <button className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-semibold transition-colors">
              Ver todas
              <ChevronRight size={16} />
            </button>
          </div>

          {recentSales.length === 0 ? (
            <div className="text-center py-12">
              <Calendar size={48} className="text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500">No hay ventas recientes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-white mb-1">{sale.productName}</h3>
                      <p className="text-sm text-gray-400">{sale.customerName}</p>
                    </div>
                    {getStatusBadge(sale.status)}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700">
                    <div className="flex gap-4 text-sm">
                      <span className="text-gray-400">
                        Venta: <span className="text-white font-semibold">{formatCurrency(sale.amount)}</span>
                      </span>
                      <span className="text-gray-400">
                        Comisión: <span className="text-green-400 font-semibold">{formatCurrency(sale.commission)}</span>
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(sale.date)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 size={24} className="text-purple-400" />
              Productos con Mejor Desempeño
            </h2>
          </div>

          {topProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package size={48} className="text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500">No hay productos para mostrar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg font-black text-lg">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-white">{product.name}</h3>
                        {getStatusBadge(product.status)}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Ventas</p>
                          <p className="font-bold text-white">{product.sales}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Ingresos</p>
                          <p className="font-bold text-green-400">{formatCurrency(product.revenue)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Vistas</p>
                          <p className="font-bold text-blue-400">{product.views}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Conversión</p>
                          <p className="font-bold text-purple-400">{product.conversionRate.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-xl p-6 hover:from-blue-500/30 hover:to-blue-600/20 transition-all">
            <Package size={32} className="text-blue-400 mb-3" />
            <h3 className="font-bold text-white mb-1">Crear Producto</h3>
            <p className="text-xs text-gray-400">Agregar nuevo servicio</p>
          </button>

          <button className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-xl p-6 hover:from-green-500/30 hover:to-green-600/20 transition-all">
            <Eye size={32} className="text-green-400 mb-3" />
            <h3 className="font-bold text-white mb-1">Ver Productos</h3>
            <p className="text-xs text-gray-400">Gestionar catálogo</p>
          </button>

          <button className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-xl p-6 hover:from-purple-500/30 hover:to-purple-600/20 transition-all">
            <Calendar size={32} className="text-purple-400 mb-3" />
            <h3 className="font-bold text-white mb-1">Reservas</h3>
            <p className="text-xs text-gray-400">Ver calendario</p>
          </button>

          <button className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 rounded-xl p-6 hover:from-orange-500/30 hover:to-orange-600/20 transition-all">
            <Download size={32} className="text-orange-400 mb-3" />
            <h3 className="font-bold text-white mb-1">Reportes</h3>
            <p className="text-xs text-gray-400">Descargar reportes</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PartnerDashboard;

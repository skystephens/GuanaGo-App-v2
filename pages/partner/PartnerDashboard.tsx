import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ShoppingCart,
  CreditCard,
  Star,
  Calendar,
  User,
  MapPin,
  Settings,
  Bell,
  ChevronRight,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Download,
  Filter,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { AppRoute } from '../../types';

interface DashboardProps {
  onNavigate?: (route: AppRoute) => void;
}

interface Stats {
  monthlyRevenue: number;
  revenueChange: number;
  activeProducts: number;
  productsChange: number;
  monthlySales: number;
  salesChange: number;
  pendingPayouts: number;
  avgRating: number;
}

interface RecentSale {
  id: string;
  productName: string;
  customerName: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'cancelled';
}

interface TopProduct {
  id: string;
  name: string;
  sales: number;
  revenue: number;
  rating: number;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [error, setError] = useState<string | null>(null);

  // Simular carga de datos (en producción, usar partnerService)
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        // Simular delay de API
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Datos mock
        const mockStats: Stats = {
          monthlyRevenue: 45500,
          revenueChange: 12.5,
          activeProducts: 23,
          productsChange: 3,
          monthlySales: 127,
          salesChange: 8.3,
          pendingPayouts: 5200,
          avgRating: 4.8
        };

        const mockSales: RecentSale[] = [
          {
            id: '1',
            productName: 'Tour Aventura Isla',
            customerName: 'John Smith',
            amount: 450,
            date: '2026-01-23',
            status: 'completed'
          },
          {
            id: '2',
            productName: 'Cena en Restaurante',
            customerName: 'María García',
            amount: 85.50,
            date: '2026-01-22',
            status: 'completed'
          },
          {
            id: '3',
            productName: 'Hotel Vista Mar',
            customerName: 'Robert Johnson',
            amount: 250,
            date: '2026-01-22',
            status: 'pending'
          }
        ];

        const mockProducts: TopProduct[] = [
          { id: '1', name: 'Tour Aventura Isla', sales: 45, revenue: 20250, rating: 4.9 },
          { id: '2', name: 'Cena Especial', sales: 38, revenue: 3230, rating: 4.7 },
          { id: '3', name: 'Hotel Vista Mar', sales: 28, revenue: 7000, rating: 4.8 },
          { id: '4', name: 'Tour Buceo', sales: 12, revenue: 6000, rating: 4.6 },
          { id: '5', name: 'Spa Relax', sales: 4, revenue: 800, rating: 4.5 }
        ];

        setStats(mockStats);
        setRecentSales(mockSales);
        setTopProducts(mockProducts);
        setError(null);
      } catch (err) {
        setError('Error al cargar datos del dashboard');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [selectedPeriod]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      notation: 'compact'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      completed: { color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
      pending: { color: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
      cancelled: { color: 'bg-red-500/20 text-red-400', icon: XCircle }
    };
    const config = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    const IconComponent = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${config.color}`}>
        <IconComponent size={12} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white pb-24 font-sans">
      {/* Header */}
      <header className="px-6 pt-6 pb-4 flex justify-between items-start bg-gray-900">
        <div>
          <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
          <p className="text-gray-400 text-xs flex items-center gap-1">
            <MapPin size={14} /> San Andrés, Colombia
          </p>
        </div>
        <button className="relative p-2.5 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors">
          <Bell size={20} className="text-white" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
      </header>

      {error && (
        <div className="mx-6 mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="px-6 space-y-6">
        {/* Period Selector */}
        <div className="flex gap-2">
          {(['week', 'month', 'year'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
                selectedPeriod === period
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {period === 'week' ? 'Semana' : period === 'month' ? 'Mes' : 'Año'}
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-800 rounded-xl"></div>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 gap-3">
            {/* Monthly Revenue */}
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-xl p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <DollarSign size={20} className="text-blue-400" />
                </div>
                {stats.revenueChange >= 0 ? (
                  <div className="flex items-center gap-1 text-green-400 text-xs font-semibold">
                    <ArrowUp size={14} />
                    {stats.revenueChange}%
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-400 text-xs font-semibold">
                    <ArrowDown size={14} />
                    {Math.abs(stats.revenueChange)}%
                  </div>
                )}
              </div>
              <p className="text-gray-400 text-xs mb-1">Ingresos Mes</p>
              <p className="text-2xl font-black text-white">
                {formatCurrency(stats.monthlyRevenue)}
              </p>
            </div>

            {/* Active Products */}
            <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-xl p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Package size={20} className="text-green-400" />
                </div>
                <div className="flex items-center gap-1 text-green-400 text-xs font-semibold">
                  <ArrowUp size={14} />
                  +{stats.productsChange}
                </div>
              </div>
              <p className="text-gray-400 text-xs mb-1">Productos Activos</p>
              <p className="text-2xl font-black text-white">{stats.activeProducts}</p>
            </div>

            {/* Monthly Sales */}
            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-xl p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <ShoppingCart size={20} className="text-purple-400" />
                </div>
                {stats.salesChange >= 0 ? (
                  <div className="flex items-center gap-1 text-green-400 text-xs font-semibold">
                    <ArrowUp size={14} />
                    {stats.salesChange}%
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-400 text-xs font-semibold">
                    <ArrowDown size={14} />
                    {Math.abs(stats.salesChange)}%
                  </div>
                )}
              </div>
              <p className="text-gray-400 text-xs mb-1">Ventas Mes</p>
              <p className="text-2xl font-black text-white">{stats.monthlySales}</p>
            </div>

            {/* Pending Payouts */}
            <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 rounded-xl p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <CreditCard size={20} className="text-orange-400" />
                </div>
              </div>
              <p className="text-gray-400 text-xs mb-1">Pago Pendiente</p>
              <p className="text-2xl font-black text-white">
                {formatCurrency(stats.pendingPayouts)}
              </p>
            </div>
          </div>
        ) : null}

        {/* Rating Card */}
        {stats && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Star size={20} className="text-yellow-400 fill-yellow-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Calificación Promedio</p>
                  <p className="text-xl font-black text-white">{stats.avgRating} ⭐</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-500" />
            </div>
          </div>
        )}

        {/* Recent Sales */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">Ventas Recientes</h2>
            <button className="text-emerald-400 text-xs font-semibold hover:text-emerald-300">
              Ver todo →
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-800 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : recentSales.length > 0 ? (
            <div className="space-y-2">
              {recentSales.map((sale) => (
                <div key={sale.id} className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{sale.productName}</p>
                      <p className="text-gray-400 text-xs mt-1">👤 {sale.customerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-400">
                        +{formatCurrency(sale.amount)}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-500 text-xs">{sale.date}</span>
                    {getStatusBadge(sale.status)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400">
              <ShoppingCart size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay ventas recientes</p>
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">Top 5 Productos</h2>
            <button className="text-emerald-400 text-xs font-semibold hover:text-emerald-300">
              Ver catálogo →
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-gray-800 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : topProducts.length > 0 ? (
            <div className="space-y-2">
              {topProducts.map((product, index) => (
                <div key={product.id} className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{product.name}</p>
                        <p className="text-gray-400 text-xs mt-0.5">
                          {product.sales} ventas • {formatCurrency(product.revenue)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-yellow-400 text-sm font-semibold">
                        <Star size={14} className="fill-yellow-400" />
                        {product.rating}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400">
              <Package size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay productos</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => onNavigate?.(AppRoute.PARTNER_CREATE_SERVICE)}
            className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-4 hover:bg-emerald-500/30 transition-colors text-center"
          >
            <Package size={24} className="text-emerald-400 mx-auto mb-2" />
            <p className="font-semibold text-sm">Nuevo Producto</p>
          </button>
          <button
            onClick={() => onNavigate?.(AppRoute.PARTNER_MY_SERVICES)}
            className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 hover:bg-blue-500/30 transition-colors text-center"
          >
            <Eye size={24} className="text-blue-400 mx-auto mb-2" />
            <p className="font-semibold text-sm">Ver Catálogo</p>
          </button>
          <button
            onClick={() => onNavigate?.(AppRoute.PARTNER_RESERVATIONS)}
            className="bg-purple-500/20 border border-purple-500/30 rounded-xl p-4 hover:bg-purple-500/30 transition-colors text-center"
          >
            <Calendar size={24} className="text-purple-400 mx-auto mb-2" />
            <p className="font-semibold text-sm">Reservas</p>
          </button>
          <button
            onClick={() => onNavigate?.(AppRoute.PROFILE)}
            className="bg-pink-500/20 border border-pink-500/30 rounded-xl p-4 hover:bg-pink-500/30 transition-colors text-center"
          >
            <Settings size={24} className="text-pink-400 mx-auto mb-2" />
            <p className="font-semibold text-sm">Config</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

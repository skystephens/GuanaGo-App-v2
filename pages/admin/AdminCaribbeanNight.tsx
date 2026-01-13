import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Calendar, Users, Music, Ticket, Search,
  Filter, Download, Eye, CheckCircle, XCircle, Clock,
  MoreVertical, TrendingUp, DollarSign, RefreshCw,
  AlertCircle, ChevronDown, Edit3, Trash2, Mail, Phone
} from 'lucide-react';
import { AppRoute } from '../../types';

interface Reservation {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  eventId: string;
  eventName: string;
  artistName: string;
  eventDate: string;
  packageId: string;
  packageName: string;
  quantity: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
  paymentMethod: string;
}

interface Event {
  id: string;
  name: string;
  artistName: string;
  date: string;
  capacity: number;
  sold: number;
  revenue: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

interface AdminCaribbeanNightProps {
  onBack: () => void;
  onNavigate: (route: AppRoute, data?: any) => void;
}

const AdminCaribbeanNight: React.FC<AdminCaribbeanNightProps> = ({ onBack, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'reservations' | 'events' | 'analytics'>('reservations');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Mock data - En producción vendría de la API
      const mockReservations: Reservation[] = [
        {
          id: 'RES-001',
          customerName: 'Carlos Ramírez',
          customerEmail: 'carlos@email.com',
          customerPhone: '+57 310 555 1234',
          eventId: 'EVT-001',
          eventName: 'Caribbean Night Live',
          artistName: 'Elkin Robinson',
          eventDate: '2025-01-16',
          packageId: 'vip',
          packageName: 'Experiencia VIP',
          quantity: 2,
          totalPrice: 370000,
          status: 'confirmed',
          createdAt: '2025-01-10T14:30:00',
          paymentMethod: 'Tarjeta de crédito'
        },
        {
          id: 'RES-002',
          customerName: 'María López',
          customerEmail: 'maria@email.com',
          customerPhone: '+57 315 555 5678',
          eventId: 'EVT-001',
          eventName: 'Caribbean Night Live',
          artistName: 'Elkin Robinson',
          eventDate: '2025-01-16',
          packageId: 'basic',
          packageName: 'Entrada Básica',
          quantity: 4,
          totalPrice: 300000,
          status: 'pending',
          createdAt: '2025-01-11T09:15:00',
          paymentMethod: 'PSE'
        },
        {
          id: 'RES-003',
          customerName: 'Juan Pérez',
          customerEmail: 'juan@email.com',
          customerPhone: '+57 300 555 9012',
          eventId: 'EVT-001',
          eventName: 'Caribbean Night Live',
          artistName: 'Elkin Robinson',
          eventDate: '2025-01-16',
          packageId: 'transport',
          packageName: 'Entrada + Transporte',
          quantity: 2,
          totalPrice: 220000,
          status: 'confirmed',
          createdAt: '2025-01-12T16:45:00',
          paymentMethod: 'Nequi'
        },
        {
          id: 'RES-004',
          customerName: 'Ana García',
          customerEmail: 'ana@email.com',
          customerPhone: '+57 320 555 3456',
          eventId: 'EVT-002',
          eventName: 'Reggae Fusion Night',
          artistName: 'Jiggy Drama',
          eventDate: '2025-01-23',
          packageId: 'basic',
          packageName: 'Entrada Básica',
          quantity: 3,
          totalPrice: 225000,
          status: 'cancelled',
          createdAt: '2025-01-08T11:20:00',
          paymentMethod: 'Tarjeta de crédito'
        }
      ];

      const mockEvents: Event[] = [
        {
          id: 'EVT-001',
          name: 'Caribbean Night Live',
          artistName: 'Elkin Robinson',
          date: '2025-01-16',
          capacity: 150,
          sold: 87,
          revenue: 8750000,
          status: 'upcoming'
        },
        {
          id: 'EVT-002',
          name: 'Reggae Fusion Night',
          artistName: 'Jiggy Drama',
          date: '2025-01-23',
          capacity: 150,
          sold: 45,
          revenue: 4500000,
          status: 'upcoming'
        },
        {
          id: 'EVT-003',
          name: 'Kriol Roots Night',
          artistName: 'Creole Group',
          date: '2025-01-30',
          capacity: 150,
          sold: 12,
          revenue: 1200000,
          status: 'upcoming'
        },
        {
          id: 'EVT-004',
          name: 'New Year Celebration',
          artistName: 'Various Artists',
          date: '2025-01-02',
          capacity: 200,
          sold: 200,
          revenue: 25000000,
          status: 'completed'
        }
      ];

      setReservations(mockReservations);
      setEvents(mockEvents);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredReservations = reservations.filter(res => {
    const matchesSearch = 
      res.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || res.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500/20 text-green-400';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'cancelled': return 'bg-red-500/20 text-red-400';
      case 'completed': return 'bg-blue-500/20 text-blue-400';
      case 'upcoming': return 'bg-cyan-500/20 text-cyan-400';
      case 'ongoing': return 'bg-orange-500/20 text-orange-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelada';
      case 'completed': return 'Completada';
      case 'upcoming': return 'Próximo';
      case 'ongoing': return 'En curso';
      default: return status;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('es-CO', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Stats
  const totalRevenue = reservations
    .filter(r => r.status === 'confirmed' || r.status === 'completed')
    .reduce((sum, r) => sum + r.totalPrice, 0);
  const totalTickets = reservations
    .filter(r => r.status === 'confirmed' || r.status === 'completed')
    .reduce((sum, r) => sum + r.quantity, 0);
  const pendingCount = reservations.filter(r => r.status === 'pending').length;
  const upcomingEvents = events.filter(e => e.status === 'upcoming').length;

  const handleUpdateStatus = async (reservationId: string, newStatus: Reservation['status']) => {
    // En producción, esto llamaría a la API
    setReservations(prev => 
      prev.map(res => res.id === reservationId ? { ...res, status: newStatus } : res)
    );
    setShowDetail(false);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-cyan-600 p-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={onBack}
            className="w-10 h-10 bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h1 className="text-white font-bold text-lg">Admin Caribbean Night</h1>
          <button 
            onClick={loadData}
            className="w-10 h-10 bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center"
          >
            <RefreshCw size={18} className="text-white" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <DollarSign size={18} className="mx-auto text-white/80 mb-1" />
            <p className="text-white font-black text-sm">${(totalRevenue / 1000000).toFixed(1)}M</p>
            <p className="text-white/60 text-[10px]">Ingresos</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <Ticket size={18} className="mx-auto text-white/80 mb-1" />
            <p className="text-white font-black text-sm">{totalTickets}</p>
            <p className="text-white/60 text-[10px]">Entradas</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <Clock size={18} className="mx-auto text-white/80 mb-1" />
            <p className="text-white font-black text-sm">{pendingCount}</p>
            <p className="text-white/60 text-[10px]">Pendientes</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <Calendar size={18} className="mx-auto text-white/80 mb-1" />
            <p className="text-white font-black text-sm">{upcomingEvents}</p>
            <p className="text-white/60 text-[10px]">Eventos</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 -mt-3">
        <div className="bg-gray-800 rounded-xl p-1 flex gap-1">
          {[
            { id: 'reservations', label: 'Reservas', icon: Ticket },
            { id: 'events', label: 'Eventos', icon: Music },
            { id: 'analytics', label: 'Reportes', icon: TrendingUp }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all ${
                activeTab === tab.id 
                  ? 'bg-cyan-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'reservations' && (
          <>
            {/* Search & Filter */}
            <div className="flex gap-2 mb-4">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar reservas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-xl px-3 text-white text-sm"
              >
                <option value="all">Todos</option>
                <option value="pending">Pendiente</option>
                <option value="confirmed">Confirmada</option>
                <option value="cancelled">Cancelada</option>
                <option value="completed">Completada</option>
              </select>
            </div>

            {/* Reservations List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw size={24} className="text-cyan-400 animate-spin" />
              </div>
            ) : filteredReservations.length === 0 ? (
              <div className="text-center py-12">
                <Ticket size={48} className="mx-auto text-gray-600 mb-3" />
                <p className="text-gray-400">No se encontraron reservas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReservations.map(res => (
                  <div 
                    key={res.id}
                    onClick={() => {
                      setSelectedReservation(res);
                      setShowDetail(true);
                    }}
                    className="bg-gray-800 rounded-xl p-4 border border-gray-700 cursor-pointer hover:border-gray-600 transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-white font-bold text-sm">{res.customerName}</p>
                        <p className="text-gray-400 text-xs">{res.id}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(res.status)}`}>
                        {getStatusLabel(res.status)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
                      <Music size={12} />
                      <span>{res.artistName}</span>
                      <span>•</span>
                      <Calendar size={12} />
                      <span>{formatDate(res.eventDate)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-cyan-400 text-xs">{res.packageName}</span>
                        <span className="text-gray-500 text-xs">×{res.quantity}</span>
                      </div>
                      <p className="text-orange-400 font-bold">${res.totalPrice.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'events' && (
          <div className="space-y-3">
            {events.map(event => (
              <div 
                key={event.id}
                className="bg-gray-800 rounded-xl p-4 border border-gray-700"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-white font-bold">{event.name}</p>
                    <p className="text-cyan-400 text-sm">{event.artistName}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(event.status)}`}>
                    {getStatusLabel(event.status)}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-gray-400 text-xs mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>{formatDate(event.date)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>9:30 PM</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-400">Ocupación</span>
                    <span className="text-white font-medium">{event.sold} / {event.capacity}</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        event.sold / event.capacity > 0.8 ? 'bg-red-500' :
                        event.sold / event.capacity > 0.5 ? 'bg-orange-500' : 'bg-cyan-500'
                      }`}
                      style={{ width: `${(event.sold / event.capacity) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-xs">Ingresos</span>
                  <span className="text-green-400 font-bold">${event.revenue.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-4">
            {/* Revenue Chart Placeholder */}
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <h3 className="text-white font-bold mb-4">Resumen de Ventas</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700/50 rounded-xl p-4 text-center">
                  <p className="text-gray-400 text-xs mb-1">Total Ventas</p>
                  <p className="text-white font-black text-2xl">${(totalRevenue / 1000000).toFixed(2)}M</p>
                </div>
                <div className="bg-gray-700/50 rounded-xl p-4 text-center">
                  <p className="text-gray-400 text-xs mb-1">Ticket Promedio</p>
                  <p className="text-white font-black text-2xl">
                    ${totalTickets > 0 ? Math.round(totalRevenue / totalTickets).toLocaleString() : 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Package Distribution */}
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <h3 className="text-white font-bold mb-4">Distribución por Paquete</h3>
              {['basic', 'transport', 'vip'].map(pkg => {
                const count = reservations.filter(r => r.packageId === pkg).length;
                const total = reservations.length;
                const percentage = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={pkg} className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-300 capitalize">
                        {pkg === 'basic' ? 'Entrada Básica' : pkg === 'transport' ? 'Entrada + Transporte' : 'VIP'}
                      </span>
                      <span className="text-white font-medium">{count} ({percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          pkg === 'vip' ? 'bg-yellow-500' : 
                          pkg === 'transport' ? 'bg-orange-500' : 'bg-cyan-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Export Button */}
            <button className="w-full bg-cyan-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-cyan-700 transition-all">
              <Download size={18} />
              Exportar Reporte
            </button>
          </div>
        )}
      </div>

      {/* Reservation Detail Modal */}
      {showDetail && selectedReservation && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end">
          <div className="bg-gray-900 w-full rounded-t-3xl p-5 max-h-[80vh] overflow-y-auto">
            <div className="w-12 h-1 bg-gray-700 rounded-full mx-auto mb-4"></div>
            
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-white font-black text-xl">{selectedReservation.customerName}</p>
                <p className="text-gray-400 text-sm">{selectedReservation.id}</p>
              </div>
              <button onClick={() => setShowDetail(false)} className="text-gray-400">
                <XCircle size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Contact Info */}
              <div className="bg-gray-800 rounded-xl p-4">
                <h4 className="text-white font-bold text-sm mb-3">Información de Contacto</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-300 text-sm">
                    <Mail size={14} className="text-cyan-400" />
                    {selectedReservation.customerEmail}
                  </div>
                  <div className="flex items-center gap-2 text-gray-300 text-sm">
                    <Phone size={14} className="text-cyan-400" />
                    {selectedReservation.customerPhone}
                  </div>
                </div>
              </div>

              {/* Event Info */}
              <div className="bg-gray-800 rounded-xl p-4">
                <h4 className="text-white font-bold text-sm mb-3">Detalles del Evento</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-400 text-xs">Evento</p>
                    <p className="text-white">{selectedReservation.eventName}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Artista</p>
                    <p className="text-white">{selectedReservation.artistName}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Fecha</p>
                    <p className="text-white">{formatDate(selectedReservation.eventDate)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Hora</p>
                    <p className="text-white">9:30 PM</p>
                  </div>
                </div>
              </div>

              {/* Package Info */}
              <div className="bg-gray-800 rounded-xl p-4">
                <h4 className="text-white font-bold text-sm mb-3">Detalles de la Reserva</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-400 text-xs">Paquete</p>
                    <p className="text-cyan-400">{selectedReservation.packageName}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Cantidad</p>
                    <p className="text-white">{selectedReservation.quantity} entradas</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Método de pago</p>
                    <p className="text-white">{selectedReservation.paymentMethod}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Total</p>
                    <p className="text-orange-400 font-bold">${selectedReservation.totalPrice.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Status Actions */}
              <div className="bg-gray-800 rounded-xl p-4">
                <h4 className="text-white font-bold text-sm mb-3">Estado de la Reserva</h4>
                <div className="flex gap-2 flex-wrap">
                  {['pending', 'confirmed', 'completed', 'cancelled'].map(status => (
                    <button
                      key={status}
                      onClick={() => handleUpdateStatus(selectedReservation.id, status as Reservation['status'])}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        selectedReservation.status === status
                          ? getStatusColor(status) + ' ring-2 ring-white/30'
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }`}
                    >
                      {getStatusLabel(status)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timestamps */}
              <div className="text-center text-gray-500 text-xs">
                Reserva creada: {formatDateTime(selectedReservation.createdAt)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCaribbeanNight;

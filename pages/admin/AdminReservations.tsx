import React, { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, Users, DollarSign, Loader2, AlertCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { AppRoute, Reservation } from '../../types';
import { api } from '../../services/api';

interface AdminReservationsProps {
  onBack: () => void;
  onNavigate: (route: AppRoute) => void;
}

// Normalizador para entradas de distintas fuentes
const normalizeReservation = (raw: any): Reservation => {
  return {
    id: raw.id || raw.reservationId || `res-${Date.now()}`,
    tourName: raw.tourName || raw.serviceName || raw.service?.name || 'Servicio',
    clientName: raw.clientName || raw.customerName || raw.customer?.name || 'Cliente',
    date: raw.date || raw.fecha || raw.createdAt || new Date().toISOString(),
    status: (raw.status || raw.estado || 'pending').toLowerCase(),
    people: raw.people || raw.pax || raw.quantity || 1,
    price: raw.price || raw.valor || raw.total || undefined,
    hederaTransactionId: raw.hederaTransactionId,
    auditStatus: 'verified'
  } as Reservation;
};

const AdminReservations: React.FC<AdminReservationsProps> = ({ onBack, onNavigate }) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'pending' | 'cancelled'>('all');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const list = await (api.reservations as any).listAll?.();
      const normalized = Array.isArray(list) ? list.map(normalizeReservation) : [];
      setReservations(normalized);
    } catch (e) {
      console.error('Error loading reservations:', e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = reservations.filter(r => filter === 'all' ? true : r.status === filter);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const startIdx = (page - 1) * pageSize;
  const paginated = filtered.slice(startIdx, startIdx + pageSize);

  const stats = {
    total: reservations.length,
    confirmed: reservations.filter(r => r.status === 'confirmed').length,
    pending: reservations.filter(r => r.status === 'pending').length,
    cancelled: reservations.filter(r => r.status === 'cancelled').length,
  };

  const statusChip = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-900/50 text-green-400 border border-green-700/40';
      case 'pending': return 'bg-yellow-900/50 text-yellow-400 border border-yellow-700/40';
      case 'cancelled': return 'bg-red-900/50 text-red-400 border border-red-700/40';
      default: return 'bg-gray-900/50 text-gray-400 border border-gray-700/40';
    }
  };

  return (
    <div className="bg-gray-950 min-h-screen text-white pb-24 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-gray-950/80 backdrop-blur-md border-b border-gray-900 px-6 py-4 flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-900 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar size={24} className="text-blue-500" />
            Reservas
          </h1>
          <p className="text-sm text-gray-400 mt-1">Listado completo de reservas recientes</p>
        </div>
        <button onClick={loadReservations} disabled={loading} className="p-2 hover:bg-gray-900 rounded-lg transition-colors disabled:opacity-50">
          <Clock size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      <div className="px-6 pt-6 space-y-6">
        {/* Stats & Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button onClick={() => setFilter('all')} className={`p-4 rounded-xl border transition-all ${filter === 'all' ? 'bg-blue-500/20 border-blue-500' : 'bg-gray-900 border-gray-800 hover:border-blue-600'}`}>
            <div className="text-2xl font-bold text-blue-400">{stats.total}</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase mt-1">Total</div>
          </button>
          <button onClick={() => setFilter('confirmed')} className={`p-4 rounded-xl border transition-all ${filter === 'confirmed' ? 'bg-green-500/20 border-green-500' : 'bg-gray-900 border-gray-800 hover:border-green-600'}`}>
            <div className="text-2xl font-bold text-green-400">{stats.confirmed}</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase mt-1">Confirmadas</div>
          </button>
          <button onClick={() => setFilter('pending')} className={`p-4 rounded-xl border transition-all ${filter === 'pending' ? 'bg-yellow-500/20 border-yellow-500' : 'bg-gray-900 border-gray-800 hover:border-yellow-600'}`}>
            <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase mt-1">Pendientes</div>
          </button>
          <button onClick={() => setFilter('cancelled')} className={`p-4 rounded-xl border transition-all ${filter === 'cancelled' ? 'bg-red-500/20 border-red-500' : 'bg-gray-900 border-gray-800 hover:border-red-600'}`}>
            <div className="text-2xl font-bold text-red-400">{stats.cancelled}</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase mt-1">Canceladas</div>
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-gray-900 rounded-xl border border-gray-800 p-4 animate-pulse">
                <div className="h-3 w-24 bg-gray-800 rounded mb-3"></div>
                <div className="h-3 w-48 bg-gray-800 rounded mb-2"></div>
                <div className="h-3 w-32 bg-gray-800 rounded"></div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center">
            <AlertCircle size={32} className="mx-auto mb-3 text-gray-600" />
            <p className="text-gray-400 font-medium">No hay reservas para mostrar</p>
            <p className="text-gray-500 text-sm mt-1">Intenta cambiar los filtros</p>
          </div>
        ) : (
          <div className="space-y-3">
            {paginated.map((res) => (
              <div key={res.id} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden hover:border-gray-700 transition-all">
                <div className="p-4 border-b border-gray-800 flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase border ${statusChip(res.status)}`}>
                        {res.status === 'confirmed' && '✅ Confirmada'}
                        {res.status === 'pending' && '⏳ Pendiente'}
                        {res.status === 'cancelled' && '❌ Cancelada'}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-white truncate">{res.tourName}</h3>
                    <p className="text-xs text-gray-400 mt-1">{new Date(res.date).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  </div>
                </div>

                <div className="p-4 bg-gray-950/50 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-start gap-2">
                    <Users size={14} className="text-gray-500 mt-1 shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Cliente</p>
                      <p className="text-sm font-medium text-white">{res.clientName}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar size={14} className="text-blue-500 mt-1 shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Personas</p>
                      <p className="text-sm font-medium text-white">{res.people}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <DollarSign size={14} className="text-green-500 mt-1 shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Valor</p>
                      <p className="text-sm font-medium text-white">{res.price ? `$${res.price.toLocaleString('es-CO')}` : '—'}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-gray-800 text-xs text-gray-500 text-center font-medium">
                  ID: {res.id}
                </div>
              </div>
            ))}
            {/* Pagination */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-gray-500">Página {page} de {totalPages}</div>
              <div className="flex items-center gap-2">
                <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 text-xs bg-gray-800 border border-gray-700 rounded disabled:opacity-50">Anterior</button>
                <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-3 py-1 text-xs bg-gray-800 border border-gray-700 rounded disabled:opacity-50">Siguiente</button>
                <select value={pageSize} onChange={(e) => { setPageSize(parseInt(e.target.value)); setPage(1); }} className="text-xs bg-gray-900 border border-gray-800 rounded px-2 py-1">
                  {[10,20,50].map(sz => <option key={sz} value={sz}>{sz}/página</option>)}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReservations;

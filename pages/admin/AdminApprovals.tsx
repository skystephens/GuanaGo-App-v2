import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Clock, Calendar, User, MapPin, Phone, Mail, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { AppRoute } from '../../types';
import { api } from '../../services/api';

interface AvailabilityRequest {
  id: string;
  usuarioId: string;
  socioId: string;
  servicioId: string;
  tipoServicio: 'hotel' | 'tour' | 'traslado' | 'paquete';
  servicioNombre?: string;
  checkIn?: string;
  checkOut?: string;
  adultos: number;
  estado: 'pending' | 'approved' | 'rejected' | 'expired';
  contactName: string;
  contactEmail: string;
  contactWhatsapp: string;
  createdAt: string;
  updatedAt?: string;
}

interface AdminApprovalsProps {
  onBack: () => void;
  onNavigate: (route: AppRoute) => void;
}

const AdminApprovals: React.FC<AdminApprovalsProps> = ({ onBack, onNavigate }) => {
  const [requests, setRequests] = useState<AvailabilityRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [syncingId, setSyncingId] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      // Usar 'as any' para evitar errores de tipo de TypeScript en tiempo de compilación
      const response = await (api.availability as any).listAllRequests?.();
      if (response && Array.isArray(response)) {
        setRequests(response);
      } else if (response?.data && Array.isArray(response.data)) {
        setRequests(response.data);
      }
    } catch (e) {
      console.error('Error loading requests:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      setProcessingId(requestId);
      await (api.availability as any).updateRequest?.(requestId, {
        estado: 'approved',
        updatedAt: new Date().toISOString()
      });
      
      const request = requests.find(r => r.id === requestId);
      if (request) {
        setRequests(prev => 
          prev.map(r => r.id === requestId ? { ...r, estado: 'approved' } : r)
        );
        
        // Auto-sync a Airtable después de aprobar
        const payload = {
          requestId: request.id,
          servicioId: request.servicioId,
          servicioNombre: request.servicioNombre,
          tipoServicio: request.tipoServicio,
          date: request.checkIn || request.createdAt,
          checkOut: request.checkOut,
          people: request.adultos,
          clientName: request.contactName,
          clientEmail: request.contactEmail,
          clientWhatsapp: request.contactWhatsapp,
          status: 'approved'
        };
        await (api.reservations as any).syncToAirtable?.(payload);
        setSuccessMessage('✅ Aprobada y registrada en Airtable automáticamente');
      }
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (e) {
      alert('Error al aprobar la solicitud: ' + (e as any).message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!confirm('¿Estás seguro de que deseas rechazar esta solicitud?')) return;
    
    try {
      setProcessingId(requestId);
      await (api.availability as any).updateRequest?.(requestId, {
        estado: 'rejected',
        updatedAt: new Date().toISOString()
      });
      
      setRequests(prev => 
        prev.map(r => r.id === requestId ? { ...r, estado: 'rejected' } : r)
      );
      setSuccessMessage('❌ Solicitud rechazada');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (e) {
      alert('Error al rechazar la solicitud: ' + (e as any).message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleSyncToAirtable = async (request: AvailabilityRequest) => {
    try {
      setSyncingId(request.id);
      const payload = {
        requestId: request.id,
        servicioId: request.servicioId,
        servicioNombre: request.servicioNombre,
        tipoServicio: request.tipoServicio,
        date: request.checkIn || request.createdAt,
        checkOut: request.checkOut,
        people: request.adultos,
        clientName: request.contactName,
        clientEmail: request.contactEmail,
        clientWhatsapp: request.contactWhatsapp,
        status: request.estado
      };
      const res = await (api.reservations as any).syncToAirtable?.(payload);
      if (res?.success) {
        setSuccessMessage('📤 Registrada en Airtable');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        alert('No se pudo registrar en Airtable');
      }
    } catch (e) {
      alert('Error al registrar en Airtable');
    } finally {
      setSyncingId(null);
    }
  };

  const filteredRequests = requests.filter(r => {
    if (filter === 'all') return true;
    return r.estado === filter;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.estado === 'pending').length,
    approved: requests.filter(r => r.estado === 'approved').length,
    rejected: requests.filter(r => r.estado === 'rejected').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 border-yellow-600/30 text-yellow-600';
      case 'approved':
        return 'bg-green-500/10 border-green-600/30 text-green-600';
      case 'rejected':
        return 'bg-red-500/10 border-red-600/30 text-red-600';
      default:
        return 'bg-gray-500/10 border-gray-600/30 text-gray-600';
    }
  };

  const getServiceTypeLabel = (type: string) => {
    switch (type) {
      case 'hotel':
        return 'Alojamiento';
      case 'tour':
        return 'Tour';
      case 'traslado':
        return 'Traslado';
      case 'paquete':
        return 'Paquete';
      default:
        return type;
    }
  };

  return (
    <div className="bg-gray-950 min-h-screen text-white pb-24 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-gray-950/80 backdrop-blur-md border-b border-gray-900 px-6 py-4 flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-gray-900 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock size={24} className="text-yellow-500" />
            Solicitudes en Proceso
          </h1>
          <p className="text-sm text-gray-400 mt-1">Aprueba o rechaza solicitudes de reserva</p>
        </div>
        <button
          onClick={loadRequests}
          disabled={loading}
          className="p-2 hover:bg-gray-900 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      <div className="px-6 pt-6 space-y-6">
        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-500/10 border border-green-600/30 p-4 rounded-xl text-green-600 text-sm font-medium">
            {successMessage}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => setFilter('pending')}
            className={`p-4 rounded-xl border transition-all ${
              filter === 'pending'
                ? 'bg-yellow-500/20 border-yellow-500'
                : 'bg-gray-900 border-gray-800 hover:border-yellow-600'
            }`}
          >
            <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase mt-1">Pendientes</div>
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`p-4 rounded-xl border transition-all ${
              filter === 'approved'
                ? 'bg-green-500/20 border-green-500'
                : 'bg-gray-900 border-gray-800 hover:border-green-600'
            }`}
          >
            <div className="text-2xl font-bold text-green-500">{stats.approved}</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase mt-1">Aprobadas</div>
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`p-4 rounded-xl border transition-all ${
              filter === 'rejected'
                ? 'bg-red-500/20 border-red-500'
                : 'bg-gray-900 border-gray-800 hover:border-red-600'
            }`}
          >
            <div className="text-2xl font-bold text-red-500">{stats.rejected}</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase mt-1">Rechazadas</div>
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`p-4 rounded-xl border transition-all ${
              filter === 'all'
                ? 'bg-blue-500/20 border-blue-500'
                : 'bg-gray-900 border-gray-800 hover:border-blue-600'
            }`}
          >
            <div className="text-2xl font-bold text-blue-500">{stats.total}</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase mt-1">Total</div>
          </button>
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-yellow-500 animate-spin mb-3" />
            <p className="text-gray-400">Cargando solicitudes...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center">
            <AlertCircle size={32} className="mx-auto mb-3 text-gray-600" />
            <p className="text-gray-400 font-medium">No hay solicitudes para mostrar</p>
            <p className="text-gray-500 text-sm mt-1">Todas las solicitudes han sido procesadas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden hover:border-gray-700 transition-all"
              >
                {/* Header */}
                <div className="p-4 border-b border-gray-800 flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase border ${getStatusColor(request.estado)}`}>
                        {request.estado === 'pending' && '⏳ Pendiente'}
                        {request.estado === 'approved' && '✅ Aprobada'}
                        {request.estado === 'rejected' && '❌ Rechazada'}
                        {request.estado === 'expired' && '⏰ Expirada'}
                      </span>
                      <span className="text-[10px] font-bold text-gray-500 uppercase bg-gray-800 px-2 py-1 rounded">
                        {getServiceTypeLabel(request.tipoServicio)}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-white truncate">{request.servicioNombre || `Servicio ${request.servicioId}`}</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Solicitado: {new Date(request.createdAt).toLocaleDateString('es-CO')} a las {new Date(request.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 bg-gray-950/50 space-y-3">
                  {/* Guest Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-start gap-2">
                      <User size={14} className="text-gray-500 mt-1 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Huésped</p>
                        <p className="text-sm font-medium text-white truncate">{request.contactName}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Mail size={14} className="text-gray-500 mt-1 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Email</p>
                        <p className="text-sm text-emerald-400 truncate">{request.contactEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Phone size={14} className="text-gray-500 mt-1 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-gray-500 uppercase font-bold">WhatsApp</p>
                        <p className="text-sm font-medium text-white truncate">{request.contactWhatsapp}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="text-gray-500 mt-1 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Huéspedes</p>
                        <p className="text-sm font-medium text-white">{request.adultos} Adulto{request.adultos !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  </div>

                  {/* Dates for Hotels */}
                  {request.checkIn && request.checkOut && (
                    <div className="bg-gray-800 rounded-lg p-3 flex items-center gap-3">
                      <Calendar size={14} className="text-blue-500 shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Fechas de Reserva</p>
                        <p className="text-sm text-white font-medium">
                          {new Date(request.checkIn).toLocaleDateString('es-CO')} → {new Date(request.checkOut).toLocaleDateString('es-CO')}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-1">
                          Check-in 3:00 PM / Check-out 1:00 PM
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {request.estado === 'pending' && (
                  <div className="p-4 border-t border-gray-800 flex gap-2">
                    <button
                      onClick={() => handleApprove(request.id)}
                      disabled={processingId === request.id}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {processingId === request.id ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={16} />
                          Aprobar
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      disabled={processingId === request.id}
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {processingId === request.id ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <XCircle size={16} />
                          Rechazar
                        </>
                      )}
                    </button>
                  </div>
                )}

                {request.estado !== 'pending' && (
                  <div className="p-4 border-t border-gray-800 text-xs text-gray-500 flex items-center justify-between">
                    <span>Procesada el {new Date(request.updatedAt || request.createdAt).toLocaleDateString('es-CO')}</span>
                    <button
                      onClick={() => handleSyncToAirtable(request)}
                      disabled={syncingId === request.id}
                      className="px-3 py-1 text-xs bg-gray-800 border border-gray-700 rounded hover:bg-gray-750 disabled:opacity-50 font-medium"
                      title="Reintenta sincronizar a Airtable"
                    >
                      {syncingId === request.id ? '⏳ Sync...' : '🔄 Reintentar'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminApprovals;

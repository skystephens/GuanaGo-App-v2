import React, { useState } from 'react';
import { Plus, Edit2, Trash2, X, Save, AlertCircle, CheckCircle } from 'lucide-react';

interface Transfer {
  id: string;
  name: string;
  origin: string;
  destination: string;
  vehicleType: 'auto' | 'van' | 'minibus' | 'bus';
  capacity: number;
  price: number;
  duration: string; // ej: "15 min", "30 min"
  description?: string;
}

interface PartnerData {
  id: string;
  businessName: string;
  [key: string]: any;
}

interface TransfersPanelProps {
  partnerData: PartnerData;
}

const TransfersPanel: React.FC<TransfersPanelProps> = ({ partnerData }) => {
  const [transfers, setTransfers] = useState<Transfer[]>([
    {
      id: '1',
      name: 'Aeropuerto - Centro',
      origin: 'Aeropuerto de San Andrés',
      destination: 'Centro de San Andrés',
      vehicleType: 'auto',
      capacity: 4,
      price: 45000,
      duration: '20 min',
      description: 'Traslado compartido desde el aeropuerto',
    },
    {
      id: '2',
      name: 'Tour Grupos',
      origin: 'Muelle',
      destination: 'Múltiples destinos',
      vehicleType: 'minibus',
      capacity: 16,
      price: 280000,
      duration: 'variable',
      description: 'Transporte para grupos de turistas',
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<Transfer>({
    id: '',
    name: '',
    origin: '',
    destination: '',
    vehicleType: 'auto',
    capacity: 1,
    price: 0,
    duration: '',
  });

  const handleOpenModal = (transfer?: Transfer) => {
    if (transfer) {
      setFormData(transfer);
      setEditingId(transfer.id);
    } else {
      setFormData({
        id: Date.now().toString(),
        name: '',
        origin: '',
        destination: '',
        vehicleType: 'auto',
        capacity: 1,
        price: 0,
        duration: '',
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
    setError('');
  };

  const handleSaveTransfer = () => {
    if (
      !formData.name.trim() ||
      !formData.origin.trim() ||
      !formData.destination.trim() ||
      !formData.duration.trim()
    ) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    if (formData.price <= 0) {
      setError('El precio debe ser mayor a 0');
      return;
    }

    if (editingId) {
      setTransfers(transfers.map(t => (t.id === editingId ? formData : t)));
      setSuccess('Traslado actualizado');
    } else {
      setTransfers([...transfers, formData]);
      setSuccess('Traslado creado');
    }

    setTimeout(() => {
      setSuccess('');
      setIsModalOpen(false);
    }, 2000);
  };

  const handleDeleteTransfer = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este traslado?')) {
      setTransfers(transfers.filter(t => t.id !== id));
      setSuccess('Traslado eliminado');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const vehicleIcons: Record<string, string> = {
    auto: '🚗',
    van: '🚐',
    minibus: '🚌',
    bus: '🚌',
  };

  const vehicleLabels: Record<string, string> = {
    auto: 'Automóvil',
    van: 'Van',
    minibus: 'Minibús',
    bus: 'Autobús',
  };

  const capacityLimits: Record<string, number> = {
    auto: 4,
    van: 8,
    minibus: 16,
    bus: 45,
  };

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-white">Gestionar Traslados</h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-semibold"
        >
          <Plus size={20} />
          Agregar Traslado
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg flex items-start gap-3">
          <CheckCircle className="text-green-400 flex-shrink-0 mt-0.5" size={20} />
          <p className="text-green-300">{success}</p>
        </div>
      )}

      {/* Transfers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {transfers.map(transfer => (
          <div key={transfer.id} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:border-emerald-500/50 transition-colors">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600/20 to-blue-500/10 p-4 border-b border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl">{vehicleIcons[transfer.vehicleType]}</span>
                <h3 className="text-lg font-bold text-white">{transfer.name}</h3>
              </div>
              <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-blue-500/30 text-blue-300">
                {vehicleLabels[transfer.vehicleType]}
              </span>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 text-sm font-bold mt-0.5">⬆️</span>
                  <div>
                    <p className="text-gray-400 text-xs">Origen</p>
                    <p className="text-white text-sm font-semibold">{transfer.origin}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 text-sm font-bold mt-0.5">⬇️</span>
                  <div>
                    <p className="text-gray-400 text-xs">Destino</p>
                    <p className="text-white text-sm font-semibold">{transfer.destination}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="bg-gray-900 rounded p-2 text-center">
                  <span className="text-gray-400 text-xs block">Capacidad</span>
                  <p className="text-white font-bold">{transfer.capacity}</p>
                </div>
                <div className="bg-gray-900 rounded p-2 text-center">
                  <span className="text-gray-400 text-xs block">Duración</span>
                  <p className="text-white font-bold text-sm">{transfer.duration}</p>
                </div>
                <div className="bg-gray-900 rounded p-2 text-center">
                  <span className="text-gray-400 text-xs block">Precio</span>
                  <p className="text-emerald-400 font-bold text-sm">${transfer.price.toLocaleString()}</p>
                </div>
              </div>

              {transfer.description && (
                <p className="text-sm text-gray-300 bg-gray-900 rounded p-2">{transfer.description}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 p-4 border-t border-gray-700 bg-gray-900/50">
              <button
                onClick={() => handleOpenModal(transfer)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded transition-colors text-sm font-semibold"
              >
                <Edit2 size={16} />
                Editar
              </button>
              <button
                onClick={() => handleDeleteTransfer(transfer.id)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-300 rounded transition-colors text-sm font-semibold"
              >
                <Trash2 size={16} />
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">
                {editingId ? 'Editar Traslado' : 'Crear Nuevo Traslado'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-gray-700 rounded">
                <X size={24} className="text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Nombre del Traslado *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded focus:border-emerald-500 focus:outline-none"
                  placeholder="Ej: Aeropuerto - Centro"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Origen *</label>
                  <input
                    type="text"
                    value={formData.origin}
                    onChange={e => setFormData({ ...formData, origin: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded focus:border-emerald-500 focus:outline-none"
                    placeholder="Ej: Aeropuerto"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Destino *</label>
                  <input
                    type="text"
                    value={formData.destination}
                    onChange={e => setFormData({ ...formData, destination: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded focus:border-emerald-500 focus:outline-none"
                    placeholder="Ej: Centro"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Tipo de Vehículo</label>
                  <select
                    value={formData.vehicleType}
                    onChange={e => {
                      const type = e.target.value as any;
                      setFormData({
                        ...formData,
                        vehicleType: type,
                        capacity: Math.min(formData.capacity, capacityLimits[type]),
                      });
                    }}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="auto">🚗 Automóvil (hasta 4)</option>
                    <option value="van">🚐 Van (hasta 8)</option>
                    <option value="minibus">🚌 Minibús (hasta 16)</option>
                    <option value="bus">🚌 Autobús (hasta 45)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Duración del Viaje *</label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={e => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded focus:border-emerald-500 focus:outline-none"
                    placeholder="Ej: 20 min, 1 hora"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Capacidad</label>
                  <input
                    type="number"
                    min="1"
                    max={capacityLimits[formData.vehicleType]}
                    value={formData.capacity}
                    onChange={e => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded focus:border-emerald-500 focus:outline-none"
                    placeholder="4"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Precio (COP) *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded focus:border-emerald-500 focus:outline-none"
                    placeholder="45000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Descripción (opcional)</label>
                <textarea
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded focus:border-emerald-500 focus:outline-none resize-none"
                  placeholder="Detalles adicionales del traslado..."
                />
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-700 bg-gray-900">
              <button
                onClick={handleSaveTransfer}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold"
              >
                <Save size={20} />
                Guardar Traslado
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded font-semibold"
              >
                <X size={20} />
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransfersPanel;

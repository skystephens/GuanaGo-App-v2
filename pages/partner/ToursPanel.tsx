import React, { useState } from 'react';
import { Plus, Edit2, Trash2, X, Save, AlertCircle, CheckCircle } from 'lucide-react';

interface Tour {
  id: string;
  name: string;
  description: string;
  duration: string; // ej: "4 horas", "1 día"
  price: number;
  capacity: number;
  included: string[];
  pickup: string;
  difficulty: 'fácil' | 'moderado' | 'difícil';
}

interface PartnerData {
  id: string;
  businessName: string;
  [key: string]: any;
}

interface ToursPanelProps {
  partnerData: PartnerData;
}

const ToursPanel: React.FC<ToursPanelProps> = ({ partnerData }) => {
  const [tours, setTours] = useState<Tour[]>([
    {
      id: '1',
      name: 'Snorkel en Banco Chinchorro',
      description: 'Experimenta el arrecife de coral más hermoso de San Andrés',
      duration: '6 horas',
      price: 180000,
      capacity: 8,
      pickup: 'Hotel',
      difficulty: 'fácil',
      included: ['Equipo de snorkel', 'Almuerzo', 'Bebidas', 'Fotos underwater'],
    },
    {
      id: '2',
      name: 'Senderismo Old Point',
      description: 'Camina por la ruta más escénica de la isla',
      duration: '3 horas',
      price: 90000,
      capacity: 10,
      pickup: 'Centro',
      difficulty: 'moderado',
      included: ['Guía local', 'Agua', 'Snacks'],
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<Tour>({
    id: '',
    name: '',
    description: '',
    duration: '',
    price: 0,
    capacity: 1,
    included: [],
    pickup: 'Hotel',
    difficulty: 'fácil',
  });

  const handleOpenModal = (tour?: Tour) => {
    if (tour) {
      setFormData(tour);
      setEditingId(tour.id);
    } else {
      setFormData({
        id: Date.now().toString(),
        name: '',
        description: '',
        duration: '',
        price: 0,
        capacity: 1,
        included: [],
        pickup: 'Hotel',
        difficulty: 'fácil',
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
    setError('');
  };

  const handleSaveTour = () => {
    if (!formData.name.trim() || !formData.description.trim() || !formData.duration.trim()) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    if (formData.price <= 0) {
      setError('El precio debe ser mayor a 0');
      return;
    }

    if (editingId) {
      setTours(tours.map(t => (t.id === editingId ? formData : t)));
      setSuccess('Tour actualizado');
    } else {
      setTours([...tours, formData]);
      setSuccess('Tour creado');
    }

    setTimeout(() => {
      setSuccess('');
      setIsModalOpen(false);
    }, 2000);
  };

  const handleDeleteTour = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este tour?')) {
      setTours(tours.filter(t => t.id !== id));
      setSuccess('Tour eliminado');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const includedOptions = [
    'Equipo de snorkel',
    'Almuerzo',
    'Bebidas',
    'Fotos underwater',
    'Guía local',
    'Transporte',
    'Seguro',
    'Snacks',
  ];

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-white">Gestionar Tours</h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-semibold"
        >
          <Plus size={20} />
          Agregar Tour
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

      {/* Tours Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {tours.map(tour => (
          <div key={tour.id} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:border-emerald-500/50 transition-colors">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600/20 to-emerald-500/10 p-4 border-b border-gray-700">
              <h3 className="text-lg font-bold text-white mb-1">{tour.name}</h3>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  tour.difficulty === 'fácil' ? 'bg-green-500/30 text-green-300' :
                  tour.difficulty === 'moderado' ? 'bg-yellow-500/30 text-yellow-300' :
                  'bg-red-500/30 text-red-300'
                }`}>
                  {tour.difficulty.charAt(0).toUpperCase() + tour.difficulty.slice(1)}
                </span>
                <span className="text-xs text-gray-400">{tour.duration}</span>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              <p className="text-sm text-gray-300 line-clamp-2">{tour.description}</p>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-gray-900 rounded p-2">
                  <span className="text-gray-400 text-xs">Capacidad</span>
                  <p className="text-white font-bold">{tour.capacity} personas</p>
                </div>
                <div className="bg-gray-900 rounded p-2">
                  <span className="text-gray-400 text-xs">Precio</span>
                  <p className="text-emerald-400 font-bold">${tour.price.toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-gray-900 rounded p-2">
                <span className="text-gray-400 text-xs">Salida</span>
                <p className="text-white text-sm">{tour.pickup}</p>
              </div>

              {tour.included.length > 0 && (
                <div className="bg-gray-900 rounded p-2">
                  <span className="text-gray-400 text-xs mb-2 block">Incluye</span>
                  <div className="flex flex-wrap gap-1">
                    {tour.included.map((item, idx) => (
                      <span key={idx} className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded">
                        ✓ {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 p-4 border-t border-gray-700 bg-gray-900/50">
              <button
                onClick={() => handleOpenModal(tour)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded transition-colors text-sm font-semibold"
              >
                <Edit2 size={16} />
                Editar
              </button>
              <button
                onClick={() => handleDeleteTour(tour.id)}
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
                {editingId ? 'Editar Tour' : 'Crear Nuevo Tour'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-gray-700 rounded">
                <X size={24} className="text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Nombre del Tour *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded focus:border-emerald-500 focus:outline-none"
                  placeholder="Ej: Snorkel en Banco Chinchorro"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Descripción *</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded focus:border-emerald-500 focus:outline-none resize-none"
                  placeholder="Describe el tour en detalle..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Duración *</label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={e => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded focus:border-emerald-500 focus:outline-none"
                    placeholder="Ej: 4 horas, 1 día"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Dificultad</label>
                  <select
                    value={formData.difficulty}
                    onChange={e => setFormData({ ...formData, difficulty: e.target.value as any })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="fácil">Fácil</option>
                    <option value="moderado">Moderado</option>
                    <option value="difícil">Difícil</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Precio (COP) *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded focus:border-emerald-500 focus:outline-none"
                    placeholder="150000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Capacidad</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={e => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded focus:border-emerald-500 focus:outline-none"
                    placeholder="10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Punto de Salida</label>
                <input
                  type="text"
                  value={formData.pickup}
                  onChange={e => setFormData({ ...formData, pickup: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded focus:border-emerald-500 focus:outline-none"
                  placeholder="Hotel, Centro, Muelle..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">¿Qué incluye?</label>
                <div className="grid grid-cols-2 gap-2">
                  {includedOptions.map(option => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          included: formData.included.includes(option)
                            ? formData.included.filter(i => i !== option)
                            : [...formData.included, option],
                        });
                      }}
                      className={`text-sm px-3 py-2 rounded transition-colors ${
                        formData.included.includes(option)
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-700 bg-gray-900">
              <button
                onClick={handleSaveTour}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold"
              >
                <Save size={20} />
                Guardar Tour
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

export default ToursPanel;

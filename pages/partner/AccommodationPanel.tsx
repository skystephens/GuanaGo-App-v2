import React, { useState } from 'react';
import { Plus, Edit2, Trash2, X, Save, AlertCircle, CheckCircle } from 'lucide-react';

interface Room {
  id: string;
  name: string;
  type: 'single' | 'double' | 'suite' | 'deluxe';
  capacity: number;
  price: number;
  availability: number;
  amenities: string[];
  description: string;
}

interface PartnerData {
  id: string;
  businessName: string;
  [key: string]: any;
}

interface AccommodationPanelProps {
  partnerData: PartnerData;
}

const AccommodationPanel: React.FC<AccommodationPanelProps> = ({ partnerData }) => {
  // Mock data para habitaciones
  const initialRooms: Room[] = [
    {
      id: '1',
      name: 'Habitación Estándar',
      type: 'double',
      capacity: 2,
      price: 120000,
      availability: 5,
      amenities: ['Wifi', 'TV', 'AC'],
      description: 'Habitación cómoda con baño privado',
    },
    {
      id: '2',
      name: 'Suite Deluxe',
      type: 'suite',
      capacity: 4,
      price: 250000,
      availability: 2,
      amenities: ['Wifi', 'TV', 'AC', 'Jacuzzi', 'Balcón'],
      description: 'Suite lujosa con vistas al mar',
    },
  ];

  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState<Partial<Room>>({
    name: '',
    type: 'double',
    capacity: 2,
    price: 0,
    availability: 0,
    amenities: [],
    description: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAddRoom = () => {
    setEditingRoom(null);
    setFormData({
      name: '',
      type: 'double',
      capacity: 2,
      price: 0,
      availability: 0,
      amenities: [],
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    setFormData(room);
    setIsModalOpen(true);
  };

  const handleSaveRoom = () => {
    if (!formData.name || !formData.price || !formData.availability) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    setError('');

    if (editingRoom) {
      // Actualizar habitación existente
      setRooms(rooms.map(r => (r.id === editingRoom.id ? { ...formData, id: editingRoom.id } : r) as Room));
      setSuccess('Habitación actualizada correctamente');
    } else {
      // Crear nueva habitación
      const newRoom: Room = {
        ...formData,
        id: Date.now().toString(),
      } as Room;
      setRooms([...rooms, newRoom]);
      setSuccess('Habitación creada correctamente');
    }

    setTimeout(() => {
      setSuccess('');
      setIsModalOpen(false);
    }, 2000);
  };

  const handleDeleteRoom = (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta habitación?')) {
      setRooms(rooms.filter(r => r.id !== id));
      setSuccess('Habitación eliminada');
      setTimeout(() => setSuccess(''), 2000);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-white">Gestión de Alojamientos</h2>
        <button
          onClick={handleAddRoom}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors"
        >
          <Plus size={20} />
          Nueva Habitación
        </button>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg flex items-start gap-3">
          <CheckCircle className="text-green-400 flex-shrink-0 mt-0.5" size={20} />
          <p className="text-green-300">{success}</p>
        </div>
      )}

      {/* Grid de Habitaciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map(room => (
          <div key={room.id} className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">{room.name}</h3>
                <p className="text-gray-400 text-sm mt-1">{room.type.toUpperCase()}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditRoom(room)}
                  className="p-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded transition-colors"
                  title="Editar"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDeleteRoom(room.id)}
                  className="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-300 rounded transition-colors"
                  title="Eliminar"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <p className="text-gray-300 text-sm mb-4 line-clamp-2">{room.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-gray-400 text-xs mb-1">Capacidad</p>
                <p className="text-white font-semibold">{room.capacity} personas</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Precio/Noche</p>
                <p className="text-emerald-400 font-bold">${room.price.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Disponibles</p>
                <p className="text-white font-semibold">{room.availability}</p>
              </div>
            </div>

            {room.amenities.length > 0 && (
              <div className="mb-4">
                <p className="text-gray-400 text-xs mb-2">Amenidades</p>
                <div className="flex flex-wrap gap-1">
                  {room.amenities.map(amenity => (
                    <span key={amenity} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal para crear/editar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">
                {editingRoom ? 'Editar Habitación' : 'Nueva Habitación'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-700 rounded transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-3">
                <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Nombre de la Habitación *
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="Ej: Habitación Doble Deluxe"
                />
              </div>

              {/* Tipo y Capacidad */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Tipo</label>
                  <select
                    value={formData.type || 'double'}
                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="single">Individual</option>
                    <option value="double">Doble</option>
                    <option value="suite">Suite</option>
                    <option value="deluxe">Deluxe</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Capacidad</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.capacity || 1}
                    onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Precio y Disponibilidad */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Precio por Noche (COP) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.price || 0}
                    onChange={e => setFormData({ ...formData, price: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-emerald-500 focus:outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Disponibles *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.availability || 0}
                    onChange={e => setFormData({ ...formData, availability: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-emerald-500 focus:outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Descripción</label>
                <textarea
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-emerald-500 focus:outline-none resize-none"
                  placeholder="Describe las características y comodidades..."
                />
              </div>

              {/* Amenidades */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Amenidades</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Wifi', 'TV', 'AC', 'Jacuzzi', 'Balcón', 'Mini Bar'].map(amenity => (
                    <label key={amenity} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(formData.amenities || []).includes(amenity)}
                        onChange={e => {
                          const amenities = formData.amenities || [];
                          if (e.target.checked) {
                            setFormData({ ...formData, amenities: [...amenities, amenity] });
                          } else {
                            setFormData({
                              ...formData,
                              amenities: amenities.filter(a => a !== amenity),
                            });
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-gray-300 text-sm">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <button
                  onClick={handleSaveRoom}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold transition-colors"
                >
                  <Save size={20} />
                  Guardar
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded font-semibold transition-colors"
                >
                  <X size={20} />
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

export default AccommodationPanel;

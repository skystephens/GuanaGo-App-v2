import React, { useState } from 'react';
import { Save, X, AlertCircle, CheckCircle, Upload } from 'lucide-react';

interface RestaurantInfo {
  name: string;
  cuisine: string[];
  description: string;
  address: string;
  phone: string;
  email: string;
  openingHours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  specialties: string[];
  logoUrl?: string;
}

interface PartnerData {
  id: string;
  businessName: string;
  [key: string]: any;
}

interface RestaurantPanelProps {
  partnerData: PartnerData;
}

const RestaurantPanel: React.FC<RestaurantPanelProps> = ({ partnerData }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [restaurantData, setRestaurantData] = useState<RestaurantInfo>({
    name: partnerData.businessName || '',
    cuisine: ['Internacional', 'Seafood'],
    description: 'Descripción del restaurante...',
    address: partnerData.address || '',
    phone: partnerData.phone || '',
    email: partnerData.email || '',
    openingHours: {
      monday: '11:00 AM - 10:00 PM',
      tuesday: '11:00 AM - 10:00 PM',
      wednesday: '11:00 AM - 10:00 PM',
      thursday: '11:00 AM - 10:00 PM',
      friday: '11:00 AM - 11:00 PM',
      saturday: '12:00 PM - 11:00 PM',
      sunday: '12:00 PM - 10:00 PM',
    },
    specialties: ['Ceviche', 'Pescado a la sal', 'Camarones al ajillo'],
  });

  const handleInputChange = (field: string, value: any) => {
    setRestaurantData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleOpeningHoursChange = (day: string, value: string) => {
    setRestaurantData(prev => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [day]: value,
      },
    }));
  };

  const handleCuisineToggle = (cuisine: string) => {
    setRestaurantData(prev => ({
      ...prev,
      cuisine: prev.cuisine.includes(cuisine)
        ? prev.cuisine.filter(c => c !== cuisine)
        : [...prev.cuisine, cuisine],
    }));
  };

  const handleSpecialtyChange = (index: number, value: string) => {
    setRestaurantData(prev => ({
      ...prev,
      specialties: prev.specialties.map((s, i) => (i === index ? value : s)),
    }));
  };

  const handleAddSpecialty = () => {
    setRestaurantData(prev => ({
      ...prev,
      specialties: [...prev.specialties, ''],
    }));
  };

  const handleRemoveSpecialty = (index: number) => {
    setRestaurantData(prev => ({
      ...prev,
      specialties: prev.specialties.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    if (!restaurantData.name || !restaurantData.address || !restaurantData.phone) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Aquí normalmente enviarías a la API
      // const response = await fetch(`/api/partners/${partnerData.id}/restaurant`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(restaurantData),
      // });

      await new Promise(resolve => setTimeout(resolve, 500));

      setSuccess('Información del restaurante actualizada');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error al guardar los cambios');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const cuisineOptions = ['Internacional', 'Seafood', 'Italiana', 'Colombiana', 'Asiática', 'Fusión'];

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-white">Información del Restaurante</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-semibold"
          >
            Editar Información
          </button>
        )}
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

      {/* Main Content */}
      <div className="space-y-6">
        {/* Información Básica */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Información Básica</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Nombre del Restaurante *
              </label>
              <input
                type="text"
                value={restaurantData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                disabled={!isEditing}
                className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                  isEditing
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-emerald-500 focus:outline-none'
                    : 'bg-gray-900 border-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Descripción *
              </label>
              <textarea
                value={restaurantData.description}
                onChange={e => handleInputChange('description', e.target.value)}
                disabled={!isEditing}
                rows={3}
                className={`w-full px-4 py-3 rounded-lg border transition-colors resize-none ${
                  isEditing
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-emerald-500 focus:outline-none'
                    : 'bg-gray-900 border-gray-700 text-gray-400 cursor-not-allowed'
                }`}
                placeholder="Cuéntanos sobre tu restaurante..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Dirección *
                </label>
                <input
                  type="text"
                  value={restaurantData.address}
                  onChange={e => handleInputChange('address', e.target.value)}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                    isEditing
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-emerald-500 focus:outline-none'
                      : 'bg-gray-900 border-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  value={restaurantData.phone}
                  onChange={e => handleInputChange('phone', e.target.value)}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                    isEditing
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-emerald-500 focus:outline-none'
                      : 'bg-gray-900 border-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Email</label>
              <input
                type="email"
                value={restaurantData.email}
                onChange={e => handleInputChange('email', e.target.value)}
                disabled={!isEditing}
                className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                  isEditing
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-emerald-500 focus:outline-none'
                    : 'bg-gray-900 border-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Tipo de Cocina */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Tipo de Cocina</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {cuisineOptions.map(cuisine => (
              <button
                key={cuisine}
                onClick={() => isEditing && handleCuisineToggle(cuisine)}
                disabled={!isEditing}
                className={`px-4 py-2 rounded-lg transition-colors font-semibold text-sm ${
                  restaurantData.cuisine.includes(cuisine)
                    ? 'bg-emerald-600 text-white'
                    : isEditing
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                {cuisine}
              </button>
            ))}
          </div>
        </div>

        {/* Especialidades */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Platos Especiales</h3>
            {isEditing && (
              <button
                onClick={handleAddSpecialty}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm font-semibold transition-colors"
              >
                + Agregar
              </button>
            )}
          </div>

          <div className="space-y-2">
            {restaurantData.specialties.map((specialty, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={specialty}
                  onChange={e => handleSpecialtyChange(index, e.target.value)}
                  disabled={!isEditing}
                  className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                    isEditing
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-emerald-500 focus:outline-none'
                      : 'bg-gray-900 border-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                  placeholder="Ej: Ceviche de atún"
                />
                {isEditing && specialty && (
                  <button
                    onClick={() => handleRemoveSpecialty(index)}
                    className="px-3 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-300 rounded transition-colors"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Horarios de Atención */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Horarios de Atención</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(restaurantData.openingHours).map(([day, hours]) => (
              <div key={day}>
                <label className="block text-sm font-semibold text-gray-300 mb-2 capitalize">
                  {day === 'monday'
                    ? 'Lunes'
                    : day === 'tuesday'
                    ? 'Martes'
                    : day === 'wednesday'
                    ? 'Miércoles'
                    : day === 'thursday'
                    ? 'Jueves'
                    : day === 'friday'
                    ? 'Viernes'
                    : day === 'saturday'
                    ? 'Sábado'
                    : 'Domingo'}
                </label>
                <input
                  type="text"
                  value={hours as string}
                  onChange={e => handleOpeningHoursChange(day, e.target.value)}
                  disabled={!isEditing}
                  className={`w-full px-4 py-2 rounded-lg border transition-colors text-sm ${
                    isEditing
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-emerald-500 focus:outline-none'
                      : 'bg-gray-900 border-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                  placeholder="Ej: 11:00 AM - 10:00 PM"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white rounded-lg transition-colors font-semibold"
            >
              <Save size={20} />
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-semibold"
            >
              <X size={20} />
              Cancelar
            </button>
          </div>
        )}
      </div>

      {/* Preview Portal B2B */}
      <div className="mt-8 bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Vista en Portal B2B</h3>
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-sm text-gray-300">
          <p>✓ Tu información aparecerá en el portal B2B de GuiaSAI</p>
          <p>✓ Los empresarios podrán ver tus horarios y especialidades</p>
          <p>✓ Podrán contactarte para colaboraciones comerciales</p>
        </div>
      </div>
    </div>
  );
};

export default RestaurantPanel;

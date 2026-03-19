import React, { useState } from 'react';
import { Save, X, AlertCircle, CheckCircle } from 'lucide-react';

interface PartnerData {
  id: string;
  businessName: string;
  contactName: string;
  email: string;
  category: 'accommodation' | 'restaurant' | null;
  phone?: string;
  address?: string;
  description?: string;
  businessUnits?: {
    accommodation: boolean;
    restaurant: boolean;
    tours: boolean;
    transfers: boolean;
  };
}

interface PartnerProfileProps {
  partnerData: PartnerData;
  onUpdate: (data: PartnerData) => void;
}

const PartnerProfile: React.FC<PartnerProfileProps> = ({ partnerData, onUpdate }) => {
  const fallbackUnits = {
    accommodation: partnerData.category === 'accommodation',
    restaurant: partnerData.category === 'restaurant',
    tours: false,
    transfers: false,
  };

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    ...partnerData,
    businessUnits: partnerData.businessUnits || fallbackUnits,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleUnit = (key: 'accommodation' | 'restaurant' | 'tours' | 'transfers') => {
    if (!isEditing) return;
    setFormData(prev => ({
      ...prev,
      businessUnits: {
        accommodation: prev.businessUnits?.accommodation ?? false,
        restaurant: prev.businessUnits?.restaurant ?? false,
        tours: prev.businessUnits?.tours ?? false,
        transfers: prev.businessUnits?.transfers ?? false,
        [key]: !(prev.businessUnits?.[key] ?? false),
      },
    }));
  };

  const handleSave = async () => {
    if (!formData.businessName.trim() || !formData.contactName.trim() || !formData.email.trim()) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Aquí normalmente enviarías a la API
      // const response = await fetch(`/api/partners/${partnerData.id}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // });

      // Por ahora, simulamos el guardado
      await new Promise(resolve => setTimeout(resolve, 500));

      const normalizedUnits = {
        accommodation: formData.businessUnits?.accommodation ?? false,
        restaurant: formData.businessUnits?.restaurant ?? false,
        tours: formData.businessUnits?.tours ?? false,
        transfers: formData.businessUnits?.transfers ?? false,
      };
      const normalizedCategory = normalizedUnits.accommodation && !normalizedUnits.restaurant && !normalizedUnits.tours && !normalizedUnits.transfers
        ? 'accommodation'
        : normalizedUnits.restaurant && !normalizedUnits.accommodation && !normalizedUnits.tours && !normalizedUnits.transfers
        ? 'restaurant'
        : formData.category;

      const normalized = {
        ...formData,
        category: normalizedCategory,
        businessUnits: normalizedUnits,
      };

      localStorage.setItem('partner_data', JSON.stringify(normalized));
      onUpdate(normalized);

      setSuccess('Perfil actualizado correctamente');
      setIsEditing(false);

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error al guardar el perfil');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-white">Mi Perfil</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-semibold"
            >
              Editar Perfil
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

        <div className="space-y-6">
          {/* Nombre del Negocio */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Nombre del Negocio *
            </label>
            <input
              type="text"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              disabled={!isEditing}
              className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                isEditing
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-emerald-500 focus:outline-none'
                  : 'bg-gray-900 border-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            />
          </div>

          {/* Nombre de Contacto */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Nombre de Contacto *
            </label>
            <input
              type="text"
              name="contactName"
              value={formData.contactName}
              onChange={handleChange}
              disabled={!isEditing}
              className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                isEditing
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-emerald-500 focus:outline-none'
                  : 'bg-gray-900 border-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={!isEditing}
              className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                isEditing
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-emerald-500 focus:outline-none'
                  : 'bg-gray-900 border-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Teléfono
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone || ''}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="+57 (código de área)"
              className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                isEditing
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-emerald-500 focus:outline-none'
                  : 'bg-gray-900 border-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            />
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Dirección
            </label>
            <input
              type="text"
              name="address"
              value={formData.address || ''}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="Calle, número y ciudad"
              className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                isEditing
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-emerald-500 focus:outline-none'
                  : 'bg-gray-900 border-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Unidades de Negocio (puedes activar varias)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => toggleUnit('accommodation')}
                className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-colors ${
                  formData.businessUnits?.accommodation
                    ? 'bg-emerald-600/20 border-emerald-500 text-white'
                    : 'bg-gray-900 border-gray-700 text-gray-300'
                } ${!isEditing ? 'cursor-not-allowed opacity-70' : 'hover:border-emerald-400'}`}
                disabled={!isEditing}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏨</span>
                  <div className="text-left">
                    <p className="font-semibold">Alojamiento</p>
                    <p className="text-xs text-gray-400">Hoteles, posadas, casas</p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded ${
                  formData.businessUnits?.accommodation ? 'bg-emerald-500 text-gray-900' : 'bg-gray-700 text-gray-300'
                }`}>
                  {formData.businessUnits?.accommodation ? 'Activo' : 'Inactivo'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => toggleUnit('restaurant')}
                className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-colors ${
                  formData.businessUnits?.restaurant
                    ? 'bg-emerald-600/20 border-emerald-500 text-white'
                    : 'bg-gray-900 border-gray-700 text-gray-300'
                } ${!isEditing ? 'cursor-not-allowed opacity-70' : 'hover:border-emerald-400'}`}
                disabled={!isEditing}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">🍽️</span>
                  <div className="text-left">
                    <p className="font-semibold">Restaurante</p>
                    <p className="text-xs text-gray-400">Bares, cafés, gastro-bares</p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded ${
                  formData.businessUnits?.restaurant ? 'bg-emerald-500 text-gray-900' : 'bg-gray-700 text-gray-300'
                }`}>
                  {formData.businessUnits?.restaurant ? 'Activo' : 'Inactivo'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => toggleUnit('tours')}
                className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-colors ${
                  formData.businessUnits?.tours
                    ? 'bg-blue-600/20 border-blue-500 text-white'
                    : 'bg-gray-900 border-gray-700 text-gray-300'
                } ${!isEditing ? 'cursor-not-allowed opacity-70' : 'hover:border-blue-400'}`}
                disabled={!isEditing}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">✈️</span>
                  <div className="text-left">
                    <p className="font-semibold">Tours</p>
                    <p className="text-xs text-gray-400">Excursiones, actividades</p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded ${
                  formData.businessUnits?.tours ? 'bg-blue-500 text-gray-900' : 'bg-gray-700 text-gray-300'
                }`}>
                  {formData.businessUnits?.tours ? 'Activo' : 'Inactivo'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => toggleUnit('transfers')}
                className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-colors ${
                  formData.businessUnits?.transfers
                    ? 'bg-purple-600/20 border-purple-500 text-white'
                    : 'bg-gray-900 border-gray-700 text-gray-300'
                } ${!isEditing ? 'cursor-not-allowed opacity-70' : 'hover:border-purple-400'}`}
                disabled={!isEditing}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">🚗</span>
                  <div className="text-left">
                    <p className="font-semibold">Traslados</p>
                    <p className="text-xs text-gray-400">Transporte, taxi, vans</p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded ${
                  formData.businessUnits?.transfers ? 'bg-purple-500 text-gray-900' : 'bg-gray-700 text-gray-300'
                }`}>
                  {formData.businessUnits?.transfers ? 'Activo' : 'Inactivo'}
                </span>
              </button>
            </div>
            {!isEditing && (
              <p className="text-xs text-gray-400 mt-2">Para activar o desactivar unidades, toca "Editar Perfil".</p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Descripción del Negocio
            </label>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="Cuéntanos sobre tu negocio..."
              rows={4}
              className={`w-full px-4 py-3 rounded-lg border transition-colors resize-none ${
                isEditing
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-emerald-500 focus:outline-none'
                  : 'bg-gray-900 border-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            />
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white rounded-lg transition-colors font-semibold"
              >
                <Save size={20} />
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              <button
                onClick={() => {
                  setFormData({
                    ...partnerData,
                    businessUnits: partnerData.businessUnits || fallbackUnits,
                  });
                  setIsEditing(false);
                  setError('');
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-semibold"
              >
                <X size={20} />
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartnerProfile;

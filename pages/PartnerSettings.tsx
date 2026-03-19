import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  DollarSign,
  Calendar,
  Edit,
  Save,
  X,
  Camera,
  Star,
  ShoppingBag,
  TrendingUp,
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  Bell,
  Lock,
  CreditCard,
  FileText,
  Globe,
  ArrowLeft
} from 'lucide-react';
import { partnerService, Partner } from '../services/partnerService';

interface PartnerSettingsProps {
  partnerId: string;
  onBack: () => void;
}

const PartnerSettings: React.FC<PartnerSettingsProps> = ({ partnerId, onBack }) => {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'business' | 'payments' | 'notifications'>('profile');

  // Form state
  const [formData, setFormData] = useState({
    contactName: '',
    email: '',
    phone: '',
    businessName: '',
    category: '',
    description: '',
    address: '',
    city: '',
    website: '',
    bankName: '',
    accountNumber: '',
    accountType: 'Ahorros',
    accountHolder: '',
    notifications: {
      emailSales: true,
      emailPayouts: true,
      emailReviews: true,
      pushSales: true,
      pushPayouts: false,
      pushReviews: false,
    },
  });

  useEffect(() => {
    loadPartnerData();
  }, [partnerId]);

  const loadPartnerData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await partnerService.getProfile(partnerId);
      setPartner(data);
      
      // Populate form
      setFormData({
        contactName: data.contactName || '',
        email: data.email || '',
        phone: data.phone || '',
        businessName: data.businessName || '',
        category: data.category || '',
        description: (data as any).description || '',
        address: data.location?.address || '',
        city: data.location?.city || '',
        website: (data as any).website || '',
        bankName: (data as any).bankName || '',
        accountNumber: (data as any).accountNumber || '',
        accountType: (data as any).accountType || 'Ahorros',
        accountHolder: (data as any).accountHolder || '',
        notifications: (data as any).notifications || {
          emailSales: true,
          emailPayouts: true,
          emailReviews: true,
          pushSales: true,
          pushPayouts: false,
          pushReviews: false,
        },
      });
    } catch (err: any) {
      console.error('Error loading partner:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const updateData = {
        contactName: formData.contactName,
        email: formData.email,
        phone: formData.phone,
        businessName: formData.businessName,
        category: formData.category,
        description: formData.description,
        location: {
          address: formData.address,
          city: formData.city,
        },
        website: formData.website,
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        accountType: formData.accountType,
        accountHolder: formData.accountHolder,
        notifications: formData.notifications,
      };

      const updatedPartner = await partnerService.updateProfile(partnerId, updateData);
      setPartner(updatedPartner);
      setEditing(false);
      setSuccess('Configuración guardada exitosamente');
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error saving:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNotificationToggle = (key: string) => {
    setFormData((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key as keyof typeof prev.notifications],
      },
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando configuración...</p>
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
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  <X size={18} />
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Save size={18} />
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <Edit size={18} />
                Editar
              </button>
            )}
          </div>
        </div>
        <h1 className="text-3xl font-black mb-1">Configuración</h1>
        <p className="text-gray-400">Gestiona tu perfil y preferencias</p>
      </header>

      {/* Alerts */}
      {error && (
        <div className="mx-6 mt-6 bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-bold text-red-400 mb-1">Error</h3>
            <p className="text-gray-300 text-sm">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mx-6 mt-6 bg-green-500/10 border border-green-500/50 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-bold text-green-400 mb-1">Éxito</h3>
            <p className="text-gray-300 text-sm">{success}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-800 px-6 mt-6">
        <div className="flex gap-4 overflow-x-auto">
          {[
            { id: 'profile', label: 'Perfil', icon: User },
            { id: 'business', label: 'Negocio', icon: Building },
            { id: 'payments', label: 'Pagos', icon: CreditCard },
            { id: 'notifications', label: 'Notificaciones', icon: Bell },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400 font-semibold'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <User size={24} className="text-blue-400" />
                Información Personal
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">
                    Nombre Completo
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.contactName}
                      onChange={(e) => handleInputChange('contactName', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-white text-lg">{formData.contactName || 'No especificado'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">
                    <Mail size={16} className="inline mr-2" />
                    Correo Electrónico
                  </label>
                  {editing ? (
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-white text-lg">{formData.email || 'No especificado'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">
                    <Phone size={16} className="inline mr-2" />
                    Teléfono
                  </label>
                  {editing ? (
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-white text-lg">{formData.phone || 'No especificado'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">
                    <Calendar size={16} className="inline mr-2" />
                    Miembro Desde
                  </label>
                  <p className="text-white text-lg">
                    {partner?.createdAt ? new Date(partner.createdAt).toLocaleDateString('es-CO') : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            {partner && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-xl p-6">
                  <Star size={24} className="text-blue-400 mb-3" />
                  <h3 className="text-gray-400 text-sm mb-1">Calificación</h3>
                  <p className="text-3xl font-black text-white">{partner.rating.toFixed(1)}</p>
                </div>

                <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-xl p-6">
                  <ShoppingBag size={24} className="text-green-400 mb-3" />
                  <h3 className="text-gray-400 text-sm mb-1">Ventas Totales</h3>
                  <p className="text-3xl font-black text-white">{partner.totalSales}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-xl p-6">
                  <Award size={24} className="text-purple-400 mb-3" />
                  <h3 className="text-gray-400 text-sm mb-1">Estado</h3>
                  <p className="text-3xl font-black text-white capitalize">{partner.status}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Business Tab */}
        {activeTab === 'business' && (
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Building size={24} className="text-purple-400" />
                Información del Negocio
              </h2>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">
                    Nombre del Negocio
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => handleInputChange('businessName', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-white text-lg">{formData.businessName || 'No especificado'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">
                    Categoría
                  </label>
                  {editing ? (
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Alojamiento">Alojamiento</option>
                      <option value="Restaurante">Restaurante</option>
                      <option value="Tour">Tour</option>
                      <option value="Transporte">Transporte</option>
                      <option value="Artesanías">Artesanías</option>
                      <option value="Servicios">Servicios</option>
                    </select>
                  ) : (
                    <p className="text-white text-lg">{formData.category || 'No especificado'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">
                    Descripción
                  </label>
                  {editing ? (
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={4}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                      placeholder="Describe tu negocio..."
                    />
                  ) : (
                    <p className="text-gray-300">{formData.description || 'No especificado'}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">
                      <MapPin size={16} className="inline mr-2" />
                      Dirección
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-white">{formData.address || 'No especificado'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">
                      Ciudad
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-white">{formData.city || 'No especificado'}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">
                    <Globe size={16} className="inline mr-2" />
                    Sitio Web
                  </label>
                  {editing ? (
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                      placeholder="https://..."
                    />
                  ) : (
                    <p className="text-white">{formData.website || 'No especificado'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <CreditCard size={24} className="text-green-400" />
                Información de Pago
              </h2>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">
                    Banco
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={(e) => handleInputChange('bankName', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-white text-lg">{formData.bankName || 'No especificado'}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">
                      Tipo de Cuenta
                    </label>
                    {editing ? (
                      <select
                        value={formData.accountType}
                        onChange={(e) => handleInputChange('accountType', e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="Ahorros">Ahorros</option>
                        <option value="Corriente">Corriente</option>
                      </select>
                    ) : (
                      <p className="text-white text-lg">{formData.accountType}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">
                      Número de Cuenta
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.accountNumber}
                        onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-white text-lg">
                        {formData.accountNumber ? `****${formData.accountNumber.slice(-4)}` : 'No especificado'}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">
                    Titular de la Cuenta
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.accountHolder}
                      onChange={(e) => handleInputChange('accountHolder', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-white text-lg">{formData.accountHolder || 'No especificado'}</p>
                  )}
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-gray-300">
                  <Lock size={16} className="inline mr-2 text-blue-400" />
                  Tu información bancaria está encriptada y segura. Solo se usa para procesamiento de pagos.
                </p>
              </div>
            </div>

            {partner && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <DollarSign size={20} className="text-green-400" />
                  Información de Comisión
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Tu tasa de comisión actual</p>
                    <p className="text-3xl font-black text-white">{partner.commission}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-sm mb-1">Ganas por cada venta</p>
                    <p className="text-2xl font-bold text-green-400">{100 - partner.commission}%</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Bell size={24} className="text-orange-400" />
                Preferencias de Notificaciones
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Mail size={18} className="text-blue-400" />
                    Notificaciones por Email
                  </h3>
                  <div className="space-y-3">
                    {[
                      { key: 'emailSales', label: 'Nuevas ventas', desc: 'Recibe un email cada vez que haces una venta' },
                      { key: 'emailPayouts', label: 'Pagos procesados', desc: 'Notificaciones de pagos completados' },
                      { key: 'emailReviews', label: 'Nuevas reseñas', desc: 'Cuando un cliente deja una reseña' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-start justify-between p-4 bg-gray-800/50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white mb-1">{item.label}</h4>
                          <p className="text-sm text-gray-400">{item.desc}</p>
                        </div>
                        <button
                          onClick={() => editing && handleNotificationToggle(item.key)}
                          disabled={!editing}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            formData.notifications[item.key as keyof typeof formData.notifications]
                              ? 'bg-blue-500'
                              : 'bg-gray-700'
                          } ${!editing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              formData.notifications[item.key as keyof typeof formData.notifications]
                                ? 'translate-x-6'
                                : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Bell size={18} className="text-purple-400" />
                    Notificaciones Push
                  </h3>
                  <div className="space-y-3">
                    {[
                      { key: 'pushSales', label: 'Nuevas ventas', desc: 'Notificación instantánea en tu dispositivo' },
                      { key: 'pushPayouts', label: 'Pagos procesados', desc: 'Alerta cuando se procesa un pago' },
                      { key: 'pushReviews', label: 'Nuevas reseñas', desc: 'Aviso de reseñas nuevas' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-start justify-between p-4 bg-gray-800/50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white mb-1">{item.label}</h4>
                          <p className="text-sm text-gray-400">{item.desc}</p>
                        </div>
                        <button
                          onClick={() => editing && handleNotificationToggle(item.key)}
                          disabled={!editing}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            formData.notifications[item.key as keyof typeof formData.notifications]
                              ? 'bg-purple-500'
                              : 'bg-gray-700'
                          } ${!editing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              formData.notifications[item.key as keyof typeof formData.notifications]
                                ? 'translate-x-6'
                                : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnerSettings;

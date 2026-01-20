import React, { useState, useEffect } from 'react';
import { Home, AlertCircle, CheckCircle, Clock, ChevronRight } from 'lucide-react';
import { api } from '../../services/api';

interface PartnerAccommodationsProps {
  onBack?: () => void;
}

export default function PartnerAccommodations({ onBack }: PartnerAccommodationsProps) {
  const [activeTab, setActiveTab] = useState<'form' | 'status'>('form');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [mySubmissions, setMySubmissions] = useState<any[]>([]);

  const [form, setForm] = useState({
    nombreAlojamiento: '',
    tipoAlojamiento: '',
    ubicacion: '',
    direccion: '',
    descripcion: '',
    capacidadMaxima: undefined as number | undefined,
    camasSencillas: undefined as number | undefined,
    camasDobles: undefined as number | undefined,
    camasQueen: undefined as number | undefined,
    camasKing: undefined as number | undefined,
    tieneCocina: false,
    incluyeDesayuno: false,
    accesoJacuzzi: false,
    accesoBar: false,
    accesoPiscina: false,
    aceptaBebes: true,
    politicaBebes: '',
    minimoNoches: 1,
    monedaPrecios: 'COP',
    precio1: undefined as number | undefined,
    precio2: undefined as number | undefined,
    precio3: undefined as number | undefined,
    precio4: undefined as number | undefined,
    telefonoContacto: '',
    emailContacto: ''
  });

  const onChange = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const loadMySubmissions = async () => {
    const res = await api.accommodations.listMySubmissions();
    if (res && res.success) {
      setMySubmissions(res.records || res.data || []);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    const payload = { ...form };
    const res = await api.accommodations.createSubmission(payload);
    setSubmitting(false);
    setResult(res);
    if (res && res.success) {
      setForm({
        nombreAlojamiento: '',
        tipoAlojamiento: '',
        ubicacion: '',
        direccion: '',
        descripcion: '',
        capacidadMaxima: undefined,
        camasSencillas: undefined,
        camasDobles: undefined,
        camasQueen: undefined,
        camasKing: undefined,
        tieneCocina: false,
        incluyeDesayuno: false,
        accesoJacuzzi: false,
        accesoBar: false,
        accesoPiscina: false,
        aceptaBebes: true,
        politicaBebes: '',
        minimoNoches: 1,
        monedaPrecios: 'COP',
        precio1: undefined,
        precio2: undefined,
        precio3: undefined,
        precio4: undefined,
        telefonoContacto: '',
        emailContacto: ''
      });
      loadMySubmissions();
      setActiveTab('status');
    }
  };

  useEffect(() => {
    // Verificar autenticación del socio
    const role = localStorage.getItem('userRole');
    const socioId = localStorage.getItem('socioId');
    
    if (!role || (role !== 'Socio' && role !== 'Aliado' && role !== 'Operador' && role !== 'partner')) {
      console.warn('Usuario no autorizado para ver formulario de alojamientos');
    }
    
    setUserRole(role);
    setIsLoading(false);
    loadMySubmissions();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-24">
      
      {/* Header */}
      <header className="px-6 pt-12 pb-6 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-4 mb-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              <ChevronRight size={20} className="rotate-180" />
            </button>
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Home size={28} className="text-blue-400" />
              Gestión de Alojamientos
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Registra y gestiona tus servicios de hospedaje
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-6">
          <button
            onClick={() => setActiveTab('form')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              activeTab === 'form'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-750 hover:text-gray-200'
            }`}
          >
            📝 Registrar Alojamiento
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              activeTab === 'status'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-750 hover:text-gray-200'
            }`}
          >
            📋 Mis Solicitudes
          </button>
        </div>
      </header>

      <div className="px-6 py-6">
        
        {/* TAB 1: Formulario */}
        {activeTab === 'form' && (
          <div className="space-y-6">
            
            {/* Info Box */}
            <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="text-blue-400 flex-shrink-0" size={20} />
                <div>
                  <h3 className="font-bold text-blue-200 mb-1">Proceso de Aprobación</h3>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    Tu solicitud será revisada por nuestro equipo. Te notificaremos cuando sea aprobada y tu alojamiento 
                    aparecerá en la app de GuanaGO para que los turistas puedan reservarlo.
                  </p>
                </div>
              </div>
            </div>

            {/* Steps Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-blue-500">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-500/20 rounded-full mb-2 mx-auto">
                  <span className="text-blue-400 font-bold text-lg">1</span>
                </div>
                <p className="text-center text-xs text-gray-300 font-semibold">Completa el formulario</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-yellow-500">
                <div className="flex items-center justify-center w-10 h-10 bg-yellow-500/20 rounded-full mb-2 mx-auto">
                  <Clock className="text-yellow-400" size={20} />
                </div>
                <p className="text-center text-xs text-gray-300 font-semibold">Revisión admin</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-green-500">
                <div className="flex items-center justify-center w-10 h-10 bg-green-500/20 rounded-full mb-2 mx-auto">
                  <CheckCircle className="text-green-400" size={20} />
                </div>
                <p className="text-center text-xs text-gray-300 font-semibold">Publicado en app</p>
              </div>
            </div>

            {/* Formulario Interno */}
            <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
              <div className="bg-gradient-to-r from-gray-800 to-gray-750 px-6 py-4 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white">Datos del Alojamiento</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Completa todos los campos para enviar tu solicitud
                </p>
              </div>
              
              <form onSubmit={onSubmit} className="p-6 space-y-6">
                
                {/* Información Básica */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white border-b border-gray-700 pb-2">Información Básica</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Nombre del Alojamiento *</label>
                      <input 
                        type="text" 
                        required
                        value={form.nombreAlojamiento} 
                        onChange={(e) => onChange('nombreAlojamiento', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ej: Hotel Paradise"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Tipo de Alojamiento *</label>
                      <select 
                        required
                        value={form.tipoAlojamiento} 
                        onChange={(e) => onChange('tipoAlojamiento', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Selecciona...</option>
                        <option value="Hotel">Hotel</option>
                        <option value="Casa">Casa</option>
                        <option value="Hostel">Hostel</option>
                        <option value="Posada">Posada</option>
                        <option value="Apartamento">Apartamento</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Ubicación</label>
                      <input 
                        type="text" 
                        value={form.ubicacion} 
                        onChange={(e) => onChange('ubicacion', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="San Andrés, Providencia, etc."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Dirección</label>
                      <input 
                        type="text" 
                        value={form.direccion} 
                        onChange={(e) => onChange('direccion', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Dirección completa"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-1">Descripción</label>
                      <textarea 
                        value={form.descripcion} 
                        onChange={(e) => onChange('descripcion', e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Describe tu alojamiento, amenidades, ubicación..."
                      />
                    </div>
                  </div>
                </div>

                {/* Capacidad y Camas */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white border-b border-gray-700 pb-2">Capacidad y Camas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Capacidad Máxima</label>
                      <input 
                        type="number" 
                        min="1"
                        value={form.capacidadMaxima ?? ''} 
                        onChange={(e) => onChange('capacidadMaxima', e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nº personas"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Camas Sencillas</label>
                      <input 
                        type="number" 
                        min="0"
                        value={form.camasSencillas ?? ''} 
                        onChange={(e) => onChange('camasSencillas', e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Camas Dobles</label>
                      <input 
                        type="number" 
                        min="0"
                        value={form.camasDobles ?? ''} 
                        onChange={(e) => onChange('camasDobles', e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Camas Queen</label>
                      <input 
                        type="number" 
                        min="0"
                        value={form.camasQueen ?? ''} 
                        onChange={(e) => onChange('camasQueen', e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Camas King</label>
                      <input 
                        type="number" 
                        min="0"
                        value={form.camasKing ?? ''} 
                        onChange={(e) => onChange('camasKing', e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Amenidades */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white border-b border-gray-700 pb-2">Amenidades</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-650">
                      <input 
                        type="checkbox" 
                        checked={form.tieneCocina} 
                        onChange={(e) => onChange('tieneCocina', e.target.checked)}
                        className="w-5 h-5 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500"
                      />
                      <span className="text-white">Tiene cocina</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-650">
                      <input 
                        type="checkbox" 
                        checked={form.incluyeDesayuno} 
                        onChange={(e) => onChange('incluyeDesayuno', e.target.checked)}
                        className="w-5 h-5 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500"
                      />
                      <span className="text-white">Incluye desayuno</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-650">
                      <input 
                        type="checkbox" 
                        checked={form.accesoJacuzzi} 
                        onChange={(e) => onChange('accesoJacuzzi', e.target.checked)}
                        className="w-5 h-5 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500"
                      />
                      <span className="text-white">Acceso a Jacuzzi</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-650">
                      <input 
                        type="checkbox" 
                        checked={form.accesoBar} 
                        onChange={(e) => onChange('accesoBar', e.target.checked)}
                        className="w-5 h-5 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500"
                      />
                      <span className="text-white">Acceso a Bar</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-650">
                      <input 
                        type="checkbox" 
                        checked={form.accesoPiscina} 
                        onChange={(e) => onChange('accesoPiscina', e.target.checked)}
                        className="w-5 h-5 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500"
                      />
                      <span className="text-white">Acceso a piscina</span>
                    </label>
                  </div>
                </div>

                {/* Políticas */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white border-b border-gray-700 pb-2">Políticas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-650">
                      <input 
                        type="checkbox" 
                        checked={form.aceptaBebes} 
                        onChange={(e) => onChange('aceptaBebes', e.target.checked)}
                        className="w-5 h-5 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500"
                      />
                      <span className="text-white">Acepta bebés</span>
                    </label>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Política de bebés</label>
                      <input 
                        type="text" 
                        value={form.politicaBebes} 
                        onChange={(e) => onChange('politicaBebes', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ej: Gratis hasta 2 años"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Mínimo de noches</label>
                      <input 
                        type="number" 
                        min="1"
                        value={form.minimoNoches} 
                        onChange={(e) => onChange('minimoNoches', Number(e.target.value))}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Precios */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white border-b border-gray-700 pb-2">Precios por Huésped</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Moneda</label>
                      <select 
                        value={form.monedaPrecios} 
                        onChange={(e) => onChange('monedaPrecios', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="COP">COP</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>
                    <div></div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Precio 1 persona</label>
                      <input 
                        type="number" 
                        min="0"
                        value={form.precio1 ?? ''} 
                        onChange={(e) => onChange('precio1', e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Precio 2 personas</label>
                      <input 
                        type="number" 
                        min="0"
                        value={form.precio2 ?? ''} 
                        onChange={(e) => onChange('precio2', e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Precio 3 personas</label>
                      <input 
                        type="number" 
                        min="0"
                        value={form.precio3 ?? ''} 
                        onChange={(e) => onChange('precio3', e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Precio 4 personas</label>
                      <input 
                        type="number" 
                        min="0"
                        value={form.precio4 ?? ''} 
                        onChange={(e) => onChange('precio4', e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Contacto */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white border-b border-gray-700 pb-2">Información de Contacto</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Teléfono</label>
                      <input 
                        type="tel" 
                        value={form.telefonoContacto} 
                        onChange={(e) => onChange('telefonoContacto', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+57 300 123 4567"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                      <input 
                        type="email" 
                        value={form.emailContacto} 
                        onChange={(e) => onChange('emailContacto', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="contacto@hotel.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <div className="flex items-center justify-between pt-4">
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Enviando...' : 'Enviar Solicitud'}
                  </button>
                  {result && (
                    <div className={`px-4 py-2 rounded-lg ${result.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {result.success ? '✓ Solicitud enviada correctamente' : '✗ Error al enviar'}
                    </div>
                  )}
                </div>
              </form>
            </div>

            {/* Tips */}
            <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                💡 Consejos para una Aprobación Rápida
              </h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span><strong className="text-white">RNT válido:</strong> Asegúrate de tener tu Registro Nacional de Turismo vigente</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span><strong className="text-white">Fotos de calidad:</strong> Imágenes claras y profesionales aumentan las reservas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span><strong className="text-white">Precios coherentes:</strong> Define correctamente las tarifas según número de huéspedes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span><strong className="text-white">Descripción detallada:</strong> Incluye amenities, ubicación y servicios especiales</span>
                </li>
              </ul>
            </div>

          </div>
        )}

        {/* TAB 2: Estado de Solicitudes */}
        {activeTab === 'status' && (
          <div className="space-y-6">
            
            {/* Info */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <CheckCircle className="text-blue-400" size={24} />
                Mis Solicitudes de Alojamiento
              </h2>
              <p className="text-gray-400">
                Aquí puedes ver el estado de todas tus solicitudes: pendientes, aprobadas y rechazadas.
              </p>
            </div>

            {/* Lista de Solicitudes */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              <div className="bg-gray-750 px-6 py-3 border-b border-gray-700">
                <h3 className="font-bold text-white">Historial de Solicitudes</h3>
              </div>
              <div className="p-6">
                {mySubmissions.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="mx-auto mb-4 text-gray-500" size={48} />
                    <p className="text-gray-400">No tienes solicitudes aún.</p>
                    <button
                      onClick={() => setActiveTab('form')}
                      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                    >
                      Crear primera solicitud
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mySubmissions.map((r: any) => {
                      const fields = r.fields || r;
                      const estado = (fields.estado || fields.Estado || 'pendiente').toLowerCase();
                      
                      let statusBadge = {
                        bg: 'bg-yellow-500/20',
                        text: 'text-yellow-400',
                        label: '⏳ Pendiente'
                      };
                      
                      if (estado === 'approved' || estado === 'aprobado') {
                        statusBadge = {
                          bg: 'bg-green-500/20',
                          text: 'text-green-400',
                          label: '✓ Aprobado'
                        };
                      } else if (estado === 'rejected' || estado === 'rechazado') {
                        statusBadge = {
                          bg: 'bg-red-500/20',
                          text: 'text-red-400',
                          label: '✗ Rechazado'
                        };
                      }
                      
                      return (
                        <div key={r.id || fields.id} className="bg-gray-750 rounded-lg p-4 border border-gray-600">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-bold text-white text-lg">
                                {fields.nombreAlojamiento || fields.Nombre || 'Sin nombre'}
                              </h4>
                              <p className="text-sm text-gray-400 mt-1">
                                Tipo: {fields.tipoAlojamiento || fields.Tipo || '-'}
                              </p>
                              <p className="text-sm text-gray-400">
                                Ubicación: {fields.ubicacion || fields.Ubicacion || '-'}
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
                                Enviado: {fields.createdTime || fields.FechaCreacion || '-'}
                              </p>
                            </div>
                            <span className={`${statusBadge.bg} ${statusBadge.text} px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap`}>
                              {statusBadge.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}

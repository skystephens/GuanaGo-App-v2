import React, { useState, useEffect } from 'react';
import { Home, AlertCircle, CheckCircle, Clock, ChevronRight } from 'lucide-react';

interface PartnerAccommodationsProps {
  onBack?: () => void;
}

export default function PartnerAccommodations({ onBack }: PartnerAccommodationsProps) {
  const [activeTab, setActiveTab] = useState<'form' | 'status'>('form');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar autenticación del socio
    const role = localStorage.getItem('userRole');
    const socioId = localStorage.getItem('socioId');
    
    if (!role || (role !== 'Socio' && role !== 'Aliado' && role !== 'Operador' && role !== 'partner')) {
      console.warn('Usuario no autorizado para ver formulario de alojamientos');
    }
    
    setUserRole(role);
    setIsLoading(false);
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

            {/* Formulario Embed */}
            <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
              <div className="bg-gradient-to-r from-gray-800 to-gray-750 px-6 py-4 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white">Datos del Alojamiento</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Completa todos los campos para enviar tu solicitud
                </p>
              </div>
              
              <div className="bg-white" style={{ minHeight: '700px' }}>
                <iframe 
                  className="w-full" 
                  src="https://airtable.com/embed/appiReH55Qhrbv4Lk/pagLkVPNTpes8TUto/form" 
                  frameBorder={0}
                  width="100%" 
                  height="700" 
                  style={{ 
                    background: 'white', 
                    border: 'none',
                  }}
                  title="Formulario de Alojamientos"
                />
              </div>
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
              <div className="text-center">
                <Clock className="mx-auto mb-4 text-yellow-400" size={48} />
                <h2 className="text-xl font-bold text-white mb-2">
                  Vista de Solicitudes
                </h2>
                <p className="text-gray-400 mb-4">
                  Próximamente podrás ver aquí el estado de todas tus solicitudes de alojamiento:
                  pendientes, aprobadas y rechazadas.
                </p>
                <div className="inline-flex items-center gap-2 bg-blue-900/30 text-blue-300 px-4 py-2 rounded-lg text-sm">
                  <span>🔄</span>
                  <span>Funcionalidad en desarrollo</span>
                </div>
              </div>
            </div>

            {/* Placeholder de tabla futura */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              <div className="bg-gray-750 px-6 py-3 border-b border-gray-700">
                <h3 className="font-bold text-white">Historial de Solicitudes</h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {/* Ejemplo de cómo se verá */}
                  <div className="bg-gray-750 rounded-lg p-4 border border-gray-600 opacity-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-white">Hotel Paradise</h4>
                        <p className="text-sm text-gray-400">Enviado: 15 ene 2026</p>
                      </div>
                      <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold">
                        ✓ Aprobado
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-750 rounded-lg p-4 border border-gray-600 opacity-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-white">Posada Nativa</h4>
                        <p className="text-sm text-gray-400">Enviado: 17 ene 2026</p>
                      </div>
                      <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold">
                        ⏳ Pendiente
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-center text-gray-500 text-sm mt-6 italic">
                  Vista previa - datos reales próximamente
                </p>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}

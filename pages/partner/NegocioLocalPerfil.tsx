import React, { useState, useEffect } from 'react';
import {
  MapPin, Phone, Mail, Globe, Clock, LogOut, Loader2, RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NegocioLocalPerfilProps {
  onLogout: () => void;
  onBack?: () => void;
}

const NegocioLocalPerfil: React.FC<NegocioLocalPerfilProps> = ({ onLogout, onBack }) => {
  const { firebaseUser } = useAuth();
  const [negocio, setNegocio]       = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  const userEmail = firebaseUser?.email || '';
  const userName  = firebaseUser?.displayName || userEmail.split('@')[0] || 'Negocio';

  const load = async () => {
    if (!userEmail) { setLoading(false); return; }
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`/api/directory?email=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      if (data.success && data.data?.length > 0) {
        setNegocio(data.data[0]);
      } else {
        setNegocio(null);
      }
    } catch {
      setError('No se pudo cargar tu ficha. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [userEmail]);

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-28">

      {/* Header */}
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 px-5 pt-10 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-2xl font-black text-white shadow-lg shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-teal-400 font-bold uppercase tracking-widest mb-0.5">Negocio Local</p>
            <h1 className="text-lg font-black truncate">{userName}</h1>
            <p className="text-xs text-gray-500 truncate">{userEmail}</p>
          </div>
          <button
            onClick={load}
            className="ml-auto p-2 hover:bg-gray-700 rounded-lg text-gray-500 shrink-0"
            title="Actualizar"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="px-5 space-y-4 mt-2">
        {/* Estado de carga */}
        {loading && (
          <div className="bg-gray-800 rounded-2xl p-8 flex flex-col items-center gap-3 text-gray-500">
            <Loader2 size={24} className="animate-spin text-teal-400" />
            <p className="text-sm">Cargando tu ficha en GuanaGO...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-red-900/20 border border-red-700 rounded-2xl p-4 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Ficha encontrada */}
        {!loading && !error && negocio && (
          <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
            {negocio.image && (
              <img
                src={negocio.image}
                alt={negocio.name}
                className="w-full h-44 object-cover"
              />
            )}
            <div className="p-5">
              {/* Nombre + estado */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-black text-white leading-tight">{negocio.name}</h2>
                  <p className="text-xs text-teal-400 font-semibold mt-0.5">{negocio.category}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                  (negocio.estado || '').toLowerCase() === 'activo'
                    ? 'bg-emerald-900/50 text-emerald-400'
                    : 'bg-gray-700 text-gray-400'
                }`}>
                  {negocio.estado || 'activo'}
                </span>
              </div>

              {/* Descripción */}
              {negocio.description && (
                <p className="text-sm text-gray-400 mb-5 leading-relaxed">{negocio.description}</p>
              )}

              {/* Datos de contacto */}
              <div className="space-y-2.5 text-sm text-gray-400">
                {negocio.address && (
                  <div className="flex items-start gap-2.5">
                    <MapPin size={14} className="text-teal-400 shrink-0 mt-0.5" />
                    <span>{negocio.address}</span>
                  </div>
                )}
                {negocio.phone && (
                  <div className="flex items-center gap-2.5">
                    <Phone size={14} className="text-teal-400 shrink-0" />
                    <span>{negocio.phone}</span>
                  </div>
                )}
                {negocio.email && (
                  <div className="flex items-center gap-2.5">
                    <Mail size={14} className="text-teal-400 shrink-0" />
                    <span className="truncate">{negocio.email}</span>
                  </div>
                )}
                {negocio.website && (
                  <div className="flex items-center gap-2.5">
                    <Globe size={14} className="text-teal-400 shrink-0" />
                    <a
                      href={negocio.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-teal-400 underline truncate"
                    >
                      {negocio.website}
                    </a>
                  </div>
                )}
                {negocio.hours && (
                  <div className="flex items-center gap-2.5">
                    <Clock size={14} className="text-teal-400 shrink-0" />
                    <span>{negocio.hours}</span>
                  </div>
                )}
              </div>

              {/* Plan / RNT / Rating */}
              {(negocio.plan || negocio.rnt || negocio.rating > 0) && (
                <div className="mt-5 pt-4 border-t border-gray-700 flex gap-6 text-xs">
                  {negocio.plan && (
                    <div>
                      <p className="text-gray-600 uppercase tracking-wide mb-0.5">Plan</p>
                      <p className="text-white font-bold">{negocio.plan}</p>
                    </div>
                  )}
                  {negocio.rnt && (
                    <div>
                      <p className="text-gray-600 uppercase tracking-wide mb-0.5">RNT</p>
                      <p className="text-white font-bold">{negocio.rnt}</p>
                    </div>
                  )}
                  {negocio.rating > 0 && (
                    <div>
                      <p className="text-gray-600 uppercase tracking-wide mb-0.5">Rating</p>
                      <p className="text-yellow-400 font-bold">★ {negocio.rating}</p>
                    </div>
                  )}
                </div>
              )}

              <p className="mt-5 text-[10px] text-gray-600 text-center">
                Para actualizar tu ficha contacta al administrador de GuanaGO
              </p>
            </div>
          </div>
        )}

        {/* Sin ficha */}
        {!loading && !error && !negocio && (
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 text-center">
            <MapPin size={36} className="mx-auto mb-3 text-gray-600" />
            <p className="text-sm font-semibold text-gray-400 mb-2">Tu negocio no está en el directorio</p>
            <p className="text-xs text-gray-600 leading-relaxed">
              Contacta al administrador de GuanaGO para que agregue tu ficha.
              <br />El email de tu cuenta debe coincidir con el registrado.
            </p>
          </div>
        )}

        {/* Cerrar sesión */}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-4 bg-red-900/20 border border-red-800 hover:bg-red-900/40 text-red-400 rounded-xl text-sm font-bold transition-colors"
        >
          <LogOut size={16} /> Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default NegocioLocalPerfil;

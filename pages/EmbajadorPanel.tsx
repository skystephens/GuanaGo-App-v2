import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, ChevronLeft, Share2, Copy, Check, Loader2 } from 'lucide-react';
import { AppRoute } from '../types';
import { useAuth } from '../context/AuthContext';
import { getEmbajador, Embajador } from '../services/dinamicasService';

interface Props {
  onBack: () => void;
  onNavigate: (route: AppRoute, data?: any) => void;
}

const EmbajadorPanel: React.FC<Props> = ({ onBack }) => {
  const { t } = useTranslation();
  const { firebaseUser, userName } = useAuth() as any;

  const [embajador, setEmbajador] = useState<Embajador | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [copied,    setCopied]    = useState(false);

  useEffect(() => {
    if (firebaseUser?.uid) {
      getEmbajador(firebaseUser.uid).then(data => {
        setEmbajador(data);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [firebaseUser]);

  // Código de referido: del perfil Airtable o generado del nombre
  const referCode = embajador?.codigoReferido
    || (userName ? userName.split(' ')[0].toUpperCase().slice(0, 6) + '2026' : 'GUANAGO26');

  const handleCopy = () => {
    navigator.clipboard.writeText(referCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShare = () => {
    const msg = t('ambassador.shareMessage', { code: referCode });
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const NIVELES = [
    { key: 'Bronce', label: t('ambassador.bronze'), rango: '0–4 ref.',  pts: '+50 pts/ref',  emoji: '🥉' },
    { key: 'Plata',  label: t('ambassador.silver'), rango: '5–14 ref.', pts: '+75 pts/ref',  emoji: '🥈' },
    { key: 'Oro',    label: t('ambassador.gold'),   rango: '15+ ref.',  pts: '+100 pts/ref', emoji: '🥇' },
  ];

  const nivelActual = embajador?.nivel || 'Bronce';

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white border-b border-gray-100 px-6 pt-12 pb-4 flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ChevronLeft size={22} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-black text-gray-800">{t('ambassador.title')}</h1>
          <p className="text-xs text-gray-400">Red de embajadores GuanaGO 🌴</p>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 size={32} className="animate-spin text-emerald-500" />
        </div>
      ) : (
        <div className="px-6 pt-6 space-y-5">
          {/* Código de referido */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white">
            <p className="text-sm font-semibold opacity-80 mb-1">{t('ambassador.yourCode')}</p>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-black tracking-widest">{referCode}</span>
              <button
                onClick={handleCopy}
                className="bg-white/20 rounded-xl p-2 hover:bg-white/30 transition-colors"
                title="Copiar código"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
            <button
              onClick={handleShare}
              className="mt-4 w-full bg-white text-emerald-700 font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-50 transition-colors active:scale-95"
            >
              <Share2 size={16} />
              {t('ambassador.shareCode')}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
              <p className="text-2xl font-black text-emerald-600">
                {embajador?.totalReferidos ?? 0}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">{t('ambassador.totalReferrals')}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
              <p className="text-2xl font-black text-blue-500">
                {embajador?.referidosActivos ?? 0}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">{t('ambassador.activeReferrals')}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
              <p className="text-2xl font-black text-amber-500">
                {embajador?.puntos ?? 0}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">{t('points.earned')}</p>
            </div>
          </div>

          {/* Niveles */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="font-black text-gray-700 text-sm">{t('ambassador.level')}: {nivelActual}</h3>
            </div>
            {NIVELES.map((n) => {
              const activo = n.key === nivelActual;
              return (
                <div
                  key={n.key}
                  className={`px-4 py-4 flex items-center gap-4 border-b border-gray-50 last:border-0 ${activo ? 'bg-emerald-50' : ''}`}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl">
                    {n.emoji}
                  </div>
                  <div className="flex-1">
                    <p className={`font-black text-sm ${activo ? 'text-emerald-700' : 'text-gray-500'}`}>{n.label}</p>
                    <p className="text-xs text-gray-400">{n.rango} · {n.pts}</p>
                  </div>
                  {activo && (
                    <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">Actual</span>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-center text-xs text-gray-300">
            {firebaseUser ? `UID: ${firebaseUser.uid.slice(0, 8)}...` : 'Sin sesión'}
          </p>
        </div>
      )}
    </div>
  );
};

export default EmbajadorPanel;

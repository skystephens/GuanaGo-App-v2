import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, ChevronLeft, Zap, Loader2 } from 'lucide-react';
import { AppRoute } from '../types';
import { useAuth } from '../context/AuthContext';
import { getPerfilPuntos, PerfilPuntos } from '../services/dinamicasService';

interface Props {
  onBack: () => void;
  onNavigate: (route: AppRoute, data?: any) => void;
}

const GamificacionTurista: React.FC<Props> = ({ onBack }) => {
  const { t } = useTranslation();
  const { firebaseUser, userName } = useAuth() as any;

  const [perfil,  setPerfil]  = useState<PerfilPuntos>({ puntos: 0, ganados: 0, canjeados: 0, nivel: 'Bronce' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (firebaseUser?.uid) {
      getPerfilPuntos(firebaseUser.uid).then(data => {
        setPerfil(data);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [firebaseUser]);

  const RETOS = [
    { id: 1, titulo: 'Primer Tour',         desc: t('points.booking'),  pts: 100, completado: false, emoji: '🤿' },
    { id: 2, titulo: 'Explorador del Mapa', desc: 'Visita 5 POIs',      pts: 50,  completado: false, emoji: '🗺️' },
    { id: 3, titulo: 'Viajero Social',      desc: 'Comparte en redes',  pts: 25,  completado: false, emoji: '📸' },
    { id: 4, titulo: 'Voto Raizal',         desc: t('points.vote'),     pts: 30,  completado: false, emoji: '🎵' },
    { id: 5, titulo: 'Referido Activo',     desc: t('points.referral'), pts: 50,  completado: false, emoji: '👥' },
  ];

  const TABLA_PUNTOS = [
    { accion: t('points.booking'),   pts: '+100' },
    { accion: t('points.review'),    pts: '+25'  },
    { accion: t('points.referral'),  pts: '+50'  },
    { accion: t('points.vote'),      pts: '+30'  },
    { accion: t('points.challenge'), pts: '+50'  },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white border-b border-gray-100 px-6 pt-12 pb-4 flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ChevronLeft size={22} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-black text-gray-800">{t('nav.challenges')}</h1>
          <p className="text-xs text-gray-400">{t('points.title')} · GuanaGO</p>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 size={32} className="animate-spin text-amber-500" />
        </div>
      ) : (
        <div className="px-6 pt-6 space-y-5">
          {/* Balance de puntos */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl p-6 text-white">
            <p className="text-sm font-semibold opacity-80">
              {userName ? t('home.greeting', { name: userName.split(' ')[0] }) : t('points.title')}
            </p>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-5xl font-black">{perfil.puntos.toLocaleString()}</span>
              <span className="text-xl font-bold opacity-70 mb-1">pts</span>
            </div>
            <p className="text-xs opacity-70 mt-1">{t('ambassador.level')}: <strong>{perfil.nivel}</strong></p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-white/20 rounded-xl p-3 text-center">
                <p className="text-xl font-black">{perfil.ganados.toLocaleString()}</p>
                <p className="text-[10px] opacity-80">{t('points.earned')}</p>
              </div>
              <div className="bg-white/20 rounded-xl p-3 text-center">
                <p className="text-xl font-black">{perfil.canjeados.toLocaleString()}</p>
                <p className="text-[10px] opacity-80">{t('points.spent')}</p>
              </div>
            </div>
          </div>

          {/* Retos disponibles */}
          <div>
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
              {t('points.earnMore')}
            </h2>
            <div className="space-y-3">
              {RETOS.map((reto) => (
                <div
                  key={reto.id}
                  className={`bg-white rounded-2xl p-4 shadow-sm border flex items-center gap-4
                    ${reto.completado ? 'border-emerald-200 bg-emerald-50' : 'border-gray-100'}`}
                >
                  <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-2xl shrink-0">
                    {reto.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-gray-800 text-sm">{reto.titulo}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{reto.desc}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-amber-600 font-black text-sm">+{reto.pts}</p>
                    <p className="text-[10px] text-gray-400">pts</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabla de puntos */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <Zap size={16} className="text-amber-500" />
              <h3 className="font-black text-gray-700 text-sm">{t('points.earnMore')}</h3>
            </div>
            {TABLA_PUNTOS.map((item) => (
              <div key={item.accion} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0">
                <span className="text-xs text-gray-600">{item.accion}</span>
                <span className="text-xs font-black text-amber-600">{item.pts} pts</span>
              </div>
            ))}
          </div>

          {!firebaseUser && (
            <p className="text-center text-xs text-gray-400 bg-amber-50 rounded-xl p-3">
              Inicia sesión para guardar tus puntos y retos 🏆
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default GamificacionTurista;

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, ChevronLeft, Star, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { AppRoute } from '../types';
import { useAuth } from '../context/AuthContext';
import { getConcursos, getParticipantes, votar, Concurso, Participante } from '../services/dinamicasService';

interface Props {
  onBack: () => void;
  onNavigate: (route: AppRoute, data?: any) => void;
}

const ConcursosResidente: React.FC<Props> = ({ onBack }) => {
  const { t } = useTranslation();
  const { firebaseUser } = useAuth() as any;

  const [concursos,     setConcursos]     = useState<Concurso[]>([]);
  const [selConcurso,   setSelConcurso]   = useState<Concurso | null>(null);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [loadingPart,   setLoadingPart]   = useState(false);
  const [votando,       setVotando]       = useState<string | null>(null);
  const [miVoto,        setMiVoto]        = useState<string | null>(null); // participanteId
  const [mensaje,       setMensaje]       = useState<{tipo: 'ok'|'err', texto: string} | null>(null);

  useEffect(() => {
    getConcursos().then(data => {
      setConcursos(data);
      if (data.length > 0) seleccionarConcurso(data[0]);
      else setLoading(false);
    });

    // Recuperar voto guardado localmente
    const votoLocal = localStorage.getItem('guanago_voto');
    if (votoLocal) setMiVoto(votoLocal);
  }, []);

  const seleccionarConcurso = async (c: Concurso) => {
    setSelConcurso(c);
    setLoadingPart(true);
    setLoading(false);
    const data = await getParticipantes(c.id);
    setParticipantes(data);
    setLoadingPart(false);
  };

  const handleVotar = async (participanteId: string) => {
    if (!firebaseUser) {
      setMensaje({ tipo: 'err', texto: t('auth.contextLogin', { action: t('auth.actionVote') }) });
      return;
    }
    if (miVoto) {
      setMensaje({ tipo: 'err', texto: t('contests.alreadyVoted') });
      return;
    }
    setVotando(participanteId);
    const res = await votar(selConcurso!.id, participanteId, firebaseUser.uid);
    if (res.success) {
      setMiVoto(participanteId);
      localStorage.setItem('guanago_voto', participanteId);
      // Actualizar votos localmente sin refetch
      setParticipantes(prev =>
        prev.map(p => p.id === participanteId ? { ...p, votos: p.votos + 1 } : p)
      );
      const ganador = participantes.find(p => p.id === participanteId);
      setMensaje({ tipo: 'ok', texto: t('contests.votedFor', { name: ganador?.nombre }) });
    } else {
      setMensaje({ tipo: 'err', texto: res.error || t('common.error') });
    }
    setVotando(null);
  };

  const totalVotos = participantes.reduce((s, p) => s + p.votos, 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 pt-12 pb-4 flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ChevronLeft size={22} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-black text-gray-800">{t('contests.title')}</h1>
          <p className="text-xs text-gray-400">{t('contests.oneVote')} · +30 GuanaPoints</p>
        </div>
      </header>

      {/* Mensaje feedback */}
      {mensaje && (
        <div className={`mx-6 mt-4 p-3 rounded-2xl flex items-start gap-2 text-sm font-semibold
          ${mensaje.tipo === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {mensaje.tipo === 'ok'
            ? <CheckCircle size={18} className="shrink-0 mt-0.5" />
            : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
          {mensaje.texto}
          <button onClick={() => setMensaje(null)} className="ml-auto opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      <div className="px-6 pt-6">
        {/* Selector de concursos */}
        {concursos.length > 1 && (
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
            {concursos.map(c => (
              <button
                key={c.id}
                onClick={() => seleccionarConcurso(c)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-black transition-all
                  ${selConcurso?.id === c.id ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
              >
                {c.nombre}
              </button>
            ))}
          </div>
        )}

        {/* Info del concurso activo */}
        {selConcurso && (
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-5 text-white mb-5">
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-bold">
              {selConcurso.categoria}
            </span>
            <h2 className="text-lg font-black mt-2">{selConcurso.nombre}</h2>
            <p className="text-xs opacity-80 mt-1">{selConcurso.descripcion}</p>
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs opacity-70">{totalVotos} {t('contests.totalVotes')}</p>
              {selConcurso.fechaFin && (
                <p className="text-xs opacity-70">{t('contests.endsOn', { date: selConcurso.fechaFin })}</p>
              )}
            </div>
          </div>
        )}

        {/* Loading inicial */}
        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 size={32} className="animate-spin text-emerald-500" />
          </div>
        )}

        {/* Sin concursos */}
        {!loading && concursos.length === 0 && (
          <div className="text-center py-16">
            <Trophy size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400 font-bold">No hay concursos activos</p>
            <p className="text-gray-300 text-sm mt-1">Vuelve pronto 🌴</p>
          </div>
        )}

        {/* Participantes */}
        {loadingPart ? (
          <div className="flex justify-center py-8">
            <Loader2 size={28} className="animate-spin text-emerald-500" />
          </div>
        ) : (
          <div className="space-y-3">
            {participantes.map((p, idx) => {
              const pct = totalVotos > 0 ? Math.round((p.votos / totalVotos) * 100) : 0;
              const esmiVoto = miVoto === p.id;
              return (
                <div
                  key={p.id}
                  className={`bg-white rounded-2xl p-4 shadow-sm border transition-all
                    ${esmiVoto ? 'border-emerald-300 bg-emerald-50' : 'border-gray-100'}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Posición */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0
                      ${idx === 0 ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-gray-800 text-sm">{p.nombre}</h3>
                      {p.descripcion && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{p.descripcion}</p>
                      )}
                      {/* Barra de progreso */}
                      <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">{p.votos} votos · {pct}%</p>
                    </div>
                    {/* Botón votar */}
                    <button
                      onClick={() => handleVotar(p.id)}
                      disabled={!!miVoto || !!votando}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all
                        ${esmiVoto
                          ? 'bg-emerald-600 text-white'
                          : miVoto
                            ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                            : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 active:scale-95'}`}
                    >
                      {votando === p.id
                        ? <Loader2 size={14} className="animate-spin" />
                        : esmiVoto
                          ? <><CheckCircle size={14} /> {t('contests.yourVote')}</>
                          : <><Star size={14} /> {t('contests.vote')}</>
                      }
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConcursosResidente;

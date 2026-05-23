// pages/admin/DashboardAvance.tsx
// Centro 1 — Mesa de Control: dashboard de avance de estrategia en tiempo real.

import React, { useEffect, useState } from 'react';
import {
  TrendingUp, CheckCircle2, Clock, AlertTriangle, Loader2,
  Target, Activity, ArrowLeft,
} from 'lucide-react';
import {
  suscribirIniciativas, calcularMetricas,
  type Iniciativa, type MetricasEstrategia,
} from '../../services/estrategiaService';
import { AppRoute } from '../../types';

const NOMBRE_CENTRO: Record<number, string> = {
  1: 'Mesa de Control',
  2: 'Ecosistema de Aliados',
  3: 'Dinámicas y Embajadores',
  4: 'Operación y Reservas',
  5: 'Plataforma y Desarrollo',
};

const COLOR_CENTRO: Record<number, string> = {
  1: '#0891b2', 2: '#0d9488', 3: '#ea580c', 4: '#059669', 5: '#475569',
};

interface Props {
  onBack: () => void;
  onNavigate: (route: AppRoute) => void;
}

const DashboardAvance: React.FC<Props> = ({ onBack }) => {
  const [iniciativas, setIniciativas] = useState<Iniciativa[]>([]);
  const [metricas, setMetricas] = useState<MetricasEstrategia | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const unsub = suscribirIniciativas(data => {
      setIniciativas(data);
      setMetricas(calcularMetricas(data));
      setCargando(false);
    });
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="font-bold text-sm">Dashboard de Avance</h1>
          <p className="text-[10px] text-gray-500">Centro 1 · Mesa de Control</p>
        </div>
      </header>

      <div className="px-4 py-5 space-y-5 pb-10">
        {cargando ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <Loader2 className="animate-spin mr-2" size={20} />
            Cargando avance…
          </div>
        ) : !metricas || metricas.totalTareas === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Target size={40} className="mb-3 opacity-40" />
            <p className="text-sm">Sin iniciativas registradas todavía.</p>
            <p className="text-xs mt-1 text-gray-600">Migra las tareas de la Torre de Control para ver el avance aquí.</p>
          </div>
        ) : (
          <>
            {/* Barra de avance global */}
            <div className="bg-gradient-to-br from-teal-900 to-teal-700 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs uppercase tracking-widest text-teal-200 font-bold">
                    Avance Global de Estrategia
                  </p>
                  <h2 className="text-4xl font-extrabold mt-1">
                    {metricas.porcentajeAvance}%
                  </h2>
                </div>
                <div className="text-right text-sm">
                  <p className="text-teal-100">
                    {metricas.completadas} de {metricas.totalTareas} tareas
                  </p>
                  {metricas.criticasPendientes > 0 && (
                    <p className="text-orange-300 font-bold mt-1 flex items-center gap-1 justify-end text-xs">
                      <AlertTriangle size={13} />
                      {metricas.criticasPendientes} críticas pendientes
                    </p>
                  )}
                </div>
              </div>
              <div className="h-3 bg-teal-950/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-400 to-emerald-300 rounded-full transition-all duration-700"
                  style={{ width: `${metricas.porcentajeAvance}%` }}
                />
              </div>
            </div>

            {/* Tarjetas de estado */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={<CheckCircle2 size={16} />} label="Completadas" value={metricas.completadas} color="#10b981" />
              <StatCard icon={<Activity size={16} />} label="En progreso" value={metricas.enProgreso} color="#0891b2" />
              <StatCard icon={<Clock size={16} />} label="Pendientes" value={metricas.pendientes} color="#64748b" />
              <StatCard icon={<AlertTriangle size={16} />} label="Bloqueadas" value={metricas.bloqueadas} color="#ef4444" />
            </div>

            {/* Avance por centro */}
            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <TrendingUp size={14} className="text-teal-500" />
                Avance por Centro de Operación
              </h3>
              <div className="space-y-3">
                {([1, 2, 3, 4, 5] as const).map(c => {
                  const data = metricas.avancePorCentro[c];
                  if (!data || data.total === 0) return null;
                  return (
                    <div key={c}>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-semibold text-gray-300">
                          Centro {c} · {NOMBRE_CENTRO[c]}
                        </span>
                        <span className="text-gray-500">
                          {data.completadas}/{data.total} · {data.pct}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${data.pct}%`, background: COLOR_CENTRO[c] }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Iniciativas activas */}
            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                Iniciativas en Curso
              </h3>
              <div className="space-y-2">
                {iniciativas.map(ini => {
                  const total = ini.tareas.length;
                  const comp = ini.tareas.filter(t => t.estado === 'completado').length;
                  const pct = total ? Math.round((comp / total) * 100) : 0;
                  return (
                    <div key={ini.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-gray-800 hover:border-teal-800 transition-colors">
                      <div className="w-1.5 h-10 rounded-full flex-shrink-0"
                        style={{ background: COLOR_CENTRO[ini.centro] }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-200 truncate">{ini.titulo}</p>
                        <p className="text-[11px] text-gray-500">
                          Centro {ini.centro} · {comp}/{total} tareas
                        </p>
                      </div>
                      <span className="text-sm font-bold flex-shrink-0"
                        style={{ color: COLOR_CENTRO[ini.centro] }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  icon: React.ReactNode; label: string; value: number; color: string;
}> = ({ icon, label, value, color }) => (
  <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
    <div className="flex items-center gap-2 mb-2" style={{ color }}>
      {icon}
      <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500">{label}</span>
    </div>
    <p className="text-2xl font-extrabold text-white">{value}</p>
  </div>
);

export default DashboardAvance;

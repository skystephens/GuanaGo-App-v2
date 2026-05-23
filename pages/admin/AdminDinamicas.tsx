// pages/admin/AdminDinamicas.tsx
// Centro 3 — Dinámicas y Embajadores
// 3 pestañas: Concursos · Embajadores · Rutas Raizal
// Lee de Firestore en tiempo real.

import React, { useEffect, useState } from 'react';
import {
  Trophy, Users, Route, Loader2, Plus, Crown,
  Medal, Award, MapPin, Vote, ArrowLeft,
} from 'lucide-react';
import {
  collection, query, onSnapshot, orderBy,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AppRoute } from '../../types';

type Tab = 'concursos' | 'embajadores' | 'rutas';

// ─── Tipos ──────────────────────────────────────────────────────────────────

interface Participante {
  id: string; negocioNombre: string; platoNombre: string;
  fotoPlato: string; votos: number;
}
interface Concurso {
  id: string; nombre: string; categoria: string; estado: string;
  fechaFin: any; imagenPortada: string; totalVotos: number;
  participantes: Participante[];
}
interface Embajador {
  id: string; nombre: string; categoria: 'residente' | 'turista';
  codigoReferido: string; nivel: 'bronce' | 'plata' | 'oro';
  referidosActivos: number; puntosGanados: number;
}
interface RutaZona {
  id: string; nombre: string; zona: string; duracionEstimada: string;
  esPremium: boolean; paradas: any[];
}

interface Props {
  onBack: () => void;
  onNavigate: (route: AppRoute) => void;
}

// ─── Componente principal ───────────────────────────────────────────────────

const AdminDinamicas: React.FC<Props> = ({ onBack }) => {
  const [tab, setTab] = useState<Tab>('concursos');

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-600 to-orange-500 text-white px-5 py-5">
        <button onClick={onBack} className="w-7 h-7 rounded-full bg-black/20 flex items-center justify-center mb-3 hover:bg-black/40">
          <ArrowLeft size={14} />
        </button>
        <p className="text-xs uppercase tracking-widest text-orange-200 font-bold">
          Centro 3 · Super Admin
        </p>
        <h1 className="text-2xl font-extrabold mt-1">Dinámicas y Embajadores</h1>
        <p className="text-sm text-orange-100 mt-1">
          Concursos, embajadores residentes y rutas Raizal por zona
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10">
        <TabButton active={tab === 'concursos'} onClick={() => setTab('concursos')}
          icon={<Trophy size={15} />} label="Concursos" />
        <TabButton active={tab === 'embajadores'} onClick={() => setTab('embajadores')}
          icon={<Users size={15} />} label="Embajadores" />
        <TabButton active={tab === 'rutas'} onClick={() => setTab('rutas')}
          icon={<Route size={15} />} label="Rutas Raizal" />
      </div>

      <div className="p-5">
        {tab === 'concursos'   && <ConcursosPanel />}
        {tab === 'embajadores' && <EmbajadoresPanel />}
        {tab === 'rutas'       && <RutasPanel />}
      </div>
    </div>
  );
};

// ─── Pestaña: Concursos ─────────────────────────────────────────────────────

const ConcursosPanel: React.FC = () => {
  const [concursos, setConcursos] = useState<Concurso[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'concursos'), orderBy('fechaFin', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setConcursos(snap.docs.map(d => ({ id: d.id, ...d.data() } as Concurso)));
      setCargando(false);
    });
    return () => unsub();
  }, []);

  if (cargando) return <Cargando />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider">
          {concursos.length} concurso(s)
        </h2>
        <button className="flex items-center gap-1.5 bg-orange-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-orange-700">
          <Plus size={14} /> Nuevo concurso
        </button>
      </div>

      {concursos.length === 0 && (
        <Vacio icon={<Trophy size={36} />}
          texto="Sin concursos. Crea el primero: Mejor Rondón, Mejor Hamburguesa, Crab Soup." />
      )}

      {concursos.map(c => {
        const ranking = [...c.participantes].sort((a, b) => b.votos - a.votos);
        return (
          <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                    {c.categoria}
                  </span>
                  <h3 className="text-base font-bold text-gray-800 mt-1">{c.nombre}</h3>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-orange-600 font-bold">
                    <Vote size={15} />
                    <span className="text-lg">{c.totalVotos}</span>
                  </div>
                  <span className="text-[10px] text-gray-400">votos totales</span>
                </div>
              </div>
            </div>
            <div className="p-3 space-y-2">
              {ranking.map((p, i) => {
                const pct = c.totalVotos ? Math.round((p.votos / c.totalVotos) * 100) : 0;
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0 ? 'bg-yellow-100 text-yellow-700'
                      : i === 1 ? 'bg-gray-100 text-gray-600'
                      : i === 2 ? 'bg-orange-100 text-orange-700'
                      : 'bg-gray-50 text-gray-400'
                    }`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-700 truncate">
                          {p.platoNombre} · {p.negocioNombre}
                        </span>
                        <span className="text-xs text-gray-400">{p.votos} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Pestaña: Embajadores ───────────────────────────────────────────────────

const EmbajadoresPanel: React.FC = () => {
  const [embajadores, setEmbajadores] = useState<Embajador[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState<'todos' | 'residente' | 'turista'>('todos');

  useEffect(() => {
    const q = query(collection(db, 'embajadores'), orderBy('referidosActivos', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setEmbajadores(snap.docs.map(d => ({ id: d.id, ...d.data() } as Embajador)));
      setCargando(false);
    });
    return () => unsub();
  }, []);

  if (cargando) return <Cargando />;

  const visibles = filtro === 'todos'
    ? embajadores
    : embajadores.filter(e => e.categoria === filtro);

  const nivelIcon = (n: string) =>
    n === 'oro' ? <Crown size={14} className="text-yellow-500" />
    : n === 'plata' ? <Medal size={14} className="text-gray-400" />
    : <Award size={14} className="text-orange-600" />;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['todos', 'residente', 'turista'] as const).map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg capitalize ${
              filtro === f ? 'bg-orange-600 text-white' : 'bg-white text-gray-500 border border-gray-200'
            }`}>
            {f === 'todos' ? 'Todos' : f + 's'}
          </button>
        ))}
      </div>

      {visibles.length === 0 && (
        <Vacio icon={<Users size={36} />} texto="Sin embajadores en esta categoría todavía." />
      )}

      {visibles.map((e, i) => (
        <div key={e.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <span className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-400">
            {i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-800 truncate">{e.nombre}</span>
              {nivelIcon(e.nivel)}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                e.categoria === 'residente' ? 'bg-teal-50 text-teal-700' : 'bg-blue-50 text-blue-700'
              }`}>{e.categoria}</span>
              <span className="text-[10px] text-gray-400 font-mono">{e.codigoReferido}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-gray-800">{e.referidosActivos}</p>
            <p className="text-[10px] text-gray-400">referidos</p>
          </div>
          <div className="text-right pl-3 border-l border-gray-100">
            <p className="text-sm font-bold text-orange-600">{e.puntosGanados}</p>
            <p className="text-[10px] text-gray-400">GuanaPoints</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Pestaña: Rutas Raizal ──────────────────────────────────────────────────

const ZONA_NOMBRE: Record<string, string> = {
  z1: 'Norte / North End', z2: 'San Luis', z3: 'La Loma / El Cove',
  z4: 'Sur / Punta Sur', z5: 'West View / Cove',
};

const RutasPanel: React.FC = () => {
  const [rutas, setRutas] = useState<RutaZona[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'rutas_zona'));
    const unsub = onSnapshot(q, snap => {
      setRutas(snap.docs.map(d => ({ id: d.id, ...d.data() } as RutaZona)));
      setCargando(false);
    });
    return () => unsub();
  }, []);

  if (cargando) return <Cargando />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider">
          {rutas.length} ruta(s)
        </h2>
        <button className="flex items-center gap-1.5 bg-orange-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-orange-700">
          <Plus size={14} /> Nueva ruta
        </button>
      </div>

      {rutas.length === 0 && (
        <Vacio icon={<Route size={36} />}
          texto="Sin rutas. Crea una ruta Raizal curada para cada zona de la isla." />
      )}

      {rutas.map(r => (
        <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-gray-800">{r.nombre}</h3>
              <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                <MapPin size={11} />
                {ZONA_NOMBRE[r.zona] || r.zona} · {r.duracionEstimada}
              </div>
            </div>
            {r.esPremium && (
              <span className="text-[10px] font-bold uppercase bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                Premium
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-500">
            {r.paradas?.length || 0} paradas en la ruta
          </p>
        </div>
      ))}
    </div>
  );
};

// ─── Subcomponentes compartidos ─────────────────────────────────────────────

const TabButton: React.FC<{
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string;
}> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick}
    className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-colors ${
      active ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50/50' : 'text-gray-400 hover:text-gray-600'
    }`}>
    {icon} {label}
  </button>
);

const Cargando: React.FC = () => (
  <div className="flex items-center justify-center h-48 text-gray-400">
    <Loader2 className="animate-spin mr-2" size={18} /> Cargando...
  </div>
);

const Vacio: React.FC<{ icon: React.ReactNode; texto: string }> = ({ icon, texto }) => (
  <div className="flex flex-col items-center justify-center py-12 text-gray-300">
    <div className="mb-3">{icon}</div>
    <p className="text-xs text-gray-400 text-center max-w-xs">{texto}</p>
  </div>
);

export default AdminDinamicas;

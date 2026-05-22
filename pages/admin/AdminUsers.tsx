import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft, Search, RefreshCw, Shield, Users, UserCheck,
  ChevronDown, X, Loader2, AlertCircle, Phone, Calendar,
  Globe, CheckCircle, Clock, XCircle, Edit3, Check,
} from 'lucide-react';
import { AppRoute } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface AdminUsersProps {
  onBack: () => void;
  onNavigate?: (route: AppRoute) => void;
}

interface LeadUser {
  id: string;
  nombre: string;
  email: string;
  role: string;
  estado: string;
  fechaRegistro: string | null;
  ultimaInteraccion: string | null;
  metodoAuth: string;
  firebaseUid: string | null;
  saldo: number;
  telefono: string | null;
  pais: string | null;
  ciudad: string | null;
}

const ROLES = [
  { value: 'Turista',          label: 'Turista',           color: 'text-sky-400',     bg: 'bg-sky-900/40' },
  { value: 'Raizal_Residente', label: 'Raizal/Residente',  color: 'text-teal-400',    bg: 'bg-teal-900/40' },
  { value: 'Aliado',           label: 'Aliado',            color: 'text-orange-400',  bg: 'bg-orange-900/40' },
  { value: 'Operador',         label: 'Operador',          color: 'text-blue-400',    bg: 'bg-blue-900/40' },
  { value: 'Socio',            label: 'Socio',             color: 'text-emerald-400', bg: 'bg-emerald-900/40' },
  { value: 'Artista',          label: 'Artista',           color: 'text-pink-400',    bg: 'bg-pink-900/40' },
  { value: 'Asesor',           label: 'Asesor',            color: 'text-yellow-400',  bg: 'bg-yellow-900/40' },
  { value: 'Admin',            label: 'Admin',             color: 'text-purple-400',  bg: 'bg-purple-900/40' },
  { value: 'Super_Admin',      label: 'Super Admin',       color: 'text-red-400',     bg: 'bg-red-900/40' },
];

function roleMeta(role: string) {
  return ROLES.find(r => r.value === role) || { value: role, label: role, color: 'text-gray-400', bg: 'bg-gray-800' };
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="bg-gray-800 rounded-xl p-3 border border-gray-700 text-center">
      <div className={`text-lg font-bold ${color}`}>{value}</div>
      <div className="text-[10px] text-gray-500 uppercase font-bold mt-0.5">{label}</div>
    </div>
  );
}

const AdminUsers: React.FC<AdminUsersProps> = ({ onBack }) => {
  const { firebaseUser } = useAuth();
  const [users, setUsers] = useState<LeadUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [selected, setSelected] = useState<LeadUser | null>(null);
  const [editRole, setEditRole] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getToken = useCallback(async () => {
    if (!firebaseUser) return null;
    return firebaseUser.getIdToken();
  }, [firebaseUser]);

  const load = useCallback(async (searchVal = '', roleVal = '') => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Sin sesión activa');
      const params = new URLSearchParams({ pageSize: '200' });
      if (searchVal) params.set('search', searchVal.toLowerCase());
      if (roleVal)   params.set('role', roleVal);
      const res = await fetch(`/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Error del servidor');
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => load(val, filterRole), 400);
  };

  const handleFilterRole = (val: string) => {
    setFilterRole(val);
    load(search, val);
  };

  const handleRoleChange = async (user: LeadUser, newRole: string) => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/users/${user.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: newRole, firebaseUid: user.firebaseUid }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
      setSelected(prev => prev ? { ...prev, role: newRole } : null);
      setSaveMsg(`Rol actualizado a ${roleMeta(newRole).label}`);
      setEditRole(false);
      setTimeout(() => setSaveMsg(null), 3000);
    } catch (err: any) {
      setSaveMsg(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Stats
  const total = users.length;
  const admins = users.filter(u => ['Super_Admin', 'Admin', 'Asesor'].includes(u.role)).length;
  const partners = users.filter(u => ['Aliado', 'Operador', 'Socio', 'Artista'].includes(u.role)).length;
  const tourists = users.filter(u => u.role === 'Turista' || u.role === 'Raizal_Residente').length;

  return (
    <div className="bg-gray-900 min-h-screen text-white pb-24 font-sans">

      {/* Header */}
      <header className="sticky top-0 z-20 bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold leading-tight">Gestión de Usuarios</h1>
          <p className="text-[11px] text-gray-500">Base: Leads · Airtable</p>
        </div>
        <button
          onClick={() => load(search, filterRole)}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      <div className="px-4 pt-4 space-y-4">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          <StatCard label="Total" value={total} color="text-white" />
          <StatCard label="Turistas" value={tourists} color="text-sky-400" />
          <StatCard label="Partners" value={partners} color="text-emerald-400" />
          <StatCard label="Admin" value={admins} color="text-red-400" />
        </div>

        {/* Search + filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Buscar por nombre o email..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="relative">
            <select
              value={filterRole}
              onChange={e => handleFilterRole(e.target.value)}
              className="appearance-none bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm pr-8 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Todos los roles</option>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-800 rounded-xl text-sm text-red-400">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && users.length === 0 && (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-xl p-4 border border-gray-700 animate-pulse h-16" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && users.length === 0 && (
          <div className="text-center py-14 text-gray-500">
            <Users size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No se encontraron usuarios</p>
          </div>
        )}

        {/* User list */}
        <div className="space-y-2">
          {users.map(user => {
            const rm = roleMeta(user.role);
            return (
              <button
                key={user.id}
                onClick={() => { setSelected(user); setEditRole(false); setSaveMsg(null); }}
                className="w-full bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-gray-600 rounded-xl p-3.5 flex items-center gap-3 text-left transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-300 shrink-0 uppercase">
                  {user.nombre?.[0] || user.email?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{user.nombre || '(sin nombre)'}</p>
                  <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rm.bg} ${rm.color}`}>
                    {rm.label}
                  </span>
                  <span className="text-[10px] text-gray-600">{fmtDate(user.fechaRegistro)}</span>
                </div>
              </button>
            );
          })}
        </div>

        {users.length > 0 && (
          <p className="text-center text-xs text-gray-600 pb-2">{users.length} usuarios cargados</p>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-900 w-full max-w-md rounded-2xl border border-gray-700 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

            {/* Modal header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-base font-bold text-white uppercase shrink-0">
                {selected.nombre?.[0] || selected.email?.[0] || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm leading-tight truncate">{selected.nombre || '(sin nombre)'}</p>
                <p className="text-[11px] text-gray-500 truncate">{selected.email}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto p-4 space-y-4">

              {/* Save msg */}
              {saveMsg && (
                <div className={`flex items-center gap-2 p-2.5 rounded-xl text-sm font-bold ${
                  saveMsg.startsWith('Error') ? 'bg-red-900/40 text-red-400 border border-red-800' : 'bg-emerald-900/40 text-emerald-400 border border-emerald-800'
                }`}>
                  {saveMsg.startsWith('Error') ? <AlertCircle size={14} /> : <Check size={14} />}
                  {saveMsg}
                </div>
              )}

              {/* Rol actual + editar */}
              <div className="bg-gray-800 rounded-xl p-3.5 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1"><Shield size={10} /> Rol</span>
                  <button
                    onClick={() => setEditRole(v => !v)}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-bold"
                  >
                    <Edit3 size={11} /> {editRole ? 'Cancelar' : 'Cambiar rol'}
                  </button>
                </div>

                {!editRole ? (
                  <span className={`text-sm font-bold px-2.5 py-1 rounded-lg inline-block ${roleMeta(selected.role).bg} ${roleMeta(selected.role).color}`}>
                    {roleMeta(selected.role).label}
                  </span>
                ) : (
                  <div className="space-y-1.5">
                    {saving && (
                      <div className="flex items-center gap-2 text-xs text-indigo-400">
                        <Loader2 size={12} className="animate-spin" /> Guardando...
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-1.5">
                      {ROLES.map(r => (
                        <button
                          key={r.value}
                          disabled={saving}
                          onClick={() => handleRoleChange(selected, r.value)}
                          className={`py-2 rounded-lg text-xs font-bold border transition-colors disabled:opacity-50 ${
                            selected.role === r.value
                              ? `${r.bg} ${r.color} border-current`
                              : 'bg-gray-700 text-gray-300 border-gray-600 hover:border-gray-500'
                          }`}
                        >
                          {r.value === selected.role && <UserCheck size={11} className="inline mr-1" />}
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-800 rounded-xl p-3 border border-gray-700">
                  <p className="text-gray-500 flex items-center gap-1 mb-1"><Calendar size={10} /> Registro</p>
                  <p className="font-bold">{fmtDate(selected.fechaRegistro)}</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-3 border border-gray-700">
                  <p className="text-gray-500 mb-1">Auth</p>
                  <p className="font-bold">{selected.metodoAuth || '—'}</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-3 border border-gray-700">
                  <p className="text-gray-500 flex items-center gap-1 mb-1"><Globe size={10} /> País</p>
                  <p className="font-bold truncate">{selected.pais || '—'}</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-3 border border-gray-700">
                  <p className="text-gray-500 mb-1">Estado</p>
                  <p className={`font-bold ${selected.estado === 'Activo' ? 'text-green-400' : selected.estado === 'Nuevo' ? 'text-sky-400' : 'text-yellow-400'}`}>
                    {selected.estado}
                  </p>
                </div>
                {selected.telefono && (
                  <div className="bg-gray-800 rounded-xl p-3 border border-gray-700 col-span-2">
                    <p className="text-gray-500 flex items-center gap-1 mb-1"><Phone size={10} /> Teléfono</p>
                    <p className="font-bold">{selected.telefono}</p>
                  </div>
                )}
              </div>

              {/* Firebase UID */}
              {selected.firebaseUid && (
                <div className="bg-gray-800/60 rounded-xl p-3 border border-gray-700/50">
                  <p className="text-[10px] text-gray-600 mb-0.5">Firebase UID</p>
                  <p className="text-[11px] text-gray-500 font-mono break-all">{selected.firebaseUid}</p>
                </div>
              )}

              {!selected.firebaseUid && (
                <div className="flex items-center gap-2 p-2.5 bg-yellow-900/20 border border-yellow-900/40 rounded-xl text-xs text-yellow-500">
                  <Clock size={13} />
                  Usuario legacy — no tiene sesión Firebase aún
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;

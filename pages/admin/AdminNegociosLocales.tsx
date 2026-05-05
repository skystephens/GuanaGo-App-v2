import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, MapPin, Plus, Search, RefreshCw,
  CheckCircle, XCircle, Clock, Edit3, X, Save,
  Building2, Phone, Mail, Globe, FileText, Star,
} from 'lucide-react';
import { AppRoute } from '../../types';

interface AdminNegociosLocalesProps {
  onBack: () => void;
  onNavigate: (route: AppRoute, data?: any) => void;
}

interface Negocio {
  id: string;
  name: string;
  category: string;
  address: string;
  phone: string;
  email: string;
  description: string;
  website: string;
  hours: string;
  estado: string;
  plan: string;
  rnt: string;
  responsable: string;
  rating: number;
  image: string;
  featured: boolean;
}

const ESTADO_BADGE: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  activo:    { label: 'Activo',    bg: 'bg-emerald-900/40', text: 'text-emerald-400', icon: <CheckCircle size={12} /> },
  inactivo:  { label: 'Inactivo',  bg: 'bg-red-900/40',     text: 'text-red-400',     icon: <XCircle size={12} /> },
  pausado:   { label: 'Pausado',   bg: 'bg-yellow-900/40',  text: 'text-yellow-400',  icon: <Clock size={12} /> },
  prospecto: { label: 'Prospecto', bg: 'bg-blue-900/40',    text: 'text-blue-400',    icon: <Clock size={12} /> },
};

const EMPTY_FORM: Omit<Negocio, 'id' | 'rating' | 'image' | 'featured'> = {
  name: '', category: 'General', address: '', phone: '',
  email: '', description: '', website: '', hours: '',
  estado: 'activo', plan: '', rnt: '', responsable: '',
};

const AdminNegociosLocales: React.FC<AdminNegociosLocalesProps> = ({ onBack }) => {
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'activo' | 'inactivo' | 'pausado' | 'prospecto'>('todos');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Negocio | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/directory');
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Error cargando negocios');
      setNegocios(data.data || []);
    } catch (e: any) {
      setError(e.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = negocios.filter(n => {
    const matchSearch = !search || (
      n.name.toLowerCase().includes(search.toLowerCase()) ||
      n.category.toLowerCase().includes(search.toLowerCase()) ||
      n.email?.toLowerCase().includes(search.toLowerCase())
    );
    const matchEstado = filtroEstado === 'todos' || (n.estado?.toLowerCase() === filtroEstado);
    return matchSearch && matchEstado;
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (n: Negocio) => {
    setEditing(n);
    setForm({
      name: n.name, category: n.category, address: n.address,
      phone: n.phone, email: n.email, description: n.description,
      website: n.website, hours: n.hours, estado: n.estado || 'activo',
      plan: n.plan || '', rnt: n.rnt || '', responsable: n.responsable || '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError('El nombre es requerido'); return; }
    setSaving(true);
    setFormError('');
    try {
      const url    = editing ? `/api/directory/${editing.id}` : '/api/directory';
      const method = editing ? 'PATCH' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Error guardando');
      setModalOpen(false);
      await load();
    } catch (e: any) {
      setFormError(e.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const estadoInfo = (estado: string) =>
    ESTADO_BADGE[estado?.toLowerCase()] || ESTADO_BADGE.activo;

  const statCount = (e: string) => negocios.filter(n => (n.estado || 'activo').toLowerCase() === e).length;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-6">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <MapPin size={20} className="text-teal-400" />
            Negocios Locales
          </h1>
          <p className="text-xs text-gray-500">Directorio GuanaGO · Airtable Directorio_Mapa</p>
        </div>
        <button
          onClick={openCreate}
          className="ml-auto flex items-center gap-2 px-3 py-2 bg-teal-600 hover:bg-teal-500 rounded-lg text-sm font-semibold transition-colors"
        >
          <Plus size={16} /> Agregar Negocio
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: negocios.length, color: 'text-white' },
          { label: 'Activos', value: statCount('activo'), color: 'text-emerald-400' },
          { label: 'Inactivos', value: statCount('inactivo'), color: 'text-red-400' },
          { label: 'Prospectos', value: statCount('prospecto'), color: 'text-blue-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-800 rounded-xl p-3 text-center">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, categoría o email..."
            className="w-full pl-8 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-teal-500"
          />
        </div>
        <div className="flex gap-1">
          {(['todos', 'activo', 'inactivo', 'pausado', 'prospecto'] as const).map(e => (
            <button
              key={e}
              onClick={() => setFiltroEstado(e)}
              className={`px-3 py-2 rounded-lg text-xs font-bold capitalize transition-colors ${
                filtroEstado === e ? 'bg-teal-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
        <button onClick={load} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-gray-400" title="Refrescar">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-sm">{error}</div>
      )}

      {/* Tabla */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-500">
          <RefreshCw size={20} className="animate-spin mr-2" /> Cargando desde Airtable...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-600">
          <MapPin size={40} className="mx-auto mb-3 opacity-30" />
          <p>No hay negocios que coincidan con el filtro</p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-left">
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Negocio</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase hidden md:table-cell">Categoría</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase hidden lg:table-cell">Plan</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase hidden lg:table-cell">Contacto</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {filtered.map(n => {
                const badge = estadoInfo(n.estado);
                return (
                  <tr key={n.id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {n.image ? (
                          <img src={n.image} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0">
                            <Building2 size={14} className="text-gray-500" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-white">{n.name}</p>
                          {n.rnt && <p className="text-[10px] text-gray-500">RNT: {n.rnt}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-gray-300">{n.category}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${badge.bg} ${badge.text}`}>
                        {badge.icon} {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-gray-400 text-xs">{n.plan || '—'}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="text-xs text-gray-400 space-y-0.5">
                        {n.phone && <p className="flex items-center gap-1"><Phone size={10} />{n.phone}</p>}
                        {n.email && <p className="flex items-center gap-1"><Mail size={10} />{n.email}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openEdit(n)}
                        className="p-1.5 hover:bg-gray-600 rounded-lg transition-colors text-gray-400 hover:text-white"
                        title="Editar"
                      >
                        <Edit3 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-4 py-2 border-t border-gray-700 text-xs text-gray-600">
            {filtered.length} de {negocios.length} negocios
          </div>
        </div>
      )}

      {/* Modal crear / editar */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-700">
              <h2 className="font-bold text-lg">{editing ? 'Editar Negocio' : 'Agregar Negocio'}</h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-400">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {formError && (
                <p className="text-red-400 text-sm bg-red-900/20 border border-red-700 rounded-lg px-3 py-2">{formError}</p>
              )}

              {[
                { label: 'Nombre *', key: 'name', type: 'text', placeholder: 'Ej: Hotel Decameron' },
                { label: 'Categoría', key: 'category', type: 'text', placeholder: 'Hotel, Restaurante, Tour...' },
                { label: 'Dirección', key: 'address', type: 'text', placeholder: 'San Andrés Isla' },
                { label: 'Teléfono', key: 'phone', type: 'tel', placeholder: '+57...' },
                { label: 'Email', key: 'email', type: 'email', placeholder: 'negocio@email.com' },
                { label: 'Website', key: 'website', type: 'url', placeholder: 'https://...' },
                { label: 'Horario', key: 'hours', type: 'text', placeholder: 'Lun-Dom 8am-10pm' },
                { label: 'RNT', key: 'rnt', type: 'text', placeholder: 'Registro Nacional de Turismo' },
                { label: 'Responsable / Contacto', key: 'responsable', type: 'text', placeholder: 'Nombre del contacto' },
                { label: 'Plan', key: 'plan', type: 'text', placeholder: 'Básico / Premium / Pro...' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">{f.label}</label>
                  <input
                    type={f.type}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal-500"
                  />
                </div>
              ))}

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Estado</label>
                <select
                  value={form.estado}
                  onChange={e => setForm(prev => ({ ...prev, estado: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                  <option value="pausado">Pausado</option>
                  <option value="prospecto">Prospecto</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción del negocio..."
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-700">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:bg-gray-600 rounded-lg text-sm font-bold transition-colors"
              >
                <Save size={16} />
                {saving ? 'Guardando...' : editing ? 'Guardar Cambios' : 'Crear Negocio'}
              </button>
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-semibold transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNegociosLocales;

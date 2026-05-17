
import React, { useState } from 'react';
import { Search, MoreHorizontal, MessageCircle, X, MapPin, Phone, Calendar, Shield, CheckCircle, XCircle, Clock, ShoppingBag, Briefcase, Building, CreditCard, Tag, User as UserIcon, Globe, Star, Award, Zap } from 'lucide-react';
import { PARTNER_CLIENTS, PARTNER_RESERVATIONS } from '../../constants';
import { Client, Reservation } from '../../types';
import ChatWindow from '../../components/ChatWindow';

type MainTab = 'turistas' | 'raizal' | 'embajadores' | 'establecimientos';

const TAB_CONFIG: { id: MainTab; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'turistas',        label: 'Turistas',            icon: <Globe size={13} />,  color: '#38BDF8' },
  { id: 'raizal',          label: 'Raizal & Residentes', icon: <Award size={13} />,  color: '#00E5CC' },
  { id: 'embajadores',     label: 'Embajadores',         icon: <Star size={13} />,   color: '#FFB74D' },
  { id: 'establecimientos',label: 'Establecimientos',    icon: <Building size={13} />,color: '#A78BFA' },
];

const AMBASSADOR_LEVELS = ['L1 Explorador', 'L2 Conector', 'L3 Guardián', 'L4 Elite'];

// Mock ambassadors for display — in production these come from Airtable Embajadores
const MOCK_AMBASSADORS = [
  { id: 'emb1', name: 'Carlos Archbold',    tipo: 'Raizal',         nivel: 'L3 Guardián',    referidos: 12, comision: 378000, estado: 'Activo',    phone: '+57 313 000 0001' },
  { id: 'emb2', name: 'María O\'Neill',     tipo: 'Residente OCCRE', nivel: 'L2 Conector',   referidos: 5,  comision: 105000, estado: 'Activo',    phone: '+57 313 000 0002' },
  { id: 'emb3', name: 'Jimmy Forbes',       tipo: 'Freelancer',     nivel: 'L4 Elite',       referidos: 22, comision: 960000, estado: 'Activo',    phone: '+57 313 000 0003' },
  { id: 'emb4', name: 'Rosita Livingston',  tipo: 'Raizal',         nivel: 'L1 Explorador',  referidos: 2,  comision: 30000,  estado: 'Pendiente', phone: '+57 313 000 0004' },
];

const AdminUsers: React.FC = () => {
  const [tab, setTab] = useState<MainTab>('turistas');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChatUser, setSelectedChatUser] = useState<Client | null>(null);
  const [selectedUser, setSelectedUser] = useState<Client | null>(null);
  const [users, setUsers] = useState<Client[]>(PARTNER_CLIENTS);

  // Filter helpers per tab
  const tourists = users.filter(u => u.role === 'tourist' || (!u.role));
  const establecimientos = users.filter(u => u.role === 'partner' || u.status === 'pending');

  const applySearch = <T extends { name: string }>(list: T[]) =>
    searchQuery ? list.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase())) : list;

  const getRoleBadge = (role: string) => {
    if (role === 'admin') return <span className="bg-purple-900/50 text-purple-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Admin</span>;
    if (role === 'partner') return <span className="bg-blue-900/50 text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Operador</span>;
    return <span className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Turista</span>;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') return <span className="text-green-500 flex items-center gap-1 text-xs font-bold"><CheckCircle size={12}/> Activo</span>;
    if (status === 'pending') return <span className="text-yellow-500 flex items-center gap-1 text-xs font-bold"><Clock size={12}/> Pendiente</span>;
    return <span className="text-red-500 flex items-center gap-1 text-xs font-bold"><XCircle size={12}/> Suspendido</span>;
  };

  const handleApproveUser = (userId: string) => {
    if (window.confirm('¿Aprobar a este operador? Se le notificará por email.')) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'active' } : u));
      setSelectedUser(prev => prev ? { ...prev, status: 'active' } : null);
    }
  };

  const getUserHistory = (userId: string, userName: string) =>
    PARTNER_RESERVATIONS.filter(r => r.clientName === userName);

  const getLevelColor = (nivel: string) => {
    if (nivel.includes('L4')) return '#A78BFA';
    if (nivel.includes('L3')) return '#FFB74D';
    if (nivel.includes('L2')) return '#00E5CC';
    return '#6B8A9E';
  };

  const getTipoColor = (tipo: string) => {
    if (tipo === 'Raizal') return { bg: 'rgba(255,183,77,.12)', color: '#FFB74D', border: 'rgba(255,183,77,.25)' };
    if (tipo === 'Freelancer') return { bg: 'rgba(167,139,250,.12)', color: '#A78BFA', border: 'rgba(167,139,250,.25)' };
    return { bg: 'rgba(0,229,204,.1)', color: '#00E5CC', border: 'rgba(0,229,204,.2)' };
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white pb-24 font-sans relative">
      <header className="px-6 pt-12 pb-4 bg-gray-900 sticky top-0 z-10">
        <h1 className="text-xl font-bold mb-4">Gestión de Usuarios</h1>
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-gray-800 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none border border-gray-700 focus:border-green-500"
          />
        </div>

        {/* Main Tabs */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {TAB_CONFIG.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={tab === t.id ? { background: `${t.color}20`, color: t.color, borderColor: `${t.color}40` } : {}}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap border transition-all ${
                tab === t.id ? 'border' : 'bg-gray-800 text-gray-400 border-gray-700'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-6 space-y-3 mt-2">

        {/* ── TURISTAS ── */}
        {tab === 'turistas' && (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-gray-800 rounded-xl p-3 text-center border border-gray-700">
                <div className="text-lg font-bold text-sky-400">{tourists.length}</div>
                <div className="text-[10px] text-gray-500 uppercase font-bold mt-0.5">Turistas</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-3 text-center border border-gray-700">
                <div className="text-lg font-bold text-green-400">{tourists.filter(u => u.status === 'active').length}</div>
                <div className="text-[10px] text-gray-500 uppercase font-bold mt-0.5">Activos</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-3 text-center border border-gray-700">
                <div className="text-lg font-bold text-purple-400">0</div>
                <div className="text-[10px] text-gray-500 uppercase font-bold mt-0.5">GuanaPoints</div>
              </div>
            </div>

            {applySearch(tourists).length === 0 && (
              <div className="text-center py-10 text-gray-500">No hay turistas registrados.</div>
            )}
            {applySearch(tourists).map(user => (
              <div
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex items-center justify-between cursor-pointer hover:bg-gray-750 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img src={user.image} alt={user.name} className="w-11 h-11 rounded-full object-cover border-2 border-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{user.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{user.city}, {user.country}</span>
                      {getStatusBadge(user.status)}
                    </div>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-white p-2"><MoreHorizontal size={18} /></button>
              </div>
            ))}
          </>
        )}

        {/* ── RAIZAL & RESIDENTES ── */}
        {tab === 'raizal' && (
          <>
            <div className="bg-gray-800/60 rounded-2xl border border-teal-900/40 p-4 mb-4">
              <div className="text-xs font-bold text-teal-400 uppercase tracking-widest mb-2">Acerca de este segmento</div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Personas que viven en San Andrés y Providencia — ya sea con ancestros raizales o con OCCRE. Son el canal de distribución más potente del ecosistema GuanaGO. Se gestionan desde la tabla <span className="text-teal-400 font-bold">Embajadores</span> en Airtable.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-gray-800 rounded-xl p-3 border border-gray-700">
                <div className="text-[10px] text-yellow-500 uppercase font-bold mb-1">🤎 Raizal ancestral</div>
                <p className="text-xs text-gray-400">Reconocimiento cultural + cupones en negocios raizales. Badge "Raizal Auténtico" desde el día 1.</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-3 border border-gray-700">
                <div className="text-[10px] text-teal-400 uppercase font-bold mb-1">🏘️ Residente OCCRE</div>
                <p className="text-xs text-gray-400">Ingreso extra fácil + descuentos en servicios que ya usa. Link de WhatsApp como herramienta natural.</p>
              </div>
            </div>

            <div className="text-center py-10">
              <div className="text-4xl mb-3">🏝️</div>
              <p className="text-gray-400 text-sm font-bold mb-1">Módulo en construcción</p>
              <p className="text-gray-500 text-xs">Los raizales y residentes se gestionarán desde<br/>la tabla Embajadores en Airtable una vez creada.</p>
              <a
                href="https://airtable.com"
                target="_blank"
                rel="noreferrer"
                className="inline-block mt-4 px-4 py-2 rounded-lg bg-teal-900/30 border border-teal-800/50 text-teal-400 text-xs font-bold"
              >
                Ir a Airtable → Crear tabla Embajadores
              </a>
            </div>
          </>
        )}

        {/* ── EMBAJADORES ── */}
        {tab === 'embajadores' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { label: 'Total', value: MOCK_AMBASSADORS.length, color: 'text-amber-400' },
                { label: 'Activos', value: MOCK_AMBASSADORS.filter(e => e.estado === 'Activo').length, color: 'text-green-400' },
                { label: 'Referidos/mes', value: MOCK_AMBASSADORS.reduce((a, e) => a + (e.estado === 'Activo' ? e.referidos : 0), 0), color: 'text-teal-400' },
                { label: 'Comisión COP', value: '1.47M', color: 'text-purple-400' },
              ].map(s => (
                <div key={s.label} className="bg-gray-800 rounded-xl p-3 text-center border border-gray-700">
                  <div className={`text-base font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] text-gray-500 uppercase font-bold mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Level filter */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3">
              <span className="text-[10px] text-gray-500 uppercase font-bold self-center flex-shrink-0">Nivel:</span>
              {['Todos', ...AMBASSADOR_LEVELS].map(lvl => (
                <button key={lvl} className="px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap bg-gray-800 text-gray-400 border border-gray-700 hover:border-amber-700 hover:text-amber-400 transition-colors">
                  {lvl}
                </button>
              ))}
            </div>

            {applySearch(MOCK_AMBASSADORS).map(emb => {
              const tc = getTipoColor(emb.tipo);
              const lvlColor = getLevelColor(emb.nivel);
              return (
                <div key={emb.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: tc.bg, border: `2px solid ${tc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                        {emb.tipo === 'Raizal' ? '🤎' : emb.tipo === 'Freelancer' ? '🎯' : '🏘️'}
                      </div>
                      <div>
                        <div className="font-bold text-sm">{emb.name}</div>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: tc.bg, color: tc.color, border: `1px solid ${tc.border}` }}>
                          {emb.tipo}
                        </span>
                      </div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 100, background: `${lvlColor}18`, color: lvlColor, border: `1px solid ${lvlColor}40` }}>
                      {emb.nivel}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-gray-700/50 rounded-lg p-2">
                      <div className="text-sm font-bold text-teal-400">{emb.referidos}</div>
                      <div className="text-[10px] text-gray-500">Referidos</div>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg p-2">
                      <div className="text-sm font-bold text-green-400">${(emb.comision / 1000).toFixed(0)}K</div>
                      <div className="text-[10px] text-gray-500">Comisión COP</div>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg p-2">
                      <div className={`text-sm font-bold ${emb.estado === 'Activo' ? 'text-green-400' : 'text-yellow-400'}`}>{emb.estado}</div>
                      <div className="text-[10px] text-gray-500">Estado</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button className="flex-1 py-1.5 rounded-lg bg-gray-700 text-xs text-gray-300 font-bold border border-gray-600 hover:bg-gray-600 transition-colors">
                      Ver perfil
                    </button>
                    <button className="py-1.5 px-3 rounded-lg bg-gray-700 text-xs text-amber-400 font-bold border border-gray-600 hover:bg-gray-600 transition-colors">
                      <Zap size={12} />
                    </button>
                  </div>
                </div>
              );
            })}

            <div className="mt-4 p-4 rounded-xl bg-amber-900/10 border border-amber-900/30 text-xs text-amber-400 font-bold text-center">
              Datos de ejemplo — conectar con tabla Embajadores en Airtable
            </div>
          </>
        )}

        {/* ── ESTABLECIMIENTOS ── */}
        {tab === 'establecimientos' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-gray-800 rounded-xl p-3 text-center border border-gray-700">
                <div className="text-lg font-bold text-purple-400">{establecimientos.length}</div>
                <div className="text-[10px] text-gray-500 uppercase font-bold mt-0.5">Total</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-3 text-center border border-gray-700">
                <div className="text-lg font-bold text-green-400">{establecimientos.filter(u => u.status === 'active').length}</div>
                <div className="text-[10px] text-gray-500 uppercase font-bold mt-0.5">Activos</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-3 text-center border border-gray-700">
                <div className="text-lg font-bold text-yellow-400">{establecimientos.filter(u => u.status === 'pending').length}</div>
                <div className="text-[10px] text-gray-500 uppercase font-bold mt-0.5">Pendientes</div>
              </div>
            </div>

            {establecimientos.filter(u => u.status === 'pending').length > 0 && (
              <div className="bg-yellow-900/15 border border-yellow-800/40 rounded-xl p-3 mb-3 flex items-center gap-2 text-xs text-yellow-400 font-bold">
                <Clock size={14} />
                {establecimientos.filter(u => u.status === 'pending').length} establecimiento(s) pendiente(s) de aprobación
              </div>
            )}

            {applySearch(establecimientos).length === 0 && (
              <div className="text-center py-10 text-gray-500">No hay establecimientos registrados.</div>
            )}
            {applySearch(establecimientos).map(user => (
              <div
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex items-center justify-between cursor-pointer hover:bg-gray-750 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img src={user.image} alt={user.name} className={`w-11 h-11 rounded-full object-cover border-2 ${user.status === 'pending' ? 'border-yellow-500' : 'border-gray-600'}`} />
                    {user.status === 'pending' && (
                      <div className="absolute -top-1 -right-1 bg-yellow-500 text-black text-[10px] font-bold px-1 rounded-full">!</div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{user.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {getRoleBadge(user.role)}
                      {getStatusBadge(user.status)}
                    </div>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-white p-2"><MoreHorizontal size={18} /></button>
              </div>
            ))}
          </>
        )}
      </div>

      {/* USER DETAIL MODAL (for Turistas & Establecimientos) */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in">
          <div className="bg-gray-900 w-full max-w-lg rounded-3xl border border-gray-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-10">
            <div className="relative h-32 bg-gradient-to-r from-gray-800 to-gray-700">
              <button onClick={() => setSelectedUser(null)} className="absolute top-4 right-4 bg-black/20 p-2 rounded-full hover:bg-black/40 transition-colors text-white">
                <X size={20} />
              </button>
              <div className="absolute -bottom-10 left-6">
                <img src={selectedUser.image} alt={selectedUser.name} className="w-20 h-20 rounded-full border-4 border-gray-900 bg-gray-800 object-cover shadow-xl" />
              </div>
            </div>

            <div className="pt-12 px-6 pb-6 overflow-y-auto no-scrollbar">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white leading-none mb-1">{selectedUser.name}</h2>
                  <p className="text-gray-400 text-sm">{selectedUser.email}</p>
                </div>
                <button onClick={() => setSelectedChatUser(selectedUser)} className="bg-gray-800 p-2 rounded-lg text-blue-400 hover:bg-gray-700 shadow-sm">
                  <MessageCircle size={20} />
                </button>
              </div>

              {selectedUser.status === 'pending' && (
                <div className="bg-yellow-900/20 border border-yellow-500/30 p-4 rounded-xl mb-6 flex items-start gap-3">
                  <Clock className="text-yellow-500 shrink-0 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-bold text-yellow-500 text-sm">Solicitud de Afiliación</h3>
                    <p className="text-gray-400 text-xs mt-1 mb-3">Este usuario desea unirse como operador. Valida los datos del negocio a continuación.</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleApproveUser(selectedUser.id)} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors">
                        Aprobar Operador
                      </button>
                      <button className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors border border-gray-700">
                        Rechazar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-800 p-3 rounded-xl border border-gray-700">
                  <span className="text-gray-500 text-[10px] uppercase font-bold flex items-center gap-1 mb-1"><Shield size={10} /> Rol</span>
                  <p className="text-sm font-medium capitalize">{selectedUser.role === 'partner' ? 'Operador' : 'Turista'}</p>
                </div>
                <div className="bg-gray-800 p-3 rounded-xl border border-gray-700">
                  <span className="text-gray-500 text-[10px] uppercase font-bold flex items-center gap-1 mb-1"><Calendar size={10} /> Registro</span>
                  <p className="text-sm font-medium">{selectedUser.joinedDate || 'N/A'}</p>
                </div>
                <div className="bg-gray-800 p-3 rounded-xl border border-gray-700">
                  <span className="text-gray-500 text-[10px] uppercase font-bold flex items-center gap-1 mb-1"><Phone size={10} /> Teléfono</span>
                  <p className="text-sm font-medium">{selectedUser.phone || 'N/A'}</p>
                </div>
                <div className="bg-gray-800 p-3 rounded-xl border border-gray-700">
                  <span className="text-gray-500 text-[10px] uppercase font-bold flex items-center gap-1 mb-1"><Globe size={10} /> Ubicación</span>
                  <p className="text-sm font-medium truncate">{selectedUser.city}, {selectedUser.country}</p>
                </div>
              </div>

              {(selectedUser.role === 'partner' || selectedUser.status === 'pending') && (
                <div className="mb-8">
                  <h3 className="font-bold text-gray-300 text-sm mb-4 flex items-center gap-2">
                    <Briefcase size={18} className="text-emerald-500" /> Información del Negocio
                  </h3>
                  <div className="bg-gray-800/50 rounded-2xl border border-gray-700 overflow-hidden">
                    <div className="grid grid-cols-1 divide-y divide-gray-700">
                      <div className="p-4 flex justify-between items-center">
                        <div className="flex items-center gap-3"><Building size={16} className="text-gray-500" /><span className="text-xs text-gray-400">Razón Social</span></div>
                        <span className="text-sm font-bold text-emerald-400">{selectedUser.name}</span>
                      </div>
                      <div className="p-4 flex justify-between items-center">
                        <div className="flex items-center gap-3"><CreditCard size={16} className="text-gray-500" /><span className="text-xs text-gray-400">NIT / ID Fiscal</span></div>
                        <span className="text-sm font-bold text-gray-200">{selectedUser.documentId || '---'}</span>
                      </div>
                      <div className="p-4 flex justify-between items-center">
                        <div className="flex items-center gap-3"><Tag size={16} className="text-gray-500" /><span className="text-xs text-gray-400">RNT</span></div>
                        <span className="text-sm font-bold text-gray-200">{selectedUser.rnt || 'No suministrado'}</span>
                      </div>
                      <div className="p-4 flex justify-between items-center">
                        <div className="flex items-center gap-3"><UserIcon size={16} className="text-gray-500" /><span className="text-xs text-gray-400">Responsable</span></div>
                        <span className="text-sm font-bold text-gray-200">{selectedUser.responsible || 'N/A'}</span>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-3 mb-2"><MapPin size={16} className="text-gray-500" /><span className="text-xs text-gray-400">Dirección Operativa</span></div>
                        <p className="text-sm font-medium text-gray-300 pl-7">{selectedUser.address || selectedUser.location || 'San Andrés Isla'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <h3 className="font-bold text-gray-300 text-sm mb-3 flex items-center gap-2">
                <ShoppingBag size={16} /> Historial de Actividad
              </h3>
              <div className="space-y-2 mb-8">
                {getUserHistory(selectedUser.id, selectedUser.name).length > 0 ? (
                  getUserHistory(selectedUser.id, selectedUser.name).map((h, i) => (
                    <div key={i} className="bg-gray-800 p-3 rounded-xl flex justify-between items-center text-sm border border-gray-700">
                      <div>
                        <p className="font-bold text-gray-200">{h.tourName}</p>
                        <p className="text-xs text-gray-500">{h.date}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        h.status === 'confirmed' ? 'bg-green-900/30 text-green-500' :
                        h.status === 'cancelled' ? 'bg-red-900/30 text-red-500' : 'bg-gray-700 text-gray-400'
                      }`}>
                        {h.status === 'confirmed' ? 'Confirmado' : h.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-gray-800/50 rounded-xl text-center text-xs text-gray-500 italic">
                    No hay historial de reservas visible.
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button className="flex-1 py-3 rounded-xl bg-gray-800 border border-gray-700 text-gray-300 font-bold text-sm hover:bg-gray-700 transition-colors">
                  Editar Perfil
                </button>
                <button className="flex-1 py-3 rounded-xl border border-red-900/50 text-red-500 font-bold text-sm hover:bg-red-900/20 transition-colors">
                  Suspender
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedChatUser && (
        <ChatWindow
          currentUserRole="admin"
          currentUserId="admin"
          targetUser={selectedChatUser}
          onClose={() => setSelectedChatUser(null)}
        />
      )}
    </div>
  );
};

export default AdminUsers;

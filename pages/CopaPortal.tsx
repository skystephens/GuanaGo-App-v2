/**
 * CopaPortal — Portal público del Coordinador de delegación.
 * Acceso solo por código (?copa=CODIGO). Solo lectura — sin login.
 *
 * Estilo visual calcado de PublicQuotePage.tsx (misma marca que las
 * cotizaciones) a pedido de Sky. 8 pasos en este orden:
 * Bienvenida → Quiénes somos → Cotización → Alimentos → Traslados →
 * Pago → Atención de consultas → Tu grupo
 */

import React, { useEffect, useState } from 'react';
import { Loader2, MessageCircle, RefreshCw, ChevronLeft, ChevronRight, Check, Utensils, Bus, HelpCircle, Users, Sparkles, Menu, X, LogOut, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { GUANA_LOGO } from '../constants';
import { useAuth } from '../context/AuthContext';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';

const API = typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
const cop = (n: number) => `$${Math.round(n || 0).toLocaleString('es-CO')}`;
const wa = 'https://wa.me/573153836043';

interface Snapshot {
  actualizado: string;
  evento: string;
  delegacion: { club: string; ciudad: string; lider: string; meta: number; inn: string; out: string };
  pax: number; noches: number; inscritos: number; completos: number; abonados: number;
  total: number; abono: number; saldo: number;
  servicios: { id: string; titulo: string; detalle: string; valor: number; origen?: string }[];
  personas: { nombre: string; doc: string; rol: string; sub: string; datos: boolean; pago: string }[];
  cotizacionesRelacionadas?: { id: string; nombre: string; estado: string; total: number }[];
}
interface HotelDisp { id: string; nombre: string; tipo: string; precioNoche: number; imagen: string; descripcion: string; habitacionesDisponibles: number; capacidadEstimada: number }

const PASOS = ['Bienvenida', 'Quiénes somos', 'Cotización', 'Alimentos', 'Traslados', 'Pago', 'Consultas', 'Tu grupo'];

const CopaPortal: React.FC = () => {
  const { userProfile, isAuthenticated, logout } = useAuth();
  const esClubAutenticado = isAuthenticated && userProfile?.role === 'ClubDeportivo' && !!userProfile?.telefono;

  const [codigo, setCodigo] = useState('');
  const [data, setData] = useState<Snapshot | null>(null);
  const [hoteles, setHoteles] = useState<HotelDisp[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paso, setPaso] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Login inline (sin salir de esta pantalla)
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const c = params.get('copa');
    if (c) { setCodigo(c); buscar(c); }
  }, []);

  // Si ya hay sesión de Club Deportivo (de una visita anterior o de Mis
  // Cotizaciones), busca su delegación automáticamente por WhatsApp —
  // sin pedir el código de 6 letras.
  useEffect(() => {
    if (esClubAutenticado && !data) {
      buscarPorTelefono(userProfile!.telefono as string);
    }
  }, [esClubAutenticado]);

  const buscarPorTelefono = async (tel: string) => {
    setLoading(true); setError('');
    try {
      const r = await fetch(`${API}/api/copa/portal-por-telefono/${encodeURIComponent(tel)}`);
      const d = await r.json();
      if (!r.ok) { setError(d.error || 'No se pudo cargar'); setData(null); return; }
      setData(d);
      setPaso(0);
      if (d.pax > 0) {
        fetch(`${API}/api/copa/disponibilidad?pax=${d.pax}`)
          .then(r2 => r2.json())
          .then(d2 => Array.isArray(d2?.hoteles) && setHoteles(d2.hoteles))
          .catch(() => {});
      }
    } catch { setError('No se pudo conectar'); }
    finally { setLoading(false); }
  };

  const handleLoginInline = async () => {
    if (!loginEmail.trim() || !loginPassword) return;
    setLoginLoading(true); setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
      // El useEffect de arriba se encarga de buscar la delegación apenas
      // AuthContext detecte la sesión nueva.
    } catch (err: any) {
      setLoginError(err.code === 'auth/invalid-credential' ? 'Email o contraseña incorrectos' : 'Error al iniciar sesión');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setData(null);
    setSidebarOpen(false);
  };

  const buscar = async (c?: string) => {
    const cod = (c || codigo).trim().toUpperCase();
    if (!cod) return;
    setLoading(true); setError('');
    try {
      const r = await fetch(`${API}/api/copa/portal/${cod}`);
      const d = await r.json();
      if (!r.ok) { setError(d.error || 'No se pudo cargar'); setData(null); return; }
      setData(d);
      setPaso(0);
      if (d.pax > 0) {
        fetch(`${API}/api/copa/disponibilidad?pax=${d.pax}`)
          .then(r2 => r2.json())
          .then(d2 => Array.isArray(d2?.hoteles) && setHoteles(d2.hoteles))
          .catch(() => {});
      }
    } catch { setError('No se pudo conectar'); }
    finally { setLoading(false); }
  };

  const set = (v: number, m: number) => ({ pct: m ? Math.min(100, v / m * 100) : 0, ok: m > 0 && v >= m });

  // ── Pantalla de ingreso de código ────────────────────────────────────────
  if (!data) {
    if (esClubAutenticado && loading) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3 p-5">
          <Loader2 className="animate-spin text-teal-600" size={28} />
          <p className="text-sm text-gray-500">Buscando tu delegación…</p>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-5">
        <a href={`${window.location.origin}${window.location.pathname}`} className="self-center sm:self-start sm:max-w-sm sm:w-full flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-gray-700 mb-3 px-1">
          <ChevronLeft size={16} /> Volver a GuiaSAI
        </a>
        <div className="bg-white rounded-2xl shadow-sm max-w-sm w-full overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-6 text-center">
            <div className="bg-white rounded-2xl w-14 h-14 p-1.5 flex items-center justify-center shadow-md mx-auto mb-2">
              <img src={GUANA_LOGO} alt="GuiaSAI" className="w-full h-full object-contain" />
            </div>
            <p className="text-white font-black text-lg">Portal del Coordinador</p>
            <p className="text-emerald-100 text-xs">Copa de la Isla · GuíaSAI</p>
          </div>
          <div className="p-5">
            {!mostrarLogin ? (
              <>
                <p className="text-sm text-gray-600 mb-3">Ingresa el código de 6 letras que te envió GuíaSAI para ver el avance de tu delegación.</p>
                <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 mb-4 text-xs text-teal-800 leading-relaxed">
                  <b>¿Qué puedes hacer aquí?</b>
                  <ul className="mt-1.5 space-y-1 list-disc list-inside">
                    <li>Ver quiénes están inscritos y con datos completos</li>
                    <li>Ver la cotización, alimentación y traslados de tu delegación</li>
                    <li>Consultar el total, el abono y el saldo restante</li>
                    <li>Escribir directo a GuíaSAI por WhatsApp si algo no cuadra</li>
                  </ul>
                </div>
                <input value={codigo} onChange={e => setCodigo(e.target.value.toUpperCase())} placeholder="EJEMPLO"
                  maxLength={6} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-center font-mono text-lg font-bold tracking-widest mb-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-teal-500" />
                {error && <p className="text-red-500 text-xs font-semibold mb-3">{error}</p>}
                <button onClick={() => buscar()} disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm py-3 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                  {loading ? <Loader2 size={14} className="animate-spin" /> : null} Ver mi delegación
                </button>
                <button onClick={() => { setMostrarLogin(true); setError(''); }} className="w-full text-center text-xs text-teal-600 font-semibold mt-3 hover:underline">
                  ¿Ya tienes cuenta de Club Deportivo? Iniciar sesión
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-3">Inicia sesión con la cuenta de tu club — vas a ver tu delegación directo, sin necesitar el código.</p>
                <div className="space-y-2.5 mb-3">
                  <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5">
                    <Mail size={15} className="text-gray-400" />
                    <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="tu@email.com"
                      className="flex-1 text-sm text-gray-800 placeholder-gray-400 outline-none" />
                  </div>
                  <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5">
                    <Lock size={15} className="text-gray-400" />
                    <input type={verPassword ? 'text' : 'password'} value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleLoginInline(); }} placeholder="Contraseña"
                      className="flex-1 text-sm text-gray-800 placeholder-gray-400 outline-none" />
                    <button onClick={() => setVerPassword(v => !v)} className="text-gray-400">{verPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                  </div>
                </div>
                {loginError && <p className="text-red-500 text-xs font-semibold mb-3">{loginError}</p>}
                <button onClick={handleLoginInline} disabled={loginLoading || !loginEmail.trim() || !loginPassword} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm py-3 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                  {loginLoading ? <Loader2 size={14} className="animate-spin" /> : null} Iniciar sesión
                </button>
                <button onClick={() => { setMostrarLogin(false); setLoginError(''); }} className="w-full text-center text-xs text-gray-500 font-semibold mt-3 hover:underline">
                  ← Volver a ingresar con código
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  const d = data.delegacion;
  const s1 = set(data.inscritos, d.meta), s2 = set(data.completos, data.inscritos), s3 = set(data.abonados, data.inscritos);
  const pctPago = data.inscritos ? data.abonados / data.inscritos : 0;
  const estadoServ = pctPago >= 1 ? { c: 'bg-emerald-50 text-emerald-700', t: 'Confirmado' } : pctPago > 0 ? { c: 'bg-teal-50 text-teal-700', t: 'En trámite' } : { c: 'bg-orange-50 text-orange-700', t: 'Pendiente de abono' };
  const incluyeAlimentacion = data.servicios.some(s => /alimentaci|desayuno|almuerzo|cena/i.test(`${s.titulo} ${s.detalle}`));
  const tieneServicios = data.servicios.length > 0;

  const irA = (n: number) => setPaso(Math.max(0, Math.min(PASOS.length - 1, n)));

  const waLink = (msg: string) => `${wa}?text=${encodeURIComponent(msg)}`;

  const Sidebar = (
    <>
      <div className="p-5 border-b border-gray-100 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl w-10 h-10 p-1.5 flex items-center justify-center shrink-0">
              <img src={GUANA_LOGO} alt="GuiaSAI" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="font-black text-sm text-[#003D5C]">Guía<span className="text-orange-500">SAI</span></p>
              <p className="text-[10px] text-gray-400">Copa de la Isla</p>
            </div>
          </div>
          <p className="text-xs font-bold text-gray-700 mt-3 truncate">{d.club}</p>
          <p className="text-[11px] text-gray-400">{d.ciudad}</p>
        </div>
        <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-gray-600 p-1">
          <X size={20} />
        </button>
      </div>
      <nav className="flex-1 py-3 overflow-y-auto">
        {PASOS.map((label, i) => (
          <button
            key={label}
            onClick={() => { irA(i); setSidebarOpen(false); }}
            className={`w-full text-left px-5 py-2.5 text-sm font-semibold flex items-center gap-2.5 transition-colors ${
              i === paso ? 'bg-teal-50 text-teal-700 border-r-2 border-teal-600' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center shrink-0 ${i === paso ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-400'}`}>{i + 1}</span>
            {label}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-100 space-y-2">
        <a href={waLink(`Hola GuíaSAI, soy ${d.lider} de ${d.club}.`)} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-2.5 rounded-xl transition-colors">
          <MessageCircle size={13} /> WhatsApp GuíaSAI
        </a>
        {esClubAutenticado && (
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-1.5 border border-gray-200 text-gray-500 hover:bg-gray-50 font-bold text-xs py-2.5 rounded-xl transition-colors">
            <LogOut size={13} /> Cerrar sesión
          </button>
        )}
        <a href={`${window.location.origin}${window.location.pathname}`} className="w-full flex items-center justify-center gap-1.5 text-gray-400 hover:text-gray-600 font-semibold text-xs py-2">
          <ChevronLeft size={13} /> Volver a GuiaSAI
        </a>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-10 md:flex">

      {/* Sidebar — cajón deslizante en móvil, fija en escritorio (md+) */}
      <div className="hidden md:flex md:flex-col md:w-64 md:shrink-0 bg-white border-r border-gray-100 md:sticky md:top-0 md:h-screen">
        {Sidebar}
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="w-72 bg-white h-full flex flex-col shadow-xl animate-in slide-in-from-left">
            {Sidebar}
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      <div className="flex-1 min-w-0">
      {/* Header brand — igual a la cotización pública */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-5 py-5 pb-8">
        <div className="max-w-2xl lg:max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-1 justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white rounded-2xl w-14 h-14 p-1.5 flex items-center justify-center shadow-md shrink-0">
                <img src={GUANA_LOGO} alt="GuiaSAI" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight">Guía<span className="text-orange-300">SAI</span></span>
                <p className="text-emerald-100 text-xs font-semibold">RNT 48674 · Aliado oficial · {data.evento}</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(true)} className="md:hidden bg-white/15 hover:bg-white/25 rounded-xl p-2.5 transition-colors">
              <Menu size={18} />
            </button>
          </div>
          <h1 className="text-xl font-bold mt-2">{d.club}</h1>
          <p className="text-emerald-100 text-sm mt-0.5">{d.ciudad} · {data.pax} viajeros · {d.inn} al {d.out}</p>

          {/* Indicador de pasos */}
          <div className="flex items-center gap-1 mt-4">
            {PASOS.map((label, i) => (
              <button key={label} onClick={() => irA(i)} className="flex-1 flex flex-col items-center gap-1">
                <div className={`w-full h-1.5 rounded-full transition-colors ${i <= paso ? 'bg-orange-400' : 'bg-white/25'}`} />
              </button>
            ))}
          </div>
          <p className="text-[11px] text-emerald-100 mt-1 font-semibold">{paso + 1}. {PASOS[paso]}</p>
        </div>
      </div>

      <div className="max-w-2xl lg:max-w-4xl mx-auto px-4 -mt-4 pb-8 space-y-4">

        {/* ══ 1. BIENVENIDA ══ */}
        {paso === 0 && (
          <>
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h2 className="text-lg font-bold text-[#003D5C] mb-2">¡Bienvenidos, {d.club}! 🏐</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Gracias por confiar en GuíaSAI para su experiencia en la Copa de la Isla. Aquí van a encontrar toda la información de su delegación — desde el estado de su cotización hasta el día a día del torneo.
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h3 className="text-xs font-bold text-teal-600 uppercase tracking-wide mb-3">Resumen de tu delegación</h3>
              <div className="grid grid-cols-3 gap-2">
                {[['Inscritos', data.inscritos, d.meta, s1], ['Datos completos', data.completos, data.inscritos, s2], ['Con abono', data.abonados, data.inscritos, s3]].map(([label, v, m, s]: any) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-2.5">
                    <p className="text-[8.5px] uppercase tracking-wide text-gray-400 font-semibold mb-1">{label}</p>
                    <p className="text-lg font-black" style={{ color: s.ok ? '#059669' : '#003D5C' }}>{v}<span className="text-[10px] text-gray-400 font-semibold"> /{m}</span></p>
                    <div className="h-1 bg-gray-200 mt-1.5 rounded-full overflow-hidden"><div className="h-full transition-all" style={{ width: `${s.pct}%`, background: s.ok ? '#059669' : '#F97316' }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ══ 2. QUIÉNES SOMOS ══ */}
        {paso === 1 && (
          <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
            <h2 className="text-lg font-bold text-[#003D5C]">Quiénes somos</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              <b>GuíaSAI S.A.S.</b> (RNT 48674) es una agencia de turismo <b>local</b>, con más de 10 años en San Andrés Islas, operador logístico oficial de la Copa de la Isla. Trabajamos de la mano con empresarios, clústeres y emprendedores locales del sector turístico — no somos intermediarios externos, somos de aquí.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              Nuestro catálogo atiende tanto a familias de paseo como a <b>equipos deportivos en torneos</b> — sabemos que competir en varias categorías a la vez hace difícil coordinar todo, así que nos encargamos de la <b>porción terrestre</b> completa: traslados desde la llegada (taxistas oficiales del aeropuerto, mini-vans, buses para ida y regreso de cada partido), alojamiento, alimentación, tours, vouchers y elementos de identificación para jugadores y cuerpo técnico.
            </p>
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
              <p className="font-bold text-orange-700 text-sm mb-1">Tú enfócate en el torneo</p>
              <p className="text-[13px] text-orange-600">La mayoría de tours no incluyen transporte terrestre — coordinar eso equipo por equipo, categoría por categoría, es justo lo que te resolvemos, para que tu energía quede en la cancha, no en la logística.</p>
            </div>
            <div className="bg-teal-50 border-l-4 border-teal-400 rounded-r-xl p-4">
              <p className="font-bold text-teal-800 text-sm mb-1">Wi da piipl fram di sii</p>
              <p className="text-[13px] text-teal-700">Tu grupo no se hospeda en la isla: entra a la isla. Cada peso que pagan queda en familias, cocineras, conductores y artesanos raizales.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xl font-black text-[#003D5C]">Kriol</p>
                <p className="text-[11px] text-gray-500">Cultura auténtica raizal</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xl font-black text-[#003D5C]">RNT</p>
                <p className="text-[11px] text-gray-500">48674 — Registro oficial</p>
              </div>
            </div>
            <p className="text-[12px] text-gray-500 leading-relaxed">
              Apoyamos directamente a la comunidad local — familias, cocineras, conductores y artesanos raizales — mientras ofrecemos experiencias auténticas de la cultura Kriol de San Andrés.
            </p>
          </div>
        )}

        {/* ══ 3. COTIZACIÓN ══ */}
        {paso === 2 && (
          <>
            {data.cotizacionesRelacionadas && data.cotizacionesRelacionadas.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <h3 className="text-sm font-bold text-[#003D5C] mb-3">Cotizaciones de tu delegación</h3>
                <div className="space-y-2">
                  {data.cotizacionesRelacionadas.map(c => (
                    <a
                      key={c.id}
                      href={`${window.location.origin}${window.location.pathname}?cot=${c.id}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-between gap-2 bg-gray-50 hover:bg-gray-100 rounded-xl p-3 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-gray-800 truncate">{c.nombre}</p>
                        <p className="text-[11px] text-gray-500">{c.estado} · {cop(c.total)}</p>
                      </div>
                      <span className="text-xs font-bold text-orange-500 shrink-0">Ver completa →</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 pt-5 pb-1"><h2 className="text-lg font-bold text-[#003D5C]">Tu cotización</h2></div>
              {tieneServicios ? (
                <table className="w-full text-xs mt-3">
                  <thead><tr className="text-[9.5px] uppercase text-gray-400 border-b border-gray-100"><th className="text-left px-5 py-2">Servicio</th><th className="text-left px-2 py-2">Detalle</th><th className="text-left px-2 py-2">Estado</th><th className="text-right px-5 py-2">Valor</th></tr></thead>
                  <tbody>{data.servicios.map(s => (
                    <tr key={s.id} className="border-b border-gray-50 last:border-0">
                      <td className="px-5 py-2.5 font-bold text-gray-700">{s.titulo}{s.origen === 'catalogo' && <span className="block text-[9px] text-teal-600 font-normal">Actividad GuiaSAI</span>}</td>
                      <td className="px-2 py-2.5 text-gray-500 text-[11px]">{s.detalle}</td>
                      <td className="px-2 py-2.5"><span className={`text-[10px] px-2 py-0.5 rounded-full ${estadoServ.c}`}>{estadoServ.t}</span></td>
                      <td className="px-5 py-2.5 text-right font-bold text-gray-700">{cop(s.valor)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              ) : <p className="text-center text-sm text-gray-400 py-8">Sin servicios contratados todavía.</p>}
            </div>

            {hoteles.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden p-5">
                <h3 className="text-sm font-bold text-[#003D5C] mb-1">Alojamiento disponible para {data.pax} pax</h3>
                <p className="text-[11px] text-gray-500 mb-3">Hoteles verificados por GuíaSAI con espacio suficiente para las fechas del torneo.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {hoteles.map(h => (
                    <div key={h.id} className="border border-gray-100 rounded-xl overflow-hidden">
                      {h.imagen ? <div className="h-28 bg-cover bg-center" style={{ backgroundImage: `url('${h.imagen}')` }} /> : <div className="h-28 bg-gray-50 flex items-center justify-center text-2xl">🏨</div>}
                      <div className="p-3">
                        <p className="font-bold text-sm text-gray-800">{h.nombre}</p>
                        <p className="text-[10px] text-gray-400 mb-1.5">{h.tipo} · capacidad estimada {h.capacidadEstimada} pax</p>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#003D5C] text-sm">
                            {h.precioNoche > 0 ? <>{cop(h.precioNoche)}<span className="text-[10px] font-normal text-gray-400">/noche</span></> : <span className="text-[11px] text-orange-600 font-bold">Precio bajo pedido</span>}
                          </span>
                          <a href={waLink(`Hola GuíaSAI, soy ${d.lider} de ${d.club}. Quiero cotizar ${h.nombre} para ${data.pax} pax del ${d.inn} al ${d.out}.`)} target="_blank" rel="noopener noreferrer"
                            className="text-[10px] font-bold bg-orange-500 hover:bg-orange-600 text-white px-2.5 py-1.5 rounded-lg transition-colors">
                            Solicitar
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ══ 4. ALIMENTOS ══ */}
        {paso === 3 && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <Utensils size={18} className="text-orange-500" />
              <h2 className="text-lg font-bold text-[#003D5C]">Alimentos</h2>
            </div>
            {incluyeAlimentacion ? (
              <p className="text-sm text-gray-600">Tu alojamiento incluye alimentación según el plan contratado — revisa el detalle en el paso "Cotización".</p>
            ) : (
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                <p className="font-bold text-orange-700 text-sm mb-1">Aún estamos organizando las opciones de alimentación</p>
                <p className="text-[13px] text-orange-600">Tu alojamiento actual no trae comidas incluidas. Estamos armando recomendaciones de restaurantes cerca de donde se van a hospedar y de las canchas — escríbenos y coordinamos según el presupuesto de tu delegación.</p>
              </div>
            )}
            <a href={waLink(`Hola GuíaSAI, somos ${d.club}. Queremos coordinar la alimentación de nuestra delegación durante la Copa de la Isla.`)} target="_blank" rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm py-3 rounded-xl transition-colors">
              <MessageCircle size={14} /> Coordinar alimentación
            </a>
          </div>
        )}

        {/* ══ 5. TRASLADOS ══ */}
        {paso === 4 && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <Bus size={18} className="text-teal-600" />
              <h2 className="text-lg font-bold text-[#003D5C]">Traslados</h2>
            </div>
            <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
              <p className="font-bold text-teal-700 text-sm mb-1">Estamos confirmando horarios exactos</p>
              <p className="text-[13px] text-teal-700">
                Tu delegación tendrá traslado ida y vuelta durante los días del torneo ({d.inn} al {d.out}): aeropuerto ↔ hotel, y hotel ↔ canchas de juego. Los horarios exactos se confirman según su vuelo y el cronograma del torneo.
              </p>
            </div>
            <a href={waLink(`Hola GuíaSAI, somos ${d.club}. Necesitamos confirmar los horarios de traslado para nuestra delegación.`)} target="_blank" rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm py-3 rounded-xl transition-colors">
              <MessageCircle size={14} /> Confirmar horarios de traslado
            </a>
          </div>
        )}

        {/* ══ 6. PAGO ══ */}
        {paso === 5 && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-lg font-bold text-[#003D5C] mb-3">Estado de pago</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-[9.5px] uppercase text-gray-400 font-semibold mb-1">Total del grupo</p><p className="text-xl font-black text-[#003D5C]">{cop(data.total)}</p></div>
              <div className="bg-orange-50 rounded-xl p-3"><p className="text-[9.5px] uppercase text-gray-400 font-semibold mb-1">Abono 30%</p><p className="text-xl font-black text-orange-600">{cop(data.abono)}</p></div>
              <div className="bg-emerald-50 rounded-xl p-3"><p className="text-[9.5px] uppercase text-gray-400 font-semibold mb-1">Saldo restante</p><p className="text-xl font-black text-emerald-600">{cop(data.saldo)}</p></div>
            </div>
            <div className="bg-orange-50 border-l-4 border-orange-400 rounded-r-xl p-3 mt-3 text-[13px]"><b className="text-orange-700">Diciembre se llena de verdad.</b> <span className="text-orange-600">El cupo se bloquea con abono, no con intención.</span></div>
          </div>
        )}

        {/* ══ 7. ATENCIÓN DE CONSULTAS ══ */}
        {paso === 6 && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <HelpCircle size={18} className="text-teal-600" />
              <h2 className="text-lg font-bold text-[#003D5C]">Atención de consultas</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">¿Tienes alguna pregunta sobre tu reserva, el torneo, o algo que no cuadra? Escríbenos directo — te responde el equipo de GuíaSAI.</p>
            <a href={waLink(`Hola GuíaSAI, soy ${d.lider} de ${d.club}. Tengo una consulta sobre nuestra delegación en la Copa de la Isla.`)} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm py-3 rounded-xl transition-colors">
              <MessageCircle size={14} /> Escribir a GuíaSAI por WhatsApp
            </a>
          </div>
        )}

        {/* ══ 8. TU GRUPO ══ */}
        {paso === 7 && (
          <>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 pt-5 pb-1 flex items-center gap-2">
                <Users size={18} className="text-teal-600" />
                <h2 className="text-lg font-bold text-[#003D5C]">Tu grupo · {data.personas.length} personas</h2>
              </div>
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-xs">
                  <thead><tr className="text-[9.5px] uppercase text-gray-400 border-b border-gray-100"><th className="text-left px-5 py-2">Nombre</th><th className="text-left px-2 py-2">Rol</th><th className="text-left px-2 py-2">Datos</th><th className="text-left px-2 py-2">Pago</th></tr></thead>
                  <tbody>{data.personas.map((p, i) => (
                    <tr key={i} className="border-b border-gray-50 last:border-0">
                      <td className="px-5 py-2"><b className="text-gray-700">{p.nombre}</b><br /><span className="text-gray-400 text-[11px]">{p.doc}</span></td>
                      <td className="px-2 py-2 text-gray-600">{p.rol}<br /><span className="text-[11px] text-gray-400">{p.sub}</span></td>
                      <td className="px-2 py-2">{p.datos ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">completo</span> : <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600">falta dato</span>}</td>
                      <td className="px-2 py-2">{p.pago === 'pago' ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">pagado</span> : p.pago === 'abono' ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-700">abonó</span> : <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-600">sin abono</span>}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <div className="p-5 pt-4">
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-2.5">
                  <Sparkles size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-indigo-700 text-sm">Próximamente: agrega tu listado de jugadores aquí mismo</p>
                    <p className="text-[12.5px] text-indigo-600 mt-0.5">Estamos construyendo la opción para que subas los datos de tus deportistas (nombre, documento, fecha de nacimiento) directo desde este portal. Por ahora, envíalo por WhatsApp.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <a href={waLink(`Hola GuíaSAI, soy ${d.lider} de ${d.club}. Te comparto el listado de jugadores de nuestra delegación.`)} target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm py-3 rounded-xl transition-colors"><MessageCircle size={14} /> Enviar listado por WhatsApp</a>
              <button onClick={() => buscar(codigo)} className="flex items-center justify-center gap-1.5 bg-white border border-gray-200 text-gray-600 font-bold text-sm px-4 rounded-xl hover:bg-gray-50"><RefreshCw size={13} /></button>
            </div>
          </>
        )}

        {/* Navegación Atrás / Siguiente */}
        <div className="flex items-center justify-between pt-3">
          <button onClick={() => irA(paso - 1)} disabled={paso === 0}
            className="flex items-center gap-1 text-sm font-bold text-[#003D5C] disabled:opacity-30 disabled:cursor-not-allowed px-3 py-2">
            <ChevronLeft size={16} /> Atrás
          </button>
          <span className="text-[11px] text-gray-400 font-semibold">{paso + 1} / {PASOS.length}</span>
          <button onClick={() => irA(paso + 1)} disabled={paso === PASOS.length - 1}
            className="flex items-center gap-1 text-sm font-bold text-[#003D5C] disabled:opacity-30 disabled:cursor-not-allowed px-3 py-2">
            Siguiente <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <p className="text-center text-[10px] text-gray-400 pt-4">GuíaSAI S.A.S. · RNT 48674 · #LaivStieg · Operador logístico de la Copa de la Isla</p>
      </div>
    </div>
  );
};

export default CopaPortal;

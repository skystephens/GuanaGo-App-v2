/**
 * WachiPortal — Portal autenticado de la alianza GuíaSAI x Club Wachi.
 * Ruta: /?p=wachi-portal
 *
 * 3 vistas según rol del usuario autenticado (Firebase + AirtableProfile):
 * - Acudiente: ve solo el/los jugador(es) cuyo Telefono_Acudiente coincide
 *   con userProfile.telefono. Meta con progreso + próximos torneos.
 * - ClubDeportivo (Jacir): registra jugadores, carga torneos, ve fondo total.
 * - SuperAdmin: panorama global — KPIs, cumplimiento de consentimientos,
 *   desglose de ventas (placeholder hasta que Leads↔CotizacionesGG estén
 *   reconciliados — ver tarea "Portal Wachi: conectar Leads->CotizacionesGG").
 *
 * Reutiliza el patrón de login inline por email/password de CopaPortal.tsx.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, LogOut, Mail, Lock, Eye, EyeOff, Plus, X, ShieldAlert, ShieldCheck } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import {
  getJugadoresWachi, createJugadorWachi,
  getTorneosClub, createTorneoClub,
} from '../services/airtableService';
import type { JugadorWachi, TorneoClub } from '../types';

const CLUB = 'WACHI2026';
const cop = (n: number) => `$${Math.round(n || 0).toLocaleString('es-CO')}`;

const WachiPortal: React.FC = () => {
  const { userProfile, isAuthenticated, logout } = useAuth();

  const [jugadores, setJugadores] = useState<JugadorWachi[]>([]);
  const [torneos, setTorneos] = useState<TorneoClub[]>([]);
  const [loading, setLoading] = useState(true);
  const [jugadorActivoIdx, setJugadorActivoIdx] = useState(0);

  // Login inline
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const cargar = useCallback(async () => {
    setLoading(true);
    const [j, t] = await Promise.all([getJugadoresWachi(CLUB), getTorneosClub(CLUB)]);
    setJugadores(j);
    setTorneos(t);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated) cargar();
  }, [isAuthenticated, cargar]);

  const handleLoginInline = async () => {
    if (!loginEmail.trim() || !loginPassword) return;
    setLoginLoading(true); setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
    } catch (err: any) {
      setLoginError(err.code === 'auth/invalid-credential' ? 'Email o contraseña incorrectos' : 'Error al iniciar sesión');
    } finally {
      setLoginLoading(false);
    }
  };

  // ---------- Pantalla de login (sin sesión) ----------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F6F1E7] flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-[#003664]/10 p-7">
          <h1 className="font-serif text-2xl font-bold text-[#003664] mb-1">Portal Club Wachi</h1>
          <p className="text-sm text-[#5A6E76] mb-6">Inicia sesión para ver tu perfil, el fondo del club, o el panorama global.</p>

          <div className="space-y-3">
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-3.5 text-gray-400" />
              <input
                value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                type="email" placeholder="Email"
                className="w-full pl-9 pr-3 py-3 rounded-lg border border-[#003664]/15 bg-[#F6F1E7] text-sm focus:outline-none focus:border-[#02ABE2]"
              />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3.5 text-gray-400" />
              <input
                value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                type={verPassword ? 'text' : 'password'} placeholder="Contraseña"
                onKeyDown={e => { if (e.key === 'Enter') handleLoginInline(); }}
                className="w-full pl-9 pr-9 py-3 rounded-lg border border-[#003664]/15 bg-[#F6F1E7] text-sm focus:outline-none focus:border-[#02ABE2]"
              />
              <button onClick={() => setVerPassword(v => !v)} className="absolute right-3 top-3.5 text-gray-400">
                {verPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {loginError && <p className="text-xs text-red-600">{loginError}</p>}
            <button
              onClick={handleLoginInline}
              disabled={loginLoading || !loginEmail.trim() || !loginPassword}
              className="w-full bg-[#F5831F] hover:bg-[#DE7112] text-white font-semibold text-sm py-3 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loginLoading ? <Loader2 size={16} className="animate-spin" /> : 'Ingresar'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const role = userProfile?.role;

  return (
    <div className="min-h-screen bg-[#F6F1E7]">
      <header style={{ background: 'linear-gradient(150deg,#003664 0%,#003664 55%,#02ABE2 130%)' }} className="text-white px-6 py-5 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-xl font-bold">Portal Club Wachi</h1>
          <p className="text-xs text-[#C9DCE4]">{userProfile?.nombre} · {role}</p>
        </div>
        <button onClick={logout} className="text-xs flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg">
          <LogOut size={13} /> Salir
        </button>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-[#003664]" /></div>
      ) : role === 'SuperAdmin' ? (
        <VistaAdmin jugadores={jugadores} torneos={torneos} />
      ) : role === 'ClubDeportivo' ? (
        <VistaClub jugadores={jugadores} torneos={torneos} onRefresh={cargar} />
      ) : (
        <VistaAcudiente
          jugadores={jugadores.filter(j => j.telefonoAcudiente === userProfile?.telefono)}
          torneos={torneos}
          activoIdx={jugadorActivoIdx}
          setActivoIdx={setJugadorActivoIdx}
        />
      )}
    </div>
  );
};

// ============ VISTA ACUDIENTE ============
const VistaAcudiente: React.FC<{ jugadores: JugadorWachi[]; torneos: TorneoClub[]; activoIdx: number; setActivoIdx: (n: number) => void }> = ({ jugadores, torneos, activoIdx, setActivoIdx }) => {
  if (!jugadores.length) {
    return <div className="max-w-2xl mx-auto p-6 text-center text-[#5A6E76] text-sm py-16">
      No encontramos ningún jugador registrado con tu número de teléfono. Si crees que esto es un error, contacta a Jacir o al equipo de GuíaSAI.
    </div>;
  }
  const j = jugadores[activoIdx] || jugadores[0];
  const pct = j.metaTotal > 0 ? Math.min(100, Math.round((j.recaudado / j.metaTotal) * 100)) : 0;
  const proximos = torneos.filter(t => t.estado !== 'Finalizado');

  return (
    <div className="max-w-2xl mx-auto p-6">
      {jugadores.length > 1 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {jugadores.map((jj, i) => (
            <button key={jj.id} onClick={() => setActivoIdx(i)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${i === activoIdx ? 'bg-[#003664] text-white border-[#003664]' : 'bg-white border-[#003664]/15'}`}>
              {jj.nombre.split(' ')[0]}
            </button>
          ))}
        </div>
      )}

      <div className="bg-white border border-[#003664]/10 rounded-xl p-5 mb-4">
        <span className="inline-block font-mono text-xs bg-[#F5831F]/10 text-[#F5831F] font-bold px-2.5 py-1 rounded-md">{j.codigoJugador}</span>
        <h2 className="font-serif text-xl font-bold mt-2">{j.nombre}</h2>
        <p className="text-xs text-[#5A6E76]">
          {j.consentimientoAcudiente ? '✓ Consentimiento confirmado' : '⚠ Consentimiento pendiente'}
        </p>

        <div className="mt-4">
          <div className="flex justify-between font-mono text-xs font-bold text-[#003664] mb-1.5">
            <span>{j.descripcionMeta || 'Meta del viaje'}</span><span>{pct}%</span>
          </div>
          <div className="bg-[#EDE7DA] rounded-full h-3.5 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#02ABE2,#0F9D6B)' }} />
          </div>
          <div className="flex justify-between font-mono text-xs text-[#003664] font-bold mt-1.5">
            <span>{cop(j.recaudado)} recaudado</span><span>Meta {cop(j.metaTotal)}</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#003664]/10 rounded-xl p-5">
        <h3 className="font-serif text-base font-bold text-[#003664] mb-3">Próximos torneos del club</h3>
        {proximos.length ? proximos.map(t => (
          <div key={t.id} className="flex justify-between items-center py-2.5 border-b border-[#003664]/10 last:border-b-0">
            <div>
              <strong className="text-sm">{t.nombreTorneo}</strong>
              <p className="text-xs text-[#5A6E76]">{t.ciudad} · {t.fechaInicio} → {t.fechaFin}</p>
            </div>
            <span className="text-[10px] font-mono uppercase bg-[#0F9D6B]/10 text-[#0F9D6B] font-bold px-2 py-1 rounded-full">{t.estado}</span>
          </div>
        )) : <p className="text-sm text-[#9FA8AC] text-center py-6">No hay torneos próximos cargados.</p>}
      </div>
    </div>
  );
};

// ============ VISTA CLUB (JACIR) ============
const VistaClub: React.FC<{ jugadores: JugadorWachi[]; torneos: TorneoClub[]; onRefresh: () => void }> = ({ jugadores, torneos, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [showTorneoForm, setShowTorneoForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nombre: '', codigo: '', acudiente: '', telefono: '', meta: '', desc: '', consentimiento: true });
  const [tForm, setTForm] = useState({ nombre: '', ciudad: '', inicio: '', fin: '', estado: 'Próximo' });

  const totalMeta = jugadores.reduce((s, j) => s + j.metaTotal, 0);
  const totalRecaudado = jugadores.reduce((s, j) => s + j.recaudado, 0);

  const guardarJugador = async () => {
    if (!form.nombre.trim() || !form.codigo.trim()) return;
    setSaving(true);
    try {
      await createJugadorWachi({
        nombre: form.nombre.trim(),
        codigoJugador: form.codigo.trim().toUpperCase(),
        club: CLUB,
        nombreAcudiente: form.acudiente.trim(),
        telefonoAcudiente: form.telefono.trim(),
        consentimientoAcudiente: form.consentimiento,
        metaTotal: Number(form.meta) || 0,
        descripcionMeta: form.desc.trim(),
        activo: true,
      });
      setForm({ nombre: '', codigo: '', acudiente: '', telefono: '', meta: '', desc: '', consentimiento: true });
      setShowForm(false);
      onRefresh();
    } finally { setSaving(false); }
  };

  const guardarTorneo = async () => {
    if (!tForm.nombre.trim()) return;
    setSaving(true);
    try {
      await createTorneoClub({ club: CLUB, nombreTorneo: tForm.nombre.trim(), ciudad: tForm.ciudad.trim(), fechaInicio: tForm.inicio, fechaFin: tForm.fin, estado: tForm.estado });
      setTForm({ nombre: '', ciudad: '', inicio: '', fin: '', estado: 'Próximo' });
      setShowTorneoForm(false);
      onRefresh();
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <div className="bg-white border border-[#003664]/10 rounded-xl p-5">
        <h3 className="font-serif text-base font-bold text-[#003664]">Fondo del club</h3>
        <p className="text-sm text-[#5A6E76] mt-1">{jugadores.length} jugadores · <strong>{cop(totalRecaudado)}</strong> recaudado de <strong>{cop(totalMeta)}</strong> en metas</p>
      </div>

      <div className="bg-white border border-[#003664]/10 rounded-xl p-5">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-serif text-base font-bold text-[#003664]">Jugadores</h3>
          <button onClick={() => setShowForm(s => !s)} className="text-xs font-semibold text-[#02ABE2] flex items-center gap-1"><Plus size={14} /> Registrar</button>
        </div>
        {jugadores.map(j => (
          <div key={j.id} className="flex justify-between items-center py-2 border-b border-[#003664]/10 last:border-b-0 text-sm">
            <span>{j.nombre} <span className="font-mono text-xs text-[#F5831F]">{j.codigoJugador}</span></span>
            <span className="text-xs text-[#5A6E76]">{cop(j.recaudado)} / {cop(j.metaTotal)}</span>
          </div>
        ))}
        {showForm && (
          <div className="mt-4 pt-4 border-t border-[#003664]/10 space-y-2.5">
            <input placeholder="Nombre completo" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#003664]/15 text-sm bg-[#F6F1E7]" />
            <input placeholder="Código (ej: A205)" value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#003664]/15 text-sm bg-[#F6F1E7]" />
            <input placeholder="Nombre acudiente" value={form.acudiente} onChange={e => setForm({ ...form, acudiente: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#003664]/15 text-sm bg-[#F6F1E7]" />
            <input placeholder="Teléfono acudiente" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#003664]/15 text-sm bg-[#F6F1E7]" />
            <input type="number" placeholder="Meta total ($)" value={form.meta} onChange={e => setForm({ ...form, meta: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#003664]/15 text-sm bg-[#F6F1E7]" />
            <textarea placeholder="Descripción de la meta" value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-[#003664]/15 text-sm bg-[#F6F1E7]" />
            <label className="flex items-center gap-2 text-xs text-[#5A6E76]">
              <input type="checkbox" checked={form.consentimiento} onChange={e => setForm({ ...form, consentimiento: e.target.checked })} />
              Consentimiento del acudiente confirmado
            </label>
            <button onClick={guardarJugador} disabled={saving} className="bg-[#F5831F] text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar jugador'}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white border border-[#003664]/10 rounded-xl p-5">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-serif text-base font-bold text-[#003664]">Torneos</h3>
          <button onClick={() => setShowTorneoForm(s => !s)} className="text-xs font-semibold text-[#02ABE2] flex items-center gap-1"><Plus size={14} /> Agregar</button>
        </div>
        {torneos.map(t => (
          <div key={t.id} className="flex justify-between items-center py-2 border-b border-[#003664]/10 last:border-b-0 text-sm">
            <span>{t.nombreTorneo} — {t.ciudad}</span>
            <span className="text-[10px] font-mono uppercase bg-[#0F9D6B]/10 text-[#0F9D6B] font-bold px-2 py-1 rounded-full">{t.estado}</span>
          </div>
        ))}
        {showTorneoForm && (
          <div className="mt-4 pt-4 border-t border-[#003664]/10 space-y-2.5">
            <input placeholder="Nombre del torneo" value={tForm.nombre} onChange={e => setTForm({ ...tForm, nombre: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#003664]/15 text-sm bg-[#F6F1E7]" />
            <input placeholder="Ciudad" value={tForm.ciudad} onChange={e => setTForm({ ...tForm, ciudad: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#003664]/15 text-sm bg-[#F6F1E7]" />
            <div className="grid grid-cols-2 gap-2.5">
              <input type="date" value={tForm.inicio} onChange={e => setTForm({ ...tForm, inicio: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#003664]/15 text-sm bg-[#F6F1E7]" />
              <input type="date" value={tForm.fin} onChange={e => setTForm({ ...tForm, fin: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#003664]/15 text-sm bg-[#F6F1E7]" />
            </div>
            <select value={tForm.estado} onChange={e => setTForm({ ...tForm, estado: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#003664]/15 text-sm bg-[#F6F1E7]">
              <option>Próximo</option><option>En curso</option><option>Finalizado</option>
            </select>
            <button onClick={guardarTorneo} disabled={saving} className="bg-[#F5831F] text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar torneo'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============ VISTA SUPERADMIN ============
const VistaAdmin: React.FC<{ jugadores: JugadorWachi[]; torneos: TorneoClub[] }> = ({ jugadores, torneos }) => {
  const totalMeta = jugadores.reduce((s, j) => s + j.metaTotal, 0);
  const totalRecaudado = jugadores.reduce((s, j) => s + j.recaudado, 0);
  const comision = totalRecaudado * 0.10;
  const sinConsentimiento = jugadores.filter(j => !j.consentimientoAcudiente);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          ['Clubes activos', '1'],
          ['Jugadores', String(jugadores.length)],
          ['Recaudado', cop(totalRecaudado)],
          ['Comisión (10%)', cop(comision)],
        ].map(([label, val]) => (
          <div key={label} className="bg-white border border-[#003664]/10 rounded-xl p-4">
            <p className="text-xs text-[#5A6E76]">{label}</p>
            <p className="font-serif text-xl font-bold text-[#003664]">{val}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#003664]/10 rounded-xl p-5">
        <h3 className="font-serif text-base font-bold text-[#003664] mb-3 flex items-center gap-2">
          {sinConsentimiento.length ? <ShieldAlert size={16} className="text-[#F5831F]" /> : <ShieldCheck size={16} className="text-[#0F9D6B]" />}
          Cumplimiento — consentimientos
        </h3>
        {sinConsentimiento.length ? sinConsentimiento.map(j => (
          <div key={j.id} className="flex justify-between items-center py-2 border-b border-[#003664]/10 last:border-b-0 text-sm">
            <span>{j.nombre} <span className="font-mono text-xs text-[#F5831F]">{j.codigoJugador}</span></span>
            <span className="text-[10px] font-mono uppercase bg-[#F5831F]/10 text-[#F5831F] font-bold px-2 py-1 rounded-full">Pendiente</span>
          </div>
        )) : <p className="text-sm text-[#0F9D6B] text-center py-4">✓ Todos los jugadores tienen consentimiento confirmado</p>}
      </div>

      <div className="bg-white border border-[#003664]/10 rounded-xl p-5">
        <h3 className="font-serif text-base font-bold text-[#003664] mb-2">Torneos cargados</h3>
        {torneos.length ? torneos.map(t => (
          <div key={t.id} className="text-sm py-1.5">{t.nombreTorneo} — {t.ciudad} ({t.estado})</div>
        )) : <p className="text-sm text-[#9FA8AC]">Sin torneos cargados aún.</p>}
      </div>

      <div className="bg-white border border-[#003664]/10 rounded-xl p-5">
        <h3 className="font-serif text-base font-bold text-[#003664] mb-2">Desglose de ventas por período</h3>
        <p className="text-sm text-[#5A6E76]">
          Pendiente de conectar — requiere reconciliar <code>Leads</code> con <code>CotizacionesGG</code> por teléfono
          para saber qué se vendió realmente vía el código de club. Ver tarea en Airtable:
          "Portal Wachi: conectar Leads→CotizacionesGG para desglose de ventas real".
        </p>
      </div>
    </div>
  );
};

export default WachiPortal;

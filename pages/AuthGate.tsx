import React, { useState } from 'react';
import { User, Briefcase, LogIn, UserPlus, AlertCircle, Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { AppRoute, UserRole } from '../types';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithCustomToken,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

interface AuthGateProps {
  onAuthenticated: (role: UserRole) => void;
  onNavigate?: (route: AppRoute) => void;
}

type Step = 'login' | 'select-type';

async function verifyWithBackend(firebaseUser: any, userType = 'turista') {
  // Refrescar token ANTES de enviar al backend para incluir claims de migrate-login
  let idToken: string;
  try { idToken = await firebaseUser.getIdToken(true); } catch { idToken = await firebaseUser.getIdToken(); }
  const res = await fetch('/api/firebase-auth/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ userType }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Error verificando perfil');
  return data;
}

const AuthGate: React.FC<AuthGateProps> = ({ onAuthenticated, onNavigate }) => {
  const { setProfile } = useAuth();
  const [step, setStep] = useState<Step>('login');
  const [pendingFirebaseUser, setPendingFirebaseUser] = useState<any>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const finishAuth = (data: any) => {
    if (data.user) setProfile(data.user);
    if (data.requiresApproval && data.message) alert(data.message);
    // normalizeRole está en AuthContext, pero aquí mapeamos Super_Admin → SuperAdmin
    const role = (data.user?.role === 'Super_Admin' ? 'SuperAdmin' : data.user?.role) as UserRole || 'Turista';
    onAuthenticated(role);
  };

  // ── Email / Password ──────────────────────────────────────────────────────
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegister) {
        if (password.length < 8) {
          setError('La contraseña debe tener mínimo 8 caracteres');
          setLoading(false);
          return;
        }
        const result = await createUserWithEmailAndPassword(auth, email, password);
        // Para nuevos registros, preguntar el tipo antes de crear Lead
        setPendingFirebaseUser(result.user);
        setStep('select-type');
        setLoading(false);
        return;
      }

      // Login: Firebase primero, fallback migración Airtable legado
      let firebaseUser;
      try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        firebaseUser = result.user;
      } catch (err: any) {
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          const migrateRes = await fetch('/api/firebase-auth/migrate-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          const migrateData = await migrateRes.json();
          if (!migrateData.success) throw new Error(migrateData.error || 'Credenciales incorrectas');
          const customResult = await signInWithCustomToken(auth, migrateData.customToken);
          firebaseUser = customResult.user;
        } else {
          throw err;
        }
      }

      const data = await verifyWithBackend(firebaseUser);
      finishAuth(data);
    } catch (err: any) {
      const code = err.code || '';
      if (code === 'auth/email-already-in-use') setError('Este correo ya está registrado. Inicia sesión.');
      else if (code === 'auth/weak-password') setError('Contraseña muy débil. Mínimo 6 caracteres.');
      else if (code === 'auth/invalid-email') setError('El correo no es válido.');
      else if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') setError('Correo o contraseña incorrectos.');
      else setError(err.message || 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  // ── Google ────────────────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const data = await verifyWithBackend(result.user);
      finishAuth(data);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') setError('Se cerró la ventana de Google.');
      else setError(err.message || 'Error al iniciar con Google');
    } finally {
      setLoading(false);
    }
  };

  // ── Selección de tipo (solo usuarios nuevos) ──────────────────────────────
  const handleSelectType = async (userType: 'turista' | 'local' | 'socio') => {
    if (!pendingFirebaseUser) return;
    setLoading(true);
    setError('');
    try {
      const data = await verifyWithBackend(pendingFirebaseUser, userType);
      finishAuth(data);
    } catch (err: any) {
      setError(err.message || 'Error al crear perfil');
    } finally {
      setLoading(false);
    }
  };

  // ── PASO 2: Selección de tipo (solo al registrarse) ───────────────────────
  if (step === 'select-type') {
    return (
      <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen flex flex-col justify-center px-4 pb-24">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-gray-900 mb-2">¿Cómo usarás GuanaGO?</h1>
            <p className="text-gray-500 text-sm">Esto personaliza tu experiencia. Puedes cambiarlo después.</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => handleSelectType('turista')}
              disabled={loading}
              className="w-full p-5 rounded-3xl border-2 border-emerald-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left active:scale-95 disabled:opacity-50"
            >
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-sm">Turista / Visitante</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Explora tours, hoteles y actividades en la isla</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleSelectType('local')}
              disabled={loading}
              className="w-full p-5 rounded-3xl border-2 border-blue-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left active:scale-95 disabled:opacity-50"
            >
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-sm">Residente de la Isla</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Accede a beneficios y descuentos para residentes</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleSelectType('socio')}
              disabled={loading}
              className="w-full p-5 rounded-3xl border-2 border-indigo-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left active:scale-95 disabled:opacity-50"
            >
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Briefcase size={24} />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-sm">Negocio / Aliado GuanaGO</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Registra tu negocio y aparece en el mapa</p>
                </div>
              </div>
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 mt-6 text-gray-500 text-sm">
              <Loader2 size={18} className="animate-spin" />
              Creando tu perfil...
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2">
              <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-800">{error}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── PASO 1: Login (único punto de entrada) ────────────────────────────────
  return (
    <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen flex flex-col justify-center px-4 pb-24">
      <div className="w-full max-w-md mx-auto">

        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-gray-900 mb-1">GuanaGO</h1>
          <p className="text-gray-500 text-sm">Tu guía definitiva de San Andrés</p>
        </div>

        {/* Google */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full p-4 rounded-2xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center gap-3 mb-5 active:scale-95 disabled:opacity-50"
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          <span className="font-bold text-gray-700 text-sm">Continuar con Google</span>
        </button>

        <div className="flex items-center gap-4 mb-5">
          <div className="h-px bg-gray-200 flex-1" />
          <span className="text-xs text-gray-400 uppercase font-bold">O con email</span>
          <div className="h-px bg-gray-200 flex-1" />
        </div>

        {/* Form */}
        <form onSubmit={handleAuthSubmit} className="space-y-4">
          <div className="relative">
            <Mail size={18} className="absolute left-4 top-3.5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-emerald-500 text-gray-900 text-sm transition-colors"
              required
            />
          </div>

          <div className="relative">
            <Lock size={18} className="absolute left-4 top-3.5 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isRegister ? 'Mínimo 8 caracteres' : '••••••••'}
              className="w-full pl-11 pr-12 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-emerald-500 text-gray-900 text-sm transition-colors"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2">
              <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-800">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl font-black text-sm uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading
              ? <><Loader2 size={18} className="animate-spin" /> Procesando...</>
              : isRegister
                ? <><UserPlus size={18} /> Crear Cuenta</>
                : <><LogIn size={18} /> Iniciar Sesión</>
            }
          </button>
        </form>

        <div className="text-center mt-5 pt-5 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">
            {isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
          </p>
          <button
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            className="text-emerald-600 font-black text-sm hover:text-emerald-700 transition-colors"
          >
            {isRegister ? 'Inicia sesión' : 'Regístrate gratis'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AuthGate;

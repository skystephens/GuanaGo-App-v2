import React, { useState } from 'react';
import { ArrowLeft, User, Briefcase, ShieldCheck, LogIn, UserPlus, AlertCircle, Mail, Lock, Loader2, Eye, EyeOff, KeyRound } from 'lucide-react';
import { AppRoute, UserRole } from '../types';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signInWithCustomToken } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

interface AuthGateProps {
  onAuthenticated: (role: UserRole) => void;
  onNavigate?: (route: AppRoute) => void;
}

type AuthStep = 'select-type' | 'login' | 'register' | 'admin-pin';
type UserType = 'turista' | 'local' | 'socio' | 'admin' | null;

/**
 * Despues de que Firebase autentica, verificar token con backend
 * para obtener/crear perfil en Airtable
 */
async function verifyWithBackend(firebaseUser: any, userType: string) {
  const idToken = await firebaseUser.getIdToken();
  const response = await fetch('/api/firebase-auth/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify({ userType }),
  });
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Error verificando perfil');
  }
  return data;
}

const AuthGate: React.FC<AuthGateProps> = ({ onAuthenticated, onNavigate }) => {
  const { setProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState<AuthStep>('select-type');
  const [userType, setUserType] = useState<UserType>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  // Para el PIN de admin
  const [adminPin, setAdminPin] = useState('');
  const [pinAttempts, setPinAttempts] = useState(0);
  const MAX_PIN_ATTEMPTS = 5;

  const userTypeConfig = {
    turista: {
      label: 'Turista',
      description: 'Explora y disfruta San Andrés',
      icon: <User size={32} />,
      color: 'emerald',
      role: 'Tourist' as UserRole,
    },
    local: {
      label: 'Residente Local',
      description: 'Vive en la isla y accede a beneficios locales',
      icon: <User size={32} />,
      color: 'blue',
      role: 'Local' as UserRole,
    },
    socio: {
      label: 'Socio Operador',
      description: 'Gestiona tu negocio turístico',
      icon: <Briefcase size={32} />,
      color: 'indigo',
      role: 'Socio' as UserRole,
    },
    admin: {
      label: 'Administrador',
      description: 'Acceso a panel administrativo',
      icon: <ShieldCheck size={32} />,
      color: 'purple',
      role: 'SuperAdmin' as UserRole,
    },
  };

  const handleSelectUserType = (type: UserType) => {
    setUserType(type);
    setError('');
    setEmail('');
    setPassword('');
    setAdminPin('');
    // Todos los tipos van al login unificado (email/password + Google)
    setCurrentStep('login');
  };

  // ============================================
  // FIREBASE: Login/Registro con Email + Password
  // ============================================
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!email || !password) {
      setError('Por favor completa todos los campos');
      setLoading(false);
      return;
    }

    if (!isLogin && password.length < 8) {
      setError('La contraseña debe tener mínimo 8 caracteres');
      setLoading(false);
      return;
    }

    try {
      let firebaseUser;

      if (isLogin) {
        // Intentar login con Firebase directamente
        try {
          const result = await signInWithEmailAndPassword(auth, email, password);
          firebaseUser = result.user;
        } catch (firebaseErr: any) {
          // Si el usuario no existe en Firebase, intentar migracion desde Airtable
          if (firebaseErr.code === 'auth/user-not-found' || firebaseErr.code === 'auth/invalid-credential') {
            console.log('🔄 Intentando migracion desde Airtable...');
            const migrateRes = await fetch('/api/firebase-auth/migrate-login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password }),
            });
            const migrateData = await migrateRes.json();

            if (!migrateData.success) {
              throw new Error(migrateData.error || 'Credenciales incorrectas');
            }

            // Login con el custom token de Firebase
            const customResult = await signInWithCustomToken(auth, migrateData.customToken);
            firebaseUser = customResult.user;
          } else {
            throw firebaseErr;
          }
        }
      } else {
        // Registro nuevo en Firebase
        const result = await createUserWithEmailAndPassword(auth, email, password);
        firebaseUser = result.user;
      }

      // Verificar con backend y obtener perfil Airtable
      const data = await verifyWithBackend(firebaseUser, userType || 'turista');

      if (data.user) {
        setProfile(data.user);
      }

      if (data.requiresApproval && data.message) {
        alert(data.message);
      }

      onAuthenticated(data.user?.role || userTypeConfig[userType!]?.role || 'Tourist');

    } catch (err: any) {
      console.error('Error en autenticación:', err);
      const code = err.code || '';
      if (code === 'auth/email-already-in-use') {
        setError('Este correo ya está registrado. Inicia sesión.');
      } else if (code === 'auth/weak-password') {
        setError('La contraseña es muy débil. Usa mínimo 6 caracteres.');
      } else if (code === 'auth/invalid-email') {
        setError('El correo no es válido.');
      } else if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
        setError('Correo o contraseña incorrectos.');
      } else {
        setError(err.message || 'Error de autenticación');
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // FIREBASE: Login con Google
  // ============================================
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const data = await verifyWithBackend(result.user, userType || 'turista');

      if (data.user) {
        setProfile(data.user);
      }

      onAuthenticated(data.user?.role || userTypeConfig[userType!]?.role || 'Tourist');
    } catch (err: any) {
      console.error('Error Google login:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Se cerró la ventana de Google.');
      } else {
        setError(err.message || 'Error al iniciar con Google');
      }
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (currentStep === 'login' || currentStep === 'register' || currentStep === 'admin-pin') {
      setCurrentStep('select-type');
      setUserType(null);
      setError('');
      setAdminPin('');
    }
  };

  // ============================================
  // Admin PIN (se mantiene igual, sin Firebase)
  // ============================================
  const handleAdminPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!adminPin || adminPin.length === 0) {
      setError('Por favor ingresa tu PIN');
      return;
    }

    if (pinAttempts >= MAX_PIN_ATTEMPTS) {
      setError('Demasiados intentos fallidos. Intenta más tarde.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/validate-admin-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: adminPin.trim() })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error del servidor');
      }

      const data = await res.json();

      if (data.success && data.user) {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 8);

        const session = {
          user: data.user,
          expiresAt: expiresAt.toISOString(),
          loginTime: new Date().toISOString()
        };

        localStorage.setItem('admin_session', JSON.stringify(session));
        localStorage.setItem('admin_authenticated', 'true');

        onAuthenticated('SuperAdmin');
      } else {
        setPinAttempts(prev => prev + 1);
        setError(data.error || 'PIN incorrecto');
        setAdminPin('');
      }
    } catch (err: any) {
      console.error('Error validando PIN:', err);
      setPinAttempts(prev => prev + 1);
      setError(err.message || 'Error conectando con el servidor');
      setAdminPin('');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // PASO 1: Seleccionar tipo de usuario
  // ============================================
  if (currentStep === 'select-type') {
    return (
      <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen flex flex-col justify-center px-4 pb-24 font-sans">
        <div className="w-full max-w-md mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-black text-gray-900 mb-2">GuanaGO</h1>
            <p className="text-gray-600 text-sm">Elige tu tipo de cuenta</p>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-4 mb-8">
            <div className="flex gap-3">
              <div className="text-emerald-600 flex-shrink-0 mt-0.5">
                <AlertCircle size={20} />
              </div>
              <p className="text-sm text-emerald-800 leading-relaxed">
                Selecciona el tipo de cuenta que mejor se adapte a ti para acceder con beneficios personalizados.
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {Object.entries(userTypeConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => handleSelectUserType(key as UserType)}
                className={`w-full p-5 rounded-3xl border-2 transition-all text-left
                  ${config.color === 'emerald' ? 'hover:border-emerald-500 hover:bg-emerald-50 border-emerald-200' : ''}
                  ${config.color === 'blue' ? 'hover:border-blue-500 hover:bg-blue-50 border-blue-200' : ''}
                  ${config.color === 'indigo' ? 'hover:border-indigo-500 hover:bg-indigo-50 border-indigo-200' : ''}
                  ${config.color === 'purple' ? 'hover:border-purple-500 hover:bg-purple-50 border-purple-200' : ''}
                  active:scale-95`}
              >
                <div className="flex gap-4">
                  <div className={`
                    w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0
                    ${config.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' : ''}
                    ${config.color === 'blue' ? 'bg-blue-100 text-blue-600' : ''}
                    ${config.color === 'indigo' ? 'bg-indigo-100 text-indigo-600' : ''}
                    ${config.color === 'purple' ? 'bg-purple-100 text-purple-600' : ''}
                  `}>
                    {config.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-gray-900 text-sm mb-0.5">{config.label}</h3>
                    <p className="text-xs text-gray-600 leading-snug">{config.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <p className="text-center text-xs text-gray-500 leading-relaxed">
            Puedes cambiar tu tipo de cuenta más adelante en la configuración de tu perfil.
          </p>
        </div>
      </div>
    );
  }

  // ============================================
  // PASO 2A: Panel PIN para Administrador
  // ============================================
  if (currentStep === 'admin-pin') {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-white min-h-screen flex flex-col px-4 pb-24 font-sans">
        <div className="flex items-center justify-between pt-4 pb-6 border-b border-gray-200">
          <button onClick={goBack} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft size={24} className="text-gray-700" />
          </button>
          <h2 className="font-black text-gray-900 text-lg">Administrador</h2>
          <div className="w-10" />
        </div>

        <div className="flex-1 flex items-center justify-center w-full max-w-sm mx-auto my-8">
          <div className="w-full">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <KeyRound size={40} className="text-purple-600" />
              </div>
              <h1 className="text-2xl font-black text-gray-900 mb-2">Acceso Admin</h1>
              <p className="text-sm text-gray-600">Ingresa tu PIN de administrador</p>
            </div>

            <form onSubmit={handleAdminPinSubmit} className="space-y-4">
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-3.5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={adminPin}
                  onChange={(e) => { setAdminPin(e.target.value); setError(''); }}
                  placeholder="Ingresa tu PIN"
                  className="w-full pl-11 pr-12 py-3 border-2 border-purple-200 rounded-xl outline-none transition-all focus:border-purple-500 text-gray-900 text-sm"
                  autoComplete="off"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-3">
                  <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-800">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || adminPin.length < 4}
                className={`w-full py-4 rounded-xl font-black uppercase text-sm tracking-wider transition-all
                  bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-200
                  flex items-center justify-center gap-2
                  ${(loading || adminPin.length < 4) ? 'opacity-60 cursor-not-allowed' : 'active:scale-95'}`}
              >
                {loading ? (<><Loader2 size={18} className="animate-spin" /> Validando...</>) : (<><ShieldCheck size={18} /> Acceder</>)}
              </button>
            </form>

            {pinAttempts > 0 && (
              <p className="text-center text-xs text-red-500 mt-4">Intentos fallidos: {pinAttempts}/{MAX_PIN_ATTEMPTS}</p>
            )}

            <div className="text-center border-t border-gray-200 pt-6 mt-6">
              <p className="text-xs text-gray-600 mb-2">¿Prefieres usar email?</p>
              <button onClick={() => setCurrentStep('login')} className="text-purple-600 font-bold text-sm hover:text-purple-700 transition-colors">
                Acceder con Email y PIN
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // PASO 2B: Login / Registro con Firebase
  // ============================================
  const config = userType ? userTypeConfig[userType] : null;

  return (
    <div className={`bg-gradient-to-br min-h-screen flex flex-col px-4 pb-24 font-sans
      ${config?.color === 'emerald' ? 'from-emerald-50 to-white' : ''}
      ${config?.color === 'blue' ? 'from-blue-50 to-white' : ''}
      ${config?.color === 'indigo' ? 'from-indigo-50 to-white' : ''}
      ${config?.color === 'purple' ? 'from-purple-50 to-white' : ''}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between pt-4 pb-6 border-b border-gray-200">
        <button onClick={goBack} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowLeft size={24} className="text-gray-700" />
        </button>
        <h2 className="font-black text-gray-900 text-lg">{config?.label}</h2>
        <div className="w-10" />
      </div>

      <div className="flex-1 flex items-center justify-center w-full max-w-md mx-auto my-8">
        <div className="w-full">
          {/* Titulo */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-black text-gray-900 mb-2">
              {isLogin ? 'Inicia Sesión' : 'Crea tu Cuenta'}
            </h1>
            <p className="text-sm text-gray-600">
              {isLogin ? `Bienvenido ${config?.label}` : `Únete como ${config?.label}`}
            </p>
          </div>

          {/* Boton Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center gap-3 mb-4 active:scale-95 disabled:opacity-50"
          >
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            <span className="font-bold text-gray-700 text-sm">Continuar con Google</span>
          </button>

          {/* Separador */}
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px bg-gray-200 flex-1"></div>
            <span className="text-xs text-gray-500 uppercase font-bold">O con email</span>
            <div className="h-px bg-gray-200 flex-1"></div>
          </div>

          {/* Formulario Email/Password */}
          <form onSubmit={handleAuthSubmit} className="space-y-5 mb-6">
            <div>
              <label className="block text-xs font-black text-gray-700 mb-2 ml-1">Correo Electrónico</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-3.5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl outline-none transition-all focus:border-emerald-500 text-gray-900 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-700 mb-2 ml-1">Contraseña</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-3.5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isLogin ? '••••••••' : '••••••••(mínimo 8)'}
                  className="w-full pl-11 pr-12 py-3 border-2 border-gray-200 rounded-xl outline-none transition-all focus:border-emerald-500 text-gray-900 text-sm"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-3">
                <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-800">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl font-black uppercase text-sm tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2
                bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200
                ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {loading ? (<><Loader2 size={18} className="animate-spin" /> Procesando...</>) : (<>{isLogin ? <LogIn size={18} /> : <UserPlus size={18} />} {isLogin ? 'Inicia Sesión' : 'Crear Cuenta'}</>)}
            </button>
          </form>

          {/* Toggle Login/Register */}
          <div className="text-center border-t border-gray-200 pt-6">
            <p className="text-xs text-gray-600 mb-3">
              {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
            </p>
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-emerald-600 font-black text-sm hover:text-emerald-700 transition-colors"
            >
              {isLogin ? 'Registrate aquí' : 'Inicia sesión aquí'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthGate;

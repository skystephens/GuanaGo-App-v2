import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2, Lock, KeyRound } from 'lucide-react';

interface AdminPinLoginProps {
  onLoginSuccess: (user?: any) => void;
}

const AdminPinLogin: React.FC<AdminPinLoginProps> = ({ onLoginSuccess }) => {
  const [pin, setPin] = useState('');
  const [displayPin, setDisplayPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const MAX_ATTEMPTS = 5;

  // Debug: Verificar si hay sesión activa al cargar
  useEffect(() => {
    const savedSession = localStorage.getItem('admin_session');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        const expiresAt = new Date(session.expiresAt);
        if (expiresAt > new Date()) {
          console.log('✅ Sesión válida, bypassing login');
          onLoginSuccess(session.user);
        } else {
          localStorage.removeItem('admin_session');
        }
      } catch (err) {
        console.error('Error parsing saved session:', err);
        localStorage.removeItem('admin_session');
      }
    }
  }, [onLoginSuccess]);

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, ''); // Solo números
    if (value.length <= 10) {
      setPin(value);
      setDisplayPin('•'.repeat(value.length)); // Mostrar puntos en lugar de números
      console.log(`📝 PIN ingresado: ${value.length} dígitos`);
    }
  };

  const handleDeletePin = () => {
    setPin('');
    setDisplayPin('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pin || pin.length === 0) {
      setError('Por favor ingresa tu PIN');
      return;
    }

    if (attempts >= MAX_ATTEMPTS) {
      setError('Demasiados intentos fallidos. Intenta más tarde.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`🔐 Enviando PIN a /api/validate-admin-pin`);
      
      const res = await fetch('/api/validate-admin-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim() })
      });

      console.log(`📊 Response status: ${res.status}`);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error del servidor');
      }

      const data = await res.json();
      console.log(`📦 Response data:`, data);

      if (data.success && data.user) {
        console.log('✅ PIN válido, guardando sesión');
        
        // Guardar sesión en localStorage (expires en 8 horas)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 8);
        
        const session = {
          user: data.user,
          expiresAt: expiresAt.toISOString(),
          loginTime: new Date().toISOString()
        };
        
        localStorage.setItem('admin_session', JSON.stringify(session));
        localStorage.setItem('admin_authenticated', 'true');
        
        // Reset form
        setPin('');
        setDisplayPin('');
        setAttempts(0);
        
        // Callback exitoso
        onLoginSuccess(data.user);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setError(`PIN incorrecto. Intentos restantes: ${MAX_ATTEMPTS - newAttempts}`);
        setPin('');
        setDisplayPin('');
      }
    } catch (err: any) {
      console.error('❌ Login error:', err);
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setError(err.message || 'Error de conexión. Verifica tu PIN e intenta de nuevo.');
      setPin('');
      setDisplayPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-green-900 to-black p-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
      
      <div className="relative z-10 w-full max-w-md">
        {/* Card */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl shadow-2xl p-8 border border-green-500/20">
          
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="inline-block">
              <div className="relative">
                {/* Animated circle background */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-600 rounded-full blur opacity-75 animate-pulse"></div>
                <div className="relative bg-gray-900 rounded-full p-4">
                  <KeyRound className="text-green-400" size={36} />
                </div>
              </div>
            </div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600 mt-6 mb-2">
              GuanaGO
            </h1>
            <p className="text-green-300 text-sm font-semibold tracking-widest">ADMIN ACCESS</p>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Panel de Administrador</h2>
            <p className="text-gray-400 text-sm">Ingresa tu PIN de seguridad (4-10 dígitos)</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* PIN Input - Custom Keypad Style */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-green-400 uppercase tracking-widest">PIN</label>
              
              {/* PIN Display (masked) */}
              <div className="bg-gray-950 border-2 border-green-500/30 rounded-xl px-6 py-4 text-center transition-all duration-300 hover:border-green-500/60">
                <div className="text-4xl font-mono tracking-widest text-green-400 select-none min-h-12 flex items-center justify-center">
                  {displayPin || <span className="text-gray-600">••••</span>}
                </div>
              </div>

              {/* Hidden actual input for form submission */}
              <input
                type="text"
                value={pin}
                onChange={handlePinChange}
                placeholder="0000"
                maxLength={10}
                className="hidden"
                disabled={loading || attempts >= MAX_ATTEMPTS}
                autoFocus
              />

              {/* PIN Keypad */}
              <div className="grid grid-cols-3 gap-3 mt-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      if (pin.length < 10) {
                        const newPin = pin + String(num);
                        setPin(newPin);
                        setDisplayPin('•'.repeat(newPin.length));
                      }
                    }}
                    disabled={loading || attempts >= MAX_ATTEMPTS}
                    className="bg-gray-800 hover:bg-green-600 border border-green-500/30 text-white font-bold py-3 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                  >
                    {num}
                  </button>
                ))}
              </div>

              {/* 0 button spanning 2 columns */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (pin.length < 10) {
                      const newPin = pin + '0';
                      setPin(newPin);
                      setDisplayPin('•'.repeat(newPin.length));
                    }
                  }}
                  disabled={loading || attempts >= MAX_ATTEMPTS}
                  className="col-span-2 bg-gray-800 hover:bg-green-600 border border-green-500/30 text-white font-bold py-3 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                >
                  0
                </button>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={handleDeletePin}
                  disabled={loading || attempts >= MAX_ATTEMPTS}
                  className="bg-gray-800 hover:bg-red-600 border border-red-500/30 text-red-400 font-bold py-3 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-950/50 border border-red-500/50 rounded-xl">
                <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Attempts warning */}
            {attempts >= MAX_ATTEMPTS - 2 && attempts < MAX_ATTEMPTS && (
              <div className="p-4 bg-yellow-950/50 border border-yellow-500/50 rounded-xl">
                <p className="text-sm text-yellow-300 font-semibold">
                  ⚠️ Intentos restantes: {MAX_ATTEMPTS - attempts}
                </p>
              </div>
            )}

            {/* Submit Button - RED */}
            <button
              type="submit"
              className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 transform text-lg uppercase tracking-widest ${
                loading || attempts >= MAX_ATTEMPTS || !pin
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed border border-gray-600'
                  : 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 hover:shadow-lg hover:shadow-red-500/50 active:scale-95 border border-red-500'
              }`}
              disabled={loading || !pin || attempts >= MAX_ATTEMPTS}
            >
              {loading && <Loader2 size={20} className="animate-spin" />}
              {loading ? 'Validando...' : 'Ingresar'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-green-500/20 text-center">
            <p className="text-xs text-gray-500">
              © 2026 GuanaGO. Plataforma de turismo segura.
            </p>
            <p className="text-xs text-green-600/50 mt-2">
              San Andrés Isla 🏝️
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPinLogin;

import React, { useState } from 'react';
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { AppRoute } from '../types';

interface Props {
  onNavigate: (route: AppRoute, data?: any) => void;
}

export default function PartnerAccess({ onNavigate }: Props) {
  const [email, setEmail] = useState('socio@test.com');
  const [password, setPassword] = useState('Test123456!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('http://localhost:3001/api/partners/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al iniciar sesión');
      }

      // Guardar token y datos del partner
      localStorage.setItem('partnerToken', data.token);
      localStorage.setItem('partnerData', JSON.stringify(data.partner));

      setSuccess(true);

      // Redirigir al nuevo dashboard profesional después de 1 segundo
      setTimeout(() => {
        onNavigate(AppRoute.PARTNER_DASHBOARD_PRO, data.partner);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full z-50">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">GuiaSAI Socios</h1>
          <p className="text-gray-600">Panel de Control para Aliados Locales</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 relative">
          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">¡Login exitoso!</p>
                <p className="text-sm text-green-700">Redirigiendo al dashboard...</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white text-gray-900 placeholder-gray-500 transition-colors"
                placeholder="tu@email.com"
                autoComplete="off"
                spellCheck="false"
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white text-gray-900 placeholder-gray-500 transition-colors"
                placeholder="Tu contraseña"
                autoComplete="off"
              />
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition cursor-pointer active:scale-95"
            >
              {loading ? 'Conectando...' : success ? 'Redirigiendo...' : 'Iniciar Sesión'}
            </button>
          </form>

          {/* Test Credentials Info */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Credenciales de prueba:</strong>
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Email: <code className="bg-blue-100 px-2 py-1 rounded">socio@test.com</code>
            </p>
            <p className="text-sm text-blue-700">
              Contraseña: <code className="bg-blue-100 px-2 py-1 rounded">Test123456!</code>
            </p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>Backend: http://localhost:3001/api</p>
          <p>Status: ✅ Conectado</p>
        </div>
      </div>
    </div>
  );
}

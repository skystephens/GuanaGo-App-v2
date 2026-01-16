import React, { useState } from 'react';

interface AdminPinLoginProps {
  onLoginSuccess: () => void;
}

const AdminPinLogin: React.FC<AdminPinLoginProps> = ({ onLoginSuccess }) => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Llamada a Airtable para validar el PIN
      const res = await fetch('/api/validate-admin-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      const data = await res.json();
      if (data.success) {
        onLoginSuccess();
      } else {
        setError('PIN incorrecto');
      }
    } catch {
      setError('Error de conexión');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-md w-full max-w-xs flex flex-col gap-4">
        <h2 className="text-lg font-bold text-center">Acceso Admin</h2>
        <input
          type="password"
          value={pin}
          onChange={e => setPin(e.target.value)}
          placeholder="Ingresa tu PIN"
          className="border rounded px-4 py-2 text-center text-lg"
          disabled={loading}
        />
        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
        <button
          type="submit"
          className="bg-green-600 text-white py-2 rounded font-bold"
          disabled={loading || !pin}
        >
          {loading ? 'Validando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
};

export default AdminPinLogin;

import React, { useState } from 'react';
import GenericProductForm from '../components/GenericProductForm.tsx';

const SocioAlojamientoProductos: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Aquí se conectará con Airtable
  const handleProductSubmit = async (data: any) => {
    // TODO: conectar con Airtable (tabla ServiciosTuristicos_SAI)
    // Por ahora solo simula
    setResult(data);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-gray-900 min-h-screen text-white p-6 font-sans flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 mb-6 animate-in zoom-in">
          ✓
        </div>
        <h2 className="text-2xl font-bold mb-2">Producto enviado</h2>
        <p className="text-gray-400 mb-8 max-w-xs">
          Tu producto/servicio fue registrado y está pendiente de aprobación por el equipo de GuanaGO.
        </p>
        <pre className="bg-gray-800 rounded-xl p-4 text-xs text-left max-w-full overflow-x-auto">{JSON.stringify(result, null, 2)}</pre>
        <button onClick={() => { setSubmitted(false); setResult(null); }} className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-4 rounded-xl mt-6">Registrar otro producto</button>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen text-white p-6 font-sans">
      <h1 className="text-xl font-bold mb-6">Registrar Alojamiento / Producto</h1>
      <GenericProductForm type="alojamiento" onSubmit={handleProductSubmit} />
    </div>
  );
};

export default SocioAlojamientoProductos;

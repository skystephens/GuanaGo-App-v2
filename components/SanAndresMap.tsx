
import React from 'react';

interface MapProps {
  selectedZoneId: string;
  onSelectZone: (id: string) => void;
}

// Mapa estático de referencia usando la imagen proporcionada
const SanAndresMap: React.FC<MapProps> = ({ selectedZoneId, onSelectZone }) => {
  // Props preservados por compatibilidad, aunque el mapa es estático
  void selectedZoneId;
  void onSelectZone;
  return (
    <div className="w-full flex justify-center my-4">
      <div className="w-full max-w-md rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm">
        <img
          src="https://guiasanandresislas.com/wp-content/uploads/2026/01/Mapa-traslados-taxi.png"
          alt="Mapa de traslados en San Andrés"
          className="w-full h-full object-contain"
          loading="lazy"
        />
      </div>
    </div>
  );
};

export default SanAndresMap;

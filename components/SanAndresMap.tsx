
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
      <div className="w-full rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm p-2">
        <div className="w-full" style={{ transform: 'rotate(270deg)', transformOrigin: 'center', overflow: 'hidden' }}>
          <img
            src="https://guiasanandresislas.com/wp-content/uploads/2026/01/Mapa-traslados-taxi-1.png"
            alt="Mapa de traslados en San Andrés"
            className="w-full h-full object-contain"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
};

export default SanAndresMap;

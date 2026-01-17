
import React from 'react';

interface MapProps {
  selectedZoneId: string;
  onSelectZone: (id: string) => void;
}

const SanAndresMap: React.FC<MapProps> = ({ selectedZoneId, onSelectZone }) => {

  return (
    <div className="w-full flex justify-center my-4 relative rounded-2xl overflow-hidden border border-gray-200 bg-blue-50">
      
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 400 600" 
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-auto max-h-[600px]"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
      >
        {/* Fondo gradiente del océano */}
        <defs>
          <linearGradient id="oceanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#E0F2FE', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#BAE6FD', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        
        <rect width="400" height="600" fill="url(#oceanGradient)" />

        {/* Imagen de fondo del mapa de San Andrés - Zonas de Taxi */}
        <image 
          xlinkHref="https://guiasanandresislas.com/wp-content/uploads/2026/01/Mapa-traslados-taxi.png"
          x="0" 
          y="0" 
          width="400" 
          height="600" 
          opacity="0.4"
          preserveAspectRatio="xMidYMid slice"
        />
      </svg>
      </svg>
    </div>
  );
};

export default SanAndresMap;
